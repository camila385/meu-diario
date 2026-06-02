import { z } from 'zod';

export const uuidParamSchema = z.object({
    id: z.uuid('ID inválido.'),
});

export const noteAndCommentParamSchema = z.object({
    noteId: z.uuid('ID da nota inválido.'),
    commentId: z.uuid('ID do comentário inválido.'),
});

export const emailSchema = z
    .email('E-mail inválido.')
    .trim()
    .transform((value) => value.toLowerCase());

export const passwordSchema = z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres.')
    .max(100, 'A senha deve ter no máximo 100 caracteres.');

export const yearMonthSchema = z.object({
    year: z.coerce.number().int().min(1970, 'Ano inválido.').max(3000, 'Ano inválido.'),
    month: z.coerce.number().int().min(1, 'Mês inválido.').max(12, 'Mês inválido.'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
export type NoteAndCommentParam = z.infer<typeof noteAndCommentParamSchema>;
export type YearMonthQuery = z.infer<typeof yearMonthSchema>;
