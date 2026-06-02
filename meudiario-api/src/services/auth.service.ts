import { ConflictError } from '@/errors/ConflictError';
import { NotFoundError } from '@/errors/NotFoundError';
import { UnauthorizedError } from '@/errors/UnauthorizedError';
import { comparePassword, hashPassword } from '@/utils/hash';
import { signToken } from '@/utils/jwt';
import type { UsersRepository } from '@/repositories/users.repository';
import { toUserResponse } from '@/mappers/users.mapper';
import type { AuthResponse, UserResponse } from '@/models/users.model';
import type { LoginDTO, RegisterDTO } from '@/validators/auth.validator';

export class AuthService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async register(input: RegisterDTO): Promise<AuthResponse> {
        const existingUser = await this.usersRepository.findByEmailOrUsername(
            input.email,
            input.username,
        );

        if (existingUser) {
            throw new ConflictError('E-mail ou nome de usuário já cadastrado.');
        }

        const passwordHash = await hashPassword(input.password);

        const createdUser = await this.usersRepository.create({
            email: input.email,
            username: input.username,
            passwordHash,
        });

        return {
            token: signToken({ userId: createdUser.id }),
            user: toUserResponse(createdUser),
        };
    }

    async login(input: LoginDTO): Promise<AuthResponse> {
        const user = await this.usersRepository.findByEmail(input.email);

        if (!user || !user.isActive) {
            throw new UnauthorizedError('E-mail ou senha inválidos.');
        }

        const isPasswordValid = await comparePassword(input.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedError('E-mail ou senha inválidos.');
        }

        return {
            token: signToken({ userId: user.id }),
            user: toUserResponse(user),
        };
    }

    async getProfile(userId: string): Promise<UserResponse> {
        const user = await this.usersRepository.findById(userId);

        if (!user || !user.isActive) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        return toUserResponse(user);
    }
}
