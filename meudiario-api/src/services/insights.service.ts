import type { InsightsRepository } from '@/repositories/insights.repository';
import type {
    WordCount,
    MonthMetrics,
    ComparisonResponse,
    OverviewResponse,
} from '@/models/insights.model';

const STOPWORDS = new Set([
    'de',
    'da',
    'do',
    'a',
    'o',
    'e',
    'que',
    'em',
    'um',
    'uma',
    'para',
    'com',
    'não',
    'por',
    'mais',
    'os',
    'as',
    'ao',
    'dos',
    'das',
    'nos',
    'nas',
    'se',
    'na',
    'no',
]);

function extractWords(text: string): string[] {
    const matches = text.match(/\p{L}+/gu);
    return matches ? matches.map((w) => w.toLowerCase()) : [];
}

function computeStreakFromDates(dates: string[]): { maxStreak: number; currentStreak: number } {
    if (!dates || dates.length === 0) return { maxStreak: 0, currentStreak: 0 };
    const days = dates
        .map((d) => new Date(d + 'T00:00:00Z'))
        .map((dt) => Math.floor(dt.getTime() / 86400000));
    const set = new Set(days);
    let maxStreak = 0;
    let currentStreak = 0;
    for (const day of days) {
        if (!set.has(day - 1)) {
            let len = 0;
            let cur = day;
            while (set.has(cur)) {
                len++;
                cur++;
            }
            if (len > maxStreak) maxStreak = len;
        }
    }
    const latest = Math.max(...days);
    let cur = latest;
    while (set.has(cur)) {
        currentStreak++;
        cur--;
    }
    return { maxStreak, currentStreak };
}

export class InsightsService {
    constructor(private readonly repo: InsightsRepository) {}

    async getCalendarDays(userId: string, year: number, month: number) {
        return await this.repo.getCalendarDays(userId, year, month);
    }

    async getTopTags(userId: string, limit: number) {
        return await this.repo.getTopTags(userId, limit);
    }

    async computeWordCloud(userId: string, year: number, month: number): Promise<WordCount[]> {
        const notes = await this.repo.fetchNotesForMonth(userId, year, month);
        const counts = new Map<string, number>();
        for (const n of notes) {
            const text = [n.title ?? '', n.content ?? ''].join(' ').trim();
            if (!text) continue;
            const words = extractWords(text);
            for (const w of words) {
                if (STOPWORDS.has(w)) continue;
                counts.set(w, (counts.get(w) ?? 0) + 1);
            }
        }
        const items: WordCount[] = Array.from(counts.entries()).map(([word, count]) => ({
            word,
            count,
        }));
        return items
            .filter((i) => i.count >= 2)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50);
    }

    async getWeekdayCounts(userId: string) {
        return await this.repo.getWeekdayCounts(userId);
    }

    async compareMonths(userId: string, year: number, month: number): Promise<ComparisonResponse> {
        const base = await this.repo.getMonthMetrics(userId, year, month);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prev = await this.repo.getMonthMetrics(userId, prevYear, prevMonth);

        const baseStreaks = computeStreakFromDates(base.dates);
        const prevStreaks = computeStreakFromDates(prev.dates);

        const baseMetrics: MonthMetrics = {
            total_notes: base.total_notes,
            mood_avg: base.mood_avg,
            days_with_record: base.days_with_record,
            max_streak: baseStreaks.maxStreak,
        };
        const prevMetricsOrNull =
            prev.total_notes === 0 && prev.days_with_record === 0
                ? null
                : {
                      total_notes: prev.total_notes,
                      mood_avg: prev.mood_avg,
                      days_with_record: prev.days_with_record,
                      max_streak: prevStreaks.maxStreak,
                  };

        const variation = {
            total_notes: prevMetricsOrNull
                ? prevMetricsOrNull.total_notes === 0
                    ? null
                    : Number(
                          (
                              ((baseMetrics.total_notes - prevMetricsOrNull.total_notes) /
                                  prevMetricsOrNull.total_notes) *
                              100
                          ).toFixed(2),
                      )
                : null,
            mood_avg:
                prevMetricsOrNull && prevMetricsOrNull.mood_avg !== null
                    ? Number(
                          (
                              (((baseMetrics.mood_avg ?? 0) - (prevMetricsOrNull.mood_avg ?? 0)) /
                                  (prevMetricsOrNull.mood_avg ?? 1)) *
                              100
                          ).toFixed(2),
                      )
                    : null,
            days_with_record: prevMetricsOrNull
                ? prevMetricsOrNull.days_with_record === 0
                    ? null
                    : Number(
                          (
                              ((baseMetrics.days_with_record - prevMetricsOrNull.days_with_record) /
                                  prevMetricsOrNull.days_with_record) *
                              100
                          ).toFixed(2),
                      )
                : null,
        };

        return { base_month: baseMetrics, previous_month: prevMetricsOrNull, variation };
    }

    async getOverview(userId: string): Promise<OverviewResponse> {
        const raw = await this.repo.getOverviewMetrics(userId);
        const streaks = computeStreakFromDates(raw.dates);
        return {
            total_notes: raw.total_notes,
            total_days_with_record: raw.total_days_with_record,
            streak_current: streaks.currentStreak,
            streak_max: streaks.maxStreak,
            mood_avg_overall: raw.mood_avg_overall,
            most_productive_month: raw.most_productive_month,
            top_tag: raw.top_tag,
            first_note_date: raw.first_note_date,
            approximate_total_words: raw.approximate_total_words,
        };
    }
}
