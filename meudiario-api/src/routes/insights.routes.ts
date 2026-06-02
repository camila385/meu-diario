import { Router } from 'express';
import { insightsService } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { calendarQuerySchema } from '@/validators/insights.validator';
import type { YearMonthQuery } from '@/validators/common.validator';
import { sendSuccess } from '@/utils/response';

const router = Router();

router.get('/calendar', authenticate, validate(calendarQuerySchema, 'query'), async (req, res) => {
    const { year, month } = req.query as unknown as YearMonthQuery;
    const days = await insightsService.findCalendarDays(req.userId!, year, month);
    sendSuccess(res, { days });
});

router.get('/weekdays', authenticate, async (req, res) => {
    const counts = await insightsService.findWeekdayCounts(req.userId!);
    sendSuccess(res, counts);
});

router.get('/overview', authenticate, async (req, res) => {
    const overview = await insightsService.getOverview(req.userId!);
    sendSuccess(res, overview);
});

export default router;
