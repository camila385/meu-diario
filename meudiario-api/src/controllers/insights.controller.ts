import type { Request, Response } from 'express';
import type { InsightsService } from '@/services/insights.service';
import { sendSuccess } from '@/utils/response';

export class InsightsController {
    constructor(private readonly service: InsightsService) {}

    async getCalendar(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const { year, month } = req.query as unknown as { year: number; month: number };
        const days = await this.service.getCalendarDays(userId, year, month);
        sendSuccess(res, { days }, 200);
    }

    async getTags(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const { limit } = req.query as unknown as { limit: number };
        const tags = await this.service.getTopTags(userId, limit);
        sendSuccess(res, tags, 200);
    }

    async getWordcloud(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const { year, month } = req.query as unknown as { year: number; month: number };
        const cloud = await this.service.computeWordCloud(userId, year, month);
        sendSuccess(res, cloud, 200);
    }

    async getWeekdays(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const counts = await this.service.getWeekdayCounts(userId);
        sendSuccess(res, counts, 200);
    }

    async compareMonths(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const { year, month } = req.query as unknown as { year: number; month: number };
        const result = await this.service.compareMonths(userId, year, month);
        sendSuccess(res, result, 200);
    }

    async getOverview(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const overview = await this.service.getOverview(userId);
        sendSuccess(res, overview, 200);
    }
}
