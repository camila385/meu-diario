import { Router } from 'express';
import { insightsController } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
    calendarQuerySchema,
    tagsQuerySchema,
    wordcloudQuerySchema,
    compareQuerySchema,
} from '@/validators/insights.validator';

const router = Router();

/**
 * @swagger
 * /api/v1/insights/calendar:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get calendar days with notes for a given month
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/calendar',
    authenticate,
    validate(calendarQuerySchema, { source: 'query' }),
    (req, res) => insightsController.getCalendar(req, res),
);

/**
 * @swagger
 * /api/v1/insights/tags:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get top tags for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 */
router.get('/tags', authenticate, validate(tagsQuerySchema, { source: 'query' }), (req, res) =>
    insightsController.getTags(req, res),
);

/**
 * @swagger
 * /api/v1/insights/wordcloud:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get the word cloud for a given month
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: year
 *         in: query
 *         schema:
 *           type: integer
 *       - name: month
 *         in: query
 *         schema:
 *           type: integer
 */
router.get(
    '/wordcloud',
    authenticate,
    validate(wordcloudQuerySchema, { source: 'query' }),
    (req, res) => insightsController.getWordcloud(req, res),
);

/**
 * @swagger
 * /api/v1/insights/weekdays:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get counts of notes per weekday (0=Sunday..6=Saturday)
 *     security:
 *       - bearerAuth: []
 */
router.get('/weekdays', authenticate, (req, res) => insightsController.getWeekdays(req, res));

/**
 * @swagger
 * /api/v1/insights/compare:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Compare a month with the previous month
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: year
 *         in: query
 *         schema:
 *           type: integer
 *       - name: month
 *         in: query
 *         schema:
 *           type: integer
 */
router.get(
    '/compare',
    authenticate,
    validate(compareQuerySchema, { source: 'query' }),
    (req, res) => insightsController.compareMonths(req, res),
);

/**
 * @swagger
 * /api/v1/insights/overview:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get overview statistics for the authenticated user
 *     security:
 *       - bearerAuth: []
 */
router.get('/overview', authenticate, (req, res) => insightsController.getOverview(req, res));

export default router;
