import { z } from 'zod'
import {
  paginationSchema,
  uuidParamSchema,
  noteTitleSchema,
  noteContentSchema,
  moodValueSchema,
  tagsArraySchema,
} from './common.validator'

// T005: Notes Schemas

/**
 * Create Note Request DTO
 * - title: required, max 200 chars
 * - content: optional, max 10,000 chars
 * - tags: optional, max 10 entries
 * - mood: optional, 1-5 scale
 * - isPublic: optional, defaults to false
 */
export const createNoteSchema = z.object({
  title: noteTitleSchema,
  content: noteContentSchema,
  tags: tagsArraySchema,
  mood: moodValueSchema,
  isPublic: z.boolean().default(false),
})

export type CreateNoteRequest = z.infer<typeof createNoteSchema>

/**
 * Update Note Request DTO (partial update)
 * - All fields optional
 * - When tags are provided, replaces the entire tag list
 */
export const updateNoteSchema = z.object({
  title: noteTitleSchema.optional(),
  content: noteContentSchema,
  tags: tagsArraySchema.optional(),
  mood: moodValueSchema,
  isPublic: z.boolean().optional(),
})

export type UpdateNoteRequest = z.infer<typeof updateNoteSchema>

/**
 * List Notes Query Parameters
 * - page, limit: pagination (from common.validator)
 * - tag: filter by single tag name
 * - mood: filter by mood value
 * - search: keyword search in title/content
 * - dateFrom, dateTo: ISO date/time strings, inclusive bounds
 */
export const listNotesQuerySchema = paginationSchema.extend({
  tag: z.string().trim().optional(),
  mood: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>

/**
 * Note ID Parameter
 * - id: UUID, required
 */
export const noteIdParamSchema = uuidParamSchema

export type NoteIdParam = z.infer<typeof noteIdParamSchema>
