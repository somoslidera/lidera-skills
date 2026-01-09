import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Area, AreaChart, ReferenceLine, ReferenceArea, Brush
} from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { ChartInfoTooltip } from '../../ui/ChartInfoTooltip';

// Função para calcular luminosidade de uma cor (0-255)
const getLuminance = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b);
};

// Função para gerar cor de gradiente baseada na escala (0-10)
// Gradiente: Vermelho → Laranja → Amarelo → Dourado (pior->melhor)
const getHeatmapColor = (score: number): { bg: string; text: string } => {
  // Normaliza o score para 0-10
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  let bgColor: string;
  // Mapeia para gradiente dourado->vermelho (melhor->pior)
  if (normalizedScore >= 9) bgColor = '#D4AF37'; // Dourado (9-10) - melhor
  else if (normalizedScore >= 8) bgColor = '#EAB308'; // Amarelo dourado (8-9)
  else if (normalizedScore >= 7) bgColor = '#F59E0B'; // Amarelo-laranja (7-8)
  else if (normalizedScore >= 6) bgColor = '#F97316'; // Laranja (6-7)
  else if (normalizedScore >= 5) bgColor = '#FB923C'; // Laranja claro (5-6)
  else if (normalizedScore >= 4) bgColor = '#EF4444'; // Vermelho-laranja (4-5)
  else if (normalizedScore >= 3) bgColor = '#F87171'; // Vermelho claro (3-4)
  else if (normalizedScore >= 2) bgColor = '#DC2626'; // Vermelho (2-3)
  else if (normalizedScore >= 1) bgColor = '#B91C1C'; // Vermelho escuro (1-2)
  else bgColor = '#991B1B'; // Vermelho muito escuro (0-1) - pior
  
  // Determina cor do texto baseado na luminosidade (escura para cores claras, clara para cores escuras)
  const luminance = getLuminance(bgColor);
  const textColor = luminance > 128 ? '#1F2937' : '#FFFFFF'; // Escuro se claro, branco se escuro
  
  return { bg: bgColor, text: textColor };
};

export const PerformanceAnalysis = ({ data }: { data: any }) => {
  const { matrixData, evolutionData, sectorEvolutionData, allSectors } = data;
  
  // Estados para ordenação e filtros do heatmap
  const [sortBy, setSortBy] = useState<'criteria' | 'average' | 'sector' | 'type'>('average');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('Todos');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('Todos');
  
  // Estados para mostrar/ocultar setores no gráfico
  const [visibleSectors, setVisibleSectors] = useState<Set<string>>(() => new Set(allSectors));
  
  // Estado para highlight no heatmap
  const [hoveredCell, setHoveredCell] = useState<{criteria: string, sector: string} | null>(null);
  
  // Atualizar setores visíveis quando allSectors mudar
  React.useEffect(() => {
    setVisibleSectors(new Set(allSectors));
  }, [allSectors]);

  // Ordena os dados da matriz
  const sortedMatrix = useMemo(() => {
    let sorted = [...matrixData];
    
    // Filtro por nível
    if (selectedLevelFilter !== 'Todos') {
      sorted = sorted.filter((row: any) => (row.type || 'Operacional') === selectedLevelFilter);
    }
    
    // Filtro por setor - filtra linhas que não têm dados para o setor selecionado
    if (selectedSectorFilter !== 'Todos') {
      sorted = sorted.filter((row: any) => {
        const sectorValue = row[selectedSectorFilter];
        return sectorValue !== undefined && sectorValue !== null && !isNaN(sectorValue);
      });
    }
    
    if (sortBy === 'average') {
      sorted.sort((a, b) => sortDirection === 'asc' ? a.average - b.average : b.average - a.average);
    } else if (sortBy === 'criteria') {
      sorted.sort((a, b) => {
        const comparison = a.criteria.localeCompare(b.criteria);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy === 'type') {
      sorted.sort((a, b) => {
        const typeOrder: Record<string, number> = { 'Estratégico': 1, 'Tático': 2, 'Operacional': 3 };
        const aOrder = typeOrder[a.type || 'Operacional'] || 3;
        const bOrder = typeOrder[b.type || 'Operacional'] || 3;
        if (aOrder !== bOrder) {
          return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
        }
        // Se mesmo nível, ordena por nome
        return a.criteria.localeCompare(b.criteria);
      });
    } else if (sortBy === 'sector' && selectedSectorFilter !== 'Todos') {
      sorted.sort((a, b) => {
        const aVal = a[selectedSectorFilter] || 0;
        const bVal = b[selectedSectorFilter] || 0;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    
    return sorted;
  }, [matrixData, sortBy, sortDirection, selectedSectorFilter, selectedLevelFilter]);

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
      <div className="bg-white dark:bg-navy-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Evolução Temporal por Nível</h3>
              <ChartInfoTooltip
                title="Evolução Temporal por Nível"
                description="Este gráfico mostra a evolução da performance média ao longo do tempo, separada por nível hierárquico (Estratégico, Tático, Operacional). Use para identificar tendências e melhorias ao longo dos meses."
                usage="Cada linha representa um nível. A linha tracejada mostra a média geral. Passe o mouse sobre os pontos para ver valores específicos. Use a legenda para mostrar/ocultar níveis."
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhamento das médias mensais por nível hierárquico.</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="gradientEstrategico" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradientTatico" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradientOperacional" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{fontSize: 12}} />
              <YAxis domain={[0, 10]} stroke="#9ca3af" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff', padding: '12px', fontSize: '14px'}}
                itemStyle={{color: '#fff', fontSize: '14px'}}
                labelStyle={{color: '#fff', fontSize: '14px', fontWeight: 'bold'}}
                cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Legend />
              
              {/* Zonas de referência */}
              <ReferenceArea y1={9} y2={10} fill="#10B981" fillOpacity={0.1} stroke="none" />
              <ReferenceArea y1={7} y2={9} fill="#EAB308" fillOpacity={0.1} stroke="none" />
              <ReferenceArea y1={0} y2={7} fill="#EF4444" fillOpacity={0.1} stroke="none" />
              
              {/* Linhas de referência */}
              <ReferenceLine y={9} stroke="#D4AF37" strokeWidth={2} strokeDasharray="3 3" label={{ value: "Meta", position: "right", fill: "#D4AF37", fontSize: 12 }} />
              <ReferenceLine y={7} stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.5} />
              
              <Area type="monotone" dataKey="Estratégico" stroke="#8B5CF6" strokeWidth={3} fill="url(#gradientEstrategico)" fillOpacity={1} name="Estratégico" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" dot={{r: 4}} />
              <Area type="monotone" dataKey="Tático" stroke="#3B82F6" strokeWidth={3} fill="url(#gradientTatico)" fillOpacity={1} name="Tático" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" dot={{r: 4}} />
              <Area type="monotone" dataKey="Operacional" stroke="#10B981" strokeWidth={3} fill="url(#gradientOperacional)" fillOpacity={1} name="Operacional" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" dot={{r: 4}} />
              <Line type="monotone" dataKey="Média Geral" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" name="Média Geral" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" dot={false} />
              <Line type="monotone" dataKey="Meta" stroke="#EF4444" strokeWidth={1} dot={false} name="Meta 9,0" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
              <Brush dataKey="date" height={30} stroke="#9ca3af" fill="#1f2937" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 1.2. Gráfico de Evolução por Setor (Linhas) */}
      {sectorEvolutionData && sectorEvolutionData.length > 0 && (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Evolução Temporal por Setor</h3>
                <ChartInfoTooltip
                  title="Evolução Temporal por Setor"
                  description="Este gráfico mostra a evolução da performance média ao longo do tempo, separada por setor. Use para comparar o desempenho de diferentes áreas da empresa."
                  usage="Cada linha representa um setor. Clique na legenda para mostrar/ocultar setores específicos. Passe o mouse sobre os pontos para ver valores."
                />
              </div>
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
                  contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff', padding: '12px', fontSize: '14px'}}
                  itemStyle={{color: '#fff', fontSize: '14px'}}
                  labelStyle={{color: '#fff', fontSize: '14px', fontWeight: 'bold'}}
                  cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '3 3' }}
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

      {/* 2. Matriz de Competências (Heatmap Dinâmico - Largura Total) */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700 flex flex-col">
             <div className="p-6 border-b border-gray-100 dark:border-navy-700">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">Heatmap de Competências</h3>
                  <ChartInfoTooltip
                    title="Heatmap de Competências"
                    description="Este heatmap mostra a média de cada competência (métrica) em cada setor. Use para identificar quais competências estão bem desenvolvidas em cada área e onde há oportunidades de melhoria."
                    usage="Cada célula mostra a média da competência no setor. Cores verdes indicam boa performance, amarelas indicam média, e vermelhas indicam baixa. Passe o mouse sobre uma célula para destacar a linha e coluna correspondentes."
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cruzamento de médias: Competência vs Setor</p>
                
                {/* Controles de Ordenação e Filtros */}
                <div className="flex gap-3 flex-wrap items-end">
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Ordenar por:</span>
                      <select
                         value={sortBy}
                         onChange={(e) => setSortBy(e.target.value as any)}
                         className="px-2 py-1 text-xs border border-gray-200 dark:border-navy-700 rounded bg-white dark:bg-navy-900 text-gray-700 dark:text-gray-300"
                      >
                         <option value="average">Média Geral</option>
                         <option value="type">Nível</option>
                         <option value="criteria">Métrica</option>
                         {selectedSectorFilter !== 'Todos' && <option value="sector">Setor Selecionado</option>}
                      </select>
                      <button
                         onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                         className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                         title={sortDirection === 'asc' ? 'Crescente' : 'Decrescente'}
                      >
                         {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Filtrar Nível:</span>
                      <select
                         value={selectedLevelFilter}
                         onChange={(e) => setSelectedLevelFilter(e.target.value)}
                         className="px-2 py-1 text-xs border border-gray-200 dark:border-navy-700 rounded bg-white dark:bg-navy-900 text-gray-700 dark:text-gray-300"
                      >
                         <option value="Todos">Todos</option>
                         <option value="Estratégico">Estratégico</option>
                         <option value="Tático">Tático</option>
                         <option value="Operacional">Operacional</option>
                      </select>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Filtrar Setor:</span>
                      <select
                         value={selectedSectorFilter}
                         onChange={(e) => setSelectedSectorFilter(e.target.value)}
                         className="px-2 py-1 text-xs border border-gray-200 dark:border-navy-700 rounded bg-white dark:bg-navy-900 text-gray-700 dark:text-gray-300"
                      >
                         <option value="Todos">Todos</option>
                         {allSectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>
             </div>
             
             <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-xs text-center border-collapse">
                   <thead className="text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-navy-900">
                      <tr>
                         <th className="p-2 text-left min-w-[80px] sticky left-0 bg-gray-50 dark:bg-navy-900 z-10 border-b dark:border-navy-700">
                           Nível
                         </th>
                         <th className="p-3 text-left min-w-[180px] sticky left-[80px] bg-gray-50 dark:bg-navy-900 z-10 border-b dark:border-navy-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                           Métrica
                         </th>
                         {(selectedSectorFilter === 'Todos' ? allSectors : [selectedSectorFilter]).map((s: string) => (
                           <th key={s} className="p-2 border-b dark:border-navy-700 min-w-[70px] max-w-[90px] truncate text-[10px]" title={s}>
                             {s}
                           </th>
                         ))}
                         <th className="p-3 border-b dark:border-navy-700 min-w-[80px] bg-gray-100 dark:bg-navy-900 font-bold">
                           Média Geral
                         </th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sortedMatrix.map((row: any) => {
                         const avgColor = getHeatmapColor(row.average);
                         const nivelColor = row.type === 'Estratégico' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                          row.type === 'Tático' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
                         const isRowHighlighted = hoveredCell?.criteria === row.criteria;
                         return (
                            <tr 
                              key={row.criteria} 
                              className={`transition-colors ${
                                isRowHighlighted 
                                  ? 'bg-blue-100 dark:bg-blue-900/40' 
                                  : 'hover:bg-gray-50 dark:hover:bg-navy-700/30'
                              }`}
                            >
                               <td className="p-2 text-center sticky left-0 bg-white dark:bg-navy-800 z-10">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold ${nivelColor}`}>
                                   {row.type || 'Operacional'}
                                 </span>
                               </td>
                               <td className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300 sticky left-[80px] bg-white dark:bg-navy-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                 {row.criteria}
                               </td>
                               {(selectedSectorFilter === 'Todos' ? allSectors : [selectedSectorFilter]).map((s: string) => {
                                  const score = row[s];
                                  const isCellHighlighted = hoveredCell?.criteria === row.criteria && hoveredCell?.sector === s;
                                  const isColumnHighlighted = hoveredCell?.sector === s;
                                  
                                  if (score === undefined) {
                                    return (
                                      <td key={s} className="p-0">
                                        <div className={`w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${
                                          isColumnHighlighted ? 'ring-2 ring-blue-500 dark:ring-gold-500' : ''
                                        }`}>
                                          <span className="text-gray-300 dark:text-gray-700 text-[11px]">-</span>
                                        </div>
                                      </td>
                                    );
                                  }
                                  const color = getHeatmapColor(score);
                                  return (
                                    <td key={s} className="p-0">
                                      <div 
                                        className={`flex items-center justify-center w-full h-full font-bold text-[11px] min-h-[40px] transition-all ${
                                          isCellHighlighted ? 'ring-4 ring-blue-500 dark:ring-gold-500 scale-105 z-20 relative' :
                                          isColumnHighlighted ? 'ring-2 ring-blue-400 dark:ring-gold-400/50' : ''
                                        }`}
                                        style={{ 
                                          backgroundColor: color.bg,
                                          color: color.text
                                        }}
                                        title={`Setor: ${s}\nNota: ${score.toFixed(2)}`}
                                        onMouseEnter={() => setHoveredCell({criteria: row.criteria, sector: s})}
                                        onMouseLeave={() => setHoveredCell(null)}
                                      >
                                        {score.toFixed(1)}
                                      </div>
                                    </td>
                                  );
                               })}
                               <td className="p-0">
                                 <div 
                                   className={`flex items-center justify-center w-full h-full font-bold text-xs min-h-[40px] bg-gray-50 dark:bg-navy-900 ${
                                     isRowHighlighted ? 'ring-2 ring-blue-400 dark:ring-gold-400/50' : ''
                                   }`}
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
             <div className="p-4 border-t border-gray-100 dark:border-navy-700 bg-gray-50 dark:bg-navy-900">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Formato</span>
                </div>
                <div className="flex items-center justify-center">
                   {/* Gradiente de 10 segmentos */}
                   <div className="flex h-8 w-full max-w-2xl">
                      <div className="flex-1" style={{ backgroundColor: '#DC2626' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#EF4444' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#FB923C' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#F97316' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#F59E0B' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#EAB308' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#84CC16' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#4ADE80' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#22C55E' }}></div>
                      <div className="flex-1" style={{ backgroundColor: '#166534' }}></div>
                   </div>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                   <span>0</span>
                   <span>5</span>
                   <span>10</span>
                </div>
             </div>
          </div>

      {/* 3. Gráfico de Gaps (Focado em Oportunidades de Melhoria) */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-navy-800 dark:to-navy-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-navy-700">
             <div className="flex items-center gap-2 mb-2">
               <h3 className="text-lg font-bold text-gray-800 dark:text-white">Análise de Gaps</h3>
               <ChartInfoTooltip
                 title="Análise de Gaps"
                 description="Este gráfico mostra as oportunidades de melhoria para cada competência. O Gap é calculado como a diferença entre a nota máxima (10) e a performance atual."
                 usage="Barras vermelhas maiores indicam maiores oportunidades de melhoria. Foque em desenvolver competências com gaps maiores para maximizar o impacto do treinamento."
               />
             </div>
             <p className="text-sm text-gray-500 mb-6">Competências que mais precisam de treinamento. Quanto maior a barra de Gap, maior a oportunidade de melhoria.</p>
             
             <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart 
                      data={gapData} 
                      layout="vertical" 
                      margin={{ left: 250, right: 30, top: 30, bottom: 30 }}
                      barCategoryGap="20%"
                   >
                      <defs>
                        <linearGradient id="gapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#DC2626" stopOpacity={0.6} />
                        </linearGradient>
                        <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.7} />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                      <XAxis 
                        type="number" 
                        domain={[0, 10]} 
                        stroke="#9ca3af" 
                        tick={{fontSize: 12}}
                        tickFormatter={(value) => value.toFixed(0)}
                        label={{ value: 'Nota', position: 'insideBottom', offset: -5, style: { fill: '#6B7280' } }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={240} 
                        tick={{fontSize: 12, fill: '#6B7280'}} 
                        interval={0}
                      />
                      <Tooltip 
                        cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} 
                        contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff', padding: '12px'}}
                        formatter={(value: number, name: string) => {
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
                        fill="url(#gapGradient)" 
                        name="Gap" 
                        radius={[0, 6, 6, 0]} 
                        barSize={32}
                        stroke="#DC2626"
                        strokeWidth={1}
                        isAnimationActive={true}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                      {/* Barra de Performance Atual */}
                      <Bar 
                        dataKey="Atual" 
                        stackId="a" 
                        fill="url(#performanceGradient)" 
                        name="Atual" 
                        radius={[0, 0, 0, 0]} 
                        barSize={32}
                        stroke="#2563EB"
                        strokeWidth={1}
                        isAnimationActive={true}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                   <strong>Interpretação:</strong> As barras vermelhas (Gap) mostram o quanto cada competência está abaixo da nota máxima (10). 
                   Quanto maior o gap, maior a necessidade de treinamento e desenvolvimento.
                </p>
             </div>
          </div>

    </div>
  );
};