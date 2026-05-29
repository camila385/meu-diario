import type { CreateNoteRequest, UpdateNoteRequest, ListNotesQuery } from '@/validators/notes.validator'
import type { Note, Tag } from '@/models/note.model'
import { prisma } from './prisma.client'

export class NotesRepository {
  async createNote(userId: string, input: CreateNoteRequest): Promise<
    Note & {
      user: { id: string; username: string }
      noteTags: Array<{ tag: Tag }>
      mood: any
    }
  > {
    return await prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          userId,
          title: input.title,
          content: input.content || null,
          isPublic: input.isPublic ?? false,
        },
      })

      if (input.tags && input.tags.length > 0) {
        const uniqueNames = [...new Set(input.tags)].slice(0, 10)

        const existing = await tx.tag.findMany({ where: { name: { in: uniqueNames } } })
        const existingNames = new Set(existing.map((t) => t.name))

        const toCreate = uniqueNames.filter((n) => !existingNames.has(n))
        if (toCreate.length > 0) {
          await tx.tag.createMany({ data: toCreate.map((name) => ({ name })), skipDuplicates: true })
        }

        const tags = await tx.tag.findMany({ where: { name: { in: uniqueNames } } })
        if (tags.length > 0) {
          await tx.noteTag.createMany({ data: tags.map((t) => ({ noteId: note.id, tagId: t.id })), skipDuplicates: true })
        }
      }

      if (input.mood) {
        await tx.mood.create({ data: { userId, noteId: note.id, value: input.mood } })
      }

      return await tx.note.findUniqueOrThrow({
        where: { id: note.id },
        include: {
          user: { select: { id: true, username: true } },
          noteTags: { include: { tag: true } },
          mood: true,
        },
      })
    })
  }

  async getOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    if (tagNames.length === 0) return []

    const uniqueNames = [...new Set(tagNames)].slice(0, 10)

    const existing = await prisma.tag.findMany({ where: { name: { in: uniqueNames } } })
    const existingNames = new Set(existing.map((t) => t.name))

    const toCreate = uniqueNames.filter((name) => !existingNames.has(name))
    if (toCreate.length > 0) {
      await prisma.tag.createMany({ data: toCreate.map((name) => ({ name })), skipDuplicates: true })
    }

    return await prisma.tag.findMany({ where: { name: { in: uniqueNames } } })
  }

  async linkTagsToNote(noteId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) return
    await prisma.noteTag.createMany({ data: tagIds.map((tagId) => ({ noteId, tagId })), skipDuplicates: true })
  }

  async clearNoteTags(noteId: string): Promise<void> {
    await prisma.noteTag.deleteMany({ where: { noteId } })
  }

  async listNotes(userId: string, query: ListNotesQuery): Promise<{ notes: Note[]; total: number }> {
    const where: any = {
      userId,
      ...(query.tag && {
        noteTags: { some: { tag: { name: query.tag } } },
      }),
      ...(query.mood && { mood: { value: query.mood } }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { content: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.dateFrom &&
        query.dateTo && {
          createdAt: { gte: new Date(query.dateFrom), lte: new Date(query.dateTo) },
        }),
      ...(query.dateFrom &&
        !query.dateTo && {
          createdAt: { gte: new Date(query.dateFrom) },
        }),
      ...(!query.dateFrom &&
        query.dateTo && {
          createdAt: { lte: new Date(query.dateTo) },
        }),
    }

    const total = await prisma.note.count({ where })
    const skip = (query.page - 1) * query.limit
    const notes = await prisma.note.findMany({
      where,
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        noteTags: { include: { tag: true } },
        mood: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    })

    return { notes, total }
  }

  async getNoteById(noteId: string, userId: string): Promise<Note | null> {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { user: { select: { id: true, username: true } }, noteTags: { include: { tag: true } }, mood: true },
    })
    if (!note) return null
    const isOwner = note.userId === userId
    if (!isOwner && !note.isPublic) return null
    return note
  }

  async updateNote(noteId: string, input: Partial<UpdateNoteRequest>): Promise<Note> {
    return await prisma.$transaction(async (tx) => {
      const updateData: any = {}
      if (input.title !== undefined) updateData.title = input.title
      if (input.content !== undefined) updateData.content = input.content
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic

      const note = await tx.note.update({ where: { id: noteId }, data: updateData })

      if (input.tags !== undefined) {
        await tx.noteTag.deleteMany({ where: { noteId } })
        if (input.tags.length > 0) {
          const uniqueNames = [...new Set(input.tags)].slice(0, 10)
          const existing = await tx.tag.findMany({ where: { name: { in: uniqueNames } } })
          const existingNames = new Set(existing.map((t) => t.name))
          const toCreate = uniqueNames.filter((n) => !existingNames.has(n))
          if (toCreate.length > 0) {
            await tx.tag.createMany({ data: toCreate.map((name) => ({ name })), skipDuplicates: true })
          }
          const tags = await tx.tag.findMany({ where: { name: { in: uniqueNames } } })
          if (tags.length > 0) {
            await tx.noteTag.createMany({ data: tags.map((t) => ({ noteId, tagId: t.id })), skipDuplicates: true })
          }
        }
      }

      if (input.mood !== undefined) {
        await tx.mood.deleteMany({ where: { noteId } })
        if (input.mood) {
          await tx.mood.create({ data: { userId: note.userId, noteId, value: input.mood } })
        }
      }

      return await tx.note.findUniqueOrThrow({ where: { id: noteId }, include: { user: { select: { id: true, username: true } }, noteTags: { include: { tag: true } }, mood: true } })
    })
  }

  async deleteNote(noteId: string): Promise<void> {
    await prisma.note.delete({ where: { id: noteId } })
  }

  async isNoteOwner(noteId: string, userId: string): Promise<boolean> {
    const note = await prisma.note.findUnique({ where: { id: noteId }, select: { userId: true } })
    return note ? note.userId === userId : false
  }
}
