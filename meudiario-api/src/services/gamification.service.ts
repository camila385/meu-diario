import { ForbiddenError } from '@/errors/ForbiddenError';
import { NotFoundError } from '@/errors/NotFoundError';
import type { NotesRepository } from '@/repositories/notes.repository';
import type { MoodsRepository } from '@/repositories/moods.repository';
import type { GamificationRepository } from '@/repositories/gamification.repository';
import {
    type BadgeResponse,
    type LevelDefinition,
    type GamificationProgressResponse,
    type RankingResponse,
    type WeeklyChallengeResponse,
} from '@/models/gamification.model';
import {
    toBadgeResponse,
    toWeeklyChallengeResponse,
} from '@/mappers/gamification.mapper';
import { addUtcDays, getUtcDayRange, toUtcDayStart } from '@/utils/date';
import { getCurrentIsoWeekRange } from '@/utils/gamification';
import type { CreateNoteRequest } from '@/validators/notes.validator';

const POINTS_PER_NOTE = 10;
const BONUS_POINTS_PER_MOOD = 5;
const BONUS_POINTS_PER_TAG = 3;
const WEEKLY_STREAK_BONUS = 20;

type ChallengeItem = {
    id: number;
    description: string;
    rewardPoints: number;
    kind: string;
    target: number;
};

export class GamificationService {
    constructor(
        private readonly gamificationRepository: GamificationRepository,
        private readonly notesRepository: NotesRepository,
        private readonly moodsRepository: MoodsRepository,
    ) {}

    private getLevel(levels: LevelDefinition[], points: number): LevelDefinition {
        const sorted = [...levels].sort((left, right) => right.minimumPoints - left.minimumPoints);
        return sorted.find((level) => points >= level.minimumPoints) ?? levels[0];
    }

    private async ensureGamification(userId: string) {
        return this.gamificationRepository.upsertForUser(userId);
    }

    private getNextLevel(levels: LevelDefinition[], currentLevel: number): LevelDefinition | null {
        return levels.find((level) => level.level === currentLevel + 1) ?? null;
    }

    private getProgressPercent(levels: LevelDefinition[], points: number, currentLevel: number): number {
        const current = levels.find((level) => level.level === currentLevel) ?? levels[0];
        const next = this.getNextLevel(levels, currentLevel);

        if (!next) {
            return 100;
        }

        const range = next.minimumPoints - current.minimumPoints;
        if (range <= 0) {
            return 100;
        }

        const earned = points - current.minimumPoints;
        return Math.max(0, Math.min(100, Number(((earned / range) * 100).toFixed(2))));
    }

    private getMilestoneSteps(streak: number): {
        next7: number;
        next14: number;
        next30: number;
        next60: number;
        next100: number;
    } {
        return {
            next7: Math.max(0, 7 - streak),
            next14: Math.max(0, 14 - streak),
            next30: Math.max(0, 30 - streak),
            next60: Math.max(0, 60 - streak),
            next100: Math.max(0, 100 - streak),
        };
    }

    private getProgressSummary(levels: LevelDefinition[], points: number, level: number, streak: number): GamificationProgressResponse {
        return {
            points,
            level,
            streak,
            nextLevelPoints: this.getNextLevel(levels, level)?.minimumPoints ?? null,
            progressPercent: this.getProgressPercent(levels, points, level),
            daysToMilestones: this.getMilestoneSteps(streak),
        };
    }

    private getWeeklyChallengeForCurrentWeek(challenges: ChallengeItem[], reference = new Date()): ChallengeItem {
        const weekNumber = Math.floor((toUtcDayStart(reference).getTime() / 86400000) % 52);
        return challenges[weekNumber % challenges.length];
    }

    private getChallengeProgressPercent(current: number, target: number): number {
        if (target <= 0) {
            return 100;
        }

        return Math.max(0, Math.min(100, Number(((current / target) * 100).toFixed(2))));
    }

    async getProgress(userId: string): Promise<GamificationProgressResponse> {
        const gamification = await this.ensureGamification(userId);
        const levels = await this.gamificationRepository.findLevels();
        return this.getProgressSummary(levels.map((level) => ({
            level: level.level,
            name: level.name,
            minimumPoints: level.minimumPoints,
        })), gamification.points, gamification.level, gamification.streak);
    }

    async getBadges(userId: string): Promise<BadgeResponse[]> {
        const badges = await this.gamificationRepository.findBadges();
        const userBadges = await this.gamificationRepository.findUserBadges(userId);
        const unlockedById = new Map(
            userBadges.map((userBadge) => [userBadge.badgeId, userBadge.unlockedAt]),
        );

        return badges.map((badge) => toBadgeResponse(badge, unlockedById.get(badge.id) ?? null));
    }

    async getWeeklyChallenge(userId: string): Promise<WeeklyChallengeResponse> {
        await this.ensureGamification(userId);
        const challenges = await this.gamificationRepository.findChallenges();
        const challenge = this.getWeeklyChallengeForCurrentWeek(
            challenges.map((item) => ({
                id: item.code,
                description: item.description,
                rewardPoints: item.rewardPoints,
                kind: item.kind,
                target: item.target,
            })),
        );
        const weekRange = getCurrentIsoWeekRange();

        let progress = 0;
        let completed = false;

        if (challenge.kind === 'notes') {
            const { total } = await this.notesRepository.listNotes(userId, {
                page: 1,
                limit: 100,
            });
            progress = Math.min(total, challenge.target);
            completed = total >= challenge.target;
        }

        if (challenge.kind === 'moods') {
            const moods = await this.moodsRepository.listByDateRange(
                userId,
                weekRange.start,
                weekRange.end,
            );
            progress = Math.min(moods.length, challenge.target);
            completed = moods.length >= challenge.target;
        }

        if (challenge.kind === 'note-tags') {
            const { notes } = await this.notesRepository.listNotes(userId, { page: 1, limit: 100 });
            const matching = notes.filter(
                (note) =>
                    (note as { noteTags?: Array<unknown> }).noteTags?.length !== undefined &&
                    ((note as { noteTags?: Array<unknown> }).noteTags?.length ?? 0) >=
                        challenge.target,
            );
            progress = Math.min(matching.length, 1);
            completed = matching.length > 0;
        }

        if (challenge.kind === 'note-length') {
            const { notes } = await this.notesRepository.listNotes(userId, { page: 1, limit: 100 });
            const matching = notes.filter((note) => (note.content?.length ?? 0) > challenge.target);
            progress = Math.min(matching.length, 1);
            completed = matching.length > 0;
        }

        if (challenge.kind === 'streak') {
            const gamification = await this.ensureGamification(userId);
            progress = Math.min(gamification.streak, challenge.target);
            completed = gamification.streak >= challenge.target;
        }

        return toWeeklyChallengeResponse({
            challengeId: challenge.id,
            description: challenge.description,
            rewardPoints: challenge.rewardPoints,
            progress: this.getChallengeProgressPercent(progress, challenge.target),
            completed,
        });
    }

    async getRanking(userId: string): Promise<RankingResponse> {
        const mutualFollowIds = await this.gamificationRepository.findMutualFollowIds(userId);
        if (mutualFollowIds.length === 0) {
            return { items: [], currentUserPosition: null };
        }

        const rankingRows = await this.gamificationRepository.listRanking(mutualFollowIds);
        const items = rankingRows
            .sort(
                (left, right) =>
                    right.points - left.points || left.username.localeCompare(right.username),
            )
            .slice(0, 50)
            .map((row, index) => ({
                userId: row.userId,
                username: row.username,
                points: row.points,
                level: row.level,
                position: index + 1,
            }));

        const currentUserPosition = items.find((item) => item.userId === userId)?.position ?? null;

        return { items, currentUserPosition };
    }

    async awardForNote(userId: string, input: CreateNoteRequest): Promise<void> {
        const gamification = await this.ensureGamification(userId);
        const levels = await this.gamificationRepository.findLevels();
        const today = toUtcDayStart();
        const lastActivity = gamification.lastActivity
            ? toUtcDayStart(gamification.lastActivity)
            : null;
        const diffDays = lastActivity
            ? Math.floor((today.getTime() - lastActivity.getTime()) / 86400000)
            : null;

        let streak = gamification.streak;
        let points = gamification.points + POINTS_PER_NOTE;

        if (input.mood !== undefined) {
            points += BONUS_POINTS_PER_MOOD;
        }

        if (input.tags?.length) {
            points += BONUS_POINTS_PER_TAG;
        }

        if (diffDays === null) {
            streak = 1;
        } else if (diffDays === 0) {
            streak = gamification.streak;
        } else if (diffDays === 1) {
            streak = gamification.streak + 1;
            if (streak % 7 === 0) {
                points += WEEKLY_STREAK_BONUS;
            }
        } else {
            streak = 1;
        }

        const level = this.getLevel(
            levels.map((item) => ({
                level: item.level,
                name: item.name,
                minimumPoints: item.minimumPoints,
            })),
            points,
        );

        await this.gamificationRepository.updateUserGamification(userId, {
            points,
            level: level.level,
            streak,
            lastActivity: new Date(),
        });

        await this.enqueueBadgeChecks(userId);
    }

    private async enqueueBadgeChecks(userId: string): Promise<void> {
        const gamification = await this.ensureGamification(userId);
        const badges = await this.gamificationRepository.findBadges();
        const unlocked = await this.gamificationRepository.findUserBadges(userId);
        const unlockedIds = new Set(unlocked.map((item) => item.badgeId));

        const notesCount = await this.notesRepository
            .listNotes(userId, { page: 1, limit: 1 })
            .then((result) => result.total);
        const moodHistory = await this.moodsRepository
            .listHistory(userId, { page: 1, limit: 1 })
            .then((result) => result.total);

        for (const badge of badges) {
            if (unlockedIds.has(badge.id)) continue;

            const shouldUnlock =
                (badge.code === 'first-note' && notesCount >= 1) ||
                (badge.code === 'notes-10' && notesCount >= 10) ||
                (badge.code === 'notes-50' && notesCount >= 50) ||
                (badge.code === 'notes-100' && notesCount >= 100) ||
                (badge.code === 'streak-7' && gamification.streak >= 7) ||
                (badge.code === 'streak-30' && gamification.streak >= 30) ||
                (badge.code === 'streak-100' && gamification.streak >= 100) ||
                (badge.code === 'level-5' && gamification.level >= 5) ||
                (badge.code === 'level-10' && gamification.level >= 10) ||
                (badge.code === 'mood-7' && moodHistory >= 7);

            if (shouldUnlock) {
                await this.gamificationRepository.upsertUserBadge(userId, badge.id);
            }
        }
    }
}
