export interface CalendarDaysResponse {
    days: number[];
}

export interface TagCount {
    name: string;
    count: number;
}

export interface WordCount {
    word: string;
    count: number;
}

export interface WeekdayCount {
    weekday: number;
    count: number;
}

export interface MonthMetrics {
    total_notes: number;
    mood_avg: number | null;
    days_with_record: number;
    max_streak: number;
}

export interface ComparisonResponse {
    base_month: MonthMetrics;
    previous_month: MonthMetrics | null;
    variation: {
        total_notes: number | null;
        mood_avg: number | null;
        days_with_record: number | null;
    };
}

export interface OverviewResponse {
    total_notes: number;
    total_days_with_record: number;
    streak_current: number;
    streak_max: number;
    mood_avg_overall: number | null;
    most_productive_month: string | null;
    top_tag: string | null;
    first_note_date: string | null;
    approximate_total_words: number;
}
