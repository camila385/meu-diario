import type { Comment, CommentLike, Prisma, User } from '@/generated/prisma';
import { prisma } from './prisma.client';

type CommentWithUser = Comment & {
    user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
};

type CommentWithUserCount = CommentWithUser & {
    _count?: { likes?: number };
};

export class CommentsRepository {
    async getCommentById(commentId: string): Promise<Comment | null> {
        return prisma.comment.findUnique({
            where: { id: commentId },
        });
    }

    async createComment(
        userId: string,
        noteId: string,
        content: string,
    ): Promise<CommentWithUser> {
        return prisma.comment.create({
            data: { userId, noteId, content },
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        });
    }

    async getComments(
        noteId: string,
        page: number,
        limit: number,
    ): Promise<{
        comments: CommentWithUserCount[];
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
        return prisma.comment.delete({ where: { id: commentId } });
    }

    async getCommentCount(noteId: string): Promise<number> {
        return prisma.comment.count({ where: { noteId } });
    }

    async upsertCommentLike(userId: string, commentId: string): Promise<CommentLike> {
        return prisma.commentLike.upsert({
            where: { userId_commentId: { userId, commentId } },
            create: { userId, commentId },
            update: {},
        });
    }

    async deleteCommentLike(userId: string, commentId: string): Promise<CommentLike | null> {
        return prisma.commentLike
            .delete({ where: { userId_commentId: { userId, commentId } } })
            .catch(() => null);
    }

    async getCommentLikeCount(commentId: string): Promise<number> {
        return prisma.commentLike.count({ where: { commentId } });
    }

    async hasUserLikedComment(userId: string, commentId: string): Promise<boolean> {
        const like = await prisma.commentLike.findUnique({
            where: { userId_commentId: { userId, commentId } },
        });
        return !!like;
    }

    async getCommentEngagement(noteId: string): Promise<{ commentCount: number }> {
        const commentCount = await this.getCommentCount(noteId);
        return { commentCount };
    }
}