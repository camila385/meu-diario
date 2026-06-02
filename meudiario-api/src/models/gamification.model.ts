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

