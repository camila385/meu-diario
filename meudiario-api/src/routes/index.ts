import { Router } from 'express'
import authRoutes from './auth.routes'
import notesRoutes from './notes.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/notes', notesRoutes)

export default router
