import { z } from 'zod';

const moodValueSchema = z.coerce
    .number()
    .int()
    .min(1, 'O humor deve estar entre 1 e 5.')
    .max(5, 'O humor deve estar entre 1 e 5.');

export const createMoodSchema = z.object({
    value: moodValueSchema,
    noteId: z.uuid('ID da anotação inválido.').optional(),
});

export const moodHistoryQuerySchema = z.object({
    dateFrom: z.iso.datetime().optional(),
    dateTo: z.iso.datetime().optional(),
});

export type CreateMoodRequest = z.infer<typeof createMoodSchema>;
export type MoodHistoryQuery = z.infer<typeof moodHistoryQuerySchema>;
