import type { Mood as PrismaMood } from '@/generated/prisma';

export type Mood = PrismaMood;

export interface MoodResponse {
    id: string;
    value: number;
    date: string;
    noteId: string | null;
}
