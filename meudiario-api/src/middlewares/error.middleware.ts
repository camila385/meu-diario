import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/errors/AppError';

export const errorMiddleware = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details ?? [],
            },
        });
        return;
    }

    console.error('[UNHANDLED ERROR]', err);

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Erro interno do servidor.',
            details: [],
        },
    });
};
