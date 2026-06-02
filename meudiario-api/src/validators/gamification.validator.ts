import { z } from 'zod';

export const gamificationRankingQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(50),
});

export type GamificationRankingQuery = z.infer<typeof gamificationRankingQuerySchema>;
