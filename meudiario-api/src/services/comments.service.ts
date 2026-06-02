import type { NotesRepository } from '@/repositories/notes.repository';
import type { CommentsRepository } from '@/repositories/comments.repository';
import { type CommentDetailResponse, type LikeCountResponse } from '@/models/social.model';
import { toCommentDetailResponse } from '@/mappers/comment.mapper';
import { ConflictError, NotFoundError, ForbiddenError } from '@/errors';

export class CommentsService {
    constructor(
        private readonly notesRepository: NotesRepository,
        private readonly commentsRepository: CommentsRepository,
    ) {}

    async getComments(noteId: string, requestingUserId: string): Promise<CommentDetailResponse[]> {
        const note = await this.notesRepository.findById(noteId);
        if (!note || !note.isPublic) {
            throw new NotFoundError('Nota não encontrada.');
        }

        const comments = await this.commentsRepository.getComments(noteId);
        const likedIds = await this.commentsRepository.getUserLikedCommentIds(
            requestingUserId,
            comments.map((c) => c.id),
        );

        return comments.map((comment) => toCommentDetailResponse(comment, likedIds.has(comment.id)));
    }

    async createComment(userId: string, noteId: string, content: string): Promise<CommentDetailResponse> {
        const note = await this.notesRepository.findById(noteId);
        if (!note || !note.isPublic) {
            throw new NotFoundError('Nota não encontrada.');
        }

        const comment = await this.commentsRepository.createComment(userId, noteId, content);
        return toCommentDetailResponse({ ...comment, _count: { likes: 0 } }, false);
    }

    async deleteComment(userId: string, commentId: string): Promise<void> {
        const comment = await this.commentsRepository.getCommentById(commentId);
        if (!comment) {
            throw new NotFoundError('Comentário não encontrado.');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenError('Você só pode deletar seus próprios comentários.');
        }

        await this.commentsRepository.deleteComment(commentId);
    }

    async likeComment(userId: string, commentId: string): Promise<LikeCountResponse> {
        const comment = await this.commentsRepository.getCommentById(commentId);
        if (!comment) throw new NotFoundError('Comentário não encontrado.');

        const already = await this.commentsRepository.hasUserLikedComment(userId, commentId);
        if (already) throw new ConflictError('Comentário já curtido.');

        await this.commentsRepository.upsertCommentLike(userId, commentId);

        const likeCount = await this.commentsRepository.getCommentLikeCount(commentId);
        return { likeCount };
    }

    async unlikeComment(userId: string, commentId: string): Promise<LikeCountResponse> {
        const comment = await this.commentsRepository.getCommentById(commentId);
        if (!comment) throw new NotFoundError('Comentário não encontrado.');

        const already = await this.commentsRepository.hasUserLikedComment(userId, commentId);
        if (!already) throw new NotFoundError('Comentário não curtido.');

        await this.commentsRepository.deleteCommentLike(userId, commentId);

        const likeCount = await this.commentsRepository.getCommentLikeCount(commentId);
        return { likeCount };
    }
}
