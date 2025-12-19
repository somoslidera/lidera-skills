/**
 * Centralized error handling utility
 * Provides consistent error messages and logging
 */

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export class ErrorHandler {
  /**
   * Handles Firebase errors and converts them to user-friendly messages
   */
  static handleFirebaseError(error: unknown): AppError {
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      
      switch (firebaseError.code) {
        case 'permission-denied':
          return {
            code: 'PERMISSION_DENIED',
            message: 'Você não tem permissão para realizar esta ação.',
            details: firebaseError
          };
        case 'unauthenticated':
          return {
            code: 'UNAUTHENTICATED',
            message: 'Você precisa estar autenticado para realizar esta ação.',
            details: firebaseError
          };
        case 'not-found':
          return {
            code: 'NOT_FOUND',
            message: 'Registro não encontrado.',
            details: firebaseError
          };
        case 'already-exists':
          return {
            code: 'ALREADY_EXISTS',
            message: 'Este registro já existe.',
            details: firebaseError
          };
        case 'failed-precondition':
          return {
            code: 'FAILED_PRECONDITION',
            message: 'Operação não pode ser realizada no momento.',
            details: firebaseError
          };
        case 'resource-exhausted':
          return {
            code: 'RESOURCE_EXHAUSTED',
            message: 'Limite de recursos excedido. Tente novamente mais tarde.',
            details: firebaseError
          };
        default:
          return {
            code: firebaseError.code || 'UNKNOWN_ERROR',
            message: firebaseError.message || 'Ocorreu um erro inesperado.',
            details: firebaseError
          };
      }
    }

    if (error instanceof Error) {
      return {
        code: 'ERROR',
        message: error.message || 'Ocorreu um erro inesperado.',
        details: error
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Ocorreu um erro inesperado.',
      details: error
    };
  }

  /**
   * Logs error to console (and potentially to error tracking service in production)
   */
  static logError(error: AppError, context?: string): void {
    const logMessage = context 
      ? `[${context}] ${error.code}: ${error.message}`
      : `${error.code}: ${error.message}`;
    
    console.error(logMessage, error.details);
    
    // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
  }

  /**
   * Gets user-friendly error message
   */
  static getUserMessage(error: unknown): string {
    const appError = this.handleFirebaseError(error);
    return appError.message;
  }
}

