import type { SocialRepository } from '@/repositories/social.repository'
import type { NotesRepository } from '@/repositories/notes.repository'
import type { UsersRepository } from '@/repositories/users.repository'
import {
  computeExcerpt,
  toISO8601,
  type FeedItemResponse,
  type FeedResponse,
  type FollowUserResponse,
  type FollowListResponse,
  type CommentDetailResponse,
  type CommentListResponse,
  type CreateCommentResponse,
  type ProfileDetailResponse,
  type ReportResponse,
  type LikeCountResponse,
  type PaginationMeta,
} from '@/models/social.model'
import { ConflictError, NotFoundError, ForbiddenError } from '@/errors'

export class SocialService {
  constructor(
    private readonly socialRepository: SocialRepository,
    private readonly notesRepository: NotesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  private logOperation(operation: string, payload: Record<string, string>): void {
    console.log(`[social] ${operation}`, payload)
  }

  // ====== FEED (T018) ======

  async getFeed(
    userId: string,
    query: { page?: number; limit?: number; tag?: string },
  ): Promise<FeedResponse> {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100) // Cap at 100
    const tag = query.tag

    const { notes, total } = await this.socialRepository.getFeedNotes(userId, page, limit, tag)

    const data: FeedItemResponse[] = notes.map((note) => ({
      id: note.id,
      title: note.title,
      excerpt: computeExcerpt(note.content),
      tags: note.noteTags.map((link) => link.tag.name),
      author: {
        id: note.user.id,
        username: note.user.username,
        avatarUrl: note.user.avatarUrl,
      },
      likeCount: note.likeCount,
      commentCount: note.commentCount,
      createdAt: toISO8601(note.createdAt),
    }))

    return {
      success: true,
      data,
      meta: { page, limit, total },
    }
  }

  // ====== FOLLOWS (T019-T020) ======

  async followUser(userId: string, targetUserId: string): Promise<FollowUserResponse> {
    // Prevent self-follow (400 error)
    if (userId === targetUserId) {
      throw new ConflictError('Você não pode seguir a si mesmo.')
    }

    // Verify target user exists
    const targetUser = await this.usersRepository.findById(targetUserId)
    if (!targetUser) {
      throw new NotFoundError('Usuário não encontrado.')
    }

    // Upsert follow (idempotent)
    await this.socialRepository.upsertFollow(userId, targetUserId)
    this.logOperation('follow', { userId, targetUserId })

    return {
      id: targetUser.id,
      username: targetUser.username,
      avatarUrl: targetUser.avatarUrl,
      isPublic: targetUser.isPublic,
    }
  }

  async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    // Verify target user exists
    const targetUser = await this.usersRepository.findById(targetUserId)
    if (!targetUser) {
      throw new NotFoundError('Usuário não encontrado.')
    }

    // Delete follow (idempotent - doesn't error if not following)
    await this.socialRepository.deleteFollow(userId, targetUserId)
    this.logOperation('unfollow', { userId, targetUserId })
  }

  async getFollowing(userId: string, query: { page?: number; limit?: number }): Promise<FollowListResponse> {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)

    const { users, total } = await this.socialRepository.getFollowing(userId, page, limit)

    const data: FollowUserResponse[] = users.map((user) => ({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isPublic: user.isPublic,
    }))

    return { success: true, data, meta: { page, limit, total } }
  }

  async getFollowers(userId: string, query: { page?: number; limit?: number }): Promise<FollowListResponse> {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)

    const { users, total } = await this.socialRepository.getFollowers(userId, page, limit)

    const data: FollowUserResponse[] = users.map((user) => ({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isPublic: user.isPublic,
    }))

    return { success: true, data, meta: { page, limit, total } }
  }

  // ====== LIKES (T021-T022) ======

  async likeNote(userId: string, noteId: string): Promise<LikeCountResponse> {
    // Verify note exists and is public
    const note = await this.notesRepository.getById(noteId)
    if (!note || !note.isPublic) {
      throw new NotFoundError('Nota não encontrada.')
    }

    // Prevent self-like (400 error)
    if (note.userId === userId) {
      throw new ConflictError('Você não pode dar like na sua própria nota.')
    }

    // Upsert like (idempotent)
    await this.socialRepository.upsertLike(userId, noteId)
    this.logOperation('like', { userId, noteId })

    const likeCount = await this.socialRepository.getLikeCount(noteId)

    return { success: true, data: { likeCount } }
  }

  async unlikeNote(userId: string, noteId: string): Promise<LikeCountResponse> {
    // Verify note exists
    const note = await this.notesRepository.getById(noteId)
    if (!note) {
      throw new NotFoundError('Nota não encontrada.')
    }

    // Delete like (idempotent)
    await this.socialRepository.deleteLike(userId, noteId)
    this.logOperation('unlike', { userId, noteId })

    const likeCount = await this.socialRepository.getLikeCount(noteId)

    return { success: true, data: { likeCount } }
  }

  // ====== COMMENTS (T023-T025) ======

  async getComments(noteId: string, query: { page?: number; limit?: number }): Promise<CommentListResponse> {
    // Verify note exists and is public
    const note = await this.notesRepository.getById(noteId)
    if (!note || !note.isPublic) {
      throw new NotFoundError('Nota não encontrada.')
    }

    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)

    const { comments, total } = await this.socialRepository.getComments(noteId, page, limit)

    const data: CommentDetailResponse[] = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
      },
      createdAt: toISO8601(comment.createdAt),
    }))

    return { success: true, data, meta: { page, limit, total } }
  }

  async createComment(userId: string, noteId: string, content: string): Promise<CreateCommentResponse> {
    // Verify note exists and is public
    const note = await this.notesRepository.getById(noteId)
    if (!note || !note.isPublic) {
      throw new NotFoundError('Nota não encontrada.')
    }

    // Validate content length (max 500 chars)
    if (content.length > 500) {
      throw new ConflictError('O comentário não pode exceder 500 caracteres.')
    }

    // Create comment
    const comment = await this.socialRepository.createComment(userId, noteId, content)
    this.logOperation('comment:create', { userId, noteId })

    return {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        author: {
          id: comment.user.id,
          username: comment.user.username,
          avatarUrl: comment.user.avatarUrl,
        },
        createdAt: toISO8601(comment.createdAt),
      },
    }
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    // Get comment to verify ownership
    const comment = await this.notesRepository.getCommentById(commentId)
    if (!comment) {
      throw new NotFoundError('Comentário não encontrado.')
    }

    // Verify ownership (403 if not owner)
    if (comment.userId !== userId) {
      throw new ForbiddenError('Você só pode deletar seus próprios comentários.')
    }

    // Delete comment
    await this.socialRepository.deleteComment(commentId)
    this.logOperation('comment:delete', { userId, commentId })
  }

  // ====== REPORTS (T026) ======

  async reportContent(
    userId: string,
    targetType: 'note' | 'comment',
    targetId: string,
    reason: string,
  ): Promise<ReportResponse> {
    // Verify content exists
    if (targetType === 'note') {
      const note = await this.notesRepository.getById(targetId)
      if (!note) {
        throw new NotFoundError('Nota não encontrada.')
      }
    } else if (targetType === 'comment') {
      const comment = await this.notesRepository.getCommentById(targetId)
      if (!comment) {
        throw new NotFoundError('Comentário não encontrado.')
      }
    }

    // Upsert report (dedup on unique constraint)
    const report = await this.socialRepository.upsertReport(userId, targetType, targetId, reason)
    this.logOperation('report', { userId, targetType, targetId })

    return {
      success: true,
      data: {
        id: report.id,
        createdAt: toISO8601(report.createdAt),
      },
    }
  }

  // ====== PUBLIC PROFILES (T027) ======

  async getPublicProfile(userId: string, username: string): Promise<ProfileDetailResponse> {
    // Get user by username
    const user = await this.socialRepository.getUserByUsername(username)
    if (!user || !user.isPublic) {
      throw new NotFoundError('Perfil não encontrado.')
    }

    // Get engagement stats
    const [followerCount, followingCount, publicNoteCount, isFollowing] = await Promise.all([
      this.socialRepository.getFollowerCount(user.id),
      this.socialRepository.getFollowingCount(user.id),
      this.socialRepository.getPublicNoteCount(user.id),
      this.socialRepository.isUserFollowing(userId, user.id),
    ])

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isPublic: user.isPublic,
      followerCount,
      followingCount,
      publicNoteCount,
      isFollowing,
    }
  }
}
