import type { Mood as PrismaMood } from '@/generated/prisma'

// T007: Re-export Prisma types
export type Mood = PrismaMood

/**
 * Mood Response DTO
 * Returned when mood is present in note context
 */
export interface MoodResponse {
  id: string
  value: number
  date: Date
}

/**
 * Map Prisma Mood to MoodResponse DTO
 */
export function toMoodResponse(mood: Mood | null | undefined): MoodResponse | undefined {
  if (!mood) return undefined
  return {
    id: mood.id,
    value: mood.value,
    date: mood.date,
  }
}
