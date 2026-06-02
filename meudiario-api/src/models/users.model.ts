export interface AuthResponse {
    token: string;
    user: UserResponse;
}

export type UserResponse = {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    isPublic: boolean;
    isActive: boolean;
    points: number;
    level: number;
    streak: number;
    lastActivity: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export type UserSummaryResponse = {
    id: string;
    username: string;
    avatarUrl: string | null;
    isPublic: boolean;
    points: number;
    level: number;
    streak: number;
    lastActivity: Date | null;
};
