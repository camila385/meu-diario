import { z } from 'zod';
import { emailSchema, passwordSchema } from './common.validator';

const usernameSchema = z
    .string()
    .trim()
    .min(3, 'O nome de usuário deve ter no mínimo 3 caracteres.')
    .max(30, 'O nome de usuário deve ter no máximo 30 caracteres.')
    .regex(/^[A-Za-z0-9_]+$/, 'O nome de usuário pode conter apenas letras, números e underscore.');

export const registerSchema = z.object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

export const authParamsSchema = z.object({
    id: z.string().uuid('ID inválido.'),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type AuthParamsDTO = z.infer<typeof authParamsSchema>;
