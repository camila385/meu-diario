import { z } from 'zod';

const titleSchema = z
    .string()
    .trim()
    .min(1, 'O título é obrigatório.')
    .max(200, 'O título não pode exceder 200 caracteres.');

const contentSchema = z
    .string()
    .trim()
    .max(10000, 'O conteúdo não pode exceder 10.000 caracteres.')
    .optional()
    .transform((value) => (value === '' ? undefined : value));

const tagSchema = z
    .string()
    .trim()
    .min(1, 'O nome da tag é obrigatório.')
    .max(50, 'O nome da tag não pode exceder 50 caracteres.');

const tagsSchema = z
    .array(tagSchema)
    .max(10, 'Não é possível associar mais de 10 tags a uma anotação.')
    .default([]);

const moodSchema = z
    .number()
    .int()
    .min(1, 'O humor deve estar entre 1 e 5.')
    .max(5, 'O humor deve estar entre 1 e 5.')
    .optional();

export const createNoteSchema = z.object({
    title: titleSchema,
    content: contentSchema,
    tags: tagsSchema,
    mood: moodSchema,
    isPublic: z.boolean().default(false),
});

export const updateNoteSchema = z.object({
    title: titleSchema.optional(),
    content: contentSchema,
    tags: tagsSchema.optional(),
    mood: moodSchema,
    isPublic: z.boolean().optional(),
});

export const notesQuerySchema = z
    .object({
        tag: z.string().trim().min(1).max(50).optional(),
        mood: z.coerce.number().int().min(1).max(5).optional(),
        search: z.string().trim().optional(),
        dateFrom: z.iso.datetime().optional(),
        dateTo: z.iso.datetime().optional(),
    })
    .refine(
        (query) => !query.dateFrom || !query.dateTo || new Date(query.dateFrom) <= new Date(query.dateTo),
        { message: 'A data inicial não pode ser maior que a data final.', path: ['dateFrom'] },
    );

export type CreateNoteRequest = z.infer<typeof createNoteSchema>;
export type UpdateNoteRequest = z.infer<typeof updateNoteSchema>;
export type NotesQuery = z.infer<typeof notesQuerySchema>;
