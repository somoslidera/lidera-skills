import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Filter, ArrowUp, ArrowDown, Minus } from 'lucide-react';

export const IndividualAnalysis = ({ data }: { data: any }) => {
  const { individualData, monthlyComparison } = data;
  const [localSearch, setLocalSearch] = useState('');
  const [viewMode, setViewMode] = useState<'comparative' | 'monthly'>('comparative');
  const [filterBy, setFilterBy] = useState<'all' | 'sector' | 'role' | 'type'>('all');
  const [filterValue, setFilterValue] = useState('');

  // Filtro local para a tabela (além dos filtros globais do dashboard)
  const displayData = useMemo(() => {
    let filtered = individualData.filter((d: any) => 
       d.name.toLowerCase().includes(localSearch.toLowerCase())
    );
    
    if (filterBy !== 'all' && filterValue) {
      filtered = filtered.filter((d: any) => {
        if (filterBy === 'sector') return d.sector === filterValue;
        if (filterBy === 'role') return d.role === filterValue;
        if (filterBy === 'type') return d.type === filterValue;
        return true;
      });
    }
    
    return filtered;
  }, [individualData, localSearch, filterBy, filterValue]);
  
  // Obter valores únicos para filtros
  const uniqueSectors = useMemo<string[]>(() => Array.from(new Set(individualData.map((d: any) => d.sector))).sort() as string[], [individualData]);
  const uniqueRoles = useMemo<string[]>(() => Array.from(new Set(individualData.map((d: any) => d.role))).sort() as string[], [individualData]);
  const uniqueTypes = useMemo<string[]>(() => Array.from(new Set(individualData.map((d: any) => d.type))).sort() as string[], [individualData]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Tabs de Visualização */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('comparative')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'comparative'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Análise Comparativa
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Evolução Mês a Mês
          </button>
        </div>
      </div>

      {viewMode === 'comparative' ? (
        /* 1. Análise Comparativa Melhorada */
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
             <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Análise Comparativa</h3>
                <p className="text-sm text-gray-500">Comparação: Colaborador vs Setor vs Empresa</p>
             </div>
             <div className="flex gap-2">
               <input 
                  type="text" 
                  placeholder="Buscar colaborador..." 
                  className="p-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
               />
               <div className="relative">
                 <Filter className="absolute left-2 top-2.5 text-gray-400" size={16} />
                 <select
                   className="pl-8 pr-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
                   value={filterBy}
                   onChange={(e) => {
                     setFilterBy(e.target.value as any);
                     setFilterValue('');
                   }}
                 >
                   <option value="all">Todos</option>
                   <option value="sector">Por Setor</option>
                   <option value="role">Por Cargo</option>
                   <option value="type">Por Nível</option>
                 </select>
               </div>
               {filterBy !== 'all' && (
                 <select
                   className="px-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
                   value={filterValue}
                   onChange={(e) => setFilterValue(e.target.value)}
                 >
                   <option value="">Selecione...</option>
                   {filterBy === 'sector' && uniqueSectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                   {filterBy === 'role' && uniqueRoles.map((r: string) => <option key={r} value={r}>{r}</option>)}
                   {filterBy === 'type' && uniqueTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                 </select>
               )}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500 uppercase text-xs">
                <tr>
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Mês</th>
                  <th className="p-4">Setor</th>
                  <th className="p-4">Cargo</th>
                  <th className="p-4">Nível</th>
                  <th className="p-4 text-center bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200">Nota Individual</th>
                  <th className="p-4 text-center">Média Setor</th>
                  <th className="p-4 text-center">Média Empresa</th>
                  <th className="p-4 text-center">Abaixo Média Setor</th>
                  <th className="p-4 text-center">Abaixo Média Empresa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                 {displayData.map((item: any, idx: number) => {
                    return (
                       <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-4 font-medium text-gray-800 dark:text-white">{item.name}</td>
                          <td className="p-4 text-gray-500 text-xs">{item.monthYear || '-'}</td>
                          <td className="p-4 text-gray-500">{item.sector}</td>
                          <td className="p-4 text-gray-500">{item.role}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {item.type}
                            </span>
                          </td>
                          <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-900/5 font-bold text-blue-600">
                             {item.individualScore.toFixed(1)}
                          </td>
                          <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                             {item.sectorAvg.toFixed(1)}
                          </td>
                          <td className="p-4 text-center text-gray-400">
                             {item.companyAvg.toFixed(1)}
                          </td>
                          <td className="p-4 text-center">
                             <span className={`text-xs font-bold px-2 py-1 rounded ${
                                item.belowSectorAvg 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                             }`}>
                                {item.belowSectorAvg ? 'Sim' : 'Não'}
                             </span>
                          </td>
                          <td className="p-4 text-center">
                             <span className={`text-xs font-bold px-2 py-1 rounded ${
                                item.belowCompanyAvg 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                             }`}>
                                {item.belowCompanyAvg ? 'Sim' : 'Não'}
                             </span>
                          </td>
                       </tr>
                    );
                 })}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t dark:border-gray-800 mt-4">
             <p className="text-xs text-gray-400 text-center">
                Mostrando {displayData.length} registros baseados nos filtros ativos.
             </p>
          </div>
        </div>
      ) : (
        /* 2. Tabela de Evolução Mês a Mês */
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
             <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Evolução Percentual Mês a Mês</h3>
                <p className="text-sm text-gray-500">Comparação de performance mês a mês por colaborador</p>
             </div>
             <div className="flex gap-2">
               <input 
                  type="text" 
                  placeholder="Buscar colaborador..." 
                  className="p-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
               />
               <div className="relative">
                 <Filter className="absolute left-2 top-2.5 text-gray-400" size={16} />
                 <select
                   className="pl-8 pr-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
                   value={filterBy}
                   onChange={(e) => {
                     setFilterBy(e.target.value as any);
                     setFilterValue('');
                   }}
                 >
                   <option value="all">Todos</option>
                   <option value="sector">Por Setor</option>
                   <option value="role">Por Cargo</option>
                   <option value="type">Por Nível</option>
                 </select>
               </div>
               {filterBy !== 'all' && (
                 <select
                   className="px-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
                   value={filterValue}
                   onChange={(e) => setFilterValue(e.target.value)}
                 >
                   <option value="">Selecione...</option>
                   {filterBy === 'sector' && uniqueSectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                   {filterBy === 'role' && uniqueRoles.map((r: string) => <option key={r} value={r}>{r}</option>)}
                   {filterBy === 'type' && uniqueTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                 </select>
               )}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500 uppercase text-xs sticky top-0">
                <tr>
                  <th className="p-3 sticky left-0 bg-gray-50 dark:bg-[#121212] z-10 border-r">Colaborador</th>
                  <th className="p-3 sticky left-[150px] bg-gray-50 dark:bg-[#121212] z-10 border-r">Setor</th>
                  <th className="p-3 sticky left-[250px] bg-gray-50 dark:bg-[#121212] z-10 border-r">Cargo</th>
                  <th className="p-3 sticky left-[350px] bg-gray-50 dark:bg-[#121212] z-10 border-r">Nível</th>
                  {monthlyComparison && monthlyComparison.length > 0 && monthlyComparison[0]?.months.map((m: any, idx: number) => (
                    <th key={idx} className="p-2 text-center min-w-[100px]">
                      <div className="flex flex-col">
                        <span className="text-[10px]">{m.month}</span>
                        <div className="flex gap-1 justify-center mt-1">
                          <span className="text-[9px] text-gray-400">Nota</span>
                          <span className="text-[9px] text-gray-400">%</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                 {monthlyComparison && monthlyComparison
                   .filter((item: any) => {
                     if (localSearch && !item.name.toLowerCase().includes(localSearch.toLowerCase())) return false;
                     if (filterBy === 'sector' && filterValue && item.sector !== filterValue) return false;
                     if (filterBy === 'role' && filterValue && item.role !== filterValue) return false;
                     if (filterBy === 'type' && filterValue && item.type !== filterValue) return false;
                     return true;
                   })
                   .map((item: any, idx: number) => {
                    return (
                       <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-3 font-medium text-gray-800 dark:text-white sticky left-0 bg-white dark:bg-[#1E1E1E] z-10 border-r">
                            {item.name}
                          </td>
                          <td className="p-3 text-gray-500 sticky left-[150px] bg-white dark:bg-[#1E1E1E] z-10 border-r">
                            {item.sector}
                          </td>
                          <td className="p-3 text-gray-500 sticky left-[250px] bg-white dark:bg-[#1E1E1E] z-10 border-r">
                            {item.role}
                          </td>
                          <td className="p-3 sticky left-[350px] bg-white dark:bg-[#1E1E1E] z-10 border-r">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {item.type}
                            </span>
                          </td>
                          {item.months.map((month: any, midx: number) => (
                            <td key={midx} className="p-2 text-center">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-gray-800 dark:text-white">{month.score.toFixed(1)}</span>
                                {month.changePercent !== undefined && (
                                  <span className={`text-xs flex items-center justify-center gap-0.5 ${
                                    month.changePercent > 0 ? 'text-green-600' :
                                    month.changePercent < 0 ? 'text-red-600' : 'text-gray-400'
                                  }`}>
                                    {month.changePercent > 0 ? <ArrowUp size={12} /> :
                                     month.changePercent < 0 ? <ArrowDown size={12} /> :
                                     <Minus size={12} />}
                                    {Math.abs(month.changePercent).toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>
                          ))}
                       </tr>
                    );
                 })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};