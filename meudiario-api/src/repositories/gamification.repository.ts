import type { Badge, Level, User, UserBadge } from '@/generated/prisma';
import { prisma } from './prisma.client';

export type RankingRow = {
    userId: string;
    username: string;
    points: number;
    level: number;
};

export type GamificationSnapshot = {
    id: string;
    points: number;
    level: number;
    streak: number;
    lastActivity: Date | null;
};

export class GamificationRepository {
    findLevels(): Promise<Level[]> {
        return prisma.level.findMany({ orderBy: { level: 'asc' } });
    }

    findBadges(): Promise<Badge[]> {
        return prisma.badge.findMany({ orderBy: { code: 'asc' } });
    }

    findUserBadges(userId: string): Promise<UserBadge[]> {
        return prisma.userBadge.findMany({ where: { userId } });
    }

    updateUserGamification(
        userId: string,
        data: Partial<Pick<User, 'points' | 'level' | 'streak' | 'lastActivity'>>,
    ): Promise<User> {
        return prisma.user.update({ where: { id: userId }, data });
    }

    listRanking(userIds: string[]): Promise<RankingRow[]> {
        return prisma.user
            .findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true, points: true, level: true },
                orderBy: [{ points: 'desc' }, { username: 'asc' }],
            })
            .then((users) =>
                users.map((user) => ({
                    userId: user.id,
                    username: user.username,
                    points: user.points,
                    level: user.level,
                })),
            );
    }

    async upsertUserBadge(userId: string, badgeId: string): Promise<UserBadge> {
        return prisma.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId } },
            create: { userId, badgeId },
            update: {},
        });
    }
}
