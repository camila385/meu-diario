import type { User, Follow } from '@/generated/prisma';
import { FollowStatus } from '@/generated/prisma';
import type { UpdateProfileRequest } from '@/validators/users.validator';
import { prisma } from './prisma.client';

export class UsersRepository {
    findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    findByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    }

    findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    findByUsername(username: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { username } });
    }

    async create(data: { email: string; username: string; passwordHash: string }): Promise<User> {
        return prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                passwordHash: data.passwordHash,
            },
        });
    }

    updateProfile(userId: string, input: UpdateProfileRequest): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: {
                username: input.username,
                avatarUrl: input.avatarUrl,
                isPublic: input.isPublic,
            },
        });
    }

    async deactivateAccount(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    }

    async isFollowing(viewerId: string, targetId: string): Promise<boolean> {
        const follow = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
            select: { status: true },
        });
        return follow?.status === FollowStatus.ACCEPTED;
    }

    createFollowRequest(followerId: string, followingId: string, status: FollowStatus): Promise<Follow> {
        return prisma.follow.upsert({
            where: { followerId_followingId: { followerId, followingId } },
            create: { followerId, followingId, status },
            update: {},
        });
    }

    acceptFollowRequest(followerId: string, followingId: string): Promise<Follow> {
        return prisma.follow.update({
            where: { followerId_followingId: { followerId, followingId } },
            data: { status: FollowStatus.ACCEPTED },
        });
    }

    deleteFollow(followerId: string, followingId: string): Promise<Follow | null> {
        return prisma.follow
            .delete({ where: { followerId_followingId: { followerId, followingId } } })
            .catch(() => null);
    }

    async getFollowing(userId: string): Promise<User[]> {
        const follows = await prisma.follow.findMany({
            where: { followerId: userId, status: FollowStatus.ACCEPTED },
            include: { following: true },
        });
        return follows.map((f) => f.following);
    }

    async getFollowers(userId: string): Promise<User[]> {
        const follows = await prisma.follow.findMany({
            where: { followingId: userId, status: FollowStatus.ACCEPTED },
            include: { follower: true },
        });
        return follows.map((f) => f.follower);
    }

    async getPendingRequests(userId: string): Promise<User[]> {
        const follows = await prisma.follow.findMany({
            where: { followingId: userId, status: FollowStatus.PENDING },
            include: { follower: true },
        });
        return follows.map((f) => f.follower);
    }

    getFollowerCount(userId: string): Promise<number> {
        return prisma.follow.count({ where: { followingId: userId, status: FollowStatus.ACCEPTED } });
    }

    getFollowingCount(userId: string): Promise<number> {
        return prisma.follow.count({ where: { followerId: userId, status: FollowStatus.ACCEPTED } });
    }

    async findMutualFollowIds(userId: string): Promise<string[]> {
        const rows = await prisma.follow.findMany({
            where: {
                status: FollowStatus.ACCEPTED,
                OR: [{ followerId: userId }, { followingId: userId }],
            },
            select: { followerId: true, followingId: true },
        });
        const followers = new Set(
            rows.filter((row) => row.followingId === userId).map((row) => row.followerId),
        );
        const following = new Set(
            rows.filter((row) => row.followerId === userId).map((row) => row.followingId),
        );
        return [...followers].filter((id) => following.has(id)).slice(0, 50);
    }
}
