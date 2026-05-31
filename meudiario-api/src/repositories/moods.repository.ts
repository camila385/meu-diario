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
    /**
     * Find the daily mood (without note) for a user on a specific date.
     * Only searches for moods where noteId IS NULL.
     */
    findDailyMoodByDate(userId: string, date: Date): Promise<Mood | null> {
        return prisma.mood.findFirst({
            where: {
                userId,
                date,
                noteId: null,
            },
        });
    }

    /**
     * Legacy method for backward compatibility.
     * Searches for any mood (daily or note-linked) on that date.
     */
    findByUserAndDate(userId: string, date: Date): Promise<Mood | null> {
        return prisma.mood.findFirst({
            where: {
                userId,
                date,
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

    /**
     * Upsert a daily mood (without note) for a user on a specific date.
     * Only updates moods where noteId IS NULL to maintain daily uniqueness.
     */
    async upsertDailyMood(
        userId: string,
        date: Date,
        value: number,
    ): Promise<Mood> {
        const existing = await this.findDailyMoodByDate(userId, date);

        if (existing) {
            return prisma.mood.update({
                where: { id: existing.id },
                data: { value },
            });
        }

        return prisma.mood.create({
            data: {
                userId,
                date,
                value,
                noteId: null,
            },
        });
    }

    /**
     * Create a mood linked to a note.
     * Multiple note-moods can exist per day (one per note).
     */
    async createNoteMood(
        userId: string,
        noteId: string,
        value: number,
    ): Promise<Mood> {
        return prisma.mood.create({
            data: {
                userId,
                noteId,
                value,
            },
        });
    }

    /**
     * Legacy method for backward compatibility.
     * Attempts upsert for daily mood; falls back to create if logic changes.
     */
    async upsertMoodForDate(
        userId: string,
        date: Date,
        value: number,
        noteId?: string | null,
    ): Promise<Mood> {
        if (noteId) {
            return this.createNoteMood(userId, noteId, value);
        }

        return this.upsertDailyMood(userId, date, value);
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
