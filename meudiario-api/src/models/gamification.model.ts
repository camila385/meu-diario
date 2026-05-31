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
