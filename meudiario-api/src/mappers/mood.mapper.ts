import type { Mood as PrismaMood } from '@/generated/prisma';
import type { MoodResponse } from '@/models/mood.model';

export const toResponse = (mood: Pick<PrismaMood, 'id' | 'value' | 'date' | 'noteId'>): MoodResponse => ({
    id: mood.id,
    value: mood.value,
    date: mood.date.toISOString(),
    noteId: mood.noteId,
});
