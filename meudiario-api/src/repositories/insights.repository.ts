import { prisma } from './prisma.client';

export class InsightsRepository {
    async getCalendarDays(userId: string, year: number, month: number): Promise<number[]> {
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));
        const rows: Array<{ day: number }> = await prisma.$queryRaw`
      SELECT DISTINCT EXTRACT(DAY FROM "createdAt")::int AS day
      FROM "Note"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${start}
        AND "createdAt" < ${end}
      ORDER BY day
    `;
        return rows.map((r) => r.day);
    }

    async getTopTags(
        userId: string,
        limit: number,
    ): Promise<Array<{ name: string; count: number }>> {
        const rows: Array<{ name: string; count: number }> = await prisma.$queryRaw`
      SELECT t.name, COUNT(*)::int AS count
      FROM "Tag" t
      JOIN "NoteTag" nt ON nt."tagId" = t.id
      JOIN "Note" n ON n.id = nt."noteId"
      WHERE n."userId" = ${userId}
      GROUP BY t.name
      ORDER BY count DESC
      LIMIT ${limit}
    `;
        return rows;
    }

    async fetchNotesForMonth(
        userId: string,
        year: number,
        month: number,
    ): Promise<Array<{ title: string | null; content: string | null }>> {
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));
        return await prisma.note.findMany({
            where: { userId, createdAt: { gte: start, lt: end }, content: { not: null } },
            select: { title: true, content: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getWeekdayCounts(userId: string): Promise<Array<{ weekday: number; count: number }>> {
        const rows: Array<{ weekday: number; count: number }> = await prisma.$queryRaw`
      SELECT EXTRACT(DOW FROM "createdAt")::int AS weekday, COUNT(*)::int AS count
      FROM "Note"
      WHERE "userId" = ${userId}
      GROUP BY weekday
      ORDER BY weekday
    `;
        // ensure all weekdays 0..6 present
        const map = new Map<number, number>(rows.map((r) => [r.weekday, r.count]));
        const result: Array<{ weekday: number; count: number }> = [];
        for (let d = 0; d < 7; d++) {
            result.push({ weekday: d, count: map.get(d) ?? 0 });
        }
        return result;
    }

    async getMonthMetrics(
        userId: string,
        year: number,
        month: number,
    ): Promise<{
        total_notes: number;
        mood_avg: number | null;
        days_with_record: number;
        dates: string[];
    }> {
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));
        const summary: Array<{
            total_notes: number;
            mood_avg: number | null;
            days_with_record: number;
        }> = await prisma.$queryRaw`
      SELECT
        COUNT(n.id)::int AS total_notes,
        AVG(m.value)::float AS mood_avg,
        COUNT(DISTINCT DATE_TRUNC('day', n."createdAt"))::int AS days_with_record
      FROM "Note" n
      LEFT JOIN "Mood" m ON m."noteId" = n.id
      WHERE n."userId" = ${userId}
        AND n."createdAt" >= ${start}
        AND n."createdAt" < ${end}
    `;

        const datesRows: Array<{ day: string }> = await prisma.$queryRaw`
      SELECT DISTINCT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day
      FROM "Note"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${start}
        AND "createdAt" < ${end}
      ORDER BY day
    `;

        const s = summary[0] ?? { total_notes: 0, mood_avg: null, days_with_record: 0 };
        return {
            total_notes: Number(s.total_notes ?? 0),
            mood_avg: s.mood_avg === null ? null : Number(s.mood_avg),
            days_with_record: Number(s.days_with_record ?? 0),
            dates: datesRows.map((r) => r.day),
        };
    }

    async getOverviewMetrics(userId: string): Promise<{
        total_notes: number;
        total_days_with_record: number;
        mood_avg_overall: number | null;
        most_productive_month: string | null;
        top_tag: string | null;
        first_note_date: string | null;
        approximate_total_words: number;
        dates: string[];
    }> {
        const totalRow: Array<{
            total_notes: number;
            total_days_with_record: number;
            mood_avg_overall: number | null;
            first_note_date: string | null;
        }> = await prisma.$queryRaw`
      SELECT
        COUNT(n.id)::int AS total_notes,
        COUNT(DISTINCT DATE_TRUNC('day', n."createdAt"))::int AS total_days_with_record,
        AVG(m.value)::float AS mood_avg_overall,
        MIN(n."createdAt")::text AS first_note_date
      FROM "Note" n
      LEFT JOIN "Mood" m ON m."noteId" = n.id
      WHERE n."userId" = ${userId}
    `;

        const mostProductive: Array<{ ym: string }> = await prisma.$queryRaw`
      SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS ym
      FROM "Note"
      WHERE "userId" = ${userId}
      GROUP BY ym
      ORDER BY COUNT(*) DESC
      LIMIT 1
    `;

        const topTag: Array<{ name: string }> = await prisma.$queryRaw`
      SELECT t.name
      FROM "Tag" t
      JOIN "NoteTag" nt ON nt."tagId" = t.id
      JOIN "Note" n ON n.id = nt."noteId"
      WHERE n."userId" = ${userId}
      GROUP BY t.name
      ORDER BY COUNT(*) DESC
      LIMIT 1
    `;

        const wordsRow: Array<{ total_words: number }> = await prisma.$queryRaw`
      SELECT COALESCE(SUM(array_length(regexp_split_to_array(content, '\\W+'),1)),0)::int AS total_words
      FROM "Note"
      WHERE "userId" = ${userId}
        AND content IS NOT NULL
    `;

        const datesRows: Array<{ day: string }> = await prisma.$queryRaw`
      SELECT DISTINCT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day
      FROM "Note"
      WHERE "userId" = ${userId}
      ORDER BY day
    `;

        const t = totalRow[0] ?? {
            total_notes: 0,
            total_days_with_record: 0,
            mood_avg_overall: null,
            first_note_date: null,
        };
        return {
            total_notes: Number(t.total_notes ?? 0),
            total_days_with_record: Number(t.total_days_with_record ?? 0),
            mood_avg_overall: t.mood_avg_overall === null ? null : Number(t.mood_avg_overall),
            most_productive_month: mostProductive[0]?.ym ?? null,
            top_tag: topTag[0]?.name ?? null,
            first_note_date: t.first_note_date ?? null,
            approximate_total_words: Number(wordsRow[0]?.total_words ?? 0),
            dates: datesRows.map((r) => r.day),
        };
    }
}
