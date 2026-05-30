import type { User as PrismaUser } from '@/generated/prisma';

export type Gamification = Pick<PrismaUser, 'id' | 'points' | 'level' | 'streak' | 'lastActivity'>;

export interface LevelDefinition {
    level: number;
    name: string;
    minimumPoints: number;
}

export interface GamificationProgressResponse {
    points: number;
    level: number;
    streak: number;
    nextLevelPoints: number | null;
    progressPercent: number;
    daysToMilestones: {
        next7: number;
        next14: number;
        next30: number;
        next60: number;
        next100: number;
    };
}

export interface BadgeResponse {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    unlockedAt: string | null;
}

export interface WeeklyChallengeResponse {
    challengeId: number;
    description: string;
    rewardPoints: number;
    progress: number;
    completed: boolean;
}

export interface RankingItemResponse {
    userId: string;
    username: string;
    points: number;
    level: number;
    position: number;
}

export interface RankingResponse {
    items: RankingItemResponse[];
    currentUserPosition: number | null;
}

export interface GamificationResponse {
    id: string;
    points: number;
    level: number;
    streak: number;
    lastActivity: Date | null;
}

export const LEVELS: LevelDefinition[] = [
    { level: 1, name: 'Iniciante', minimumPoints: 0 },
    { level: 2, name: 'Aprendiz', minimumPoints: 100 },
    { level: 3, name: 'Explorador', minimumPoints: 300 },
    { level: 4, name: 'Escritor', minimumPoints: 600 },
    { level: 5, name: 'Narrador', minimumPoints: 1000 },
    { level: 6, name: 'Cronista', minimumPoints: 1500 },
    { level: 7, name: 'Memorialista', minimumPoints: 2200 },
    { level: 8, name: 'Guardião', minimumPoints: 3000 },
    { level: 9, name: 'Mestre', minimumPoints: 4000 },
    { level: 10, name: 'Lendário', minimumPoints: 5500 },
];

export const BADGES = [
    { id: 'first-note', name: 'Primeira Palavra', description: 'Criar a primeira anotação.' },
    { id: 'streak-7', name: 'Uma Semana', description: 'Manter streak de 7 dias.' },
    { id: 'streak-30', name: 'Um Mês', description: 'Manter streak de 30 dias.' },
    { id: 'streak-100', name: 'Cem Dias', description: 'Manter streak de 100 dias.' },
    { id: 'notes-10', name: 'Dez Histórias', description: 'Criar 10 anotações.' },
    { id: 'notes-50', name: 'Cinquenta Capítulos', description: 'Criar 50 anotações.' },
    { id: 'notes-100', name: 'Centenário', description: 'Criar 100 anotações.' },
    { id: 'level-5', name: 'Meio Caminho', description: 'Atingir nível 5.' },
    { id: 'level-10', name: 'Lendário', description: 'Atingir nível 10.' },
    { id: 'mood-7', name: 'Semana Emocional', description: 'Registrar humor 7 dias seguidos.' },
];

export const CHALLENGES = [
    {
        id: 1,
        description: 'Escreva 5 anotações esta semana',
        rewardPoints: 50,
        kind: 'notes',
        target: 5,
    },
    {
        id: 2,
        description: 'Registre seu humor todos os dias desta semana',
        rewardPoints: 40,
        kind: 'moods',
        target: 7,
    },
    {
        id: 3,
        description: 'Escreva uma anotação com pelo menos 3 tags',
        rewardPoints: 30,
        kind: 'note-tags',
        target: 3,
    },
    {
        id: 4,
        description: 'Escreva uma anotação com mais de 200 caracteres',
        rewardPoints: 25,
        kind: 'note-length',
        target: 200,
    },
    {
        id: 5,
        description: 'Mantenha um streak de pelo menos 3 dias esta semana',
        rewardPoints: 35,
        kind: 'streak',
        target: 3,
    },
] as const;

export type ChallengeKind = (typeof CHALLENGES)[number]['kind'];

export const getLevelByPoints = (points: number): LevelDefinition => {
    const sorted = [...LEVELS].sort((left, right) => right.minimumPoints - left.minimumPoints);
    return sorted.find((level) => points >= level.minimumPoints) ?? LEVELS[0];
};

export const getNextLevel = (currentLevel: number): LevelDefinition | null => {
    return LEVELS.find((level) => level.level === currentLevel + 1) ?? null;
};

export const getProgressPercent = (points: number, currentLevel: number): number => {
    const current = LEVELS.find((level) => level.level === currentLevel) ?? LEVELS[0];
    const next = getNextLevel(currentLevel);

    if (!next) {
        return 100;
    }

    const range = next.minimumPoints - current.minimumPoints;
    if (range <= 0) {
        return 100;
    }

    const earned = points - current.minimumPoints;
    return Math.max(0, Math.min(100, Number(((earned / range) * 100).toFixed(2))));
};

export const getMilestoneSteps = (
    streak: number,
): { next7: number; next14: number; next30: number; next60: number; next100: number } => ({
    next7: Math.max(0, 7 - streak),
    next14: Math.max(0, 14 - streak),
    next30: Math.max(0, 30 - streak),
    next60: Math.max(0, 60 - streak),
    next100: Math.max(0, 100 - streak),
});
