import { addUtcDays, getUtcDayRange, toUtcDayStart } from './date';

export const getCurrentIsoWeekRange = (reference = new Date()): { start: Date; end: Date } => {
    const current = toUtcDayStart(reference);
    const dayOfWeek = current.getUTCDay() || 7;
    const start = addUtcDays(current, -(dayOfWeek - 1));
    const end = addUtcDays(start, 7);
    return { start, end };
};

export const clampRankingSize = (size: number): number => Math.max(1, Math.min(50, size));

export const normalizeUtcDay = (value: Date | string = new Date()): Date => toUtcDayStart(value);

export const getWeekdayRange = (date: Date) => getUtcDayRange(date);
