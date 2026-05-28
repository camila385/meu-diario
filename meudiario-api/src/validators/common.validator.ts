import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido.'),
})

export const emailSchema = z
  .string()
  .trim()
  .email('E-mail inválido.')
  .transform((value) => value.toLowerCase())

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres.')
  .max(100, 'A senha deve ter no máximo 100 caracteres.')

// Notes DTO Primitives (T004)
export const noteTitleSchema = z
  .string()
  .trim()
  .min(1, 'O título é obrigatório.')
  .max(200, 'O título não pode exceder 200 caracteres.')

export const noteContentSchema = z
  .string()
  .trim()
  .max(10000, 'O conteúdo não pode exceder 10.000 caracteres.')
  .optional()
  .transform((value) => (value === '' ? undefined : value))

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, 'O nome da tag é obrigatório.')
  .max(50, 'O nome da tag não pode exceder 50 caracteres.')

export const moodValueSchema = z
  .number()
  .int()
  .min(1, 'O humor deve estar entre 1 e 5.')
  .max(5, 'O humor deve estar entre 1 e 5.')
  .optional()

export const tagsArraySchema = z
  .array(tagNameSchema)
  .max(10, 'Não é possível associar mais de 10 tags a uma anotação.')
  .default([])

export type PaginationQuery = z.infer<typeof paginationSchema>
export type UuidParam = z.infer<typeof uuidParamSchema>
export type NoteTitle = z.infer<typeof noteTitleSchema>
export type NoteContent = z.infer<typeof noteContentSchema>
export type TagName = z.infer<typeof tagNameSchema>
export type MoodValue = z.infer<typeof moodValueSchema>
export type TagsArray = z.infer<typeof tagsArraySchema>
