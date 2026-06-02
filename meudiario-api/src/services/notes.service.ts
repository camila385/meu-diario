import type { CreateNoteRequest, UpdateNoteRequest, NotesQuery } from '@/validators/notes.validator';
import { AppError, ForbiddenError, NotFoundError } from '@/errors';
import type { NotesRepository } from '@/repositories/notes.repository';
import type { UsersRepository } from '@/repositories/users.repository';
import type { GamificationService } from '@/services/gamification.service';
import { toNoteDetail } from '@/mappers/note.mapper';

export class NotesService {
    constructor(
        private readonly notesRepository: NotesRepository,
        private readonly usersRepository: UsersRepository,
        private readonly gamificationService: GamificationService,
    ) {}

    async createNote(userId: string, input: CreateNoteRequest) {
        const note = await this.notesRepository.createNote(userId, input);

        await this.gamificationService.awardForNote(userId, input);

        return toNoteDetail(note);
    }

    async getNotes(requesterId: string, targetUserId: string, query: NotesQuery = {}) {
        if (requesterId === targetUserId) {
            const notes = await this.notesRepository.findMany(targetUserId, query);
            return notes.map(toNoteDetail);
        }

        const target = await this.usersRepository.findById(targetUserId);
        if (!target || !target.isActive) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        const canAccess = target.isPublic || await this.usersRepository.isFollowing(requesterId, targetUserId);
        if (!canAccess) {
            throw new ForbiddenError('Este perfil é privado.');
        }

        const notes = await this.notesRepository.findMany(targetUserId, { isPublic: true });
        return notes.map(toNoteDetail);
    }

    async getNote(noteId: string, userId: string) {
        const note = await this.notesRepository.findById(noteId);
        if (!note || (!note.isPublic && note.userId !== userId)) {
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

    async getFeed(userId: string, query: NotesQuery) {
        return this.notesRepository.findFeedNotes(userId, query.tag);
    }

    async likeNote(userId: string, noteId: string) {
        const note = await this.notesRepository.findById(noteId);
        if (!note || !note.isPublic) {
            throw new NotFoundError('Anotação não encontrada.');
        }
        const author = await this.usersRepository.findById(note.userId);
        if (!author || !author.isActive) {
            throw new NotFoundError('Anotação não encontrada.');
        }
        const canAccess = author.isPublic || await this.usersRepository.isFollowing(userId, note.userId);
        if (!canAccess) {
            throw new NotFoundError('Anotação não encontrada.');
        }
        return this.notesRepository.upsertLike(userId, noteId);
    }

    async unlikeNote(userId: string, noteId: string) {
        const deleted = await this.notesRepository.deleteLike(userId, noteId);
        if (!deleted) {
            throw new NotFoundError('Curtida não encontrada.');
        }
    }
}
