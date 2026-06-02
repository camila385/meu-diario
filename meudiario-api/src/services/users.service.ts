import { ConflictError, ForbiddenError, NotFoundError } from '@/errors';
import type { UsersRepository } from '@/repositories/users.repository';
import { FollowStatus } from '@/generated/prisma';
import type { UserResponse } from '@/models/users.model';
import type { UpdateProfileRequest } from '@/validators/users.validator';
import { toUserResponse, toUserSummaryResponse } from '@/mappers/users.mapper';

export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async getUserById(id: string): Promise<UserResponse> {
        const user = await this.usersRepository.findById(id);
        if (!user || !user.isActive) {
            throw new NotFoundError('Usuário não encontrado.');
        }
        return toUserResponse(user);
    }

    async getUserByUsername(username: string): Promise<UserResponse> {
        const user = await this.usersRepository.findByUsername(username);
        if (!user || !user.isActive) {
            throw new NotFoundError('Usuário não encontrado.');
        }
        return toUserResponse(user);
    }

    async update(userId: string, input: UpdateProfileRequest): Promise<UserResponse> {
        const user = await this.usersRepository.findById(userId);
        if (!user || !user.isActive) {
            throw new NotFoundError('Usuário não encontrado.');
        }
        if (input.username) {
            const existing = await this.usersRepository.findByUsername(input.username);
            if (existing && existing.id !== userId) {
                throw new ConflictError('Nome de usuário já cadastrado.');
            }
        }
        const updated = await this.usersRepository.updateProfile(userId, input);
        return toUserResponse(updated);
    }

    async deactivate(userId: string): Promise<void> {
        const user = await this.usersRepository.findById(userId);
        if (!user || !user.isActive) {
            throw new NotFoundError('Usuário não encontrado.');
        }
        await this.usersRepository.deactivateAccount(userId);
    }

    async follow(followerId: string, followingId: string): Promise<{ status: FollowStatus }> {
        if (followerId === followingId) {
            throw new ForbiddenError('Você não pode seguir a si mesmo.');
        }
        const target = await this.usersRepository.findById(followingId);
        if (!target || !target.isActive) {
            throw new NotFoundError('Usuário não encontrado.');
        }
        const status = target.isPublic ? FollowStatus.ACCEPTED : FollowStatus.PENDING;
        await this.usersRepository.createFollowRequest(followerId, followingId, status);
        return { status };
    }

    async unfollow(followerId: string, followingId: string): Promise<void> {
        await this.usersRepository.deleteFollow(followerId, followingId);
    }

    async acceptFollow(currentUserId: string, requesterId: string): Promise<void> {
        const follow = await this.usersRepository.findById(requesterId);
        if (!follow) {
            throw new NotFoundError('Solicitação não encontrada.');
        }
        await this.usersRepository.acceptFollowRequest(requesterId, currentUserId);
    }

    async rejectFollow(currentUserId: string, requesterId: string): Promise<void> {
        await this.usersRepository.deleteFollow(requesterId, currentUserId);
    }

    async getFollowRequests(userId: string) {
        const users = await this.usersRepository.getPendingRequests(userId);
        return users.map(toUserSummaryResponse);
    }

    async getFollowing(userId: string) {
        const users = await this.usersRepository.getFollowing(userId);
        return users.map(toUserSummaryResponse);
    }

    async getFollowers(userId: string) {
        const users = await this.usersRepository.getFollowers(userId);
        return users.map(toUserSummaryResponse);
    }
}
