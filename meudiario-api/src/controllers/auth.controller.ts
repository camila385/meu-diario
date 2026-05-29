import { Request, Response } from 'express'
import type { AuthService } from '@/services/auth.service'
import { sendSuccess } from '@/utils/response'

export class AuthController {
	constructor(private readonly authService: AuthService) {}

	async register(req: Request, res: Response): Promise<void> {
		const result = await this.authService.register(req.body)
		sendSuccess(res, result, 201)
	}

	async login(req: Request, res: Response): Promise<void> {
		const result = await this.authService.login(req.body)
		sendSuccess(res, result)
	}

	async me(req: Request, res: Response): Promise<void> {
		const profile = await this.authService.getProfile(req.userId)
		sendSuccess(res, profile)
	}
}
