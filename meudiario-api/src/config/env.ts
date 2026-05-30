import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(10),
    JWT_EXPIRES_IN: z.string().default('7d'),
    PORT: z.coerce.number().default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Variáveis de ambiente inválidas:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
