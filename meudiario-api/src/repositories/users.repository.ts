import type { User } from '@/generated/prisma';
import { prisma } from './prisma.client';

export class UsersRepository {
    findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    findByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    }

    findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    async create(data: { email: string; username: string; passwordHash: string }): Promise<User> {
        const user = await prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                passwordHash: data.passwordHash,
            },
        });

        return user;
    }
}
