import type { Request, Response } from 'express';
import type {
    CreateNoteRequest,
    UpdateNoteRequest,
    ListNotesQuery,
    NoteIdParam,
} from '@/validators/notes.validator';
import type { NotesService } from '@/services/notes.service';
import { sendSuccess } from '@/utils/response';

export class NotesController {
    constructor(private readonly notesService: NotesService) {}

    async createNote(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const body = req.body as CreateNoteRequest;
        const note = await this.notesService.createNote(userId, body);
        sendSuccess(res, note, 201);
    }

    async listNotes(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const query = req.query as unknown as ListNotesQuery;
        const { notes, meta } = await this.notesService.listNotes(userId, query);
        sendSuccess(res, notes, 200, meta);
    }

    async getNoteById(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const { id: noteId } = req.params as unknown as NoteIdParam;
        const note = await this.notesService.getNote(noteId, userId);
        sendSuccess(res, note, 200);
    }

    async updateNote(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const { id: noteId } = req.params as unknown as NoteIdParam;
        const body = req.body as Partial<UpdateNoteRequest>;
        const updatedNote = await this.notesService.updateNote(noteId, userId, body);
        sendSuccess(res, updatedNote, 200);
    }

    async deleteNote(req: Request, res: Response): Promise<void> {
        const userId = req.userId!;
        const { id: noteId } = req.params as unknown as NoteIdParam;
        await this.notesService.deleteNote(noteId, userId);
        sendSuccess(res, null, 204);
    }
}
