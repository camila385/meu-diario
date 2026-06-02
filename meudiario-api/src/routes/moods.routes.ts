import { Router } from 'express';
import { moodsService } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createMoodSchema, moodHistoryQuerySchema } from '@/validators/moods.validator';
import type { CreateMoodRequest, MoodHistoryQuery } from '@/validators/moods.validator';
import { sendSuccess } from '@/utils/response';

const router = Router();

router.get('/', authenticate, validate(moodHistoryQuerySchema, 'query'), async (req, res) => {
    const moods = await moodsService.list(req.userId!, req.query as unknown as MoodHistoryQuery);
    sendSuccess(res, moods);
});

router.post('/', authenticate, validate(createMoodSchema), async (req, res) => {
    const result = await moodsService.record(req.userId!, req.body as CreateMoodRequest);
    sendSuccess(res, result, 201);
});

export default router;
