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

// TODO: T030 - Add Swagger @swagger annotations and implement
/**
 @swagger
 /api/v1/notes:
   get:
     tags:
       - Notes
     summary: List user's notes with pagination and filters
     description: Retrieve paginated list of notes for the authenticated user. Supports filtering by tag, mood, date range, and keyword search. Notes are returned as summaries (with excerpt, not full content) sorted by creation date (newest first).
     security:
       - bearerAuth: []
     parameters:
       - name: page
         in: query
         schema:
           type: integer
           minimum: 1
           default: 1
         description: Page number for pagination (1-indexed)
       - name: limit
         in: query
         schema:
           type: integer
           minimum: 1
           maximum: 100
           default: 20
         description: Number of notes per page (max 100)
       - name: tag
         in: query
         schema:
           type: string
         description: Filter by single tag name (case-sensitive)
       - name: mood
         in: query
         schema:
           type: integer
           minimum: 1
           maximum: 5
         description: Filter by mood value (1-5)
       - name: search
         in: query
         schema:
           type: string
           maxLength: 200
         description: Search keyword in note title and content (case-insensitive)
       - name: dateFrom
         in: query
         schema:
           type: string
           format: date-time
         description: Filter notes created on or after this ISO datetime (inclusive)
       - name: dateTo
         in: query
         schema:
           type: string
           format: date-time
         description: Filter notes created on or before this ISO datetime (inclusive)
     responses:
       "200":
         description: Notes retrieved successfully with pagination metadata
         content:
           application/json:
             schema:
               type: object
               properties:
                 success:
                   type: boolean
                   example: true
                 data:
                   type: array
                   items:
                     type: object
                     properties:
                       id:
                         type: string
                         format: uuid
                       title:
                         type: string
                         maxLength: 200
                       excerpt:
                         type: string
                         maxLength: 150
                         description: First 150 chars of content or full content if shorter
                       tags:
                         type: array
                         items:
                           type: object
                           properties:
                             id:
                               type: string
                               format: uuid
                             name:
                               type: string
                               maxLength: 50
                       mood:
                         type: object
                         properties:
                           value:
                             type: integer
                             minimum: 1
                             maximum: 5
                           date:
                             type: string
                             format: date-time
                       isPublic:
                         type: boolean
                       createdAt:
                         type: string
                         format: date-time
                   example:
                     - id: "uuid-1"
                       title: "Meu dia produtivo"
                       excerpt: "Hoje foi um dia muito bom, consegui terminar todos os projetos..."
                       tags: [{ id: "uuid-tag", name: "produtivo" }]
                       mood: { value: 5, date: "2024-01-15T10:30:00Z" }
                       isPublic: false
                       createdAt: "2024-01-15T10:30:00Z"
                 meta:
                   type: object
                   properties:
                     page:
                       type: integer
                       example: 1
                     limit:
                       type: integer
                       example: 20
                     total:
                       type: integer
                       example: 45
                   description: Pagination metadata (current page, items per page, total count)
       "400":
         description: Invalid query parameters (e.g., invalid date format, limit > 100)
       "401":
         description: Unauthorized (missing or invalid token)
 */
router.get('/', authenticate, validate(listNotesQuerySchema), notesController.listNotes)

// TODO: T031 - Add Swagger @swagger annotations and implement
/**
 @swagger
 /api/v1/notes/{id}:
   get:
     tags:
       - Notes
     summary: Get a single note by ID
     description: Retrieve a complete note with all details (title, content, tags, mood). Owner always has access. Non-owners can view only if the note is marked as public (isPublic=true).
     security:
       - bearerAuth: []
     parameters:
       - name: id
         in: path
         required: true
         schema:
           type: string
           format: uuid
         description: The UUID identifier of the note to retrieve
         example: "550e8400-e29b-41d4-a716-446655440000"
     responses:
       "200":
         description: Note retrieved successfully
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
                       description: Full note content (not truncated, unlike list summaries)
                     tags:
                       type: array
                       items:
                         type: object
                         properties:
                           id:
                             type: string
                             format: uuid
                           name:
                             type: string
                             maxLength: 50
                     mood:
                       type: object
                       properties:
                         value:
                           type: integer
                           minimum: 1
                           maximum: 5
                         date:
                           type: string
                           format: date-time
                     isPublic:
                       type: boolean
                     owner:
                       type: object
                       properties:
                         id:
                           type: string
                           format: uuid
                         username:
                           type: string
                     createdAt:
                       type: string
                       format: date-time
                     updatedAt:
                       type: string
                       format: date-time
                   example:
                     id: "550e8400-e29b-41d4-a716-446655440000"
                     title: "Dia produtivo"
                     content: "Hoje foi um dia muito produtivo. Consegui terminar todos os projetos planejados..."
                     tags: [{ id: "uuid-tag", name: "produtivo" }, { id: "uuid-tag2", name: "reflexão" }]
                     mood: { value: 5, date: "2024-01-15T10:30:00Z" }
                     isPublic: false
                     owner: { id: "uuid-user", username: "johndoe" }
                     createdAt: "2024-01-15T10:30:00Z"
                     updatedAt: "2024-01-15T10:30:00Z"
       "404":
         description: Note not found (or access denied for non-owner/private notes)
       "401":
         description: Unauthorized (missing or invalid token)
 */
router.get('/:id', authenticate, validate(noteIdParamSchema), notesController.getNoteById)

// TODO: T038 - Add Swagger @swagger annotations and implement
/**
 @swagger
 /api/v1/notes/{id}:
   patch:
     tags:
       - Notes
     summary: Update a note (partial update)
     description: Partially update an existing note. All fields are optional - only provided fields are updated. Tag list is fully replaced when tags are provided (not appended). Ownership required.
     security:
       - bearerAuth: []
     parameters:
       - name: id
         in: path
         required: true
         schema:
           type: string
           format: uuid
         description: The UUID identifier of the note to update
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
                 description: Note title (optional, only update if provided)
               content:
                 type: string
                 maxLength: 10000
                 description: Note content (optional)
               tags:
                 type: array
                 maxItems: 10
                 items:
                   type: string
                   maxLength: 50
                 description: List of tag names (optional, replaces all existing tags)
               mood:
                 type: integer
                 minimum: 1
                 maximum: 5
                 description: Mood value on scale 1-5 (optional, can be null to remove)
               isPublic:
                 type: boolean
                 description: Visibility flag (optional)
             example:
               title: "Dia atualizado"
               tags: ["reflexão", "produtivo"]
               mood: 4
     responses:
       "200":
         description: Note updated successfully
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
                   description: Updated NoteDetail with all fields
       "400":
         description: Validation error (invalid fields, constraints violated)
       "401":
         description: Unauthorized (missing or invalid token)
       "403":
         description: Forbidden (not the owner of the note)
       "404":
         description: Note not found
 */
router.patch('/:id', authenticate, validate(updateNoteSchema), notesController.updateNote)

// TODO: T043 - Add Swagger @swagger annotations and implement
/**
 * DELETE /api/v1/notes/:id - Delete a note
 */
router.delete('/:id', authenticate, validate(noteIdParamSchema), notesController.deleteNote)

export default router
