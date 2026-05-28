import type { Gamification } from '@/generated/prisma'
import { prisma } from './prisma.client'

export const gamificationRepository = {
	createForUser(userId: string): Promise<Gamification> {
		return prisma.gamification.create({
			data: {
				userId,
				points: 0,
				level: 1,
				streak: 0,
			},
		})
	},

	findByUserId(userId: string): Promise<Gamification | null> {
		return prisma.gamification.findUnique({
			where: { userId },
		})
	},
}
