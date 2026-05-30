import type { User } from '@/generated/prisma';
import { signToken } from '@/utils/jwt';

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

export const toProfileResponse = (user: User): UserProfileResponse => ({
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isPublic: user.isPublic,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
});

export const buildAuthResponse = (user: User): AuthResponse => ({
    token: signToken({ userId: user.id }),
    user: toProfileResponse(user),
});
