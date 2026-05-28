import type { Gamification } from '@/generated/prisma'

export type { Gamification }

export interface GamificationResponse {
	id: string
	userId: string
	points: number
	level: number
	streak: number
	lastActivity: string | null
}
