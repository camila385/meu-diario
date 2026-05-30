import type { Badge, Gamification, UserBadge } from '@/generated/prisma'
import { prisma } from './prisma.client'

export type RankingRow = {
	userId: string
	username: string
	points: number
	level: number
}

export class GamificationRepository {
	createForUser(userId: string): Promise<Gamification> {
		return prisma.gamification.create({
			data: {
				userId,
				points: 0,
				level: 1,
				streak: 0,
			},
		})
	}

	findByUserId(userId: string): Promise<Gamification | null> {
		return prisma.gamification.findUnique({ where: { userId } })
	}

	findByIds(userIds: string[]): Promise<Gamification[]> {
		return prisma.gamification.findMany({ where: { userId: { in: userIds } } })
	}

	findBadges(): Promise<Badge[]> {
		return prisma.badge.findMany({ orderBy: { name: 'asc' } })
	}

	findUserBadges(userId: string): Promise<UserBadge[]> {
		return prisma.userBadge.findMany({ where: { userId } })
	}

	updateUserGamification(userId: string, data: Partial<Pick<Gamification, 'points' | 'level' | 'streak' | 'lastActivity'>>): Promise<Gamification> {
		return prisma.gamification.update({ where: { userId }, data })
	}

	upsertForUser(userId: string): Promise<Gamification> {
		return prisma.gamification.upsert({
			where: { userId },
			create: {
				userId,
				points: 0,
				level: 1,
				streak: 0,
			},
			update: {},
		})
	}

	listRanking(userIds: string[]): Promise<RankingRow[]> {
		return prisma.user.findMany({
			where: { id: { in: userIds } },
			select: {
				id: true,
				username: true,
				gamification: {
					select: {
						points: true,
						level: true,
					},
				},
			},
			orderBy: [{ gamification: { points: 'desc' } }, { username: 'asc' }],
		}).then((users) =>
			users.map((user) => ({
				userId: user.id,
				username: user.username,
				points: user.gamification?.points ?? 0,
				level: user.gamification?.level ?? 1,
			}))
		)
	}

	findMutualFollowIds(userId: string): Promise<string[]> {
		return prisma.follow.findMany({
			where: {
				OR: [{ followerId: userId }, { followingId: userId }],
			},
			select: {
				followerId: true,
				followingId: true,
			},
		}).then((rows) => {
			const followers = new Set(rows.filter((row) => row.followingId === userId).map((row) => row.followerId))
			const following = new Set(rows.filter((row) => row.followerId === userId).map((row) => row.followingId))
			return [...followers].filter((id) => following.has(id)).slice(0, 50)
		})
	}

	async upsertUserBadge(userId: string, badgeId: string): Promise<UserBadge> {
		return prisma.userBadge.upsert({
			where: { userId_badgeId: { userId, badgeId } },
			create: { userId, badgeId },
			update: {},
		})
	}

	updateOnNoteCreation(userId: string): Promise<Gamification> {
		return prisma.gamification.update({
			where: { userId },
			data: {
				points: { increment: 10 },
			},
		})
	}
}
