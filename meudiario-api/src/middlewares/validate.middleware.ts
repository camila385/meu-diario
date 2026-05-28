import { Request, Response, NextFunction } from 'express'
import { type ZodSchema } from 'zod'

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
    (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[source])

        if (!result.success) {
            const details = result.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }))

            _res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Dados de entrada inválidos.',
                    details,
                },
            })
            return
        }

        req[source] = result.data
        next()
    }
