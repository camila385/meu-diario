import { NotFoundError } from '@/errors/NotFoundError';
import type { NotesRepository } from '@/repositories/notes.repository';
import type { MoodsRepository } from '@/repositories/moods.repository';
import type { GamificationRepository } from '@/repositories/gamification.repository';
import type { UsersRepository } from '@/repositories/users.repository';
import {
    type BadgeResponse,
    type LevelDefinition,
    type GamificationProgressResponse,
    type RankingResponse,
} from '@/models/gamification.model';
import { toBadgeResponse } from '@/mappers/gamification.mapper';
import { toUtcDayStart } from '@/utils/date';
import type { CreateNoteRequest } from '@/validators/notes.validator';
import type { Badge } from '@/generated/prisma';

const POINTS_PER_NOTE = 10;
const BONUS_POINTS_PER_MOOD = 5;
const BONUS_POINTS_PER_TAG = 3;
const WEEKLY_STREAK_BONUS = 20;

export class GamificationService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly gamificationRepository: GamificationRepository,
        private readonly notesRepository: NotesRepository,
        private readonly moodsRepository: MoodsRepository,
    ) {}

    /** Retorna a definicao de nivel correspondente a um total de pontos. */
    private getLevel(levels: LevelDefinition[], points: number): LevelDefinition {
        const sorted = [...levels].sort((left, right) => right.minimumPoints - left.minimumPoints);
        return sorted.find((level) => points >= level.minimumPoints) ?? levels[0];
    }

    /** Retorna a definicao do proximo nivel apos o nivel atual, ou null se ja for o maximo. */
    private getNextLevel(levels: LevelDefinition[], currentLevel: number): LevelDefinition | null {
        return levels.find((level) => level.level === currentLevel + 1) ?? null;
    }

    /** Retorna o progresso atual de gamificacao do usuario: pontos, nivel, streak e % para o proximo nivel. */
    async getProgress(userId: string): Promise<GamificationProgressResponse> {
        const user = await this.usersRepository.findById(userId);
        if (!user) throw new NotFoundError('Usuário não encontrado.');

        const levels = await this.gamificationRepository.findLevels();
        const levelDefs = levels.map((l) => ({ level: l.level, name: l.name, minimumPoints: l.minimumPoints }));
        const currentLevel = this.getLevel(levelDefs, user.points);
        const nextLevel = this.getNextLevel(levelDefs, user.level);
        const progressPercent = nextLevel
            ? Math.floor(((user.points - currentLevel.minimumPoints) / (nextLevel.minimumPoints - currentLevel.minimumPoints)) * 100)
            : 100;

        return {
            points: user.points,
            level: user.level,
            streak: user.streak,
            nextLevelPoints: nextLevel?.minimumPoints ?? null,
            progressPercent,
        };
    }

    /** Retorna todos os badges do sistema com status de desbloqueio para o usuario (unlocked true/false e data de conquista). */
    async getBadges(userId: string): Promise<BadgeResponse[]> {
        const badges = await this.gamificationRepository.findBadges();
        const userBadges = await this.gamificationRepository.findUserBadges(userId);
        const unlockedById = new Map(
            userBadges.map((userBadge) => [userBadge.badgeId, userBadge.unlockedAt]),
        );
        return badges.map((badge) => toBadgeResponse(badge, unlockedById.get(badge.id) ?? null));
    }

    /** Retorna o ranking de pontos entre o usuario e seus seguidores mutuos (follow aceito nos dois sentidos), com a posicao do usuario no ranking. */
    async getRanking(userId: string, limit = 50): Promise<RankingResponse> {
        const mutualFollowIds = await this.usersRepository.findMutualFollowIds(userId);
        if (mutualFollowIds.length === 0) {
            return { items: [], currentUserPosition: null };
        }

        const rankingRows = await this.gamificationRepository.listRanking([userId, ...mutualFollowIds]);
        const items = rankingRows
            .slice(0, limit)
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

    /**
     * Concede pontos e atualiza streak ao criar uma nota.
     * Pontos base: 10 por nota, +5 se tiver humor vinculado, +3 se tiver tags.
     * Streak: reinicia em 1 se a ultima nota foi ha 2+ dias; mantem se foi hoje; incrementa se foi ontem.
     * Bonus de 20 pontos a cada 7 dias consecutivos de streak.
     * Ao final, verifica e desbloqueia badges conquistados.
     */
    async awardForNote(userId: string, input: CreateNoteRequest): Promise<void> {
        const user = await this.usersRepository.findById(userId);
        if (!user) throw new NotFoundError('Usuário não encontrado.');

        const levels = await this.gamificationRepository.findLevels();
        if (levels.length === 0) return;

        const today = toUtcDayStart();
        const lastActivity = user.lastActivity ? toUtcDayStart(user.lastActivity) : null;
        const diffDays = lastActivity
            ? Math.floor((today.getTime() - lastActivity.getTime()) / 86400000)
            : null;

        let streak = user.streak;
        let points = user.points + POINTS_PER_NOTE;

        if (input.mood !== undefined) points += BONUS_POINTS_PER_MOOD;
        if (input.tags?.length) points += BONUS_POINTS_PER_TAG;

        if (diffDays === null) {
            streak = 1;
        } else if (diffDays === 0) {
            streak = user.streak;
        } else if (diffDays === 1) {
            streak = user.streak + 1;
            if (streak % 7 === 0) points += WEEKLY_STREAK_BONUS;
        } else {
            streak = 1;
        }

        const levelDefs = levels.map((l) => ({ level: l.level, name: l.name, minimumPoints: l.minimumPoints }));
        const newLevel = this.getLevel(levelDefs, points).level;

        await this.gamificationRepository.updateUserGamification(userId, {
            points,
            level: newLevel,
            streak,
            lastActivity: new Date(),
        });

        await this.checkAndUnlockBadges(userId, { points, level: newLevel, streak });
    }

    private isBadgeMet(
        badge: Badge,
        snapshot: { level: number; streak: number },
        notesCount: number,
        moodCount: number,
    ): boolean {
        const valueByKind: Record<string, number | undefined> = {
            'notes-count': notesCount,
            'streak': snapshot.streak,
            'level': snapshot.level,
            'mood-count': moodCount,
        };
        const value = valueByKind[badge.kind];
        return value !== undefined && value >= badge.threshold;
    }

    /** Verifica todos os badges ainda nao conquistados e desbloqueia os que o usuario ja atingiu os criterios. */
    private async checkAndUnlockBadges(
        userId: string,
        snapshot: { points: number; level: number; streak: number },
    ): Promise<void> {
        const [badges, unlocked, notesCount, moodCount] = await Promise.all([
            this.gamificationRepository.findBadges(),
            this.gamificationRepository.findUserBadges(userId),
            this.notesRepository.countNotes(userId),
            this.moodsRepository.count(userId),
        ]);

        const unlockedIds = new Set(unlocked.map((item) => item.badgeId));

        for (const badge of badges) {
            if (unlockedIds.has(badge.id)) continue;
            if (this.isBadgeMet(badge, snapshot, notesCount, moodCount)) {
                await this.gamificationRepository.upsertUserBadge(userId, badge.id);
            }
        }
    }
}
