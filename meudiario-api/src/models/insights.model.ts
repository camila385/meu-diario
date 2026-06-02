export interface WeekdayCount {
    weekday: number;
    count: number;
}

export interface OverviewResponse {
    totalNotes: number;
    totalDaysWithRecord: number;
    moodAvgOverall: number | null;
    topTag: string | null;
}
