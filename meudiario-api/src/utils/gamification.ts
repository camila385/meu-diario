import { addUtcDays, getUtcDayRange, toUtcDayStart } from './date'
import { CHALLENGES, LEVELS, getLevelByPoints, getMilestoneSteps, getNextLevel, getProgressPercent } from '@/models/gamification.model'

export const getLevelDefinition = (points: number) => getLevelByPoints(points)

export const getNextLevelDefinition = (level: number) => getNextLevel(level)

export const getProgressSummary = (points: number, level: number, streak: number) => ({
	points,
	level,
	streak,
	nextLevelPoints: getNextLevel(level)?.minimumPoints ?? null,
	progressPercent: getProgressPercent(points, level),
	daysToMilestones: getMilestoneSteps(streak),
})

export const getCurrentIsoWeekRange = (reference = new Date()): { start: Date; end: Date } => {
	const current = toUtcDayStart(reference)
	const dayOfWeek = current.getUTCDay() || 7
	const start = addUtcDays(current, -(dayOfWeek - 1))
	const end = addUtcDays(start, 7)
	return { start, end }
}

export const getChallengeForCurrentWeek = (reference = new Date()) => {
	const weekNumber = Math.floor((toUtcDayStart(reference).getTime() / 86400000) % 52)
	return CHALLENGES[weekNumber % CHALLENGES.length]
}

export const getChallengeProgressPercent = (current: number, target: number): number => {
	if (target <= 0) {
		return 100
	}

	return Math.max(0, Math.min(100, Number(((current / target) * 100).toFixed(2))))
}

export const clampRankingSize = (size: number): number => Math.max(1, Math.min(50, size))

export const normalizeUtcDay = (value: Date | string = new Date()): Date => toUtcDayStart(value)

export const getWeekdayRange = (date: Date) => getUtcDayRange(date)

export const GAMIFICATION_LEVELS = LEVELS
