import { prisma } from './prisma.client';
import type { Prisma, User, Note, Follow, Like, Comment } from '@/generated/prisma';

type FeedNote = Note & {
    user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
    noteTags: Array<{ tag: { name: string } }>;
    _count: { likes: number; comments: number };
};

type CommentWithUserCount = Comment & {
    user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
    _count?: { likes?: number };
};

export class SocialRepository {

    async getFeedNotes(
        userId: string,
        page: number,
        limit: number,
        tag?: string,
    ): Promise<{
        notes: Array<Omit<FeedNote, '_count'> & { likeCount: number; commentCount: number }>;
        total: number;
    }> {
        const skip = (page - 1) * limit;

        const where: Prisma.NoteWhereInput = {
            isPublic: true,
            user: { is: { isPublic: true } },
            userId: { not: userId },
            noteTags: tag ? { some: { tag: { name: tag } } } : undefined,
        };

        const [notes, total] = await Promise.all([
            prisma.note.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                    noteTags: { include: { tag: { select: { name: true } } } },
                    _count: { select: { likes: true, comments: true } },
                },
            }),
            prisma.note.count({ where }),
        ]);

        return {
            notes: notes.map((note) => {
                const { _count, ...rest } = note;

                return {
                    ...rest,
                    likeCount: _count.likes,
                    commentCount: _count.comments,
                };
            }),
            total,
        };
    }

    async upsertLike(userId: string, noteId: string): Promise<Like> {
        return await prisma.like.upsert({
            where: { userId_noteId: { userId, noteId } },
            create: { userId, noteId },
            update: {},
        });
    }

    async deleteLike(userId: string, noteId: string): Promise<Like | null> {
        return await prisma.like
            .delete({
                where: { userId_noteId: { userId, noteId } },
            })
            .catch(() => null);
    }

    async getLikeCount(noteId: string): Promise<number> {
        return await prisma.like.count({ where: { noteId } });
    }

    async hasUserLiked(userId: string, noteId: string): Promise<boolean> {
        const like = await prisma.like.findUnique({
            where: { userId_noteId: { userId, noteId } },
        });
        return !!like;
    }

    async upsertFollow(followerId: string, followingId: string): Promise<Follow> {
        return await prisma.follow.upsert({
            where: { followerId_followingId: { followerId, followingId } },
            create: { followerId, followingId },
            update: {},
        });
    }

    async deleteFollow(followerId: string, followingId: string): Promise<Follow | null> {
        return await prisma.follow
            .delete({
                where: { followerId_followingId: { followerId, followingId } },
            })
            .catch(() => null);
    }

    async getFollowing(
        userId: string,
        page: number,
        limit: number,
    ): Promise<{
        users: User[];
        total: number;
    }> {
        const skip = (page - 1) * limit;

        const [follows, total] = await Promise.all([
            prisma.follow.findMany({
                where: { followerId: userId },
                include: { following: true },
                take: limit,
                skip,
            }),
            prisma.follow.count({ where: { followerId: userId } }),
        ]);

        return {
            users: follows.map((f) => f.following),
            total,
        };
    }

    async getFollowers(
        userId: string,
        page: number,
        limit: number,
    ): Promise<{
        users: User[];
        total: number;
    }> {
        const skip = (page - 1) * limit;

        const [follows, total] = await Promise.all([
            prisma.follow.findMany({
                where: { followingId: userId },
                include: { follower: true },
                take: limit,
                skip,
            }),
            prisma.follow.count({ where: { followingId: userId } }),
        ]);

        return {
            users: follows.map((f) => f.follower),
            total,
        };
    }

    async getFollowerCount(userId: string): Promise<number> {
        return await prisma.follow.count({ where: { followingId: userId } });
    }

    async getFollowingCount(userId: string): Promise<number> {
        return await prisma.follow.count({ where: { followerId: userId } });
    }

    async isUserFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } },
        });
        return !!follow;
    }

    async createComment(
        userId: string,
        noteId: string,
        content: string,
    ): Promise<Comment & { user: Pick<User, 'id' | 'username' | 'avatarUrl'> }> {
        return await prisma.comment.create({
            data: { userId, noteId, content },
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        });
    }

    async getComments(
        noteId: string,
        page: number,
        limit: number,
    ): Promise<{
        comments: Array<CommentWithUserCount>;
        total: number;
    }> {
        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where: { noteId },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                    _count: { select: { likes: true } },
                },
                orderBy: { createdAt: 'asc' },
                take: limit,
                skip,
            }),
            prisma.comment.count({ where: { noteId } }),
        ]);

        return { comments, total };
    }

    async deleteComment(commentId: string): Promise<Comment> {
        return await prisma.comment.delete({ where: { id: commentId } });
    }

    async getCommentCount(noteId: string): Promise<number> {
        return await prisma.comment.count({ where: { noteId } });
    }

    async upsertCommentLike(userId: string, commentId: string): Promise<void> {
        await prisma.commentLike
            .upsert({
                where: { userId_commentId: { userId, commentId } },
                create: { userId, commentId },
                update: {},
            })
            .catch(() => null);
    }

    async deleteCommentLike(userId: string, commentId: string): Promise<void> {
        await prisma.commentLike
            .delete({ where: { userId_commentId: { userId, commentId } } })
            .catch(() => null);
    }

    async getCommentLikeCount(commentId: string): Promise<number> {
        return await prisma.commentLike.count({ where: { commentId } });
    }

    async hasUserLikedComment(userId: string, commentId: string): Promise<boolean> {
        const like = await prisma.commentLike.findUnique({
            where: { userId_commentId: { userId, commentId } },
        });
        return !!like;
    }

    async getUserByUsername(username: string): Promise<User | null> {
        return await prisma.user.findUnique({ where: { username } });
    }

    async getPublicNoteCount(userId: string): Promise<number> {
        return await prisma.note.count({
            where: { userId, isPublic: true },
        });
    }

    async getEngagementStats(noteId: string): Promise<{ likeCount: number; commentCount: number }> {
        const [likeCount, commentCount] = await Promise.all([
            this.getLikeCount(noteId),
            this.getCommentCount(noteId),
        ]);
        return { likeCount, commentCount };
    }
}
