import { z } from 'zod';
import { paginationSchema } from './common.validator';

export const calendarQuerySchema = z.object({
    year: z.coerce.number().int().min(1970).max(3000),
    month: z.coerce.number().int().min(1).max(12),
});

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;

export const tagsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type TagsQuery = z.infer<typeof tagsQuerySchema>;

export const wordcloudQuerySchema = calendarQuerySchema;
export type WordcloudQuery = z.infer<typeof wordcloudQuerySchema>;

export const compareQuerySchema = calendarQuerySchema;
export type CompareQuery = z.infer<typeof compareQuerySchema>;

export const weekdaysQuerySchema = z.object({});
export type WeekdaysQuery = z.infer<typeof weekdaysQuerySchema>;
