import { z } from 'zod';
import { paginationSchema } from './common.validator';

export const gamificationProgressQuerySchema = z.object({});
export type GamificationProgressQuery = z.infer<typeof gamificationProgressQuerySchema>;

export const gamificationChallengeQuerySchema = z.object({});
export type GamificationChallengeQuery = z.infer<typeof gamificationChallengeQuerySchema>;

export const gamificationRankingQuerySchema = paginationSchema.extend({
    limit: z.coerce.number().int().min(1).max(50).default(50),
});
export type GamificationRankingQuery = z.infer<typeof gamificationRankingQuerySchema>;

export const gamificationBadgeQuerySchema = z.object({});
export type GamificationBadgeQuery = z.infer<typeof gamificationBadgeQuerySchema>;
