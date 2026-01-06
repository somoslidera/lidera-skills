import { useState, useEffect } from 'react';
import { Target, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  getPerformanceGoals, 
  setPerformanceGoal, 
  deletePerformanceGoal,
  type PerformanceGoal 
} from '../../services/firebase';
import { fetchCollection } from '../../services/firebase';
import { toast } from '../../utils/toast';
import { Modal } from '../ui/Modal';

export const GoalsView = () => {
  const { currentCompany } = useCompany();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);
  
  const [formData, setFormData] = useState<{
    sectorId: string;
    roleId: string;
    level: 'Estratégico' | 'Tático' | 'Operacional' | 'Geral' | '';
    goalValue: number;
  }>({
    sectorId: '',
    roleId: '',
    level: '',
    goalValue: 9.0
  });

  useEffect(() => {
    loadData();
  }, [currentCompany?.id]);

  const loadData = async () => {
    if (!currentCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [goalsData, sectorsData, rolesData] = await Promise.all([
        getPerformanceGoals(currentCompany.id),
        fetchCollection('sectors', currentCompany.id),
        fetchCollection('roles', currentCompany.id)
      ]);
      
      setGoals(goalsData);
      setSectors(sectorsData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (goal?: PerformanceGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        sectorId: goal.sectorId || '',
        roleId: goal.roleId || '',
        level: (goal.level || '') as 'Estratégico' | 'Tático' | 'Operacional' | 'Geral' | '',
        goalValue: goal.goalValue
      });
    } else {
      setEditingGoal(null);
      setFormData({
        sectorId: '',
        roleId: '',
        level: '',
        goalValue: 9.0
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setFormData({
      sectorId: '',
      roleId: '',
      level: '',
      goalValue: 9.0
    });
  };

  const handleSave = async () => {
    if (!currentCompany?.id) {
      toast.error('Selecione uma empresa');
      return;
    }

    if (formData.goalValue < 0 || formData.goalValue > 10) {
      toast.error('A meta deve estar entre 0 e 10');
      return;
    }

    try {
      await setPerformanceGoal(currentCompany.id, {
        sectorId: formData.sectorId || undefined,
        roleId: formData.roleId || undefined,
        level: (formData.level || undefined) as 'Estratégico' | 'Tático' | 'Operacional' | 'Geral' | undefined,
        goalValue: formData.goalValue
      });

      toast.success(editingGoal ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!');
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast.error('Erro ao salvar meta');
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta meta?')) {
      return;
    }

    try {
      await deletePerformanceGoal(goalId);
      toast.success('Meta excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast.error('Erro ao excluir meta');
    }
  };

  const getGoalDescription = (goal: PerformanceGoal) => {
    const parts: string[] = [];
    if (goal.sectorId) {
      const sector = sectors.find(s => s.id === goal.sectorId);
      parts.push(`Setor: ${sector?.name || goal.sectorId}`);
    }
    if (goal.roleId) {
      const role = roles.find(r => r.id === goal.roleId);
      parts.push(`Cargo: ${role?.name || goal.roleId}`);
    }
    if (goal.level) {
      parts.push(`Nível: ${goal.level}`);
    }
    if (parts.length === 0) {
      return 'Meta Geral da Empresa';
    }
    return parts.join(' | ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-gray-500">Carregando metas...</div>
      </div>
    );
  }

  if (!currentCompany?.id) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-yellow-800 dark:text-yellow-200">
          Selecione uma empresa para gerenciar metas de desempenho.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Target size={20} /> Configuração de Metas de Desempenho
        </h3>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
          Configure metas de desempenho para a empresa, setores, cargos ou níveis hierárquicos.
          Metas mais específicas têm prioridade sobre metas gerais.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Nova Meta
        </button>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#121212]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Escopo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Meta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Atualizado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {goals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma meta configurada. Clique em "Nova Meta" para criar.
                  </td>
                </tr>
              ) : (
                goals.map((goal) => (
                  <tr key={goal.id} className="hover:bg-gray-50 dark:hover:bg-[#121212]">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {getGoalDescription(goal)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {goal.goalValue.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(goal.updatedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(goal)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingGoal ? 'Editar Meta' : 'Nova Meta'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Setor (Opcional)
            </label>
            <select
              value={formData.sectorId}
              onChange={(e) => setFormData({ ...formData, sectorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100"
            >
              <option value="">Nenhum (Meta Geral)</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cargo (Opcional)
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100"
            >
              <option value="">Nenhum (Meta Geral)</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nível Hierárquico (Opcional)
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as 'Estratégico' | 'Tático' | 'Operacional' | 'Geral' | '' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100"
            >
              <option value="">Nenhum (Meta Geral)</option>
              <option value="Estratégico">Estratégico</option>
              <option value="Tático">Tático</option>
              <option value="Operacional">Operacional</option>
              <option value="Geral">Geral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor da Meta (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.goalValue}
              onChange={(e) => setFormData({ ...formData, goalValue: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={18} className="inline mr-1" />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save size={18} className="inline mr-1" />
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
