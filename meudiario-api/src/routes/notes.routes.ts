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
 @swagger
 /api/v1/notes:
    post:
      tags:
        - Notes
      summary: Create a new note
      description: Create a new diary note with title, optional content, tags, mood, and visibility settings. New notes are private by default. Upon creation, user earns gamification points and streak updates.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                  maxLength: 200
                  description: Note title (required, max 200 chars)
                  example: "Meu dia de hoje"
                content:
                  type: string
                  maxLength: 10000
                  description: Note content (optional, max 10,000 chars)
                  example: "Foi um dia produtivo e interessante"
                tags:
                  type: array
                  maxItems: 10
                  items:
                    type: string
                    maxLength: 50
                  description: List of tag names (optional, max 10 tags, each max 50 chars)
                  example: ["diário", "produtivo"]
                mood:
                  type: integer
                  minimum: 1
                  maximum: 5
                  description: Mood value on scale 1-5 (optional)
                  example: 4
                isPublic:
                  type: boolean
                  description: Visibility flag (optional, defaults to false)
                  example: false
              required:
                - title
      responses:
        "201":
          description: Note created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      id:
                        type: string
                        format: uuid
                      title:
                        type: string
                      content:
                        type: string
                      tags:
                        type: array
                        items:
                          type: object
                      mood:
                        type: object
                      isPublic:
                        type: boolean
                      createdAt:
                        type: string
                        format: date-time
                      updatedAt:
                        type: string
                        format: date-time
                      owner:
                        type: object
        "400":
          description: Validation error (invalid title, content too long, etc)
        "401":
          description: Unauthorized (missing or invalid token)
 */
// T019: Route already registered with authenticate + validate middleware
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
