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
    // ====== FEED QUERIES ======

    /**
     * Get paginated public feed for authenticated user
     * Excludes user's own notes and filters by privacy settings
     */
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

    // ====== LIKE QUERIES ======

    /**
     * Create or update a like (upsert)
     */
    async upsertLike(userId: string, noteId: string): Promise<Like> {
        return await prisma.like.upsert({
            where: { userId_noteId: { userId, noteId } },
            create: { userId, noteId },
            update: {},
        });
    }

    /**
     * Delete a like if it exists (idempotent)
     */
    async deleteLike(userId: string, noteId: string): Promise<Like | null> {
        return await prisma.like
            .delete({
                where: { userId_noteId: { userId, noteId } },
            })
            .catch(() => null);
    }

    /**
     * Get like count for a note
     */
    async getLikeCount(noteId: string): Promise<number> {
        return await prisma.like.count({ where: { noteId } });
    }

    /**
     * Check if user has liked a note
     */
    async hasUserLiked(userId: string, noteId: string): Promise<boolean> {
        const like = await prisma.like.findUnique({
            where: { userId_noteId: { userId, noteId } },
        });
        return !!like;
    }

    // ====== FOLLOW QUERIES ======

    /**
     * Create or update a follow relationship (upsert)
     */
    async upsertFollow(followerId: string, followingId: string): Promise<Follow> {
        return await prisma.follow.upsert({
            where: { followerId_followingId: { followerId, followingId } },
            create: { followerId, followingId },
            update: {},
        });
    }

    /**
     * Delete a follow relationship if it exists (idempotent)
     */
    async deleteFollow(followerId: string, followingId: string): Promise<Follow | null> {
        return await prisma.follow
            .delete({
                where: { followerId_followingId: { followerId, followingId } },
            })
            .catch(() => null);
    }

    /**
     * Get paginated list of users that a user is following
     */
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

    /**
     * Get paginated list of users following a user
     */
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

    /**
     * Get total follower count for a user (including private followers)
     */
    async getFollowerCount(userId: string): Promise<number> {
        return await prisma.follow.count({ where: { followingId: userId } });
    }

    /**
     * Get total following count for a user (including private following)
     */
    async getFollowingCount(userId: string): Promise<number> {
        return await prisma.follow.count({ where: { followerId: userId } });
    }

    /**
     * Check if user is following another user
     */
    async isUserFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } },
        });
        return !!follow;
    }

    // ====== COMMENT QUERIES ======

    /**
     * Create a new comment on a note
     */
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

    /**
     * Get paginated comments for a note, ordered oldest first
     */
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

    /**
     * Delete a comment
     */
    async deleteComment(commentId: string): Promise<Comment> {
        return await prisma.comment.delete({ where: { id: commentId } });
    }

    /**
     * Get comment count for a note
     */
    async getCommentCount(noteId: string): Promise<number> {
        return await prisma.comment.count({ where: { noteId } });
    }
    // ====== COMMENT LIKES ======

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

    // ====== PROFILE QUERIES ======

    /**
     * Get user by username
     */
    async getUserByUsername(username: string): Promise<User | null> {
        return await prisma.user.findUnique({ where: { username } });
    }

    /**
     * Get count of public notes for a user
     */
    async getPublicNoteCount(userId: string): Promise<number> {
        return await prisma.note.count({
            where: { userId, isPublic: true },
        });
    }

    /**
     * Get comment count for a note (used in engagement calculations)
     */
    async getEngagementStats(noteId: string): Promise<{ likeCount: number; commentCount: number }> {
        const [likeCount, commentCount] = await Promise.all([
            this.getLikeCount(noteId),
            this.getCommentCount(noteId),
        ]);
        return { likeCount, commentCount };
    }
}
