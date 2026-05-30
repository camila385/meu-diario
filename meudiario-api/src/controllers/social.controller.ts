import type { Request, Response } from 'express'
import type { SocialService } from '@/services/social.service'
import { sendSuccess } from '@/utils/response'

export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ====== FEED ======

  async getFeed(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { page, limit, tag } = req.query as any
    const feedItems = await this.socialService.getFeed(userId, { page, limit, tag })
    sendSuccess(res, feedItems.data, 200, feedItems.meta)
  }

  // ====== FOLLOWS ======

  async followUser(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { id: targetUserId } = req.params as any
    const result = await this.socialService.followUser(userId, targetUserId)
    sendSuccess(res, result, 201)
  }

  async unfollowUser(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { id: targetUserId } = req.params as any
    await this.socialService.unfollowUser(userId, targetUserId)
    sendSuccess(res, null, 204)
  }

  async getFollowing(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { page, limit } = req.query as any
    const result = await this.socialService.getFollowing(userId, { page, limit })
    sendSuccess(res, result.data, 200, result.meta)
  }

  async getFollowers(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { page, limit } = req.query as any
    const result = await this.socialService.getFollowers(userId, { page, limit })
    sendSuccess(res, result.data, 200, result.meta)
  }

  // ====== LIKES ======

  async likeNote(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { id: noteId } = req.params as any
    const result = await this.socialService.likeNote(userId, noteId)
    sendSuccess(res, result, 200)
  }

  async unlikeNote(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { id: noteId } = req.params as any
    const result = await this.socialService.unlikeNote(userId, noteId)
    sendSuccess(res, result, 200)
  }

  // ====== COMMENTS ======

  async getComments(req: Request, res: Response): Promise<void> {
    const { id: noteId } = req.params as any
    const { page, limit } = req.query as any
    const result = await this.socialService.getComments(noteId, { page, limit })
    sendSuccess(res, result.data, 200, result.meta)
  }

  async createComment(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { id: noteId } = req.params as any
    const { content } = req.body as any
    const result = await this.socialService.createComment(userId, noteId, content)
    sendSuccess(res, result, 201)
  }

  async deleteComment(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { id: commentId } = req.params as any
    await this.socialService.deleteComment(userId, commentId)
    sendSuccess(res, null, 204)
  }

  // ====== REPORTS ======

  async reportNote(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { id: noteId } = req.params as any
    const { reason } = req.body as any
    const result = await this.socialService.reportContent(userId, 'note', noteId, reason)
    sendSuccess(res, result, 201)
  }

  async reportComment(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { id: commentId } = req.params as any
    const { reason } = req.body as any
    const result = await this.socialService.reportContent(userId, 'comment', commentId, reason)
    sendSuccess(res, result, 201)
  }

  // ====== PROFILES ======

  async getPublicProfile(req: Request, res: Response): Promise<void> {
    const userId = req.userId!
    const { username } = req.params as any
    const result = await this.socialService.getPublicProfile(userId, username)
    sendSuccess(res, result, 200)
  }
}
