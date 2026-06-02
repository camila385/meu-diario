import { Router } from 'express';
import { commentsService } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createCommentSchema } from '@/validators/comments.validator';
import { uuidParamSchema, noteAndCommentParamSchema } from '@/validators/common.validator';
import type { CreateCommentRequest } from '@/validators/comments.validator';
import type { UuidParam, NoteAndCommentParam } from '@/validators/common.validator';
import { sendSuccess } from '@/utils/response';

const router = Router();

router.get('/:id/comments', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id: noteId } = req.params as unknown as UuidParam;
    const comments = await commentsService.getComments(noteId, req.userId!);
    sendSuccess(res, comments);
});

router.post('/:id/comments',
    authenticate, validate(uuidParamSchema, 'params'), validate(createCommentSchema, 'body'),
    async (req, res) => {
        const { id: noteId } = req.params as unknown as UuidParam;
        const { content } = req.body as CreateCommentRequest;
        const comment = await commentsService.createComment(req.userId!, noteId, content);
        sendSuccess(res, comment, 201);
    },
);

router.post('/:noteId/comments/:commentId/like',
    authenticate, validate(noteAndCommentParamSchema, 'params'),
    async (req, res) => {
        const { commentId } = req.params as unknown as NoteAndCommentParam;
        const result = await commentsService.likeComment(req.userId!, commentId);
        sendSuccess(res, result);
    },
);

router.delete('/:noteId/comments/:commentId',
    authenticate, validate(noteAndCommentParamSchema, 'params'),
    async (req, res) => {
        const { commentId } = req.params as unknown as NoteAndCommentParam;
        await commentsService.deleteComment(req.userId!, commentId);
        sendSuccess(res, null, 204);
    },
);

router.delete('/:noteId/comments/:commentId/like',
    authenticate, validate(noteAndCommentParamSchema, 'params'),
    async (req, res) => {
        const { commentId } = req.params as unknown as NoteAndCommentParam;
        const result = await commentsService.unlikeComment(req.userId!, commentId);
        sendSuccess(res, result);
    },
);

export default router;
