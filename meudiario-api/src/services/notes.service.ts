import type { CreateNoteRequest, UpdateNoteRequest, ListNotesQuery } from '@/validators/notes.validator'
import { AppError, NotFoundError, ForbiddenError } from '@/errors'
import notesRepository from '@/repositories/notes.repository'
import { gamificationRepository } from '@/repositories/gamification.repository'
import { toNoteDetail, toNoteSummary } from '@/models/note.model'

// T011: Notes Service Scaffolding
// Services contain business logic, no req/res, no Prisma access (P-07, P-03 compliance)

/**
/**
 * T016: Create a new note for user
 * - Validate input (delegated to validator middleware)
 * - Store note with gamification update (atomic in repository)
 * - Business logic: set isPublic default, compute streak, update points
 * Returns the created note with relations
 */
export async function createNote(userId: string, input: CreateNoteRequest) {
  // Call notesRepository.createNote which handles:
  // 1. Create note record with isPublic default
  // 2. Get/create tags and link them
  // 3. Store optional mood
  const note = await notesRepository.createNote(userId, input)

  // Call gamificationRepository to update points and streak
  await gamificationRepository.updateOnNoteCreation(userId)

  // Return note detail with mapper
  return toNoteDetail(note)
}

/**
 * T022: List notes for user with pagination and filters
 * - Apply pagination (page, limit)
 * - Apply filters: tag, mood, date range, keyword search
 * - Sort by createdAt descending
 * Returns summaries only (not full content) with pagination metadata
 */
export async function listNotes(userId: string, query: ListNotesQuery) {
  const { notes, total } = await notesRepository.listNotes(userId, query)

  // Map notes to summary DTO (excerpt, no full content)
  const summaries = notes.map(toNoteSummary)

  const meta = {
    page: query.page,
    limit: query.limit,
    total,
  }

  return { summaries, meta }
}

/**
 * Get a single note by ID with access control
 * - Owner always has access
 * - Non-owner can view only if isPublic=true
 * - Throws 404 if not found or access denied
 */
export async function getNote(noteId: string, userId: string) {
  // T028: Call repository with access control (repository returns null if denied)
  const note = await notesRepository.getNoteById(noteId, userId)
  if (!note) {
    throw new NotFoundError('Anotação não encontrada.')
  }
  return toNoteDetail(note)
}

/**
 * Update a note owned by the user
 * - Partial update: preserve fields not included in input
 * - Replace full tag list when tags are provided
 * - Ownership check: throw ForbiddenError if not owner
 * - Throws 404 if not found or ForbiddenError if not owner
 */
export async function updateNote(noteId: string, userId: string, input: Partial<UpdateNoteRequest>) {
  // T035: Check ownership first
  const isOwner = await notesRepository.isNoteOwner(noteId, userId)
  if (!isOwner) {
    throw new ForbiddenError('Acesso negado. Apenas o proprietário pode editar esta anotação.')
  }

  // Call updateNote with partial input
  const note = await notesRepository.updateNote(noteId, input)
  if (!note) {
    throw new NotFoundError('Anotação não encontrada.')
  }

  return toNoteDetail(note)
}

/**
 * Delete a note owned by the user (permanent)
 * - Ownership check: throw ForbiddenError if not owner
 * - Returns no value (void)
 * - Throws 404 or ForbiddenError if denied
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  // TODO: Implement delete logic with ownership check
  // 1. Check ownership: call notesRepository.isNoteOwner(noteId, userId)
  // 2. Throw ForbiddenError if not owner
  // 3. Call notesRepository.deleteNote(noteId)
  throw new Error('Not implemented')
}

export default {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
}
