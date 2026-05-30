import type { SocialRepository } from '@/repositories/social.repository';
import type { NotesRepository } from '@/repositories/notes.repository';
import type { UsersRepository } from '@/repositories/users.repository';
import {
    computeExcerpt,
    toISO8601,
    type FeedItemResponse,
    type FeedResponse,
    type FollowUserResponse,
    type FollowListResponse,
    type CommentDetailResponse,
    type CommentListResponse,
    type CreateCommentResponse,
    type ProfileDetailResponse,
    type ReportResponse,
    type LikeCountResponse,
    type PaginationMeta,
} from '@/models/social.model';
import { ConflictError, NotFoundError, ForbiddenError } from '@/errors';

export class SocialService {
    constructor(
        private readonly socialRepository: SocialRepository,
        private readonly notesRepository: NotesRepository,
        private readonly usersRepository: UsersRepository,
    ) {}

    private logOperation(operation: string, payload: Record<string, string>): void {
        console.log(`[social] ${operation}`, payload);
    }

    // ====== FEED ======

    async getFeed(
        userId: string,
        query: { page?: number; limit?: number; tag?: string },
    ): Promise<FeedResponse> {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100); // Cap at 100
        const tag = query.tag;

        const { notes, total } = await this.socialRepository.getFeedNotes(userId, page, limit, tag);

        const data: FeedItemResponse[] = notes.map((note) => ({
            id: note.id,
            title: note.title,
            excerpt: computeExcerpt(note.content),
            tags: note.noteTags.map((link) => link.tag.name),
            author: {
                id: note.user.id,
                username: note.user.username,
                avatarUrl: note.user.avatarUrl,
            },
            likeCount: note.likeCount,
            commentCount: note.commentCount,
            createdAt: toISO8601(note.createdAt),
        }));

        return {
            success: true,
            data,
            meta: { page, limit, total },
        };
    }

    // ====== FOLLOWS ======

    async followUser(userId: string, targetUserId: string): Promise<FollowUserResponse> {
        // Prevent self-follow (400 error)
        if (userId === targetUserId) {
            throw new ConflictError('Você não pode seguir a si mesmo.');
        }

        // Verify target user exists
        const targetUser = await this.usersRepository.findById(targetUserId);
        if (!targetUser) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        // Upsert follow (idempotent)
        await this.socialRepository.upsertFollow(userId, targetUserId);
        this.logOperation('follow', { userId, targetUserId });

        return {
            id: targetUser.id,
            username: targetUser.username,
            avatarUrl: targetUser.avatarUrl,
            isPublic: targetUser.isPublic,
        };
    }

    async unfollowUser(userId: string, targetUserId: string): Promise<void> {
        // Verify target user exists
        const targetUser = await this.usersRepository.findById(targetUserId);
        if (!targetUser) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        // Delete follow (idempotent - doesn't error if not following)
        await this.socialRepository.deleteFollow(userId, targetUserId);
        this.logOperation('unfollow', { userId, targetUserId });
    }

    async getFollowing(
        userId: string,
        query: { page?: number; limit?: number },
    ): Promise<FollowListResponse> {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);

        const { users, total } = await this.socialRepository.getFollowing(userId, page, limit);

        const data: FollowUserResponse[] = users.map((user) => ({
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            isPublic: user.isPublic,
        }));

        return { success: true, data, meta: { page, limit, total } };
    }

    async getFollowers(
        userId: string,
        query: { page?: number; limit?: number },
    ): Promise<FollowListResponse> {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);

        const { users, total } = await this.socialRepository.getFollowers(userId, page, limit);

        const data: FollowUserResponse[] = users.map((user) => ({
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            isPublic: user.isPublic,
        }));

        return { success: true, data, meta: { page, limit, total } };
    }

    // ====== LIKES ======

    async likeNote(userId: string, noteId: string): Promise<LikeCountResponse> {
        // Verify note exists and is public
        const note = await this.notesRepository.getById(noteId);
        if (!note || !note.isPublic) {
            throw new NotFoundError('Nota não encontrada.');
        }

        // Prevent self-like (400 error)
        if (note.userId === userId) {
            throw new ConflictError('Você não pode dar like na sua própria nota.');
        }

        // Upsert like (idempotent)
        await this.socialRepository.upsertLike(userId, noteId);
        this.logOperation('like', { userId, noteId });

        const likeCount = await this.socialRepository.getLikeCount(noteId);

        return { success: true, data: { likeCount } };
    }

    async unlikeNote(userId: string, noteId: string): Promise<LikeCountResponse> {
        // Verify note exists
        const note = await this.notesRepository.getById(noteId);
        if (!note) {
            throw new NotFoundError('Nota não encontrada.');
        }

        // Delete like (idempotent)
        await this.socialRepository.deleteLike(userId, noteId);
        this.logOperation('unlike', { userId, noteId });

        const likeCount = await this.socialRepository.getLikeCount(noteId);

        return { success: true, data: { likeCount } };
    }

    // ====== COMMENTS ======

    async getComments(
        noteId: string,
        query: { page?: number; limit?: number; requestingUserId?: string },
    ): Promise<CommentListResponse> {
        // Verify note exists and is public
        const note = await this.notesRepository.getById(noteId);
        if (!note || !note.isPublic) {
            throw new NotFoundError('Nota não encontrada.');
        }

        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const requestingUserId = query.requestingUserId;

        const { comments, total } = await this.socialRepository.getComments(noteId, page, limit);

        const data: CommentDetailResponse[] = [];
        for (const comment of comments) {
            const likeCount = comment._count?.likes ?? 0;
            const likedByMe = requestingUserId
                ? await this.socialRepository.hasUserLikedComment(requestingUserId, comment.id)
                : false;
            data.push({
                id: comment.id,
                content: comment.content,
                author: {
                    id: comment.user.id,
                    username: comment.user.username,
                    avatarUrl: comment.user.avatarUrl,
                },
                createdAt: toISO8601(comment.createdAt),
                likesCount: likeCount,
                likedByMe,
            });
        }

        return { success: true, data, meta: { page, limit, total } };
    }

    async createComment(
        userId: string,
        noteId: string,
        content: string,
    ): Promise<CreateCommentResponse> {
        // Verify note exists and is public
        const note = await this.notesRepository.getById(noteId);
        if (!note || !note.isPublic) {
            throw new NotFoundError('Nota não encontrada.');
        }

        // Validate content length (max 500 chars)
        if (content.length > 500) {
            throw new ConflictError('O comentário não pode exceder 500 caracteres.');
        }

        // Create comment
        const comment = await this.socialRepository.createComment(userId, noteId, content);
        this.logOperation('comment:create', { userId, noteId });

        return {
            success: true,
            data: {
                id: comment.id,
                content: comment.content,
                author: {
                    id: comment.user.id,
                    username: comment.user.username,
                    avatarUrl: comment.user.avatarUrl,
                },
                createdAt: toISO8601(comment.createdAt),
                likesCount: 0,
                likedByMe: false,
            },
        };
    }

    async deleteComment(userId: string, commentId: string): Promise<void> {
        // Get comment to verify ownership
        const comment = await this.notesRepository.getCommentById(commentId);
        if (!comment) {
            throw new NotFoundError('Comentário não encontrado.');
        }

        // Verify ownership (403 if not owner)
        if (comment.userId !== userId) {
            throw new ForbiddenError('Você só pode deletar seus próprios comentários.');
        }

        // Delete comment
        await this.socialRepository.deleteComment(commentId);
        this.logOperation('comment:delete', { userId, commentId });
    }

    // ====== COMMENT LIKES ======

    async likeComment(userId: string, commentId: string): Promise<LikeCountResponse> {
        const comment = await this.notesRepository.getCommentById(commentId);
        if (!comment) throw new NotFoundError('Comentário não encontrado.');

        const already = await this.socialRepository.hasUserLikedComment(userId, commentId);
        if (already) throw new ConflictError('Comentário já curtido.');

        await this.socialRepository.upsertCommentLike(userId, commentId);
        this.logOperation('likeComment', { userId, commentId });

        const likeCount = await this.socialRepository.getCommentLikeCount(commentId);
        return { success: true, data: { likeCount } };
    }

    async unlikeComment(userId: string, commentId: string): Promise<LikeCountResponse> {
        const comment = await this.notesRepository.getCommentById(commentId);
        if (!comment) throw new NotFoundError('Comentário não encontrado.');

        const already = await this.socialRepository.hasUserLikedComment(userId, commentId);
        if (!already) throw new NotFoundError('Comentário não curtido.');

        await this.socialRepository.deleteCommentLike(userId, commentId);
        this.logOperation('unlikeComment', { userId, commentId });

        const likeCount = await this.socialRepository.getCommentLikeCount(commentId);
        return { success: true, data: { likeCount } };
    }

    // ====== PUBLIC PROFILES ======

    async getPublicProfile(userId: string, username: string): Promise<ProfileDetailResponse> {
        // Get user by username
        const user = await this.socialRepository.getUserByUsername(username);
        if (!user || !user.isPublic) {
            throw new NotFoundError('Perfil não encontrado.');
        }

        // Get engagement stats
        const [followerCount, followingCount, publicNoteCount, isFollowing] = await Promise.all([
            this.socialRepository.getFollowerCount(user.id),
            this.socialRepository.getFollowingCount(user.id),
            this.socialRepository.getPublicNoteCount(user.id),
            this.socialRepository.isUserFollowing(userId, user.id),
        ]);

        return {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            isPublic: user.isPublic,
            followerCount,
            followingCount,
            publicNoteCount,
            isFollowing,
        };
    }
}
