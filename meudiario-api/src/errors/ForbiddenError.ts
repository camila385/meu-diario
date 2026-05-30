import { AppError } from './AppError';

export class ForbiddenError extends AppError {
    constructor(message = 'Acesso negado.') {
        super(message, 403, 'FORBIDDEN');
    }
}
