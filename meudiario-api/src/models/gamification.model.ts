import type { Gamification as PrismaGamification } from '@/generated/prisma'

export type Gamification = PrismaGamification

export interface GamificationResponse {
  id: string
  points: number
  level: number
  streak: number
  lastActivity: Date | null
}

export const toGamificationResponse = (gamification: Gamification): GamificationResponse => {
  return {
    id: gamification.id,
    points: gamification.points,
    level: gamification.level,
    streak: gamification.streak,
    lastActivity: gamification.lastActivity,
  }
}
