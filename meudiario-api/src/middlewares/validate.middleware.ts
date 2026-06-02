import { Request, Response, NextFunction } from 'express';
import { type ZodType } from 'zod';

export const validate = (schema: ZodType, source: 'body' | 'query' | 'params' = 'body') =>
    (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const details = result.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));

            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Dados de entrada inválidos.',
                    details,
                },
            });
            return;
        }

        Object.defineProperty(req, source, {
            value: result.data,
            writable: true,
            configurable: true,
            enumerable: true,
        });
        next();
    };
