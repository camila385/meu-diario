import { Router } from 'express';
import authRoutes from './auth.routes';
import notesRoutes from './notes.routes';
import moodsRoutes from './moods.routes';
import gamificationRoutes from './gamification.routes';
import insightsRoutes from './insights.routes';
import commentsRoutes from './comments.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', gamificationRoutes);
router.use('/users', usersRoutes);
router.use('/notes', notesRoutes);
router.use('/notes', commentsRoutes);
router.use('/moods', moodsRoutes);
router.use('/insights', insightsRoutes);

export default router;
