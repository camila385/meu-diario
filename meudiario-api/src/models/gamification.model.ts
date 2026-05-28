import type { Gamification as PrismaGamification } from '@/generated/prisma'

// T007: Re-export Prisma types
export type Gamification = PrismaGamification

export interface GamificationResponse {
  id: string
  points: number
  level: number
  streak: number
  lastActivity: Date | null
}

/**
 * Map Prisma Gamification to GamificationResponse DTO
 */
export function toGamificationResponse(gamification: Gamification): GamificationResponse {
  return {
    id: gamification.id,
    points: gamification.points,
    level: gamification.level,
    streak: gamification.streak,
    lastActivity: gamification.lastActivity,
  }
}
