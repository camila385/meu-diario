import { Router } from 'express';
import { usersService } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { updateProfileSchema, usernameParamSchema } from '@/validators/users.validator';
import { uuidParamSchema } from '@/validators/common.validator';
import type { UpdateProfileRequest, UsernameParam } from '@/validators/users.validator';
import type { UuidParam } from '@/validators/common.validator';
import { sendSuccess } from '@/utils/response';

const router = Router();

router.get('/me', authenticate, async (req, res) => {
    const user = await usersService.getUserById(req.userId!);
    sendSuccess(res, user);
});

router.get('/me/following', authenticate, async (req, res) => {
    const users = await usersService.getFollowing(req.userId!);
    sendSuccess(res, users);
});

router.get('/me/followers', authenticate, async (req, res) => {
    const users = await usersService.getFollowers(req.userId!);
    sendSuccess(res, users);
});

router.get('/me/requests', authenticate, async (req, res) => {
    const users = await usersService.getFollowRequests(req.userId!);
    sendSuccess(res, users);
});

router.get('/username/:username', authenticate, validate(usernameParamSchema, 'params'), async (req, res) => {
    const { username } = req.params as unknown as UsernameParam;
    const user = await usersService.getUserByUsername(username);
    sendSuccess(res, user);
});

router.get('/:id', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id } = req.params as unknown as UuidParam;
    const user = await usersService.getUserById(id);
    sendSuccess(res, user);
});

router.post('/:id/follow', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id: followingId } = req.params as unknown as UuidParam;
    const result = await usersService.follow(req.userId!, followingId);
    sendSuccess(res, result);
});

router.post('/me/requests/:id/accept', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id: requesterId } = req.params as unknown as UuidParam;
    await usersService.acceptFollow(req.userId!, requesterId);
    sendSuccess(res, null, 204);
});

router.patch('/me', authenticate, validate(updateProfileSchema, 'body'), async (req, res) => {
    const updated = await usersService.update(req.userId!, req.body as UpdateProfileRequest);
    sendSuccess(res, updated);
});

router.delete('/me', authenticate, async (req, res) => {
    await usersService.deactivate(req.userId!);
    sendSuccess(res, null, 204);
});

router.delete('/me/requests/:id', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id: requesterId } = req.params as unknown as UuidParam;
    await usersService.rejectFollow(req.userId!, requesterId);
    sendSuccess(res, null, 204);
});

router.delete('/:id/follow', authenticate, validate(uuidParamSchema, 'params'), async (req, res) => {
    const { id: followingId } = req.params as unknown as UuidParam;
    await usersService.unfollow(req.userId!, followingId);
    sendSuccess(res, null, 204);
});

export default router;
