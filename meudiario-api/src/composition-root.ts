import { UsersRepository } from '@/repositories/users.repository'
import { GamificationRepository } from '@/repositories/gamification.repository'
import { NotesRepository } from '@/repositories/notes.repository'
import { MoodsRepository } from '@/repositories/moods.repository'
import { AuthService } from '@/services/auth.service'
import { NotesService } from '@/services/notes.service'
import { MoodsService } from '@/services/moods.service'
import { GamificationService } from '@/services/gamification.service'
import { AuthController } from '@/controllers/auth.controller'
import { NotesController } from '@/controllers/notes.controller'
import { MoodsController } from '@/controllers/moods.controller'
import { GamificationController } from '@/controllers/gamification.controller'

const usersRepository = new UsersRepository()
const gamificationRepository = new GamificationRepository()
const notesRepository = new NotesRepository()
const moodsRepository = new MoodsRepository()

const authService = new AuthService(usersRepository)
const moodsService = new MoodsService(moodsRepository)
const gamificationService = new GamificationService(gamificationRepository, notesRepository, moodsRepository)
const notesService = new NotesService(notesRepository, gamificationService)

export const authController = new AuthController(authService)
export const notesController = new NotesController(notesService)
export const moodsController = new MoodsController(moodsService)
export const gamificationController = new GamificationController(gamificationService)