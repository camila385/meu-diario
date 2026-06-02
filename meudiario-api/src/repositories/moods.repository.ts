import { prisma } from './prisma.client';
import type { Mood } from '@/models/mood.model';

export interface MoodHistoryFilters {
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
    findDailyByDate(userId: string, date: Date): Promise<Mood | null> {
        return prisma.mood.findFirst({
            where: { userId, date, noteId: null },
        });
    }

    findByNoteId(noteId: string): Promise<Mood | null> {
        return prisma.mood.findUnique({ where: { noteId } });
    }

    async upsertDaily(userId: string, date: Date, value: number): Promise<Mood> {
        const existing = await this.findDailyByDate(userId, date);
        if (existing) {
            return prisma.mood.update({ where: { id: existing.id }, data: { value } });
        }
        return prisma.mood.create({ data: { userId, date, value, noteId: null } });
    }

    createForNote(userId: string, noteId: string, value: number): Promise<Mood> {
        return prisma.mood.create({ data: { userId, noteId, value } });
    }

    async findMany(userId: string, filters: MoodHistoryFilters): Promise<Array<Pick<Mood, 'id' | 'value' | 'date' | 'noteId'>>> {
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
        return prisma.mood.findMany({
            where,
            select: moodSelect,
            orderBy: { date: 'desc' },
        });
    }

    count(userId: string): Promise<number> {
        return prisma.mood.count({ where: { userId } });
    }
}
