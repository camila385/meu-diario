import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import { UnauthorizedError } from '@/errors/UnauthorizedError';

declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Token não fornecido.'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = verifyToken(token);
        req.userId = payload.userId;
        next();
    } catch {
        next(new UnauthorizedError('Token inválido ou expirado.'));
    }
};
