import type { Request, Response } from 'express';
import type { MoodsService } from '@/services/moods.service';
import { sendSuccess } from '@/utils/response';
import type {
    CreateMoodRequest,
    MoodHistoryQuery,
    MonthlyMoodSummaryQuery,
} from '@/validators/moods.validator';

export class MoodsController {
    constructor(private readonly moodsService: MoodsService) {}

    async createMood(req: Request, res: Response): Promise<void> {
        const result = await this.moodsService.createMood(
            req.userId,
            req.body as CreateMoodRequest,
        );
        sendSuccess(res, result, 201);
    }

    async listHistory(req: Request, res: Response): Promise<void> {
        const result = await this.moodsService.listHistory(
            req.userId,
            req.query as unknown as MoodHistoryQuery,
        );
        sendSuccess(res, result.data, 200, result.meta);
    }

    async weeklySummary(req: Request, res: Response): Promise<void> {
        const result = await this.moodsService.weeklySummary(req.userId);
        sendSuccess(res, result);
    }

    async monthlySummary(req: Request, res: Response): Promise<void> {
        const result = await this.moodsService.monthlySummary(
            req.userId,
            req.query as unknown as MonthlyMoodSummaryQuery,
        );
        sendSuccess(res, result);
    }
}
