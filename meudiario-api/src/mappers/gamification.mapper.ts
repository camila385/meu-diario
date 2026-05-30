import type {
    BadgeResponse,
    Gamification,
    GamificationResponse,
    WeeklyChallengeResponse,
} from '@/models/gamification.model';

export const toGamificationResponse = (gamification: Gamification): GamificationResponse => {
    return {
        id: gamification.id,
        points: (gamification.points as unknown as number) ?? 0,
        level: (gamification.level as unknown as number) ?? 1,
        streak: (gamification.streak as unknown as number) ?? 0,
        lastActivity: (gamification.lastActivity as unknown as Date) ?? null,
    };
};

export const toBadgeResponse = (
    badge: { id: string; name: string; description: string },
    unlockedAt: Date | null,
): BadgeResponse => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    unlocked: Boolean(unlockedAt),
    unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
});

export const toWeeklyChallengeResponse = (input: {
    challengeId: number;
    description: string;
    rewardPoints: number;
    progress: number;
    completed: boolean;
}): WeeklyChallengeResponse => input;

export default {
    toGamificationResponse,
    toBadgeResponse,
    toWeeklyChallengeResponse,
};
