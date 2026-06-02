import type { Comment, CommentLike, Prisma, User } from '@/generated/prisma';
import { prisma } from './prisma.client';

type CommentWithUser = Comment & {
    user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
};

export type CommentWithUserCount = CommentWithUser & {
    _count: { likes: number };
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

    getComments(noteId: string): Promise<CommentWithUserCount[]> {
        return prisma.comment.findMany({
            where: { noteId },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
                _count: { select: { likes: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async deleteComment(commentId: string): Promise<Comment> {
        return prisma.comment.delete({ where: { id: commentId } });
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

    async getUserLikedCommentIds(userId: string, commentIds: string[]): Promise<Set<string>> {
        const likes = await prisma.commentLike.findMany({
            where: { userId, commentId: { in: commentIds } },
            select: { commentId: true },
        });
        return new Set(likes.map((l) => l.commentId));
    }
}