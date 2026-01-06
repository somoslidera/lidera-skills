import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Filter, ArrowUp, ArrowDown, Minus, X } from 'lucide-react';

export const IndividualAnalysis = ({ data }: { data: any }) => {
  const { individualData, monthlyComparison } = data;
  const [localSearch, setLocalSearch] = useState('');
  const [viewMode, setViewMode] = useState<'comparative' | 'monthly'>('comparative');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Filtro local para a tabela (além dos filtros globais do dashboard)
  const displayData = useMemo(() => {
    let filtered = individualData.filter((d: any) => 
       d.name.toLowerCase().includes(localSearch.toLowerCase())
    );
    
    // Filtros múltiplos
    if (selectedSectors.length > 0) {
      filtered = filtered.filter((d: any) => selectedSectors.includes(d.sector));
    }
    if (selectedRoles.length > 0) {
      filtered = filtered.filter((d: any) => selectedRoles.includes(d.role));
    }
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((d: any) => selectedTypes.includes(d.type));
    }
    
    return filtered;
  }, [individualData, localSearch, selectedSectors, selectedRoles, selectedTypes]);
  
  // Obter valores únicos para filtros
  const uniqueSectors = useMemo<string[]>(() => Array.from(new Set(individualData.map((d: any) => d.sector))).sort() as string[], [individualData]);
  const uniqueRoles = useMemo<string[]>(() => Array.from(new Set(individualData.map((d: any) => d.role))).sort() as string[], [individualData]);
  const uniqueTypes = useMemo<string[]>(() => Array.from(new Set(individualData.map((d: any) => d.type))).sort() as string[], [individualData]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sector-filter') && !target.closest('.role-filter') && !target.closest('.type-filter')) {
        setShowSectorDropdown(false);
        setShowRoleDropdown(false);
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
             <div className="flex gap-2 flex-wrap">
               <input 
                  type="text" 
                  placeholder="Buscar colaborador..." 
                  className="p-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
               />
               
               {/* Filtro Setor (Múltipla Seleção) */}
               <div className="relative sector-filter">
                 <button
                   onClick={() => {
                     setShowSectorDropdown(!showSectorDropdown);
                     setShowRoleDropdown(false);
                     setShowTypeDropdown(false);
                   }}
                   className="pl-8 pr-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm text-left flex items-center gap-2"
                 >
                   <Filter size={16} className="text-gray-400" />
                   <span>Setor{selectedSectors.length > 0 ? ` (${selectedSectors.length})` : ''}</span>
                 </button>
                 {showSectorDropdown && (
                   <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[200px]">
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
                       {uniqueSectors.map((s: string) => (
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
               
               {/* Filtro Cargo (Múltipla Seleção) */}
               <div className="relative role-filter">
                 <button
                   onClick={() => {
                     setShowRoleDropdown(!showRoleDropdown);
                     setShowSectorDropdown(false);
                     setShowTypeDropdown(false);
                   }}
                   className="pl-8 pr-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm text-left flex items-center gap-2"
                 >
                   <Filter size={16} className="text-gray-400" />
                   <span>Cargo{selectedRoles.length > 0 ? ` (${selectedRoles.length})` : ''}</span>
                 </button>
                 {showRoleDropdown && (
                   <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[200px]">
                     <div className="p-2">
                       <button
                         onClick={() => {
                           setSelectedRoles([]);
                           setShowRoleDropdown(false);
                         }}
                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                       >
                         Todos Cargos
                       </button>
                       {uniqueRoles.map((r: string) => (
                         <label key={r} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                           <input
                             type="checkbox"
                             checked={selectedRoles.includes(r)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedRoles([...selectedRoles, r]);
                               } else {
                                 setSelectedRoles(selectedRoles.filter(role => role !== r));
                               }
                             }}
                             className="mr-2"
                           />
                           <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
               
               {/* Filtro Nível (Múltipla Seleção) */}
               <div className="relative type-filter">
                 <button
                   onClick={() => {
                     setShowTypeDropdown(!showTypeDropdown);
                     setShowSectorDropdown(false);
                     setShowRoleDropdown(false);
                   }}
                   className="pl-8 pr-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm text-left flex items-center gap-2"
                 >
                   <Filter size={16} className="text-gray-400" />
                   <span>Nível{selectedTypes.length > 0 ? ` (${selectedTypes.length})` : ''}</span>
                 </button>
                 {showTypeDropdown && (
                   <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[200px]">
                     <div className="p-2">
                       <button
                         onClick={() => {
                           setSelectedTypes([]);
                           setShowTypeDropdown(false);
                         }}
                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                       >
                         Todos Níveis
                       </button>
                       {uniqueTypes.map((t: string) => (
                         <label key={t} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                           <input
                             type="checkbox"
                             checked={selectedTypes.includes(t)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedTypes([...selectedTypes, t]);
                               } else {
                                 setSelectedTypes(selectedTypes.filter(type => type !== t));
                               }
                             }}
                             className="mr-2"
                           />
                           <span className="text-sm text-gray-700 dark:text-gray-300">{t}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
               
               {/* Limpar Filtros */}
               {(selectedSectors.length > 0 || selectedRoles.length > 0 || selectedTypes.length > 0) && (
                 <button
                   onClick={() => {
                     setSelectedSectors([]);
                     setSelectedRoles([]);
                     setSelectedTypes([]);
                   }}
                   className="px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex items-center gap-1"
                 >
                   <X size={14} />
                   Limpar
                 </button>
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
                  <th className="p-4 text-center">Média Setor</th>
                  <th className="p-4 text-center">Média Empresa</th>
                  <th className="p-4 text-center bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200">Nota Individual</th>
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
                          <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                             {item.sectorAvg.toFixed(1)}
                          </td>
                          <td className="p-4 text-center text-gray-400">
                             {item.companyAvg.toFixed(1)}
                          </td>
                          <td className="p-4 text-center">
                             {(() => {
                                // Determina cor baseada na performance
                                let bgColor, textColor, borderColor;
                                if (item.belowCompanyAvg) {
                                  // Vermelho: abaixo da média da empresa
                                  bgColor = 'bg-red-100 dark:bg-red-900/30';
                                  textColor = 'text-red-700 dark:text-red-300';
                                  borderColor = 'border-red-300 dark:border-red-700';
                                } else if (item.belowSectorAvg) {
                                  // Laranja: abaixo da média do setor mas acima da média da empresa
                                  bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                                  textColor = 'text-orange-700 dark:text-orange-300';
                                  borderColor = 'border-orange-300 dark:border-orange-700';
                                } else {
                                  // Azul/Verde: acima da média do setor
                                  bgColor = 'bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30';
                                  textColor = 'text-blue-700 dark:text-blue-300';
                                  borderColor = 'border-blue-300 dark:border-blue-700';
                                }
                                
                                return (
                                  <span className={`font-bold px-3 py-1.5 rounded-lg border ${bgColor} ${textColor} ${borderColor}`}>
                                    {item.individualScore.toFixed(1)}
                                  </span>
                                );
                             })()}
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
             <div className="flex gap-2 flex-wrap">
               <input 
                  type="text" 
                  placeholder="Buscar colaborador..." 
                  className="p-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
               />
               
               {/* Filtro Setor (Múltipla Seleção) */}
               <div className="relative sector-filter">
                 <button
                   onClick={() => {
                     setShowSectorDropdown(!showSectorDropdown);
                     setShowRoleDropdown(false);
                     setShowTypeDropdown(false);
                   }}
                   className="pl-8 pr-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm text-left flex items-center gap-2"
                 >
                   <Filter size={16} className="text-gray-400" />
                   <span>Setor{selectedSectors.length > 0 ? ` (${selectedSectors.length})` : ''}</span>
                 </button>
                 {showSectorDropdown && (
                   <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[200px]">
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
                       {uniqueSectors.map((s: string) => (
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
               
               {/* Filtro Cargo (Múltipla Seleção) */}
               <div className="relative role-filter">
                 <button
                   onClick={() => {
                     setShowRoleDropdown(!showRoleDropdown);
                     setShowSectorDropdown(false);
                     setShowTypeDropdown(false);
                   }}
                   className="pl-8 pr-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm text-left flex items-center gap-2"
                 >
                   <Filter size={16} className="text-gray-400" />
                   <span>Cargo{selectedRoles.length > 0 ? ` (${selectedRoles.length})` : ''}</span>
                 </button>
                 {showRoleDropdown && (
                   <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[200px]">
                     <div className="p-2">
                       <button
                         onClick={() => {
                           setSelectedRoles([]);
                           setShowRoleDropdown(false);
                         }}
                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                       >
                         Todos Cargos
                       </button>
                       {uniqueRoles.map((r: string) => (
                         <label key={r} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                           <input
                             type="checkbox"
                             checked={selectedRoles.includes(r)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedRoles([...selectedRoles, r]);
                               } else {
                                 setSelectedRoles(selectedRoles.filter(role => role !== r));
                               }
                             }}
                             className="mr-2"
                           />
                           <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
               
               {/* Filtro Nível (Múltipla Seleção) */}
               <div className="relative type-filter">
                 <button
                   onClick={() => {
                     setShowTypeDropdown(!showTypeDropdown);
                     setShowSectorDropdown(false);
                     setShowRoleDropdown(false);
                   }}
                   className="pl-8 pr-3 py-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm text-left flex items-center gap-2"
                 >
                   <Filter size={16} className="text-gray-400" />
                   <span>Nível{selectedTypes.length > 0 ? ` (${selectedTypes.length})` : ''}</span>
                 </button>
                 {showTypeDropdown && (
                   <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[200px]">
                     <div className="p-2">
                       <button
                         onClick={() => {
                           setSelectedTypes([]);
                           setShowTypeDropdown(false);
                         }}
                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                       >
                         Todos Níveis
                       </button>
                       {uniqueTypes.map((t: string) => (
                         <label key={t} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                           <input
                             type="checkbox"
                             checked={selectedTypes.includes(t)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedTypes([...selectedTypes, t]);
                               } else {
                                 setSelectedTypes(selectedTypes.filter(type => type !== t));
                               }
                             }}
                             className="mr-2"
                           />
                           <span className="text-sm text-gray-700 dark:text-gray-300">{t}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
               
               {/* Limpar Filtros */}
               {(selectedSectors.length > 0 || selectedRoles.length > 0 || selectedTypes.length > 0) && (
                 <button
                   onClick={() => {
                     setSelectedSectors([]);
                     setSelectedRoles([]);
                     setSelectedTypes([]);
                   }}
                   className="px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex items-center gap-1"
                 >
                   <X size={14} />
                   Limpar
                 </button>
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
                     if (selectedSectors.length > 0 && !selectedSectors.includes(item.sector)) return false;
                     if (selectedRoles.length > 0 && !selectedRoles.includes(item.role)) return false;
                     if (selectedTypes.length > 0 && !selectedTypes.includes(item.type)) return false;
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