import type { Mood as PrismaMood } from '@/generated/prisma'

export type Mood = PrismaMood

export interface MoodResponse {
  id: string
  value: number
  date: Date
}

export const toMoodResponse = (mood: Mood | null | undefined): MoodResponse | undefined => {
  if (!mood) return undefined
  return {
    id: mood.id,
    value: mood.value,
    date: mood.date,
  }
}
