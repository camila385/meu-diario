import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
    constructor(message = 'Não autenticado.') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
