import { useState } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { useDashboardAnalytics } from '../../hooks/useDashboardAnalytics';

// Import Tabs
import { CompanyOverview } from './tabs/CompanyOverview';
import { PerformanceAnalysis } from './tabs/PerformanceAnalysis';
import { IndividualAnalysis } from './tabs/IndividualAnalysis';

interface DashboardProps {
  evaluations: any[];
  employees: any[];
}

export const Dashboard = ({ evaluations = [], employees = [] }: DashboardProps) => {
  // Estado Local de Filtros
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [activeFilterLabel, setActiveFilterLabel] = useState('Todo o período');
  
  // Estado da Aba Ativa
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'individual'>('overview');

  // Hook de Analytics
  const analytics = useDashboardAnalytics(evaluations, employees, {
    searchTerm,
    selectedSector,
    dateStart,
    dateEnd
  });

  // Lista de Setores para o Select
  const uniqueSectors = analytics.competenceMetrics.allSectors || [];

  // Funções de Filtro de Data
  const applyDateFilter = (type: '30days' | '3months' | '6months' | 'year' | 'all') => {
    const end = new Date();
    let start = new Date();

    switch (type) {
      case '30days':
        start.setDate(end.getDate() - 30);
        setActiveFilterLabel('Últimos 30 dias');
        break;
      case '3months':
        start.setMonth(end.getMonth() - 3);
        setActiveFilterLabel('Últimos 3 meses');
        break;
      case '6months':
        start.setMonth(end.getMonth() - 6);
        setActiveFilterLabel('Últimos 6 meses');
        break;
      case 'year':
        start = new Date(end.getFullYear(), 0, 1); // 1 de Jan do ano atual
        setActiveFilterLabel('Este Ano');
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

  return (
    <div className="space-y-6 pb-10">
      
      {/* --- BARRA DE FILTROS SUPERIOR --- */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col gap-4 sticky top-0 z-10">
        
        {/* Linha 1: Controles Principais */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Busca */}
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar colaborador..." 
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 ring-blue-500/20 w-full sm:w-64 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filtro Setor */}
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select 
                className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer w-full sm:w-48 appearance-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
              >
                <option value="">Todos Setores</option>
                {uniqueSectors.sort().map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            {/* Indicador de Filtros Ativos */}
            {(searchTerm || selectedSector || dateStart || dateEnd) && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Filtros ativos:</span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Busca: "{searchTerm}"
                  </span>
                )}
                {selectedSector && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Setor: {selectedSector}
                  </span>
                )}
                {(dateStart || dateEnd) && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {activeFilterLabel}
                  </span>
                )}
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSector('');
                    applyDateFilter('all');
                  }}
                  className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  Limpar todos
                </button>
              </div>
            )}
          </div>

          {/* Seleção Rápida de Período */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
             {['all', '30days', '3months', 'year'].map((period) => {
                const labels: Record<string, string> = { all: 'Tudo', '30days': '30 Dias', '3months': '3 Meses', year: 'Este Ano' };
                const isActive = (period === 'all' && !dateStart) || (period === 'year' && activeFilterLabel === 'Este Ano') || (period === '3months' && activeFilterLabel === 'Últimos 3 meses');
                
                return (
                  <button 
                    key={period}
                    onClick={() => applyDateFilter(period as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                       isActive 
                       ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                       : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {labels[period]}
                  </button>
                );
             })}
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
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'overview' 
              ? 'bg-white dark:bg-[#1E1E1E] text-blue-600 shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Saúde da Empresa
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'performance' 
              ? 'bg-white dark:bg-[#1E1E1E] text-blue-600 shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Análise de Desempenho
        </button>
        <button
          onClick={() => setActiveTab('individual')}
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
      {evaluations.length === 0 ? (
         <div className="p-10 text-center text-gray-500 bg-white dark:bg-[#1E1E1E] rounded-xl border border-dashed border-gray-300">
            Nenhuma avaliação encontrada. Utilize a aba "Histórico" para importar dados via CSV.
         </div>
      ) : (
         <>
            {activeTab === 'overview' && <CompanyOverview data={analytics.generalMetrics} />}
            {activeTab === 'performance' && <PerformanceAnalysis data={analytics.competenceMetrics} />}
            {activeTab === 'individual' && <IndividualAnalysis data={analytics.comparativeMetrics} />}
         </>
      )}

    </div>
  );
};