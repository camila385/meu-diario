import type { Request, Response, NextFunction } from 'express'
import type { CreateNoteRequest, UpdateNoteRequest, ListNotesQuery, NoteIdParam } from '@/validators/notes.validator'
import notesService from '@/services/notes.service'
import { sendSuccess } from '@/utils/response'

// T010: Notes Controller Scaffolding
// Controllers only orchestrate: extract req → call service → format response (P-07 compliance)

/**
 * POST /api/v1/notes
 * Create a new note for the authenticated user
 * - Body: CreateNoteRequest
 * - Auth: Bearer token (set by authenticate middleware)
 * - Response: 201 Created with NoteDetail
 */
export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // T017: Extract userId and validated body, call service, return 201
    const userId = req.userId! // Set by authenticate middleware
    const body = req.body as CreateNoteRequest // Validated by validate middleware
    const note = await notesService.createNote(userId, body)
    sendSuccess(res, note, 201)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/notes
 * List notes for the authenticated user with pagination and filters
 * - Query: ListNotesQuery (page, limit, tag, mood, search, dateFrom, dateTo)
 * - Auth: Bearer token
 * - Response: 200 OK with paginated NoteSummary[]
 */
export async function listNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // T023: Extract userId and validated query, call service, return paginated response
    const userId = req.userId! // Set by authenticate middleware
    const query = req.query as unknown as ListNotesQuery // Validated by validate middleware
    const { summaries, meta } = await notesService.listNotes(userId, query)
    sendSuccess(res, summaries, 200, meta)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/notes/:id
 * Get a single note by ID with access control
 * - Params: NoteIdParam (id)
 * - Auth: Bearer token
 * - Response: 200 OK with NoteDetail
 * - Access: Owner always; non-owner only if isPublic=true
 */
export async function getNoteById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // T029: Extract userId and note ID, call service, return detail
    const userId = req.userId!
    const { id: noteId } = req.params as unknown as NoteIdParam
    const note = await notesService.getNote(noteId, userId)
    sendSuccess(res, note, 200)
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/v1/notes/:id
 * Update a note owned by the authenticated user
 * - Params: NoteIdParam (id)
 * - Body: UpdateNoteRequest (partial, all fields optional)
 * - Auth: Bearer token
 * - Response: 200 OK with updated NoteDetail
 * - Access: Owner only
 */
export async function updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: Implement orchestration
    // 1. Extract userId from req.userId
    // 2. Extract params as NoteIdParam (validated)
    // 3. Extract body as UpdateNoteRequest (validated, partial)
    // 4. Call notesService.updateNote(noteId, userId, body)
    // 5. sendSuccess(res, updatedNote)
    throw new Error('Not implemented')
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/v1/notes/:id
 * Delete a note owned by the authenticated user (permanent)
 * - Params: NoteIdParam (id)
 * - Auth: Bearer token
 * - Response: 204 No Content (empty body)
 * - Access: Owner only
 */
export async function deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: Implement orchestration
    // 1. Extract userId from req.userId
    // 2. Extract params as NoteIdParam (validated)
    // 3. Call notesService.deleteNote(noteId, userId)
    // 4. Send 204 response with no body
    throw new Error('Not implemented')
  } catch (error) {
    next(error)
  }
}

export default {
  createNote,
  listNotes,
  getNoteById,
  updateNote,
  deleteNote,
}
