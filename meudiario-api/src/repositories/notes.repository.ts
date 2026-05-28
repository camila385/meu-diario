import { PrismaClient } from '@/generated/prisma'
import type { CreateNoteRequest, UpdateNoteRequest, ListNotesQuery } from '@/validators/notes.validator'
import type { Note, Tag } from '@/models/note.model'

// T008: Notes Repository Scaffolding
// Single place for Prisma access (P-03, P-12 compliance)

// Initialize Prisma Client
const prisma = new PrismaClient()

/**
 * T014: Create a new note for the authenticated user
 * - Store note with title, content, isPublic
 * - Create/reuse tags and link to note
 * - Store optional mood if provided
 * Returns the created note with relations
 */
export async function createNote(userId: string, input: CreateNoteRequest): Promise<Note & {
  user: { id: string; username: string }
  noteTags: Array<{ tag: Tag }>
  mood: any
}> {
  // T014: Create note in single transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Create note record
    const note = await tx.note.create({
      data: {
        userId,
        title: input.title,
        content: input.content || null,
        isPublic: input.isPublic ?? false,
      },
      include: {
        user: { select: { id: true, username: true } },
        noteTags: { include: { tag: true } },
        mood: true,
      },
    })

    // 2. Handle tag creation/linking
    if (input.tags && input.tags.length > 0) {
      const tags = await getOrCreateTags(input.tags)
      await linkTagsToNote(note.id, tags.map((t) => t.id))
      // Re-fetch note with updated tags
      return await tx.note.findUniqueOrThrow({
        where: { id: note.id },
        include: {
          user: { select: { id: true, username: true } },
          noteTags: { include: { tag: true } },
          mood: true,
        },
      })
    }

    // 3. Store optional mood if provided
    if (input.mood) {
      await tx.mood.create({
        data: {
          userId,
          noteId: note.id,
          value: input.mood,
        },
      })
      // Re-fetch note with mood
      return await tx.note.findUniqueOrThrow({
        where: { id: note.id },
        include: {
          user: { select: { id: true, username: true } },
          noteTags: { include: { tag: true } },
          mood: true,
        },
      })
    }

    return note
  })
}

/**
 * Get or create tags by name (bulk operation)
 * - Returns existing tags by name
 * - Creates new tags if they don't exist
 * - Returns all tag records as array
 */
export async function getOrCreateTags(tagNames: string[]): Promise<Tag[]> {
  if (tagNames.length === 0) return []

  const uniqueNames = [...new Set(tagNames)].slice(0, 10) // Max 10 tags

  // Get existing tags
  const existing = await prisma.tag.findMany({
    where: { name: { in: uniqueNames } },
  })

  const existingNames = new Set(existing.map((t) => t.name))

  // Create missing tags
  const toCreate = uniqueNames.filter((name) => !existingNames.has(name))
  const created =
    toCreate.length > 0
      ? await prisma.tag.createMany({
          data: toCreate.map((name) => ({ name })),
          skipDuplicates: true,
        })
      : { count: 0 }

  // Return all tags
  return await prisma.tag.findMany({
    where: { name: { in: uniqueNames } },
  })
}

/**
 * Link tags to a note (establishes NoteTag relations)
 * - Bulk create NoteTag records
 * - Expects tags to already exist
 */
export async function linkTagsToNote(noteId: string, tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return

  await prisma.noteTag.createMany({
    data: tagIds.map((tagId) => ({ noteId, tagId })),
    skipDuplicates: true,
  })
}

/**
 * Remove all tags from a note (clear NoteTag relations)
 */
export async function clearNoteTags(noteId: string): Promise<void> {
  await prisma.noteTag.deleteMany({
    where: { noteId },
  })
}

/**
 * T021: List notes for the authenticated user with pagination and filters
 * - Pagination: page, limit from ListNotesQuery
 * - Filters: tag, mood, search (keyword), dateFrom/dateTo (ISO date/time, inclusive)
 * - Sort: descending by createdAt
 * Returns paginated summary records with total count
 */
export async function listNotes(
  userId: string,
  query: ListNotesQuery
): Promise<{ notes: Note[]; total: number }> {
  // Build WHERE clause with filters
  const where = {
    userId,
    ...(query.tag && {
      noteTags: {
        some: {
          tag: { name: query.tag },
        },
      },
    }),
    ...(query.mood && {
      mood: { value: query.mood },
    }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { content: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(query.dateFrom &&
      query.dateTo && {
      createdAt: {
        gte: new Date(query.dateFrom),
        lte: new Date(query.dateTo),
      },
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

  // Count total matching records
  const total = await prisma.note.count({ where })

  // Fetch paginated results
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

/**
 * Get a single note by ID with access control
 * - Owner always has access
 * - Non-owner can view only if isPublic is true
 * - Returns null if note doesn't exist or access denied
 */
export async function getNoteById(noteId: string, userId: string): Promise<Note | null> {
  // T027: Query note with all relations
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      user: { select: { id: true, username: true } },
      noteTags: { include: { tag: true } },
      mood: true,
    },
  })

  if (!note) return null

  // Check access: owner always has access, non-owner needs isPublic
  const isOwner = note.userId === userId
  if (!isOwner && !note.isPublic) {
    return null
  }

  return note
}

/**
 * Update a note (partial update)
 * - Replace all tag links when tags are provided
 * - Preserve unmodified fields
 * - Update only title, content, tags, mood, isPublic
 */
export async function updateNote(noteId: string, input: Partial<UpdateNoteRequest>): Promise<Note> {
  // T034: Partial update in transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Update note fields (only provided ones)
    const updateData: any = {}
    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.isPublic !== undefined) updateData.isPublic = input.isPublic

    const note = await tx.note.update({
      where: { id: noteId },
      data: updateData,
    })

    // 2. Replace tags if provided
    if (input.tags !== undefined) {
      // Clear existing tags
      await tx.noteTag.deleteMany({ where: { noteId } })
      // Get/create new tags and link them
      if (input.tags.length > 0) {
        const tags = await getOrCreateTags(input.tags)
        await linkTagsToNote(noteId, tags.map((t) => t.id))
      }
    }

    // 3. Update or create mood
    if (input.mood !== undefined) {
      // Delete existing mood first
      await tx.mood.deleteMany({ where: { noteId } })
      // Create new mood if provided
      if (input.mood) {
        await tx.mood.create({
          data: {
            userId: note.userId,
            noteId,
            value: input.mood,
          },
        })
      }
    }

    // Return updated note with relations
    return await tx.note.findUniqueOrThrow({
      where: { id: noteId },
      include: {
        user: { select: { id: true, username: true } },
        noteTags: { include: { tag: true } },
        mood: true,
      },
    })
  })
}

/**
 * Delete a note by ID (permanent removal)
 */
export async function deleteNote(noteId: string): Promise<void> {
  // T040: Delete note (cascades to NoteTag, Mood via schema)
  await prisma.note.delete({
    where: { id: noteId },
  })
}

/**
 * Check if user is the owner of a note
 */
export async function isNoteOwner(noteId: string, userId: string): Promise<boolean> {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { userId: true },
  })
  return note?.userId === userId ?? false
}

export default {
  createNote,
  listNotes,
  getNoteById,
  updateNote,
  deleteNote,
  isNoteOwner,
  getOrCreateTags,
  linkTagsToNote,
  clearNoteTags,
}
