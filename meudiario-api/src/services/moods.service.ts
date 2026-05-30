import { ConflictError } from '@/errors/ConflictError';
import { ForbiddenError } from '@/errors/ForbiddenError';
import { NotFoundError } from '@/errors/NotFoundError';
import { buildMeta, getPaginationParams } from '@/utils/pagination';
import { addUtcDays, getUtcDayRange, getUtcMonthRange, toUtcDayStart } from '@/utils/date';
import type { MoodsRepository } from '@/repositories/moods.repository';
import type {
    CreateMoodRequest,
    MoodHistoryQuery,
    MonthlyMoodSummaryQuery,
} from '@/validators/moods.validator';
import {
    type MonthlyMoodSummary,
    type MoodResponse,
    type WeeklyMoodSummary,
} from '@/models/mood.model';
import { toMoodHistoryItem, toMoodResponse } from '@/mappers/mood.mapper';

export class MoodsService {
    constructor(private readonly moodsRepository: MoodsRepository) {}

    async createMood(userId: string, input: CreateMoodRequest): Promise<MoodResponse> {
        const today = toUtcDayStart();
        const existingMood = await this.moodsRepository.findByUserAndDate(userId, today);

        if (input.noteId) {
            const noteOwner = await this.moodsRepository.findNoteOwner(input.noteId);

            if (!noteOwner) {
                throw new NotFoundError('Anotação não encontrada.');
            }

            if (noteOwner.userId !== userId) {
                throw new ForbiddenError(
                    'Acesso negado. Apenas o proprietário pode vincular esta anotação.',
                );
            }

            const noteMood = await this.moodsRepository.findByNoteId(input.noteId);

            if (noteMood && noteMood.id !== existingMood?.id) {
                throw new ConflictError('A anotação já possui um humor vinculado.');
            }
        }

        const mood = await this.moodsRepository.upsertMoodForDate(
            userId,
            today,
            input.value,
            input.noteId !== undefined ? input.noteId : (existingMood?.noteId ?? null),
        );

        return toMoodResponse(mood);
    }

    async listHistory(
        userId: string,
        query: MoodHistoryQuery,
    ): Promise<{
        data: ReturnType<typeof toMoodHistoryItem>[];
        meta: ReturnType<typeof buildMeta>;
    }> {
        const pagination = getPaginationParams(query.page, query.limit);

        const { moods, total } = await this.moodsRepository.listHistory(userId, {
            page: pagination.page,
            limit: pagination.limit,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        });

        return {
            data: moods.map(toMoodHistoryItem),
            meta: buildMeta(pagination, total),
        };
    }

    async weeklySummary(userId: string): Promise<WeeklyMoodSummary> {
        const today = toUtcDayStart();
        const start = addUtcDays(today, -6);
        const end = addUtcDays(today, 1);
        const moods = await this.moodsRepository.listByDateRange(userId, start, end);

        const moodsByDay = new Map<string, number>();
        for (const mood of moods) {
            moodsByDay.set(toUtcDayStart(mood.date).toISOString(), mood.value);
        }

        const days: Array<number | null> = [];
        let total = 0;
        let sum = 0;

        for (let offset = 0; offset < 7; offset += 1) {
            const currentDay = addUtcDays(start, offset);
            const value = moodsByDay.get(currentDay.toISOString()) ?? null;
            days.push(value);

            if (value !== null) {
                total += 1;
                sum += value;
            }
        }

        return {
            days,
            average: total > 0 ? Number((sum / total).toFixed(2)) : null,
            count: total,
        };
    }

    async monthlySummary(
        userId: string,
        query: MonthlyMoodSummaryQuery,
    ): Promise<MonthlyMoodSummary> {
        const range = getUtcMonthRange(query.year, query.month);
        const moods = await this.moodsRepository.listByDateRange(userId, range.start, range.end);

        const moodsByDay = new Map<string, number>();
        const counts = new Map<number, number>();

        for (const mood of moods) {
            moodsByDay.set(toUtcDayStart(mood.date).toISOString(), mood.value);
            counts.set(mood.value, (counts.get(mood.value) ?? 0) + 1);
        }

        const days: Array<number | null> = [];
        let total = 0;
        let sum = 0;

        for (let dayOffset = 0; dayOffset < range.days; dayOffset += 1) {
            const currentDay = addUtcDays(range.start, dayOffset);
            const value = moodsByDay.get(currentDay.toISOString()) ?? null;
            days.push(value);

            if (value !== null) {
                total += 1;
                sum += value;
            }
        }

        let mostFrequent: number | null = null;
        if (counts.size > 0) {
            mostFrequent = [...counts.entries()].sort(
                (left, right) => right[1] - left[1] || right[0] - left[0],
            )[0][0];
        }

        return {
            days,
            average: total > 0 ? Number((sum / total).toFixed(2)) : null,
            count: total,
            mostFrequent,
        };
    }
}
