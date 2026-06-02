import { ConflictError } from '@/errors/ConflictError';
import { ForbiddenError } from '@/errors/ForbiddenError';
import { NotFoundError } from '@/errors/NotFoundError';
import { toUtcDayStart } from '@/utils/date';
import type { MoodsRepository } from '@/repositories/moods.repository';
import type { NotesRepository } from '@/repositories/notes.repository';
import type { CreateMoodRequest, MoodHistoryQuery } from '@/validators/moods.validator';
import type { MoodResponse } from '@/models/mood.model';
import { toResponse } from '@/mappers/mood.mapper';

export class MoodsService {
    constructor(
        private readonly moodsRepository: MoodsRepository,
        private readonly notesRepository: NotesRepository,
    ) {}

    async record(userId: string, input: CreateMoodRequest): Promise<MoodResponse> {
        if (input.noteId) {
            const note = await this.notesRepository.findById(input.noteId);
            if (!note) {
                throw new NotFoundError('Anotação não encontrada.');
            }
            if (note.userId !== userId) {
                throw new ForbiddenError('Acesso negado. Apenas o proprietário pode associar humor a esta anotação.');
            }
            const existing = await this.moodsRepository.findByNoteId(input.noteId);
            if (existing) {
                throw new ConflictError('Esta anotação já possui um humor vinculado.');
            }
            return toResponse(await this.moodsRepository.createForNote(userId, input.noteId, input.value));
        }

        return toResponse(await this.moodsRepository.upsertDaily(userId, toUtcDayStart(), input.value));
    }

    async list(userId: string, query: MoodHistoryQuery): Promise<MoodResponse[]> {
        const moods = await this.moodsRepository.findMany(userId, {
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        });
        return moods.map(toResponse);
    }
}
