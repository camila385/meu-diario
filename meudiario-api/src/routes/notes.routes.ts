import { Router } from 'express';
import { notesController } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
    createNoteSchema,
    updateNoteSchema,
    listNotesQuerySchema,
    noteIdParamSchema,
} from '@/validators/notes.validator';

const router = Router();

/**
 * @swagger
 * /api/v1/notes:
 *   post:
 *     tags:
 *       - Notes
 *     summary: Create a new note
 *     description: Create a new diary note with title, optional content, tags, mood, and visibility settings. New notes are private by default. Upon creation, user earns gamification points and streak updates.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Note title (required, max 200 chars)
 *                 example: "Meu dia de hoje"
 *               content:
 *                 type: string
 *                 maxLength: 10000
 *                 description: Note content (optional, max 10,000 chars)
 *                 example: "Foi um dia produtivo e interessante"
 *               tags:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   maxLength: 50
 *                 description: List of tag names (optional, max 10 tags, each max 50 chars)
 *                 example: ["diário", "produtivo"]
 *               mood:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Mood value on scale 1-5 (optional)
 *                 example: 4
 *               isPublic:
 *                 type: boolean
 *                 description: Visibility flag (optional, defaults to false)
 *                 example: false
 *             required:
 *               - title
 *     responses:
 *       "201":
 *         description: Note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: object
 *                     mood:
 *                       type: object
 *                     isPublic:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     owner:
 *                       type: object
 *       "400":
 *         description: Validation error (invalid title, content too long, etc)
 *       "401":
 *         description: Unauthorized (missing or invalid token)
 */
router.post('/', authenticate, validate(createNoteSchema), (req, res) => notesController.createNote(req, res));

/**
 * @swagger
 * /api/v1/notes:
 *   get:
 *     tags:
 *       - Notes
 *     summary: List user's notes with pagination and filters
 *     description: Retrieve paginated list of notes for the authenticated user. Supports filtering by tag, mood, date range, and keyword search. Notes are returned as summaries (with excerpt, not full content) sorted by creation date (newest first).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination (1-indexed)
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of notes per page (max 100)
 *       - name: tag
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by single tag name (case-sensitive)
 *       - name: mood
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by mood value (1-5)
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Search keyword in note title and content (case-insensitive)
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter notes created on or after this ISO datetime (inclusive)
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter notes created on or before this ISO datetime (inclusive)
 *     responses:
 *       "200":
 *         description: Notes retrieved successfully with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                         maxLength: 200
 *                       excerpt:
 *                         type: string
 *                         maxLength: 150
 *                         description: First 150 chars of content or full content if shorter
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                               maxLength: 50
 *                       mood:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: integer
 *                             minimum: 1
 *                             maximum: 5
 *                           date:
 *                             type: string
 *                             format: date-time
 *                       isPublic:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                   example:
 *                     - id: "uuid-1"
 *                       title: "Meu dia produtivo"
 *                       excerpt: "Hoje foi um dia muito bom, consegui terminar todos os projetos..."
 *                       tags: [{ id: "uuid-tag", name: "produtivo" }]
 *                       mood: { value: 5, date: "2024-01-15T10:30:00Z" }
 *                       isPublic: false
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 45
 *                   description: Pagination metadata (current page, items per page, total count)
 *       "400":
 *         description: Invalid query parameters (e.g., invalid date format, limit > 100)
 *       "401":
 *         description: Unauthorized (missing or invalid token)
 */
router.get('/', authenticate, validate(listNotesQuerySchema), (req, res) => notesController.listNotes(req, res));

/**
 * @swagger
 * /api/v1/notes/{id}:
 *   parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: The UUID identifier of the note
 *   get:
 *     tags:
 *       - Notes
 *     summary: Get a single note by ID
 *     description: Retrieve a complete note with all details (title, content, tags, mood). Owner always has access. Non-owners can view only if the note is marked as public (isPublic=true).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Note retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: object
 *                     mood:
 *                       type: object
 *                     isPublic:
 *                       type: boolean
 *                     owner:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       "404":
 *         description: Note not found (or access denied for non-owner/private notes)
 *       "401":
 *         description: Unauthorized
 *   patch:
 *     tags:
 *       - Notes
 *     summary: Update a note (partial update)
 *     description: Partially update an existing note. All fields are optional - only provided fields are updated. Tag list is fully replaced when tags are provided. Ownership required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 maxLength: 10000
 *               tags:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   maxLength: 50
 *               mood:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       "200":
 *         description: Note updated successfully
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (not the owner)
 *       "404":
 *         description: Note not found
 *   delete:
 *     tags:
 *       - Notes
 *     summary: Delete a note permanently
 *     description: Permanently delete an existing note. This action cannot be undone. Ownership required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "204":
 *         description: Note deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (not the owner)
 *       "404":
 *         description: Note not found
 */
router.get('/:id', authenticate, validate(noteIdParamSchema), (req, res) => notesController.getNoteById(req, res));
router.patch('/:id', authenticate, validate(updateNoteSchema), (req, res) => notesController.updateNote(req, res));
router.delete('/:id', authenticate, validate(noteIdParamSchema), (req, res) => notesController.deleteNote(req, res));

export default router;
