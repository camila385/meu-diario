import { UsersRepository } from '@/repositories/users.repository';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { NotesRepository } from '@/repositories/notes.repository';
import { MoodsRepository } from '@/repositories/moods.repository';
import { CommentsRepository } from '@/repositories/comments.repository';
import { InsightsRepository } from '@/repositories/insights.repository';
import { AuthService } from '@/services/auth.service';
import { NotesService } from '@/services/notes.service';
import { MoodsService } from '@/services/moods.service';
import { GamificationService } from '@/services/gamification.service';
import { UsersService } from '@/services/users.service';
import { CommentsService } from '@/services/comments.service';
import { InsightsService } from '@/services/insights.service';

const usersRepository = new UsersRepository();
const gamificationRepository = new GamificationRepository();
const notesRepository = new NotesRepository();
const moodsRepository = new MoodsRepository();
const commentsRepository = new CommentsRepository();
const insightsRepository = new InsightsRepository();

const gamificationService = new GamificationService(
    usersRepository,
    gamificationRepository,
    notesRepository,
    moodsRepository,
);

export const authService = new AuthService(usersRepository);
export const notesService = new NotesService(notesRepository, usersRepository, gamificationService);
export const moodsService = new MoodsService(moodsRepository, notesRepository);
export const usersService = new UsersService(usersRepository);
export const commentsService = new CommentsService(notesRepository, commentsRepository);
export const insightsService = new InsightsService(insightsRepository);
export { gamificationService };
