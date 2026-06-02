import type { CommentDetailResponse } from '@/models/social.model';
import type { CommentWithUserCount } from '@/repositories/comments.repository';
import { toISO8601 } from '@/mappers/social.mapper';

export const toCommentDetailResponse = (
    comment: CommentWithUserCount,
    likedByMe: boolean,
): CommentDetailResponse => ({
    id: comment.id,
    content: comment.content,
    author: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
    },
    createdAt: toISO8601(comment.createdAt),
    likesCount: comment._count.likes,
    likedByMe,
});
