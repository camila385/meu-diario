import { Router } from 'express';
import { socialController } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
    feedQuerySchema,
    userIdParamSchema,
    noteIdParamSchema,
    commentIdParamSchema,
    createCommentSchema,
    usernameParamSchema,
    followingListQuerySchema,
} from '@/validators/social.validator';

const router = Router();

/**
 * @swagger
 * /api/v1/feed:
 *   get:
 *     tags:
 *       - Social
 *     summary: Get public feed
 *     description: |-
 *       Retrieve paginated list of recent public notes from public users.
 *       Excludes authenticated user's own notes.
 *       Supports filtering by tag.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page (max 100)
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Optional tag filter (exact match)
 *     responses:
 *       "200":
 *         description: Feed retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       excerpt:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       author:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           avatarUrl:
 *                             type: string
 *                             nullable: true
 *                       likeCount:
 *                         type: integer
 *                       commentCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       "400":
 *         description: Invalid pagination parameters
 *       "401":
 *         description: Unauthorized (missing JWT)
 */
router.get('/feed', authenticate, validate(feedQuerySchema, 'query'), (req, res) =>
    socialController.getFeed(req, res),
);

/**
 * @swagger
 * /api/v1/notes/{id}/like:
 *   post:
 *     tags:
 *       - Social
 *     summary: Like a note
 *     description: Create a like on a public note from another user. Prevents self-likes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note ID
 *     responses:
 *       "200":
 *         description: Note liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     likeCount:
 *                       type: integer
 *       "400":
 *         description: Cannot like own note
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Note not found
 */
router.post('/notes/:id/like', authenticate, validate(noteIdParamSchema, 'params'), (req, res) =>
    socialController.likeNote(req, res),
);

/**
 * @swagger
 * /api/v1/notes/{id}/like:
 *   delete:
 *     tags:
 *       - Social
 *     summary: Unlike a note
 *     description: Remove a like from a note. Idempotent - succeeds even if note wasn't liked.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note ID
 *     responses:
 *       "200":
 *         description: Note unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     likeCount:
 *                       type: integer
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Note not found
 */
router.delete('/notes/:id/like', authenticate, validate(noteIdParamSchema, 'params'), (req, res) =>
    socialController.unlikeNote(req, res),
);

// ====== FOLLOW / UNFOLLOW USERS ======

/**
 * @swagger
 * /api/v1/users/{id}/follow:
 *   post:
 *     tags:
 *       - Social
 *     summary: Follow a user
 *     description: Create a follow relationship. Prevents self-follows. Idempotent.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to follow
 *     responses:
 *       "201":
 *         description: User followed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                       nullable: true
 *                     isPublic:
 *                       type: boolean
 *       "400":
 *         description: Cannot follow self
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: User not found
 */
router.post('/users/:id/follow', authenticate, validate(userIdParamSchema, 'params'), (req, res) =>
    socialController.followUser(req, res),
);

/**
 * @swagger
 * /api/v1/users/{id}/follow:
 *   delete:
 *     tags:
 *       - Social
 *     summary: Unfollow a user
 *     description: Remove a follow relationship. Idempotent - succeeds even if not following.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to unfollow
 *     responses:
 *       "200":
 *         description: User unfollowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: User not found
 */
router.delete(
    '/users/:id/follow',
    authenticate,
    validate(userIdParamSchema, 'params'),
    (req, res) => socialController.unfollowUser(req, res),
);

// ====== FOLLOWING / FOLLOWERS LISTS ======

/**
 * @swagger
 * /api/v1/users/@me/following:
 *   get:
 *     tags:
 *       - Social
 *     summary: Get list of users being followed
 *     description: Retrieve paginated list of users that the authenticated user follows.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       "200":
 *         description: Following list retrieved successfully
 *       "401":
 *         description: Unauthorized
 */
router.get(
    '/users/@me/following',
    authenticate,
    validate(followingListQuerySchema, 'query'),
    (req, res) => socialController.getFollowing(req, res),
);

/**
 * @swagger
 * /api/v1/users/@me/followers:
 *   get:
 *     tags:
 *       - Social
 *     summary: Get list of followers
 *     description: Retrieve paginated list of users following the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       "200":
 *         description: Followers list retrieved successfully
 *       "401":
 *         description: Unauthorized
 */
router.get(
    '/users/@me/followers',
    authenticate,
    validate(followingListQuerySchema, 'query'),
    (req, res) => socialController.getFollowers(req, res),
);

// ====== COMMENTS ======

/**
 * @swagger
 * /api/v1/notes/{id}/comments:
 *   get:
 *     tags:
 *       - Social
 *     summary: Get comments on a note
 *     description: Retrieve paginated list of comments on a public note, ordered oldest-first.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       "200":
 *         description: Comments retrieved successfully
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Note not found
 */
router.get('/notes/:id/comments', authenticate, validate(noteIdParamSchema, 'params'), (req, res) =>
    socialController.getComments(req, res),
);

/**
 * @swagger
 * /api/v1/notes/{id}/comments:
 *   post:
 *     tags:
 *       - Social
 *     summary: Create a comment on a note
 *     description: Post a comment (max 500 chars) on a public note.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 500
 *                 description: Comment text
 *             required:
 *               - content
 *     responses:
 *       "201":
 *         description: Comment created successfully
 *       "400":
 *         description: Invalid comment (e.g., exceeds 500 chars)
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Note not found
 */
router.post(
    '/notes/:id/comments',
    authenticate,
    validate(noteIdParamSchema, 'params'),
    validate(createCommentSchema, 'body'),
    (req, res) => socialController.createComment(req, res),
);

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   delete:
 *     tags:
 *       - Social
 *     summary: Delete a comment
 *     description: Delete a comment. Only the comment author or admin can delete.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment ID
 *     responses:
 *       "204":
 *         description: Comment deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (not the comment author)
 *       "404":
 *         description: Comment not found
 */
router.delete('/comments/:id', authenticate, validate(commentIdParamSchema, 'params'), (req, res) =>
    socialController.deleteComment(req, res),
);

// ====== COMMENT LIKES ======

/**
 * @swagger
 * /api/v1/comments/{id}/like:
 *   post:
 *     tags:
 *       - Social
 *     summary: Like a comment
 *     description: Create a like on a comment. Prevents double-like.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment ID
 *     responses:
 *       "200":
 *         description: Comment liked successfully
 *       "400":
 *         description: Invalid request
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Comment not found
 */
router.post(
    '/comments/:id/like',
    authenticate,
    validate(commentIdParamSchema, 'params'),
    (req, res) => socialController.likeComment(req, res),
);

/**
 * @swagger
 * /api/v1/comments/{id}/like:
 *   delete:
 *     tags:
 *       - Social
 *     summary: Unlike a comment
 *     description: Remove a like from a comment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment ID
 *     responses:
 *       "200":
 *         description: Comment unliked successfully
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Comment not found
 */
router.delete(
    '/comments/:id/like',
    authenticate,
    validate(commentIdParamSchema, 'params'),
    (req, res) => socialController.unlikeComment(req, res),
);

// ====== PUBLIC PROFILES ======

/**
 * @swagger
 * /api/v1/users/username/{username}:
 *   get:
 *     tags:
 *       - Social
 *     summary: Get public user profile
 *     description: Retrieve public profile information for a user. Returns 404 if user is private.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the profile to view
 *     responses:
 *       "200":
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     username:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                       nullable: true
 *                     followerCount:
 *                       type: integer
 *                     followingCount:
 *                       type: integer
 *                     publicNoteCount:
 *                       type: integer
 *                     isFollowing:
 *                       type: boolean
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: User not found or profile is private
 */
router.get(
    '/users/username/:username',
    authenticate,
    validate(usernameParamSchema, 'params'),
    (req, res) => socialController.getPublicProfile(req, res),
);

export default router;
