import type { Badge, User, UserBadge } from '@/generated/prisma';
import { prisma } from './prisma.client';

export type RankingRow = {
    userId: string;
    username: string;
    points: number;
    level: number;
};

export class GamificationRepository {
    async createForUser(
        userId: string,
    ): Promise<{ id: string; points: number; level: number; streak: number }> {
        // noop: user already contains gamification fields; ensure defaults
        await prisma.user.update({ where: { id: userId }, data: {} }).catch(() => null);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return {
            id: user!.id,
            points: user!.points ?? 0,
            level: user!.level ?? 1,
            streak: user!.streak ?? 0,
        };
    }

    findByUserId(
        userId: string,
    ): Promise<{
        id: string;
        points: number;
        level: number;
        streak: number;
        lastActivity: Date | null;
    } | null> {
        return prisma.user
            .findUnique({ where: { id: userId } })
            .then((u) =>
                u
                    ? {
                          id: u.id,
                          points: u.points ?? 0,
                          level: u.level ?? 1,
                          streak: u.streak ?? 0,
                          lastActivity: u.lastActivity ?? null,
                      }
                    : null,
            );
    }

    findByIds(
        userIds: string[],
    ): Promise<Array<{ id: string; points: number; level: number; streak: number }>> {
        return prisma.user
            .findMany({ where: { id: { in: userIds } } })
            .then((users) =>
                users.map((u) => ({
                    id: u.id,
                    points: u.points ?? 0,
                    level: u.level ?? 1,
                    streak: u.streak ?? 0,
                })),
            );
    }

    findBadges(): Promise<Badge[]> {
        return prisma.badge.findMany({ orderBy: { name: 'asc' } });
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

    upsertForUser(
        userId: string,
    ): Promise<{ id: string; points: number; level: number; streak: number }> {
        return prisma.user
            .upsert({
                where: { id: userId },
                create: { id: userId, email: '', username: '', passwordHash: '' as any },
                update: {},
            })
            .then((u) => ({
                id: u.id,
                points: u.points ?? 0,
                level: u.level ?? 1,
                streak: u.streak ?? 0,
            }));
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
                    points: user.points ?? 0,
                    level: user.level ?? 1,
                })),
            );
    }

    findMutualFollowIds(userId: string): Promise<string[]> {
        return prisma.follow
            .findMany({
                where: {
                    OR: [{ followerId: userId }, { followingId: userId }],
                },
                select: { followerId: true, followingId: true },
            })
            .then((rows) => {
                const followers = new Set(
                    rows.filter((row) => row.followingId === userId).map((row) => row.followerId),
                );
                const following = new Set(
                    rows.filter((row) => row.followerId === userId).map((row) => row.followingId),
                );
                return [...followers].filter((id) => following.has(id)).slice(0, 50);
            });
    }

    async upsertUserBadge(userId: string, badgeId: string): Promise<UserBadge> {
        return prisma.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId } },
            create: { userId, badgeId },
            update: {},
        });
    }

    updateOnNoteCreation(userId: string): Promise<User> {
        return prisma.user.update({ where: { id: userId }, data: { points: { increment: 10 } } });
    }
}
