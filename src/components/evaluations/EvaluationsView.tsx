import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, FileText, Search, Download, Filter, Save, 
  Calendar, Loader2, CheckSquare, Square, Edit, X
} from 'lucide-react';
import { collection, addDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCompany } from '../../contexts/CompanyContext';
import Papa from 'papaparse';
import { Modal } from '../ui/Modal';
import { toast } from '../../utils/toast';
import { ErrorHandler } from '../../utils/errorHandler';
import { useAuditLogger } from '../../utils/auditLogger';

// --- Interfaces para Tipagem ---
interface Employee {
  id: string;
  name: string;
  role: string;
  sector: string;
  companyId: string;
  status?: string;
}

interface Role {
  id: string;
  name: string;
  level: 'Estratégico' | 'Tático' | 'Operacional' | 'Colaborador' | 'Líder';
}

interface Criteria {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface EvaluationData {
  id: string;
  employeeName: string;
  role: string;
  sector: string;
  type: string;
  date: string;
  average: number;
  details: Record<string, number>;
}

// --- Subcomponente: Formulário de Avaliação (Mantido igual, apenas tipos ajustados) ---
const EvaluationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { currentCompany, companies } = useCompany();
  const { logAction } = useAuditLogger();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [criteriaList, setCriteriaList] = useState<Criteria[]>([]);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [formType, setFormType] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [observations, setObservations] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [highlightReason, setHighlightReason] = useState('');
  
  const [evalMonth, setEvalMonth] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7); 
  });

  const [loading, setLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(currentCompany?.id === 'all' ? '' : currentCompany?.id || '');
  const [sortOrder, setSortOrder] = useState<'name' | 'sector'>('sector');
  const [searchTerm, setSearchTerm] = useState('');
  const [existingEvaluations, setExistingEvaluations] = useState<Set<string>>(new Set());

  // Carregar avaliações existentes para o mês selecionado
  useEffect(() => {
    const loadExistingEvaluations = async () => {
      if (!selectedCompanyId || !evalMonth) {
        setExistingEvaluations(new Set());
        return;
      }
      
      try {
        const monthStart = `${evalMonth}-01`;
        const monthEnd = `${evalMonth}-31`;
        
        const evalQuery = query(
          collection(db, 'evaluations'),
          where("companyId", "==", selectedCompanyId),
          where("date", ">=", monthStart),
          where("date", "<=", monthEnd)
        );
        
        const evalSnap = await getDocs(evalQuery);
        const evaluatedEmployeeIds = new Set<string>();
        
        evalSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.employeeId) {
            evaluatedEmployeeIds.add(data.employeeId);
          } else if (data.employeeName) {
            // Fallback: usar nome se não tiver ID
            const emp = employees.find(e => e.name === data.employeeName);
            if (emp) evaluatedEmployeeIds.add(emp.id);
          }
        });
        
        setExistingEvaluations(evaluatedEmployeeIds);
      } catch (error) {
        console.error("Erro ao carregar avaliações existentes", error);
      }
    };
    
    loadExistingEvaluations();
  }, [selectedCompanyId, evalMonth, employees]);

  useEffect(() => {
    const loadAux = async () => {
      try {
        const [roleSnap] = await Promise.all([
          getDocs(collection(db, 'roles'))
        ]);
        
        setRoles(roleSnap.docs.map(d => ({ id: d.id, ...d.data() } as Role)));
        
        if (selectedCompanyId) {
          const empQuery = query(collection(db, 'employees'), where("companyId", "==", selectedCompanyId));
          const empSnap = await getDocs(empQuery);
          
          const allEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
          // Filtrar: mostrar apenas Ativos, Férias e Afastados (não mostrar Inativos)
          const availableEmployees = allEmployees.filter(emp => {
            const status = emp.status || 'Ativo';
            return status !== 'Inativo';
          });
          setEmployees(availableEmployees);

          const critSnap = await getDocs(collection(db, 'evaluation_criteria'));
          const allCriteria = critSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

          const filteredCriteria = allCriteria.filter((crit: any) => {
            const ids: string[] = crit.companyIds || [];
            if (!ids || ids.length === 0) return true;
            return ids.includes(selectedCompanyId);
          });

          setCriteriaList(filteredCriteria as Criteria[]);
        } else {
          setEmployees([]);
          setCriteriaList([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados auxiliares", error);
      }
    };
    loadAux();
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setCurrentEmployee(null);
      setFormType(null);
      setScores({});
      return;
    }
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (emp) {
      setCurrentEmployee(emp);
      const roleData = roles.find(r => r.name === emp.role);
      
      if (roleData?.level) {
         setFormType(roleData.level);
      } else {
         setFormType('Operacional');
      }
      setScores({});
    }
  }, [selectedEmployeeId, employees, roles]);

  const activeCriteria = useMemo(() => {
    if (!formType) return [];
    return criteriaList.filter(c => c.type === formType);
  }, [formType, criteriaList]);

  // Filtrar e ordenar funcionários disponíveis
  const availableEmployees = useMemo(() => {
    let filtered = employees.filter(emp => !existingEvaluations.has(emp.id));
    
    // Busca por nome
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Ordenação
    if (sortOrder === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'sector') {
      filtered.sort((a, b) => {
        const sectorCompare = a.sector.localeCompare(b.sector);
        if (sectorCompare !== 0) return sectorCompare;
        return a.name.localeCompare(b.name);
      });
    }
    
    return filtered;
  }, [employees, existingEvaluations, searchTerm, sortOrder]);

  const currentAverage = useMemo(() => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }, [scores]);

  const handleSubmit = async () => {
    if (!currentEmployee || !evalMonth || !selectedCompanyId) {
      toast.warning("Por favor, selecione uma empresa e um funcionário antes de salvar.");
      return;
    }
    
    // Verificar se já existe avaliação para este funcionário neste mês
    if (existingEvaluations.has(currentEmployee.id)) {
      const confirmMessage = `O funcionário ${currentEmployee.name} já possui uma avaliação para o mês ${evalMonth}.\n\nDeseja criar uma nova avaliação mesmo assim?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    if (activeCriteria.length > 0 && Object.keys(scores).length !== activeCriteria.length) {
      if(!window.confirm("Alguns critérios estão sem nota (serão considerados 0). Deseja continuar?")) return;
    }

    setLoading(true);
    try {
      const payload = {
        companyId: selectedCompanyId,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        role: currentEmployee.role,
        sector: currentEmployee.sector,
        type: formType,
        date: `${evalMonth}-01`,
        average: Number(currentAverage.toFixed(2)),
        details: scores,
        observations: observations.trim(),
        funcionarioMes: isHighlighted ? 'Sim' : 'Não',
        highlightReason: isHighlighted ? highlightReason.trim() : '',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'evaluations'), payload);
      toast.success("Avaliação salva com sucesso!");
      
      // Log de auditoria
      await logAction('create', 'evaluation', docRef.id, {
        entityName: `${currentEmployee.name} - ${evalMonth}`,
        metadata: { average: payload.average, type: formType }
      });
      
      // Adiciona o funcionário à lista de já avaliados
      setExistingEvaluations(prev => new Set([...prev, currentEmployee.id]));
      
      // Limpa seleção para facilitar próxima avaliação
      setSelectedEmployeeId('');
      setScores({});
      setObservations('');
      setIsHighlighted(false);
      setHighlightReason('');
      
      onSuccess();
    } catch (error) {
      toast.handleError(error, 'EvaluationsView.handleSubmit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
        <FileText className="text-blue-600" /> Nova Avaliação de Desempenho
      </h3>

      {/* Controles de Filtro e Ordenação */}
      {selectedCompanyId && (
        <div className="bg-gray-50 dark:bg-[#121212] p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Buscar Colaborador</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Nome, cargo ou setor..."
                  className="w-full pl-10 pr-3 py-2 text-sm border rounded dark:bg-[#1E1E1E] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ordenar por</label>
              <select
                className="w-full sm:w-40 px-3 py-2 text-sm border rounded dark:bg-[#1E1E1E] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'name' | 'sector')}
              >
                <option value="sector">Setor → Nome</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>
            {existingEvaluations.size > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-6 sm:pt-0">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {existingEvaluations.size} já avaliado{existingEvaluations.size !== 1 ? 's' : ''}
                </span>
                {' '}neste mês
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa <span className="text-red-500">*</span></label>
          <select 
            className="w-full p-2 border rounded dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20"
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setSelectedEmployeeId('');
              setCriteriaList([]);
              setScores({});
              setSearchTerm('');
            }}
          >
            <option value="">Selecione uma empresa...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Colaborador 
            <span className="text-xs text-gray-500 ml-2">
              ({availableEmployees.length} disponível{availableEmployees.length !== 1 ? 'eis' : ''})
            </span>
          </label>
          <div className="relative">
            <select 
              className="w-full p-2 pr-24 border rounded dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              disabled={!selectedCompanyId}
            >
              <option value="">
                  {selectedCompanyId 
                    ? availableEmployees.length > 0 
                      ? "Selecione um funcionário..." 
                      : "Todos os funcionários já foram avaliados neste mês"
                    : "Selecione a empresa primeiro"}
              </option>
              {availableEmployees.map(e => {
                const status = e.status || 'Ativo';
                const statusDisplay = status === 'Férias' ? ' 🏖️ Férias' : status === 'Afastado' ? ' 🏥 Afastado' : '';
                return (
                  <option key={e.id} value={e.id}>
                    {sortOrder === 'sector' ? `[${e.sector}] ` : ''}{e.name} - {e.role}{statusDisplay}
                  </option>
                );
              })}
            </select>
            {/* Indicador visual de status ao lado do select */}
            {selectedEmployeeId && (() => {
              const selectedEmp = availableEmployees.find(e => e.id === selectedEmployeeId);
              if (!selectedEmp) return null;
              const status = selectedEmp.status || 'Ativo';
              if (status === 'Férias' || status === 'Afastado') {
                return (
                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded pointer-events-none ${
                    status === 'Férias' 
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' 
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  }`}>
                    {status === 'Férias' ? '🏖️' : '🏥'} {status}
                  </div>
                );
              }
              return null;
            })()}
          </div>
          {/* Indicador de status abaixo do select */}
          {selectedEmployeeId && (() => {
            const selectedEmp = availableEmployees.find(e => e.id === selectedEmployeeId);
            if (!selectedEmp) return null;
            const status = selectedEmp.status || 'Ativo';
            if (status === 'Férias' || status === 'Afastado') {
              return (
                <div className={`mt-1 text-xs font-medium px-2 py-1 rounded inline-flex items-center gap-1 ${
                  status === 'Férias' 
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' 
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                }`}>
                  {status === 'Férias' ? '🏖️' : '🏥'} Status: {status}
                </div>
              );
            }
            return null;
          })()}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mês de Referência</label>
          <input 
            type="month" 
            className="w-full p-2 border rounded dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20"
            value={evalMonth}
            onChange={(e) => setEvalMonth(e.target.value)}
          />
        </div>
      </div>

      {currentEmployee && (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg mb-6 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300 border border-blue-100 dark:border-blue-800">
          <div><span className="font-bold">Cargo:</span> {currentEmployee.role}</div>
          <div><span className="font-bold">Setor:</span> {currentEmployee.sector}</div>
          <div>
            <span className="font-bold">Nível:</span>{' '}
            <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {formType}
            </span>
          </div>
        </div>
      )}

      {formType && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {activeCriteria.length > 0 ? (
              activeCriteria.map(crit => (
                <div key={crit.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="mb-2 md:mb-0 md:w-2/3">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{crit.name}</p>
                    {crit.description && <p className="text-xs text-gray-500">{crit.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="0" max="10" step="1"
                      className="w-32 accent-blue-600"
                      value={scores[crit.name] || 0}
                      onChange={(e) => setScores({...scores, [crit.name]: parseInt(e.target.value)})}
                    />
                    <div className="relative">
                      <input 
                        type="number" min="0" max="10" step="1"
                        className="w-16 p-2 text-center border rounded font-bold dark:bg-[#121212] dark:border-gray-700 text-gray-800 dark:text-white"
                        value={scores[crit.name] || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if(val >= 0 && val <= 10) setScores({...scores, [crit.name]: val});
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-100 dark:border-yellow-800">
                Nenhum critério encontrado para o nível "{formType}" nesta empresa. <br/>
                Vá em <strong>Configurações &gt; Critérios</strong> e cadastre novos itens.
              </div>
            )}
          </div>

          {/* Campos de Observações e Destaque */}
          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                rows={3}
                className="w-full p-3 border rounded-lg dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20 resize-none"
                placeholder="Adicione observações sobre a avaliação..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHighlighted}
                  onChange={(e) => setIsHighlighted(e.target.checked)}
                  className="w-5 h-5 accent-yellow-600 dark:accent-yellow-500 rounded"
                />
                <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">⭐</span>
                  Destaque do Mês
                </span>
              </label>
              
              {isHighlighted && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo do Destaque
                  </label>
                  <textarea
                    rows={2}
                    className="w-full p-3 border rounded-lg dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-yellow-500/20 resize-none"
                    placeholder="Explique o motivo pelo qual este colaborador se destacou..."
                    value={highlightReason}
                    onChange={(e) => setHighlightReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mt-6 border border-gray-200 dark:border-gray-700">
            <div className="text-lg text-gray-800 dark:text-gray-200 mb-4 md:mb-0">
              Média Final: <span className={`font-bold text-3xl ml-2 ${currentAverage >= 8 ? 'text-green-600' : currentAverage >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>{currentAverage.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || activeCriteria.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {loading ? 'Salvando...' : 'Salvar Avaliação'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Subcomponente: Tabela de Avaliações com Edição em Massa ---
const EvaluationsTable = () => {
  const { currentCompany } = useCompany();
  const [data, setData] = useState<EvaluationData[]>([]);
  const [filteredData, setFilteredData] = useState<EvaluationData[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Estados para seleção em massa
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkLevel, setBulkLevel] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Carrega dados
  const loadData = async () => {
    if (!currentCompany) return;
    setIsLoading(true);
    try {
      let q;
      if (currentCompany.id === 'all') {
          q = collection(db, 'evaluations');
      } else {
          q = query(collection(db, 'evaluations'), where("companyId", "==", currentCompany.id));
      }
      
      const snap = await getDocs(q);
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as EvaluationData));
      raw.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setData(raw);
      setFilteredData(raw);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  useEffect(() => {
    let res = data;
    if (filterName) res = res.filter(d => d.employeeName.toLowerCase().includes(filterName.toLowerCase()));
    if (filterSector) res = res.filter(d => d.sector === filterSector);
    setFilteredData(res);
  }, [filterName, filterSector, data]);

  // Handlers de Seleção
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(d => d.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Handler de Edição em Massa
  const handleBulkUpdate = async () => {
    if (!bulkLevel) return;
    setIsUpdating(true);
    try {
      const batch = writeBatch(db);
      
      selectedIds.forEach(id => {
        const docRef = doc(db, 'evaluations', id);
        batch.update(docRef, { type: bulkLevel });
      });

      await batch.commit();
      
      // Atualiza localmente para feedback instantâneo
      const updatedData = data.map(item => 
        selectedIds.includes(item.id) ? { ...item, type: bulkLevel } : item
      );
      setData(updatedData);
      
      setSelectedIds([]);
      setIsBulkEditOpen(false);
      setBulkLevel('');
      toast.success(`${selectedIds.length} avaliações atualizadas para o nível "${bulkLevel}".`);
    } catch (error) {
      console.error("Erro na atualização em massa:", error);
      toast.handleError(error, 'EvaluationsView.handleBulkUpdate');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const csv = Papa.unparse(filteredData.map(d => ({
      Nome: d.employeeName,
      Cargo: d.role,
      Setor: d.sector,
      Nível: d.type,
      Data: d.date,
      Nota_Final: typeof d.average === 'number' ? d.average.toFixed(2) : d.average,
      ...d.details
    })));
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `avaliacoes_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const sectors = Array.from(new Set(data.map(d => d.sector))).sort();

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas / Ações em Massa */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              placeholder="Buscar por nome..."
              className="w-full pl-10 p-2 border rounded-lg dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select 
              className="w-full pl-10 p-2 border rounded-lg dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              value={filterSector}
              onChange={e => setFilterSector(e.target.value)}
            >
              <option value="">Todos Setores</option>
              {sectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsBulkEditOpen(true)}
              className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 font-bold px-4 py-2 rounded-lg transition-colors shadow-sm animate-fadeIn"
            >
              <Edit size={18} /> Editar Nível ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={handleExportCSV} 
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-bold px-4 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
          >
            <Download size={18} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500 uppercase font-medium border-b dark:border-gray-800">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={handleSelectAll} className="text-gray-400 hover:text-blue-500">
                    {selectedIds.length > 0 && selectedIds.length === filteredData.length ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th className="p-4">Data</th>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Setor</th>
                <th className="p-4">Nível</th>
                <th className="p-4 text-right">Nota Média</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2"/> Carregando histórico...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
              ) : filteredData.map((ev) => (
                <tr key={ev.id} className={`hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors ${selectedIds.includes(ev.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="p-4">
                    <button onClick={() => handleSelectOne(ev.id)} className="text-gray-400 hover:text-blue-500">
                      {selectedIds.includes(ev.id) ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="p-4 text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <Calendar size={14}/> 
                        {new Date(ev.date).toLocaleDateString('pt-BR', {timeZone: 'UTC', month: 'short', year: 'numeric'})}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-800 dark:text-white">{ev.employeeName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{ev.role}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{ev.sector}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded border font-medium 
                        ${ev.type === 'Estratégico' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 
                          ev.type === 'Tático' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' :
                          'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                        }`}>
                      {ev.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-bold px-3 py-1 rounded-full ${
                      ev.average >= 8 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                      ev.average >= 6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {typeof ev.average === 'number' ? ev.average.toFixed(2) : ev.average}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição em Massa */}
      <Modal isOpen={isBulkEditOpen} onClose={() => setIsBulkEditOpen(false)} title={`Editar ${selectedIds.length} Itens Selecionados`}>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Selecione o novo nível de cargo para aplicar a todas as avaliações selecionadas:
          </p>
          
          <div className="grid gap-2">
            {['Colaborador', 'Líder', 'Operacional', 'Tático', 'Estratégico'].map(level => (
              <label key={level} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                <input 
                  type="radio" 
                  name="bulkLevel" 
                  value={level} 
                  checked={bulkLevel === level} 
                  onChange={(e) => setBulkLevel(e.target.value)}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className="text-gray-800 dark:text-gray-200 font-medium">{level}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <button 
              onClick={handleBulkUpdate}
              disabled={!bulkLevel || isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold disabled:opacity-50 flex justify-center gap-2"
            >
              {isUpdating ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              Confirmar Alteração
            </button>
            <button 
              onClick={() => setIsBulkEditOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const EvaluationsView = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('list');

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão de Avaliações</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Central de lançamento e histórico de desempenho.</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'list' 
              ? 'bg-white dark:bg-[#121212] text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Histórico Completo
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'new' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Plus size={16} /> Nova Avaliação
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'new' ? (
          <EvaluationForm onSuccess={() => setActiveTab('list')} />
        ) : (
          <EvaluationsTable />
        )}
      </div>
    </div>
  );
};