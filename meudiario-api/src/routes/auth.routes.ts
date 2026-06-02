import { Router } from 'express';
import { authService } from '@/composition-root';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { loginSchema, registerSchema } from '@/validators/auth.validator';
import { sendSuccess } from '@/utils/response';

const router = Router();

router.get('/me', authenticate, async (req, res) => {
    const profile = await authService.getProfile(req.userId!);
    sendSuccess(res, profile);
});

router.post('/register', validate(registerSchema), async (req, res) => {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201);
});

router.post('/login', validate(loginSchema), async (req, res) => {
    const result = await authService.login(req.body);
    sendSuccess(res, result);
});

export default router;
