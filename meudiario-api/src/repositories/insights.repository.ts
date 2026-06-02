import { prisma } from './prisma.client';
import type { WeekdayCount, OverviewResponse } from '@/models/insights.model';

export class InsightsRepository {
    async findCalendarDays(userId: string, year: number, month: number): Promise<number[]> {
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));
        const notes = await prisma.note.findMany({
            where: { userId, createdAt: { gte: start, lt: end } },
            select: { createdAt: true },
        });
        return [...new Set(notes.map((n) => n.createdAt.getUTCDate()))].sort((a, b) => a - b);
    }

    async findWeekdayCounts(userId: string): Promise<WeekdayCount[]> {
        const notes = await prisma.note.findMany({
            where: { userId },
            select: { createdAt: true },
        });
        const counts = new Map<number, number>();
        for (const n of notes) {
            const dow = n.createdAt.getUTCDay();
            counts.set(dow, (counts.get(dow) ?? 0) + 1);
        }
        return counts.size > 0
            ? [...counts.entries()].map(([weekday, count]) => ({ weekday, count }))
            : [];
    }

    async findOverviewMetrics(userId: string): Promise<OverviewResponse> {
        const [notes, moodAggregate] = await Promise.all([
            prisma.note.findMany({
                where: { userId },
                select: {
                    createdAt: true,
                    noteTags: { select: { tag: { select: { name: true } } } },
                },
            }),
            prisma.mood.aggregate({
                where: { userId },
                _avg: { value: true },
            }),
        ]);

        const totalNotes = notes.length;
        const totalDaysWithRecord = new Set(
            notes.map((n) => n.createdAt.toISOString().slice(0, 10)),
        ).size;

        const tagCounts = new Map<string, number>();
        for (const n of notes) {
            for (const nt of n.noteTags) {
                tagCounts.set(nt.tag.name, (tagCounts.get(nt.tag.name) ?? 0) + 1);
            }
        }
        const topTag = tagCounts.size > 0
            ? [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
            : null;

        return {
            totalNotes,
            totalDaysWithRecord,
            moodAvgOverall: moodAggregate._avg.value ?? null,
            topTag,
        };
    }
}
