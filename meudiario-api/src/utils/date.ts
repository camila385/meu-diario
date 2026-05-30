export const toUtcDayStart = (value: Date | string = new Date()): Date => {
    const date = typeof value === 'string' ? new Date(value) : new Date(value.getTime());

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const addUtcDays = (date: Date, days: number): Date => {
    const next = new Date(date.getTime());
    next.setUTCDate(next.getUTCDate() + days);
    return toUtcDayStart(next);
};

export const getUtcDayRange = (date: Date): { start: Date; end: Date } => {
    const start = toUtcDayStart(date);
    return {
        start,
        end: addUtcDays(start, 1),
    };
};

export const getUtcMonthRange = (
    year: number,
    month: number,
): { start: Date; end: Date; days: number } => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const days = end.getUTCDate() === 1 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;

    return {
        start,
        end,
        days: days || new Date(Date.UTC(year, month, 0)).getUTCDate(),
    };
};
