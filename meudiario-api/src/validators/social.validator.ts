import { z } from 'zod'
import { paginationSchema, uuidParamSchema } from './common.validator'

// ====== Query Schemas ======

export const feedQuerySchema = paginationSchema.extend({
  tag: z.string().trim().min(1).max(50).optional(),
})

export type FeedQuery = z.infer<typeof feedQuerySchema>

export const followingListQuerySchema = paginationSchema

export type FollowingListQuery = z.infer<typeof followingListQuerySchema>

// ====== Request Body Schemas ======

export const followUserSchema = z.object({
  // No body required for PUT/POST follow
})

export type FollowUserRequest = z.infer<typeof followUserSchema>

export const unfollowUserSchema = z.object({
  // No body required for DELETE unfollow
})

export type UnfollowUserRequest = z.infer<typeof unfollowUserSchema>

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'O comentário é obrigatório.')
    .max(500, 'O comentário não pode exceder 500 caracteres.'),
})

export type CreateCommentRequest = z.infer<typeof createCommentSchema>

export const reportSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'harassment', 'other'], {
    message: 'Motivo inválido. Use: spam, inappropriate, harassment, ou other.',
  }),
})

export type ReportRequest = z.infer<typeof reportSchema>

// ====== Param Schemas ======

export const userIdParamSchema = uuidParamSchema

export type UserIdParam = z.infer<typeof userIdParamSchema>

export const noteIdParamSchema = uuidParamSchema

export type NoteIdParam = z.infer<typeof noteIdParamSchema>

export const commentIdParamSchema = uuidParamSchema

export type CommentIdParam = z.infer<typeof commentIdParamSchema>

export const usernameParamSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username é obrigatório.')
    .max(20, 'Username não pode exceder 20 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore.'),
})

export type UsernameParam = z.infer<typeof usernameParamSchema>

// ====== Combined Route Schemas ======

export const likeNoteSchema = z.object({
  // No body required for POST like
})

export type LikeNoteRequest = z.infer<typeof likeNoteSchema>

export const unlikeNoteSchema = z.object({
  // No body required for DELETE unlike
})

export type UnlikeNoteRequest = z.infer<typeof unlikeNoteSchema>
