import type { Request, Response } from 'express';
import type { GamificationService } from '@/services/gamification.service';
import { sendSuccess } from '@/utils/response';

export class GamificationController {
    constructor(private readonly gamificationService: GamificationService) {}

    async progress(req: Request, res: Response): Promise<void> {
        const result = await this.gamificationService.getProgress(req.userId);
        sendSuccess(res, result);
    }

    async badges(req: Request, res: Response): Promise<void> {
        const result = await this.gamificationService.getBadges(req.userId);
        sendSuccess(res, result);
    }

    async currentChallenge(req: Request, res: Response): Promise<void> {
        const result = await this.gamificationService.getWeeklyChallenge(req.userId);
        sendSuccess(res, result);
    }

    async ranking(req: Request, res: Response): Promise<void> {
        const result = await this.gamificationService.getRanking(req.userId);
        sendSuccess(res, result);
    }
}
