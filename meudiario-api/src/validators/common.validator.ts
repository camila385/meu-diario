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

export type PaginationQuery = z.infer<typeof paginationSchema>
export type UuidParam = z.infer<typeof uuidParamSchema>
