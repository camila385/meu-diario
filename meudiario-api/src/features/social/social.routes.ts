import { Router } from 'express'
import { SocialController } from './social.controller'
import { validate } from '@/middlewares/validate.middleware'
import { authenticate } from '@/middlewares/auth.middleware'
import { reportSchema } from './social.validator'

const router = Router()
const controller = new SocialController()

router.post('/reports', authenticate, validate(reportSchema), (req, res) => controller.createReport(req, res))

export default router
