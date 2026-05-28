import { AppError } from './AppError'

export class ConflictError extends AppError {
  constructor(message = 'Conflito com o estado atual do recurso.') {
    super(message, 409, 'CONFLICT')
  }
}
