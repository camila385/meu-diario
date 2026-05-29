import type { Gamification } from '@/generated/prisma'
import { prisma } from './prisma.client'

const POINTS_PER_NOTE = 10

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

	async updateOnNoteCreation(userId: string): Promise<Gamification> {
		const gamification = await this.findByUserId(userId)

		if (!gamification) {
			return await this.createForUser(userId)
		}

		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		let lastActivity = gamification.lastActivity
		let newStreak = gamification.streak

		if (lastActivity) {
			const lastActivityDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
			const diffDays = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))

			if (diffDays === 0) {
				newStreak = gamification.streak
			} else if (diffDays === 1) {
				newStreak = gamification.streak + 1
			} else {
				newStreak = 1
			}
		} else {
			newStreak = 1
		}

		return await prisma.gamification.update({
			where: { userId },
			data: {
				points: gamification.points + POINTS_PER_NOTE,
				streak: newStreak,
				lastActivity: now,
			},
		})
	},
}
