import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// Função para gerar cor de gradiente suave estilo Looker Studio (heatmap)
const getHeatmapColor = (score: number): { bg: string; text: string } => {
  // Gradiente suave de vermelho → amarelo → verde
  if (score >= 9) return { bg: '#10B981', text: '#FFFFFF' }; // Verde escuro
  if (score >= 8.5) return { bg: '#34D399', text: '#FFFFFF' }; // Verde claro
  if (score >= 8) return { bg: '#6EE7B7', text: '#065F46' }; // Verde muito claro
  if (score >= 7.5) return { bg: '#FCD34D', text: '#78350F' }; // Amarelo claro
  if (score >= 7) return { bg: '#FBBF24', text: '#78350F' }; // Amarelo
  if (score >= 6.5) return { bg: '#F59E0B', text: '#FFFFFF' }; // Laranja claro
  if (score >= 6) return { bg: '#F97316', text: '#FFFFFF' }; // Laranja
  if (score >= 5) return { bg: '#EF4444', text: '#FFFFFF' }; // Vermelho claro
  return { bg: '#DC2626', text: '#FFFFFF' }; // Vermelho escuro
};

export const PerformanceAnalysis = ({ data }: { data: any }) => {
  const { matrixData, evolutionData, sectorEvolutionData, allSectors } = data;
  
  // Estados para ordenação e filtros do heatmap
  const [sortBy, setSortBy] = useState<'criteria' | 'average' | 'sector'>('average');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('Todos');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('Todos');
  
  // Estados para mostrar/ocultar setores no gráfico
  const [visibleSectors, setVisibleSectors] = useState<Set<string>>(() => new Set(allSectors));
  
  // Atualizar setores visíveis quando allSectors mudar
  React.useEffect(() => {
    setVisibleSectors(new Set(allSectors));
  }, [allSectors]);

  // Ordena os dados da matriz
  const sortedMatrix = useMemo(() => {
    let sorted = [...matrixData];
    
    if (sortBy === 'average') {
      sorted.sort((a, b) => sortDirection === 'asc' ? a.average - b.average : b.average - a.average);
    } else if (sortBy === 'criteria') {
      sorted.sort((a, b) => {
        const comparison = a.criteria.localeCompare(b.criteria);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy === 'sector' && selectedSectorFilter !== 'Todos') {
      sorted.sort((a, b) => {
        const aVal = a[selectedSectorFilter] || 0;
        const bVal = b[selectedSectorFilter] || 0;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    
    return sorted;
  }, [matrixData, sortBy, sortDirection, selectedSectorFilter]);

  // Dados para o gráfico de Gaps (focado em valores baixos - gaps de melhoria)
  const gapData = useMemo(() => {
    // Ordena por menor nota primeiro (maiores gaps)
    const sorted = [...matrixData].sort((a, b) => a.average - b.average);
    return sorted.map((m: any) => ({
      name: m.criteria.length > 25 ? m.criteria.substring(0, 25) + '...' : m.criteria,
      fullName: m.criteria,
      Gap: parseFloat((10 - m.average).toFixed(2)), // Gap (oportunidade de melhoria)
      Atual: m.average // Performance atual
    }));
  }, [matrixData]);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Gráfico de Evolução por Nível (Linhas) */}
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Evolução Temporal por Nível</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhamento das médias mensais por nível hierárquico.</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{fontSize: 12}} />
              <YAxis domain={[0, 10]} stroke="#9ca3af" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}}
                itemStyle={{color: '#fff'}}
              />
              <Legend />
              
              <Line type="monotone" dataKey="Estratégico" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4}} name="Estratégico" />
              <Line type="monotone" dataKey="Tático" stroke="#3B82F6" strokeWidth={3} dot={{r: 4}} name="Tático" />
              <Line type="monotone" dataKey="Operacional" stroke="#10B981" strokeWidth={3} dot={{r: 4}} name="Operacional" />
              <Line type="monotone" dataKey="Média Geral" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" name="Média Geral" />
              <Line type="monotone" dataKey="Meta" stroke="#EF4444" strokeWidth={1} dot={false} name="Meta 9,0" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 1.2. Gráfico de Evolução por Setor (Linhas) */}
      {sectorEvolutionData && sectorEvolutionData.length > 0 && (
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Evolução Temporal por Setor</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhamento das médias mensais por setor. Clique na legenda para mostrar/ocultar setores.</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sectorEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{fontSize: 12}} />
                <YAxis domain={[0, 10]} stroke="#9ca3af" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                />
                <Legend 
                  onClick={(e: any) => {
                    const sectorName = e.dataKey;
                    setVisibleSectors(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(sectorName)) {
                        newSet.delete(sectorName);
                      } else {
                        newSet.add(sectorName);
                      }
                      return newSet;
                    });
                  }}
                />
                
                {allSectors.map((sector: string, idx: number) => {
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
                  const color = colors[idx % colors.length];
                  const isVisible = visibleSectors.has(sector);
                  
                  return (
                    <Line 
                      key={sector}
                      type="monotone" 
                      dataKey={sector} 
                      stroke={color} 
                      strokeWidth={isVisible ? 2 : 0}
                      strokeOpacity={isVisible ? 1 : 0}
                      dot={isVisible ? {r: 3} : false}
                      name={sector}
                      hide={!isVisible}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 2. Matriz de Competências (Heatmap Dinâmico) */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col">
             <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">Heatmap de Competências</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cruzamento de médias: Competência vs Setor</p>
                
                {/* Controles de Ordenação */}
                <div className="flex gap-3 flex-wrap">
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Ordenar por:</span>
                      <select
                         value={sortBy}
                         onChange={(e) => setSortBy(e.target.value as any)}
                         className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-[#121212] text-gray-700 dark:text-gray-300"
                      >
                         <option value="average">Média Geral</option>
                         <option value="criteria">Competência</option>
                         {selectedSectorFilter !== 'Todos' && <option value="sector">Setor Selecionado</option>}
                      </select>
                      <button
                         onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                         className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                         {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Filtrar Setor:</span>
                      <select
                         value={selectedSectorFilter}
                         onChange={(e) => setSelectedSectorFilter(e.target.value)}
                         className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-[#121212] text-gray-700 dark:text-gray-300"
                      >
                         <option value="Todos">Todos</option>
                         {allSectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>
             </div>
             
             <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-xs text-center border-collapse">
                   <thead className="text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-[#121212]">
                      <tr>
                         <th className="p-3 text-left min-w-[150px] sticky left-0 bg-gray-50 dark:bg-[#121212] z-10 border-b dark:border-gray-700">
                           Competência
                         </th>
                         {allSectors.map((s: string) => (
                           <th key={s} className="p-2 border-b dark:border-gray-700 min-w-[70px] max-w-[90px] truncate text-[10px]" title={s}>
                             {s}
                           </th>
                         ))}
                         <th className="p-3 border-b dark:border-gray-700 min-w-[70px] bg-gray-100 dark:bg-gray-900 font-bold">
                           Média Geral
                         </th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sortedMatrix.map((row: any) => {
                         const avgColor = getHeatmapColor(row.average);
                         return (
                            <tr key={row.criteria} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                               <td className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                 {row.criteria}
                               </td>
                               {allSectors.map((s: string) => {
                                  const score = row[s];
                                  if (score === undefined) {
                                    return (
                                      <td key={s} className="p-1">
                                        <span className="text-gray-200 dark:text-gray-800">-</span>
                                      </td>
                                    );
                                  }
                                  const color = getHeatmapColor(score);
                                  return (
                                    <td key={s} className="p-1">
                                      <div 
                                        className="flex items-center justify-center w-full h-full rounded px-2 py-1.5 font-bold text-[11px] transition-all hover:scale-105"
                                        style={{ 
                                          backgroundColor: color.bg,
                                          color: color.text
                                        }}
                                        title={`Setor: ${s}\nNota: ${score.toFixed(2)}`}
                                      >
                                        {score.toFixed(1)}
                                      </div>
                                    </td>
                                  );
                               })}
                               <td className="p-2 bg-gray-50 dark:bg-gray-900">
                                 <div 
                                   className="flex items-center justify-center w-full h-full rounded px-2 py-1.5 font-bold text-xs"
                                   style={{ 
                                     backgroundColor: avgColor.bg,
                                     color: avgColor.text
                                   }}
                                 >
                                   {row.average.toFixed(1)}
                                 </div>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
             <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] flex gap-4 text-xs justify-center flex-wrap">
                <div className="flex items-center gap-1">
                   <div className="w-4 h-4 rounded" style={{ backgroundColor: '#DC2626' }}></div>
                   <span className="text-gray-600 dark:text-gray-400">0-5</span>
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }}></div>
                   <span className="text-gray-600 dark:text-gray-400">5-6</span>
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FBBF24' }}></div>
                   <span className="text-gray-600 dark:text-gray-400">6-7</span>
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FCD34D' }}></div>
                   <span className="text-gray-600 dark:text-gray-400">7-8</span>
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6EE7B7' }}></div>
                   <span className="text-gray-600 dark:text-gray-400">8-9</span>
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
                   <span className="text-gray-600 dark:text-gray-400">9-10</span>
                </div>
             </div>
          </div>

          {/* 3. Gráfico de Gaps (Focado em Oportunidades de Melhoria) */}
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Análise de Gaps</h3>
             <p className="text-sm text-gray-500 mb-6">Competências que mais precisam de treinamento. Quanto maior a barra de Gap, maior a oportunidade de melhoria.</p>
             
             <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart 
                      data={gapData} 
                      layout="vertical" 
                      margin={{ left: 150, right: 20, top: 20, bottom: 20 }}
                   >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                      <XAxis 
                        type="number" 
                        domain={[0, 10]} 
                        stroke="#9ca3af" 
                        tick={{fontSize: 11}}
                        label={{ value: 'Nota', position: 'insideBottom', offset: -5, style: { fill: '#6B7280' } }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={140} 
                        tick={{fontSize: 10, fill: '#6B7280'}} 
                        interval={0}
                      />
                      <Tooltip 
                        cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} 
                        contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}}
                        formatter={(value: any, name: string, props: any) => {
                          if (name === 'Gap') {
                            return [`${value.toFixed(1)} pontos de oportunidade`, 'Gap'];
                          }
                          return [`${value.toFixed(1)}`, 'Performance Atual'];
                        }}
                        labelFormatter={(label) => `Competência: ${gapData.find(d => d.name === label)?.fullName || label}`}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        formatter={(value) => value === 'Gap' ? 'Gap (Oportunidade)' : 'Performance Atual'}
                      />
                      {/* Barra de Gap (oportunidade) - aparece primeiro para destacar */}
                      <Bar 
                        dataKey="Gap" 
                        stackId="a" 
                        fill="#EF4444" 
                        name="Gap" 
                        radius={[0, 4, 4, 0]} 
                        barSize={28}
                      />
                      {/* Barra de Performance Atual */}
                      <Bar 
                        dataKey="Atual" 
                        stackId="a" 
                        fill="#3B82F6" 
                        name="Atual" 
                        radius={[0, 0, 0, 0]} 
                        barSize={28}
                      />
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-700 dark:text-red-300">
                   <strong>Interpretação:</strong> As barras vermelhas (Gap) mostram o quanto cada competência está abaixo da nota máxima (10). 
                   Quanto maior o gap, maior a necessidade de treinamento e desenvolvimento.
                </p>
             </div>
          </div>

      </div>
    </div>
  );
};