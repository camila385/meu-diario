import { Router } from 'express';
import { gamificationService } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { gamificationRankingQuerySchema } from '@/validators/gamification.validator';
import type { GamificationRankingQuery } from '@/validators/gamification.validator';
import { sendSuccess } from '@/utils/response';

const router = Router();

router.get('/progress', authenticate, async (req, res) => {
    const result = await gamificationService.getProgress(req.userId!);
    sendSuccess(res, result);
});

router.get('/badges', authenticate, async (req, res) => {
    const result = await gamificationService.getBadges(req.userId!);
    sendSuccess(res, result);
});

router.get('/ranking', authenticate, validate(gamificationRankingQuerySchema, 'query'), async (req, res) => {
    const { limit } = req.query as unknown as GamificationRankingQuery;
    const result = await gamificationService.getRanking(req.userId!, limit);
    sendSuccess(res, result);
});

export default router;
