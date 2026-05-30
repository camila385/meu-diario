import type { Mood as PrismaMood } from '@/generated/prisma';

export type Mood = PrismaMood;

export interface MoodResponse {
    id: string;
    value: number;
    date: string;
    noteId: string | null;
}

export interface MoodHistoryItem extends MoodResponse {}

export interface WeeklyMoodSummary {
    days: Array<number | null>;
    average: number | null;
    count: number;
}

export interface MonthlyMoodSummary {
    days: Array<number | null>;
    average: number | null;
    count: number;
    mostFrequent: number | null;
}

