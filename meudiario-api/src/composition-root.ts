import { UsersRepository } from '@/repositories/users.repository'
import { GamificationRepository } from '@/repositories/gamification.repository'
import { NotesRepository } from '@/repositories/notes.repository'
import { MoodsRepository } from '@/repositories/moods.repository'
import { SocialRepository } from '@/repositories/social.repository'
import { AuthService } from '@/services/auth.service'
import { NotesService } from '@/services/notes.service'
import { MoodsService } from '@/services/moods.service'
import { GamificationService } from '@/services/gamification.service'
import { SocialService } from '@/services/social.service'
import { AuthController } from '@/controllers/auth.controller'
import { NotesController } from '@/controllers/notes.controller'
import { MoodsController } from '@/controllers/moods.controller'
import { GamificationController } from '@/controllers/gamification.controller'
import { SocialController } from '@/controllers/social.controller'

const usersRepository = new UsersRepository()
const gamificationRepository = new GamificationRepository()
const notesRepository = new NotesRepository()
const moodsRepository = new MoodsRepository()
const socialRepository = new SocialRepository()

const authService = new AuthService(usersRepository)
const moodsService = new MoodsService(moodsRepository)
const gamificationService = new GamificationService(gamificationRepository, notesRepository, moodsRepository)
const notesService = new NotesService(notesRepository, gamificationService)
const socialService = new SocialService(socialRepository, notesRepository, usersRepository)

export const authController = new AuthController(authService)
export const notesController = new NotesController(notesService)
export const moodsController = new MoodsController(moodsService)
export const gamificationController = new GamificationController(gamificationService)
export const socialController = new SocialController(socialService)