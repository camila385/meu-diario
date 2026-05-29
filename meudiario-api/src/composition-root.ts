import { UsersRepository } from '@/repositories/users.repository'
import { GamificationRepository } from '@/repositories/gamification.repository'
import { NotesRepository } from '@/repositories/notes.repository'
import { AuthService } from '@/services/auth.service'
import { NotesService } from '@/services/notes.service'
import { AuthController } from '@/controllers/auth.controller'
import { NotesController } from '@/controllers/notes.controller'

const usersRepository = new UsersRepository()
const gamificationRepository = new GamificationRepository()
const notesRepository = new NotesRepository()

const authService = new AuthService(usersRepository)
const notesService = new NotesService(notesRepository, gamificationRepository)

export const authController = new AuthController(authService)
export const notesController = new NotesController(notesService)