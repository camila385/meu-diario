import { z } from 'zod';

const usernameSchema = z
    .string()
    .trim()
    .min(3, 'Username deve ter no mínimo 3 caracteres.')
    .max(20, 'Username não pode exceder 20 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore.');

export const updateProfileSchema = z.object({
    username: usernameSchema.optional(),
    avatarUrl: z
        .url({ error: 'URL de avatar inválida.' })
        .nullable()
        .optional(),
    isPublic: z.boolean().optional(),
});

export const usernameParamSchema = z.object({
    username: usernameSchema,
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type UsernameParam = z.infer<typeof usernameParamSchema>;
