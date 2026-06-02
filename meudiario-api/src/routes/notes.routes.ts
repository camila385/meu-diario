import { Router } from 'express';
import { notesService } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createNoteSchema, updateNoteSchema, notesQuerySchema } from '@/validators/notes.validator';
import { uuidParamSchema } from '@/validators/common.validator';
import type { CreateNoteRequest, UpdateNoteRequest, NotesQuery } from '@/validators/notes.validator';
import type { UuidParam } from '@/validators/common.validator';
import { sendSuccess } from '@/utils/response';

const router = Router();

router.get('/', authenticate, validate(notesQuerySchema, 'query'), async (req, res) => {
    const notes = await notesService.getNotes(req.userId!, req.userId!, req.query as unknown as NotesQuery);
    sendSuccess(res, notes);
});

router.get('/feed', authenticate, validate(notesQuerySchema, 'query'), async (req, res) => {
    const notes = await notesService.getFeed(req.userId!, req.query as unknown as NotesQuery);
    sendSuccess(res, notes);
});

router.get('/by-user/:id', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id: targetUserId } = req.params as unknown as UuidParam;
    const notes = await notesService.getNotes(req.userId!, targetUserId);
    sendSuccess(res, notes);
});

router.get('/:id', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id } = req.params as unknown as UuidParam;
    const note = await notesService.getNote(id, req.userId!);
    sendSuccess(res, note);
});

router.post('/', authenticate, validate(createNoteSchema), async (req, res) => {
    const note = await notesService.createNote(req.userId!, req.body as CreateNoteRequest);
    sendSuccess(res, note, 201);
});

router.post('/:id/like', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id: noteId } = req.params as unknown as UuidParam;
    await notesService.likeNote(req.userId!, noteId);
    sendSuccess(res, null, 204);
});

router.patch('/:id', authenticate, validate(updateNoteSchema), async (req, res) => {
    const { id } = req.params as unknown as UuidParam;
    const updated = await notesService.updateNote(id, req.userId!, req.body as Partial<UpdateNoteRequest>);
    sendSuccess(res, updated);
});

router.delete('/:id', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id } = req.params as unknown as UuidParam;
    await notesService.deleteNote(id, req.userId!);
    sendSuccess(res, null, 204);
});

router.delete('/:id/like', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id: noteId } = req.params as unknown as UuidParam;
    await notesService.unlikeNote(req.userId!, noteId);
    sendSuccess(res, null, 204);
});

export default router;
