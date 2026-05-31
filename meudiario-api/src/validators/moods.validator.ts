import { z } from 'zod';
import { paginationSchema } from './common.validator';

export const moodValueSchema = z.coerce
    .number()
    .int()
    .min(1, 'O humor deve estar entre 1 e 5.')
    .max(5, 'O humor deve estar entre 1 e 5.');

export const createMoodSchema = z.object({
    value: moodValueSchema,
    noteId: z.uuid('ID da anotação inválido.').optional(),
});

export type CreateMoodRequest = z.infer<typeof createMoodSchema>;

export const moodHistoryQuerySchema = paginationSchema.extend({
    dateFrom: z.iso.datetime().optional(),
    dateTo: z.iso.datetime().optional(),
});

export type MoodHistoryQuery = z.infer<typeof moodHistoryQuerySchema>;

export const monthlyMoodSummaryQuerySchema = z.object({
    year: z.coerce.number().int().min(1970, 'Ano inválido.'),
    month: z.coerce.number().int().min(1, 'Mês inválido.').max(12, 'Mês inválido.'),
});

export type MonthlyMoodSummaryQuery = z.infer<typeof monthlyMoodSummaryQuerySchema>;
