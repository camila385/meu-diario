import type { Gamification, User } from '@/generated/prisma'
import { prisma } from './prisma.client'

export class UsersRepository {
	findByEmail(email: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { email },
		})
	}

	findByEmailOrUsername(email: string, username: string): Promise<User | null> {
		return prisma.user.findFirst({
			where: {
				OR: [{ email }, { username }],
			},
		})
	}

	findById(id: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { id },
		})
	}

	create(data: { email: string; username: string; passwordHash: string }): Promise<User> {
		return prisma.user.create({
			data: {
				email: data.email,
				username: data.username,
				passwordHash: data.passwordHash,
			},
		})
	}

	async createWithGamification(data: {
		email: string
		username: string
		passwordHash: string
	}): Promise<{ user: User; gamification: Gamification }> {
		return prisma.$transaction(async (tx) => {
			const user = await tx.user.create({
				data: {
					email: data.email,
					username: data.username,
					passwordHash: data.passwordHash,
				},
			})

			const gamification = await tx.gamification.create({
				data: {
					userId: user.id,
					points: 0,
					level: 1,
					streak: 0,
				},
			})

			return { user, gamification }
		})
	}
}
