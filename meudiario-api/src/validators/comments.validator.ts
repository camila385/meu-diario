import { z } from 'zod';

export const createCommentSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, 'O comentário é obrigatório.')
        .max(500, 'O comentário não pode exceder 500 caracteres.'),
});

export type CreateCommentRequest = z.infer<typeof createCommentSchema>;
