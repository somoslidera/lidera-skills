// src/components/dashboard/Dashboard.tsx
import { useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
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
  
  // Estado da Aba Ativa
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'individual'>('overview');

  // Hook de Analytics (Faz todo o trabalho pesado)
  const analytics = useDashboardAnalytics(evaluations, employees, {
    searchTerm,
    selectedSector,
    dateStart,
    dateEnd
  });

  // Lista de Setores para o Select (derivado do hook)
  const uniqueSectors = analytics.competenceMetrics.allSectors || [];

  return (
    <div className="space-y-6 pb-10">
      
      {/* --- BARRA DE FILTROS SUPERIOR --- */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Busca */}
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador..." 
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 ring-blue-500/20 w-full sm:w-64 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro Setor */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select 
              className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer w-full sm:w-48 appearance-none text-gray-700 dark:text-gray-300"
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
            >
              <option value="">Todos Setores</option>
              {uniqueSectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Filtro Data */}
        <div className="flex items-center gap-2 w-full lg:w-auto bg-gray-50 dark:bg-[#121212] p-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <Calendar size={16} className="text-gray-400 ml-2" />
          <input 
            type="date" 
            className="bg-transparent text-sm outline-none text-gray-600 dark:text-gray-300"
            value={dateStart}
            onChange={e => setDateStart(e.target.value)}
          />
          <span className="text-gray-400">-</span>
          <input 
            type="date" 
            className="bg-transparent text-sm outline-none text-gray-600 dark:text-gray-300"
            value={dateEnd}
            onChange={e => setDateEnd(e.target.value)}
          />
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