import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, X, Check } from 'lucide-react';
import { useDashboardAnalytics } from '../../hooks/useDashboardAnalytics';
import { fetchCollection } from '../../services/firebase';
import { useCompany } from '../../contexts/CompanyContext';
import { ReportExporter } from '../reports/ReportExporter';
import { usePerformanceGoals } from '../../hooks/usePerformanceGoals';

// Import Tabs
import { CompanyOverview } from './tabs/CompanyOverview';
import { PerformanceAnalysis } from './tabs/PerformanceAnalysis';
import { IndividualAnalysis } from './tabs/IndividualAnalysis';

interface DashboardProps {
  evaluations: any[];
  employees: any[];
}

export const Dashboard = ({ evaluations = [], employees = [], initialTab }: { evaluations?: any[]; employees?: any[]; initialTab?: string }) => {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const dashboardContentRef = useRef<HTMLDivElement>(null);
  
  // Estado Local de Filtros
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [activeFilterLabel, setActiveFilterLabel] = useState('Todo o período');
  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  
  // Buscar critérios do banco
  useEffect(() => {
    const loadCriteria = async () => {
      try {
        const criteria = await fetchCollection('evaluation_criteria');
        setCriteriaList(criteria);
      } catch (error) {
        console.error("Erro ao carregar critérios:", error);
      }
    };
    loadCriteria();
  }, []);
  
  // Estado da Aba Ativa (usa initialTab da URL se disponível)
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'individual'>(
    (initialTab as any) || 'overview'
  );
  
  // Atualizar tab quando initialTab mudar (navegação via URL)
  useEffect(() => {
    if (initialTab && ['overview', 'performance', 'individual'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  // Hook de Metas
  const { goalValue } = usePerformanceGoals();

  // Hook de Analytics
  const analytics = useDashboardAnalytics(evaluations, employees, {
    searchTerm: '', // Removido - agora usa apenas selectedEmployees
    selectedSectors,
    selectedEmployees,
    dateStart,
    dateEnd
  }, criteriaList, goalValue);

  // Lista de Setores para o Select
  const uniqueSectors = analytics.competenceMetrics.allSectors || [];
  
  // Lista de funcionários únicos para busca
  const uniqueEmployees = useMemo(() => {
    const names = new Set<string>();
    evaluations.forEach((ev: any) => {
      if (ev.employeeName) names.add(ev.employeeName);
    });
    return Array.from(names).sort();
  }, [evaluations]);
  
  // Funcionários filtrados pela busca
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm) return uniqueEmployees;
    return uniqueEmployees.filter(name => 
      name.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    );
  }, [uniqueEmployees, employeeSearchTerm]);

  // Funções de Filtro de Período (adequado para avaliações mensais)
  const applyDateFilter = (type: 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisSemester' | 'lastSemester' | 'thisYear' | 'lastYear' | 'all') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setActiveFilterLabel('Este Mês');
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        setActiveFilterLabel('Mês Passado');
        break;
      case 'thisQuarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), currentQuarter * 3, 1);
        end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        setActiveFilterLabel('Este Trimestre');
        break;
      case 'lastQuarter':
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
        const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const lastQuarterMonth = lastQuarter < 0 ? 9 : lastQuarter * 3;
        start = new Date(lastQuarterYear, lastQuarterMonth, 1);
        end = new Date(lastQuarterYear, lastQuarterMonth + 3, 0);
        setActiveFilterLabel('Trimestre Passado');
        break;
      case 'thisSemester':
        const currentSemester = now.getMonth() < 6 ? 0 : 6;
        start = new Date(now.getFullYear(), currentSemester, 1);
        end = new Date(now.getFullYear(), currentSemester + 6, 0);
        setActiveFilterLabel('Este Semestre');
        break;
      case 'lastSemester':
        const lastSemester = now.getMonth() < 6 ? 6 : 0;
        const lastSemesterYear = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
        start = new Date(lastSemesterYear, lastSemester, 1);
        end = new Date(lastSemesterYear, lastSemester + 6, 0);
        setActiveFilterLabel('Semestre Passado');
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        setActiveFilterLabel('Este Ano');
        break;
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        setActiveFilterLabel('Ano Passado');
        break;
      case 'all':
        setDateStart('');
        setDateEnd('');
        setActiveFilterLabel('Todo o período');
        return;
    }

    setDateStart(start.toISOString().split('T')[0]);
    setDateEnd(end.toISOString().split('T')[0]);
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sector-filter') && !target.closest('.employee-filter')) {
        setShowSectorDropdown(false);
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6 pb-10">
      
      {/* --- BARRA DE FILTROS SUPERIOR --- */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col gap-4 sticky top-0 z-10">
        
        {/* Linha 1: Controles Principais */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Filtro Setor (Múltipla Seleção) */}
            <div className="relative w-full sm:w-auto sector-filter">
              <Filter className="absolute left-3 top-2.5 text-gray-400 z-10" size={18} />
              <div className="relative">
                <button
                  onClick={() => setShowSectorDropdown(!showSectorDropdown)}
                  className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer w-full sm:w-48 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedSectors.length === 0 ? 'Todos Setores' : `${selectedSectors.length} setor(es)`}
                  </span>
                  <span className="text-xs text-gray-400">▼</span>
                </button>
                {showSectorDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full sm:w-48 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedSectors([]);
                          setShowSectorDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        Todos Setores
                      </button>
                      {uniqueSectors.sort().map((s: string) => (
                        <label key={s} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSectors.includes(s)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSectors([...selectedSectors, s]);
                              } else {
                                setSelectedSectors(selectedSectors.filter(sec => sec !== s));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro Funcionário (Busca + Seleção Múltipla) */}
            <div className="relative w-full sm:w-auto employee-filter">
              <Search className="absolute left-3 top-2.5 text-gray-400 z-10" size={18} />
              <div className="relative">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Buscar funcionário..."
                    value={employeeSearchTerm}
                    onChange={(e) => {
                      setEmployeeSearchTerm(e.target.value);
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg outline-none w-full sm:w-64 text-gray-700 dark:text-gray-300 focus:ring-2 ring-blue-500/20"
                  />
                  {selectedEmployees.length > 0 && (
                    <span className="absolute right-8 text-xs bg-blue-500 text-white rounded-full px-2 py-0.5">
                      {selectedEmployees.length}
                    </span>
                  )}
                </div>
                {showEmployeeDropdown && filteredEmployees.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-full sm:w-64 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {filteredEmployees.slice(0, 10).map((name: string) => (
                        <label key={name} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployees([...selectedEmployees, name]);
                              } else {
                                setSelectedEmployees(selectedEmployees.filter(emp => emp !== name));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                        </label>
                      ))}
                      {filteredEmployees.length > 10 && (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          +{filteredEmployees.length - 10} mais...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Indicador de Filtros Ativos */}
            {(selectedSectors.length > 0 || selectedEmployees.length > 0 || dateStart || dateEnd) && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                <span className="font-medium">Filtros ativos:</span>
                {selectedSectors.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Setores: {selectedSectors.length}
                  </span>
                )}
                {selectedEmployees.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Funcionários: {selectedEmployees.length}
                  </span>
                )}
                {(dateStart || dateEnd) && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {activeFilterLabel}
                  </span>
                )}
                <button 
                  onClick={() => {
                    setSelectedSectors([]);
                    setSelectedEmployees([]);
                    setEmployeeSearchTerm('');
                    applyDateFilter('all');
                  }}
                  className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  Limpar todos
                </button>
              </div>
            )}
          </div>

          {/* Seleção Rápida de Período e Exportação */}
          <div className="flex flex-col gap-3 justify-center lg:justify-end items-center">
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { key: 'thisMonth', label: 'Este Mês' },
                { key: 'lastMonth', label: 'Mês Passado' },
                { key: 'thisQuarter', label: 'Este Trimestre' },
                { key: 'lastQuarter', label: 'Trimestre Passado' },
                { key: 'thisSemester', label: 'Este Semestre' },
                { key: 'lastSemester', label: 'Semestre Passado' },
                { key: 'thisYear', label: 'Este Ano' },
                { key: 'lastYear', label: 'Ano Passado' },
                { key: 'all', label: 'Todo Período' }
              ].map((period) => {
                const isActive = (period.key === 'all' && !dateStart) || activeFilterLabel === period.label;
                
                return (
                  <button 
                    key={period.key}
                    onClick={() => applyDateFilter(period.key as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                       isActive 
                       ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg border border-blue-400 transform scale-105' 
                       : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-400 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600'
                    }`}
                  >
                    {period.label}
                  </button>
                );
              })}
            </div>
            
            {/* Botão de Exportação */}
            {evaluations.length > 0 && (
              <div className="ml-2">
                <ReportExporter
                  title="Dashboard de Desempenho"
                  contentRef={dashboardContentRef}
                  generalMetrics={analytics.generalMetrics}
                  competenceMetrics={analytics.competenceMetrics}
                  comparativeMetrics={analytics.comparativeMetrics}
                  companyName={currentCompany?.name || 'Empresa'}
                  exportType="dashboard"
                />
              </div>
            )}
          </div>
        </div>

        {/* Linha 2: Intervalo Personalizado (se necessário) */}
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-[#121212] p-2 rounded-lg border border-gray-200 dark:border-gray-800 w-fit">
          <Calendar size={14} />
          <span className="text-xs font-bold uppercase tracking-wide">Personalizado:</span>
          <input 
            type="date" 
            className="bg-transparent outline-none text-gray-700 dark:text-gray-300"
            value={dateStart}
            onChange={e => { setDateStart(e.target.value); setActiveFilterLabel('Personalizado'); }}
          />
          <span className="text-gray-400">-</span>
          <input 
            type="date" 
            className="bg-transparent outline-none text-gray-700 dark:text-gray-300"
            value={dateEnd}
            onChange={e => { setDateEnd(e.target.value); setActiveFilterLabel('Personalizado'); }}
          />
          {(dateStart || dateEnd) && (
             <button onClick={() => applyDateFilter('all')} className="ml-2 hover:text-red-500"><X size={14} /></button>
          )}
        </div>
      </div>

      {/* --- NAVEGAÇÃO POR ABAS --- */}
      <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => {
            setActiveTab('overview');
            navigate('/dashboard/overview');
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'overview' 
              ? 'bg-white dark:bg-[#1E1E1E] text-blue-600 shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Saúde da Empresa
        </button>
        <button
          onClick={() => {
            setActiveTab('performance');
            navigate('/dashboard/performance');
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'performance' 
              ? 'bg-white dark:bg-[#1E1E1E] text-blue-600 shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Análise de Desempenho
        </button>
        <button
          onClick={() => {
            setActiveTab('individual');
            navigate('/dashboard/individual');
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'individual' 
              ? 'bg-white dark:bg-[#1E1E1E] text-blue-600 shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Comparativo Individual
        </button>
      </div>

      {/* --- CONTEÚDO DAS ABAS --- */}
      <div ref={dashboardContentRef}>
        {evaluations.length === 0 ? (
          <div className="p-10 text-center text-gray-500 bg-white dark:bg-[#1E1E1E] rounded-xl border border-dashed border-gray-300">
            Nenhuma avaliação encontrada. Utilize a aba "Histórico" para importar dados via CSV.
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <CompanyOverview data={analytics.generalMetrics} employees={employees} />}
            {activeTab === 'performance' && <PerformanceAnalysis data={analytics.competenceMetrics} />}
            {activeTab === 'individual' && <IndividualAnalysis data={analytics.comparativeMetrics} />}
          </>
        )}
      </div>

    </div>
  );
};