import { z } from 'zod'
import {
  paginationSchema,
  uuidParamSchema,
  noteTitleSchema,
  noteContentSchema,
  moodValueSchema,
  tagsArraySchema,
} from './common.validator'

export const createNoteSchema = z.object({
  title: noteTitleSchema,
  content: noteContentSchema,
  tags: tagsArraySchema,
  mood: moodValueSchema,
  isPublic: z.boolean().default(false),
})

export type CreateNoteRequest = z.infer<typeof createNoteSchema>

export const updateNoteSchema = z.object({
  title: noteTitleSchema.optional(),
  content: noteContentSchema,
  tags: tagsArraySchema.optional(),
  mood: moodValueSchema,
  isPublic: z.boolean().optional(),
})

export type UpdateNoteRequest = z.infer<typeof updateNoteSchema>

export const listNotesQuerySchema = paginationSchema.extend({
  tag: z.string().trim().optional(),
  mood: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>

export const noteIdParamSchema = uuidParamSchema

export type NoteIdParam = z.infer<typeof noteIdParamSchema>
