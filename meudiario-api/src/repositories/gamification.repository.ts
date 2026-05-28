import type { Gamification } from '@/generated/prisma'
import { prisma } from './prisma.client'

// T015: Gamification helpers for note creation
// Business rules: Award points on note creation, update streak for consecutive days

const POINTS_PER_NOTE = 10 // Configurable: points awarded per note

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

	/**
	 * T015: Update gamification on note creation
	 * - Award POINTS_PER_NOTE to user
	 * - Update lastActivity to today
	 * - Calculate streak (simplified: +1 if activity today, reset if gap > 1 day)
	 * Returns updated Gamification record
	 */
	async updateOnNoteCreation(userId: string): Promise<Gamification> {
		const gamification = await this.findByUserId(userId)

		if (!gamification) {
			// Create gamification record if it doesn't exist
			return await this.createForUser(userId)
		}

		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		// Initialize lastActivity if null
		let lastActivity = gamification.lastActivity
		let newStreak = gamification.streak

		if (lastActivity) {
			const lastActivityDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
			const diffDays = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))

			if (diffDays === 0) {
				// Same day: no change to streak
				newStreak = gamification.streak
			} else if (diffDays === 1) {
				// Consecutive day: increment streak
				newStreak = gamification.streak + 1
			} else {
				// Gap > 1 day: reset streak
				newStreak = 1
			}
		} else {
			// First activity: streak = 1
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
