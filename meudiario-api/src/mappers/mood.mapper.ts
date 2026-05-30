import type { Mood as PrismaMood } from '@/generated/prisma';
import type { MoodResponse, MoodHistoryItem } from '@/models/mood.model';

export const toMoodResponse = (mood: PrismaMood): MoodResponse => ({
    id: mood.id,
    value: mood.value,
    date: mood.date.toISOString(),
    noteId: mood.noteId,
});

export const toMoodHistoryItem = (
    mood: Pick<PrismaMood, 'id' | 'value' | 'date' | 'noteId'>,
): MoodHistoryItem => ({
    id: mood.id,
    value: mood.value,
    date: mood.date.toISOString(),
    noteId: mood.noteId,
});

export default {
    toMoodResponse,
    toMoodHistoryItem,
};
