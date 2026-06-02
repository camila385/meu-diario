import type { BadgeResponse } from '@/models/gamification.model';

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
