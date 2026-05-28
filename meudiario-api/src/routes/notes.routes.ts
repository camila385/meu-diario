import { Router } from 'express'
import { authenticate } from '@/middlewares/auth.middleware'
import { validate } from '@/middlewares/validate.middleware'
import notesController from '@/controllers/notes.controller'
import {
  createNoteSchema,
  updateNoteSchema,
  listNotesQuerySchema,
  noteIdParamSchema,
} from '@/validators/notes.validator'

// T009: Notes Routes Scaffolding
// Placeholder for 5 endpoints (POST, GET, GET/:id, PATCH, DELETE)
// Swagger annotations will be added in user story implementation tasks

const router = Router()

// TODO: T018 - Add Swagger @swagger annotations and implement
/**
 * POST /api/v1/notes - Create a new note
 */
router.post('/', authenticate, validate(createNoteSchema), notesController.createNote)

// TODO: T024 - Add Swagger @swagger annotations and implement
/**
 * GET /api/v1/notes - List user's notes with pagination and filters
 */
router.get('/', authenticate, validate(listNotesQuerySchema), notesController.listNotes)

// TODO: T030 - Add Swagger @swagger annotations and implement
/**
 * GET /api/v1/notes/:id - Get a single note by ID
 */
router.get('/:id', authenticate, validate(noteIdParamSchema), notesController.getNoteById)

// TODO: T037 - Add Swagger @swagger annotations and implement
/**
 * PATCH /api/v1/notes/:id - Update a note
 */
router.patch('/:id', authenticate, validate(updateNoteSchema), notesController.updateNote)

// TODO: T043 - Add Swagger @swagger annotations and implement
/**
 * DELETE /api/v1/notes/:id - Delete a note
 */
router.delete('/:id', authenticate, validate(noteIdParamSchema), notesController.deleteNote)

export default router
