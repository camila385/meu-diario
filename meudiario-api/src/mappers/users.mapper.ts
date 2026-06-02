import type { User } from '@/generated/prisma';
import type { UserResponse, UserSummaryResponse } from '@/models/users.model';

export const toUserResponse = (user: User): UserResponse => ({
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isPublic: user.isPublic,
    isActive: user.isActive,
    points: user.points,
    level: user.level,
    streak: user.streak,
    lastActivity: user.lastActivity,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

export const toUserSummaryResponse = (user: User): UserSummaryResponse => ({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isPublic: user.isPublic,
    points: user.points,
    level: user.level,
    streak: user.streak,
    lastActivity: user.lastActivity,
});
