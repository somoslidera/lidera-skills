import { useState, useEffect } from 'react';
import { getGoalValue, getPerformanceGoals, type PerformanceGoal } from '../services/firebase';
import { useCompany } from '../contexts/CompanyContext';

export const usePerformanceGoals = (
  sectorId?: string,
  roleId?: string,
  level?: string
) => {
  const { currentCompany } = useCompany();
  const [goalValue, setGoalValue] = useState<number>(9.0);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoals = async () => {
      if (!currentCompany?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allGoals = await getPerformanceGoals(
          currentCompany.id,
          sectorId,
          roleId,
          level
        );
        setGoals(allGoals);

        const value = await getGoalValue(
          currentCompany.id,
          sectorId,
          roleId,
          level
        );
        setGoalValue(value);
      } catch (error) {
        console.error('Erro ao carregar metas:', error);
        setGoalValue(9.0); // Fallback para valor padrão
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [currentCompany?.id, sectorId, roleId, level]);

  return { goalValue, goals, loading };
};
