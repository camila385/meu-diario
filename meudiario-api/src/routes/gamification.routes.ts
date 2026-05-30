import { Router } from 'express'
import { gamificationController } from '@/composition-root'
import { authenticate } from '@/middlewares/auth.middleware'
import { validate } from '@/middlewares/validate.middleware'
import {
	gamificationBadgeQuerySchema,
	gamificationChallengeQuerySchema,
	gamificationProgressQuerySchema,
	gamificationRankingQuerySchema,
} from '@/validators/gamification.validator'

const router = Router()

/**
 * @swagger
 * /api/v1/gamification/progress:
 *   get:
 *     tags:
 *       - Gamification
 *     summary: Get authenticated user's gamification progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Gamification progress retrieved successfully
 */
router.get('/progress', authenticate, validate(gamificationProgressQuerySchema, 'query'), (req, res) => gamificationController.progress(req, res))

/**
 * @swagger
 * /api/v1/gamification/badges:
 *   get:
 *     tags:
 *       - Gamification
 *     summary: List gamification badges for authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Badges retrieved successfully
 */
router.get('/badges', authenticate, validate(gamificationBadgeQuerySchema, 'query'), (req, res) => gamificationController.badges(req, res))

/**
 * @swagger
 * /api/v1/gamification/challenge/current:
 *   get:
 *     tags:
 *       - Gamification
 *     summary: Get the current weekly challenge
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Weekly challenge retrieved successfully
 */
router.get('/challenge/current', authenticate, validate(gamificationChallengeQuerySchema, 'query'), (req, res) => gamificationController.currentChallenge(req, res))

/**
 * @swagger
 * /api/v1/gamification/ranking:
 *   get:
 *     tags:
 *       - Gamification
 *     summary: Get points ranking among mutual followers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Ranking retrieved successfully
 */
router.get('/ranking', authenticate, validate(gamificationRankingQuerySchema, 'query'), (req, res) => gamificationController.ranking(req, res))

export default router
