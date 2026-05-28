import { Router } from 'express'
import { authController } from '@/controllers/auth.controller'
import { authenticate } from '@/middlewares/auth.middleware'
import { validate } from '@/middlewares/validate.middleware'
import { loginSchema, registerSchema } from '@/validators/auth.validator'

const router = Router()

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Criar uma nova conta
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 */
router.post('/register', validate(registerSchema), authController.register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar um usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */
router.post('/login', validate(loginSchema), authController.login)

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obter o perfil autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário autenticado
 */
router.get('/me', authenticate, authController.me)

export default router
