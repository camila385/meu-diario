import { Request, Response } from 'express'
import { authService } from '@/services/auth.service'
import { sendSuccess } from '@/utils/response'

export const authController = {
    async register(req: Request, res: Response): Promise<void> {
        const result = await authService.register(req.body)
        sendSuccess(res, result, 201)
    },

    async login(req: Request, res: Response): Promise<void> {
        const result = await authService.login(req.body)
        sendSuccess(res, result)
    },

    async me(req: Request, res: Response): Promise<void> {
        const profile = await authService.getProfile(req.userId)
        sendSuccess(res, profile)
    },
}
