import type { User } from '@/generated/prisma';

export type { User };

export type UserWithPassword = User;

export interface UserProfileResponse {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    user: UserProfileResponse;
}
