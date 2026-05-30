import type { User } from '@/generated/prisma';
import type { UserProfileResponse } from '@/models/user.model';

export const toProfileResponse = (user: User): UserProfileResponse => ({
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isPublic: user.isPublic,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
});

export default {
    toProfileResponse,
};
