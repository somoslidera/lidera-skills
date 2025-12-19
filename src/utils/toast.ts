import { toast as sonnerToast } from 'sonner';
import { ErrorHandler } from './errorHandler';

/**
 * Centralized toast notification utility
 * Provides consistent toast messages throughout the application
 */

export const toast = {
  /**
   * Show success message
   */
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show error message
   */
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Show warning message
   */
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show info message
   */
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show loading message (returns dismiss function)
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * Show promise toast (for async operations)
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  /**
   * Handle error and show toast
   */
  handleError: (error: unknown, context?: string) => {
    const appError = ErrorHandler.handleFirebaseError(error);
    ErrorHandler.logError(appError, context);
    toast.error(appError.message);
  },
};

/**
 * Confirmation dialog using toast (alternative to native confirm)
 * Note: For critical confirmations, consider using a proper modal component
 */
export const confirmAction = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  // For now, we'll use native confirm but with better styling
  // TODO: Replace with a custom confirmation modal component
  if (window.confirm(message)) {
    onConfirm();
  } else {
    onCancel?.();
  }
};

