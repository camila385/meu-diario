import type {
    CreateNoteRequest,
    UpdateNoteRequest,
    ListNotesQuery,
} from '@/validators/notes.validator';
import { AppError, NotFoundError, ForbiddenError } from '@/errors';
import type { NotesRepository } from '@/repositories/notes.repository';
import type { GamificationService } from '@/services/gamification.service';
import { toNoteDetail, toNoteSummary } from '@/mappers/note.mapper';

export class NotesService {
    constructor(
        private readonly notesRepository: NotesRepository,
        private readonly gamificationService: GamificationService,
    ) {}

    async createNote(userId: string, input: CreateNoteRequest) {
        const note = await this.notesRepository.createNote(userId, input);

        await this.gamificationService.awardForNote(userId, input);

        return toNoteDetail(note);
    }

    async listNotes(userId: string, query: ListNotesQuery) {
        const { notes, total } = await this.notesRepository.listNotes(userId, query);

        const summaries = notes.map(toNoteSummary);

        const meta = {
            page: query.page,
            limit: query.limit,
            total,
        };

        return { summaries, meta };
    }

    async getNote(noteId: string, userId: string) {
        const note = await this.notesRepository.getNoteById(noteId, userId);
        if (!note) {
            throw new NotFoundError('Anotação não encontrada.');
        }
        return toNoteDetail(note);
    }

    async updateNote(noteId: string, userId: string, input: Partial<UpdateNoteRequest>) {
        const isOwner = await this.notesRepository.isNoteOwner(noteId, userId);
        if (!isOwner) {
            throw new ForbiddenError(
                'Acesso negado. Apenas o proprietário pode editar esta anotação.',
            );
        }

        const note = await this.notesRepository.updateNote(noteId, input);
        if (!note) {
            throw new NotFoundError('Anotação não encontrada.');
        }

        return toNoteDetail(note);
    }

    async deleteNote(noteId: string, userId: string): Promise<void> {
        const isOwner = await this.notesRepository.isNoteOwner(noteId, userId);
        if (!isOwner) {
            throw new ForbiddenError(
                'Acesso negado. Apenas o proprietário pode excluir esta anotação.',
            );
        }

        await this.notesRepository.deleteNote(noteId);
    }
}
