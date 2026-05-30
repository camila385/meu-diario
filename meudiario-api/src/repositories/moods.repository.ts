import { prisma } from './prisma.client';
import type { Mood } from '@/models/mood.model';
import type { Note } from '@/models/note.model';

export interface MoodHistoryFilters {
    page: number;
    limit: number;
    dateFrom?: Date;
    dateTo?: Date;
}

const moodSelect = {
    id: true,
    value: true,
    date: true,
    noteId: true,
} as const;

export class MoodsRepository {
    findByUserAndDate(userId: string, date: Date): Promise<Mood | null> {
        return prisma.mood.findUnique({
            where: {
                userId_date: {
                    userId,
                    date,
                },
            },
        });
    }

    findByNoteId(noteId: string): Promise<Mood | null> {
        return prisma.mood.findUnique({
            where: {
                noteId,
            },
        });
    }

    findNoteOwner(noteId: string): Promise<Pick<Note, 'userId'> | null> {
        return prisma.note.findUnique({
            where: { id: noteId },
            select: { userId: true },
        });
    }

    upsertMoodForDate(
        userId: string,
        date: Date,
        value: number,
        noteId?: string | null,
    ): Promise<Mood> {
        return prisma.mood.upsert({
            where: {
                userId_date: {
                    userId,
                    date,
                },
            },
            create: {
                userId,
                date,
                value,
                noteId: noteId ?? null,
            },
            update: {
                value,
                ...(noteId !== undefined ? { noteId } : {}),
            },
        });
    }

    async listHistory(
        userId: string,
        filters: MoodHistoryFilters,
    ): Promise<{ moods: Array<Pick<Mood, 'id' | 'value' | 'date' | 'noteId'>>; total: number }> {
        const where = {
            userId,
            ...(filters.dateFrom || filters.dateTo
                ? {
                      date: {
                          ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
                          ...(filters.dateTo ? { lte: filters.dateTo } : {}),
                      },
                  }
                : {}),
        };

        const total = await prisma.mood.count({ where });
        const moods = await prisma.mood.findMany({
            where,
            select: moodSelect,
            orderBy: { date: 'desc' },
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
        });

        return { moods, total };
    }

    async listByDateRange(
        userId: string,
        start: Date,
        end: Date,
    ): Promise<Array<Pick<Mood, 'id' | 'value' | 'date' | 'noteId'>>> {
        return prisma.mood.findMany({
            where: {
                userId,
                date: {
                    gte: start,
                    lt: end,
                },
            },
            select: moodSelect,
            orderBy: { date: 'asc' },
        });
    }
}
