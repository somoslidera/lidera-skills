import { createAuditLog } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

/**
 * Hook para criar audit logs facilmente
 */
export const useAuditLogger = () => {
  const { user, userRole } = useAuth();
  const { currentCompany } = useCompany();

  const logAction = async (
    action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'import',
    entityType: string,
    entityId: string,
    options?: {
      entityName?: string;
      changes?: Record<string, { old?: any; new?: any }>;
      metadata?: Record<string, any>;
    }
  ) => {
    if (!user || !currentCompany?.id) {
      return; // Não loga se não houver usuário ou empresa
    }

    try {
      await createAuditLog(
        user.uid,
        user.email || '',
        action,
        entityType,
        entityId,
        currentCompany.id,
        {
          userName: user.displayName || userRole?.email,
          ...options
        }
      );
    } catch (error) {
      // Silenciosamente falha - não queremos que logs quebrem o fluxo
      console.error('Erro ao criar audit log:', error);
    }
  };

  return { logAction };
};
