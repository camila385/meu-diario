import type { CreateNoteRequest, UpdateNoteRequest } from '@/validators/notes.validator';
import type { Note, Tag, Mood } from '@/models/note.model';
import type { Prisma, User, Like } from '@/generated/prisma';
import { prisma } from './prisma.client';

type FeedNote = Note & {
    user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
    noteTags: Array<{ tag: { name: string } }>;
    likeCount: number;
    commentCount: number;
};

type NoteWithRelations = Note & {
    user: { id: string; username: string };
    noteTags: Array<{ tag: Tag }>;
    mood: Mood | null;
};

type NoteFilter = {
    isPublic?: boolean;
    tag?: string;
    mood?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
};

const noteInclude = {
    user: { select: { id: true, username: true } },
    noteTags: { include: { tag: true } },
    mood: true,
} as const;

export class NotesRepository {
    async createNote(userId: string, input: CreateNoteRequest): Promise<NoteWithRelations> {
        return prisma.$transaction(async (tx) => {
            const note = await tx.note.create({
                data: {
                    userId,
                    title: input.title,
                    content: input.content ?? null,
                    isPublic: input.isPublic,
                },
            });

            if (input.tags.length > 0) {
                await this.replaceTags(tx, note.id, input.tags);
            }

            if (input.mood !== undefined) {
                await tx.mood.create({ data: { userId, noteId: note.id, value: input.mood } });
            }

            return tx.note.findUniqueOrThrow({ where: { id: note.id }, include: noteInclude });
        });
    }

    findMany(userId: string, filters: NoteFilter = {}): Promise<NoteWithRelations[]> {
        const where: Prisma.NoteWhereInput = {
            userId,
            ...(filters.isPublic !== undefined && { isPublic: filters.isPublic }),
            ...(filters.tag && { noteTags: { some: { tag: { name: filters.tag } } } }),
            ...(filters.mood && { mood: { value: filters.mood } }),
            ...(filters.search && {
                OR: [
                    { title: { contains: filters.search, mode: 'insensitive' as const } },
                    { content: { contains: filters.search, mode: 'insensitive' as const } },
                ],
            }),
            ...(filters.dateFrom && filters.dateTo && {
                createdAt: { gte: new Date(filters.dateFrom), lte: new Date(filters.dateTo) },
            }),
            ...(filters.dateFrom && !filters.dateTo && { createdAt: { gte: new Date(filters.dateFrom) } }),
            ...(!filters.dateFrom && filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } }),
        };

        return prisma.note.findMany({ where, include: noteInclude, orderBy: { createdAt: 'desc' } });
    }

    countNotes(userId: string): Promise<number> {
        return prisma.note.count({ where: { userId } });
    }

    findById(noteId: string): Promise<NoteWithRelations | null> {
        return prisma.note.findUnique({ where: { id: noteId }, include: noteInclude });
    }

    async updateNote(noteId: string, input: Partial<UpdateNoteRequest>): Promise<NoteWithRelations> {
        return prisma.$transaction(async (tx) => {
            const updateData: Prisma.NoteUpdateInput = {};
            if (input.title !== undefined) updateData.title = input.title;
            if (input.content !== undefined) updateData.content = input.content;
            if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

            const note = await tx.note.update({ where: { id: noteId }, data: updateData });

            if (input.tags !== undefined) {
                await tx.noteTag.deleteMany({ where: { noteId } });
                if (input.tags.length > 0) {
                    await this.replaceTags(tx, noteId, input.tags);
                }
            }

            if (input.mood !== undefined) {
                await tx.mood.deleteMany({ where: { noteId } });
                await tx.mood.create({ data: { userId: note.userId, noteId, value: input.mood } });
            }

            return tx.note.findUniqueOrThrow({ where: { id: noteId }, include: noteInclude });
        });
    }

    deleteNote(noteId: string): Promise<Note> {
        return prisma.note.delete({ where: { id: noteId } });
    }

    async isNoteOwner(noteId: string, userId: string): Promise<boolean> {
        const note = await prisma.note.findUnique({ where: { id: noteId }, select: { userId: true } });
        return note?.userId === userId;
    }

    async findFeedNotes(userId: string, tag?: string): Promise<FeedNote[]> {
        const where: Prisma.NoteWhereInput = {
            isPublic: true,
            user: { is: { isPublic: true, isActive: true } },
            userId: { not: userId },
            noteTags: tag ? { some: { tag: { name: tag } } } : undefined,
        };
        const rawNotes = await prisma.note.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
                noteTags: { include: { tag: { select: { name: true } } } },
                _count: { select: { likes: true, comments: true } },
            },
        });
        return rawNotes.map(({ _count, ...rest }) => ({
            ...rest,
            likeCount: _count.likes,
            commentCount: _count.comments,
        }));
    }

    upsertLike(userId: string, noteId: string): Promise<Like> {
        return prisma.like.upsert({
            where: { userId_noteId: { userId, noteId } },
            create: { userId, noteId },
            update: {},
        });
    }

    deleteLike(userId: string, noteId: string): Promise<Like | null> {
        return prisma.like.delete({ where: { userId_noteId: { userId, noteId } } }).catch(() => null);
    }

    getLikeCount(noteId: string): Promise<number> {
        return prisma.like.count({ where: { noteId } });
    }

    private async replaceTags(tx: Prisma.TransactionClient, noteId: string, tagNames: string[]): Promise<void> {
        const tags = await this.getOrCreateTags(tx, [...new Set(tagNames)]);
        await tx.noteTag.createMany({
            data: tags.map((tag) => ({ noteId, tagId: tag.id })),
            skipDuplicates: true,
        });
    }

    private async getOrCreateTags(tx: Prisma.TransactionClient, tagNames: string[]): Promise<Tag[]> {
        const existing = await tx.tag.findMany({ where: { name: { in: tagNames } } });
        const existingNames = new Set(existing.map((t) => t.name));
        const toCreate = tagNames.filter((name) => !existingNames.has(name));

        if (toCreate.length > 0) {
            await tx.tag.createMany({ data: toCreate.map((name) => ({ name })), skipDuplicates: true });
        }

        return tx.tag.findMany({ where: { name: { in: tagNames } } });
    }
}
