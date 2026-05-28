import { ConflictError } from '@/errors/ConflictError'
import { NotFoundError } from '@/errors/NotFoundError'
import { UnauthorizedError } from '@/errors/UnauthorizedError'
import { comparePassword, hashPassword } from '@/utils/hash'
import { usersRepository } from '@/repositories/users.repository'
import {
	buildAuthResponse,
	toProfileResponse,
	type AuthResponse,
	type UserProfileResponse,
} from '@/models/user.model'
import type { LoginDTO, RegisterDTO } from '@/validators/auth.validator'

export const authService = {
	async register(input: RegisterDTO): Promise<AuthResponse> {
		const existingUser = await usersRepository.findByEmailOrUsername(input.email, input.username)

		if (existingUser) {
			throw new ConflictError('E-mail ou nome de usuário já cadastrado.')
		}

		const passwordHash = await hashPassword(input.password)

		const { user: createdUser } = await usersRepository.createWithGamification({
			email: input.email,
			username: input.username,
			passwordHash,
		})

		return buildAuthResponse(createdUser)
	},

	async login(input: LoginDTO): Promise<AuthResponse> {
		const user = await usersRepository.findByEmail(input.email)

		if (!user) {
			throw new UnauthorizedError('E-mail ou senha inválidos.')
		}

		const isPasswordValid = await comparePassword(input.password, user.passwordHash)

		if (!isPasswordValid) {
			throw new UnauthorizedError('E-mail ou senha inválidos.')
		}

		return buildAuthResponse(user)
	},

	async getProfile(userId: string): Promise<UserProfileResponse> {
		const user = await usersRepository.findById(userId)

		if (!user) {
			throw new NotFoundError('Usuário não encontrado.')
		}

		return toProfileResponse(user)
	},
}