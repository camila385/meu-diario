import { Router } from 'express';
import { moodsController } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
    createMoodSchema,
    moodHistoryQuerySchema,
    monthlyMoodSummaryQuerySchema,
} from '@/validators/moods.validator';

const router = Router();

/**
 * @swagger
 * /api/v1/moods:
 *   post:
 *     tags:
 *       - Moods
 *     summary: Register today's mood
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               noteId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       '201':
 *         description: Mood registered successfully
 *       '400':
 *         description: Invalid payload
 *       '401':
 *         description: Unauthorized
 */
router.post('/', authenticate, validate(createMoodSchema), (req, res) => moodsController.createMood(req, res));

/**
 * @swagger
 * /api/v1/moods:
 *   get:
 *     tags:
 *       - Moods
 *     summary: List mood history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       '200':
 *         description: Mood history retrieved successfully
 */
router.get('/', authenticate, validate(moodHistoryQuerySchema, 'query'), (req, res) => moodsController.listHistory(req, res));

/**
 * @swagger
 * /api/v1/moods/weekly:
 *   get:
 *     tags:
 *       - Moods
 *     summary: Weekly mood summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Weekly summary retrieved successfully
 */
router.get('/weekly', authenticate, (req, res) => moodsController.weeklySummary(req, res));

/**
 * @swagger
 * /api/v1/moods/monthly:
 *   get:
 *     tags:
 *       - Moods
 *     summary: Monthly mood summary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: year
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *       - name: month
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       '200':
 *         description: Monthly summary retrieved successfully
 */
router.get('/monthly', authenticate, validate(monthlyMoodSummaryQuerySchema, 'query'), (req, res) => 
    moodsController.monthlySummary(req, res),
);

export default router;
