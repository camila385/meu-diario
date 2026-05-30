import { Router } from 'express'
import authRoutes from './auth.routes'
import notesRoutes from './notes.routes'
import moodsRoutes from './moods.routes'
import gamificationRoutes from './gamification.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/notes', notesRoutes)
router.use('/moods', moodsRoutes)
router.use('/gamification', gamificationRoutes)

export default router
