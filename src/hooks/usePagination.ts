import { useState, useCallback, useRef } from 'react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export interface PaginationState {
  items: any[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
}

export interface PaginationOptions {
  pageSize?: number;
  initialLoad?: number; // Quantidade inicial a carregar
}

/**
 * Hook para gerenciar paginação de dados do Firestore
 */
export const usePagination = (options: PaginationOptions = {}) => {
  const { pageSize = 20, initialLoad = 20 } = options;
  
  const [state, setState] = useState<PaginationState>({
    items: [],
    lastDoc: null,
    hasMore: true,
    loading: false,
    error: null,
  });

  const loadMoreRef = useRef(false); // Previne múltiplas chamadas simultâneas

  /**
   * Reseta a paginação
   */
  const reset = useCallback(() => {
    setState({
      items: [],
      lastDoc: null,
      hasMore: true,
      loading: false,
      error: null,
    });
    loadMoreRef.current = false;
  }, []);

  /**
   * Carrega mais itens
   */
  const loadMore = useCallback(
    async (
      fetchFn: (
        lastDoc: QueryDocumentSnapshot<DocumentData> | null,
        limit: number
      ) => Promise<{
        items: any[];
        lastDoc: QueryDocumentSnapshot<DocumentData> | null;
        hasMore: boolean;
      }>
    ) => {
      if (loadMoreRef.current || state.loading || !state.hasMore) {
        return;
      }

      loadMoreRef.current = true;
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const limit = state.items.length === 0 ? initialLoad : pageSize;
        const result = await fetchFn(state.lastDoc, limit);

        setState((prev) => ({
          items: [...prev.items, ...result.items],
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
          loading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Erro desconhecido'),
        }));
      } finally {
        loadMoreRef.current = false;
      }
    },
    [state.lastDoc, state.loading, state.hasMore, state.items.length, pageSize, initialLoad]
  );

  /**
   * Adiciona um novo item ao início da lista (útil após criar um registro)
   */
  const prependItem = useCallback((item: any) => {
    setState((prev) => ({
      ...prev,
      items: [item, ...prev.items],
    }));
  }, []);

  /**
   * Atualiza um item existente na lista
   */
  const updateItem = useCallback((id: string, updates: Partial<any>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  /**
   * Remove um item da lista
   */
  const removeItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  return {
    ...state,
    loadMore,
    reset,
    prependItem,
    updateItem,
    removeItem,
  };
};

