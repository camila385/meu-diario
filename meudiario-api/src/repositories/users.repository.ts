import type { User } from '@/generated/prisma';
import { prisma } from './prisma.client';

export class UsersRepository {
    findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    findByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
    }

    findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    create(data: { email: string; username: string; passwordHash: string }): Promise<User> {
        return prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                passwordHash: data.passwordHash,
            },
        });
    }

    async createWithGamification(data: {
        email: string;
        username: string;
        passwordHash: string;
    }): Promise<{
        user: User;
        gamification: {
            id: string;
            points: number;
            level: number;
            streak: number;
            lastActivity: Date | null;
        };
    }> {
        const user = await prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                passwordHash: data.passwordHash,
            },
        });

        return {
            user,
            gamification: {
                id: user.id,
                points: user.points ?? 0,
                level: user.level ?? 1,
                streak: user.streak ?? 0,
                lastActivity: user.lastActivity ?? null,
            },
        };
    }
}
