import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card } from '../../ui/Card';
import { Users, Briefcase, Award, TrendingUp, AlertCircle, CheckCircle, Star, Filter } from 'lucide-react';

const COLORS = ['#0F52BA', '#4CA1AF', '#10B981', '#F59E0B', '#EF4444'];
const COLOR_OTHER = '#9CA3AF'; // Cor cinza para "Outros"

// Função para gerar cor de gradiente estilo Looker Studio (heatmap suave)
const getHeatmapColor = (score: number): string => {
  // Gradiente de vermelho (0) → amarelo (5) → verde (10)
  if (score >= 9) return '#10B981'; // Verde escuro
  if (score >= 8) return '#34D399'; // Verde claro
  if (score >= 7) return '#FCD34D'; // Amarelo claro
  if (score >= 6) return '#FBBF24'; // Amarelo
  if (score >= 5) return '#F59E0B'; // Laranja claro
  if (score >= 4) return '#EF4444'; // Vermelho claro
  return '#DC2626'; // Vermelho escuro
};

// Função para gerar cor de fundo com opacidade (estilo Looker Studio)
const getHeatmapBgColor = (score: number): string => {
  const color = getHeatmapColor(score);
  // Converte hex para rgba com opacidade baseada na nota
  const opacity = Math.min(0.3 + (score / 10) * 0.4, 0.7); // Opacidade entre 0.3 e 0.7
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
};

export const CompanyOverview = ({ data }: { data: any }) => {
  const { 
    healthScore, 
    activeSectorsCount, 
    activeEmployeesCount, 
    activeRolesCount, 
    sectorDistribution, 
    roleDistribution, 
    topEmployee, 
    totalEvaluations,
    performanceList 
  } = data;
  
  const [selectedLevel, setSelectedLevel] = useState<string>('Todos');

  // Cor do Health Score
  const healthColor = healthScore >= 8 ? 'text-emerald-500' : healthScore >= 6 ? 'text-yellow-500' : 'text-red-500';
  
  // Filtrar performanceList por nível
  const filteredPerformanceList = useMemo(() => {
    if (selectedLevel === 'Todos') return performanceList;
    return performanceList.filter((item: any) => {
      const nivel = item.realType || item.type || 'Operacional';
      return nivel === selectedLevel;
    });
  }, [performanceList, selectedLevel]);
  
  // Obter níveis únicos disponíveis
  const availableLevels = useMemo<string[]>(() => {
    const levels = new Set<string>(performanceList.map((item: any) => item.realType || item.type || 'Operacional'));
    return ['Todos', ...Array.from(levels).sort()];
  }, [performanceList]);

  // Função auxiliar para cores do gráfico (inclui "Outros")
  const getSliceColor = (entry: any, index: number) => {
    if (entry.name === 'Outros') return COLOR_OTHER;
    return COLORS[index % COLORS.length];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Scorecards Superiores */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Colaboradores" value={activeEmployeesCount} icon={Users} className="bg-blue-50 dark:bg-blue-900/10" />
        <Card title="Setores" value={activeSectorsCount} icon={Briefcase} />
        <Card title="Cargos" value={activeRolesCount} icon={Award} />
        <Card title="Avaliações" value={totalEvaluations} icon={TrendingUp} />
        <Card title="Férias" value={0} icon={CheckCircle} subtitle="Mock Data" /> 
        <Card title="Afastados" value={0} icon={AlertCircle} subtitle="Mock Data" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Medidor de Saúde */}
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 absolute top-6 left-6">Saúde da Empresa</h3>
          <div className="relative mt-8">
            <ResponsiveContainer width={250} height={250}>
               <PieChart>
                 <Pie
                    data={[{ value: healthScore }, { value: 10 - healthScore }]}
                    cx="50%" cy="50%"
                    innerRadius={80} outerRadius={100}
                    startAngle={180} endAngle={0}
                    dataKey="value"
                 >
                    <Cell fill={healthScore >= 8 ? '#10B981' : healthScore >= 6 ? '#F59E0B' : '#EF4444'} />
                    <Cell fill="#e5e7eb" />
                 </Pie>
               </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center -mt-8">
               <span className={`text-5xl font-bold ${healthColor}`}>{healthScore.toFixed(1)}</span>
               <span className="block text-sm text-gray-400">de 10.0</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-[-40px]">Baseado na média geral das avaliações do período.</p>
        </div>

        {/* 3. Distribuição de Setores (Rosca) */}
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
           <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Setores Ativos</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                   data={sectorDistribution} 
                   cx="50%" cy="50%" 
                   innerRadius={60} 
                   outerRadius={80} 
                   paddingAngle={5} 
                   dataKey="value"
                 >
                   {sectorDistribution.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={getSliceColor(entry, index)} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* 4. Distribuição de Cargos (Rosca) */}
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
           <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Cargos Ativos</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                   data={roleDistribution} 
                   cx="50%" cy="50%" 
                   innerRadius={60} 
                   outerRadius={80} 
                   paddingAngle={5} 
                   dataKey="value"
                 >
                   {roleDistribution.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={getSliceColor(entry, index + 2)} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* 5. Tabela Resumo e Destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Tabela Resumo com Mapa de Calor */}
         <div className="lg:col-span-2 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
               <h3 className="font-bold text-gray-800 dark:text-white">Resumo de Performance (Top 10)</h3>
               <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                     value={selectedLevel}
                     onChange={(e) => setSelectedLevel(e.target.value)}
                     className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#121212] text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20"
                  >
                     {availableLevels.map((level: string) => (
                        <option key={level} value={level}>{level}</option>
                     ))}
                  </select>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500 font-medium">
                     <tr>
                        <th className="p-3 text-left">Rank</th>
                        <th className="p-3 text-left">Nome</th>
                        <th className="p-3 text-left">Setor</th>
                        <th className="p-3 text-left">Cargo</th>
                        <th className="p-3 text-left">Nível</th>
                        <th className="p-3 text-center">Nota</th>
                        <th className="p-3 text-center">Destaque</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredPerformanceList.length > 0 ? (
                       filteredPerformanceList.slice(0, 10).map((item: any, idx: number) => {
                         const score = item.score || 0;
                         const bgColor = getHeatmapColor(score);
                         const isDestaque = item.funcionarioMes === 'Sim' || item.funcionarioMes === 'sim';
                         
                         return (
                           <tr key={item.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="p-3 text-gray-400 font-mono text-xs">#{idx + 1}</td>
                              <td className="p-3 font-medium text-gray-700 dark:text-gray-300">
                                 {item.realName}
                              </td>
                              <td className="p-3 text-gray-500">{item.realSector}</td>
                              <td className="p-3 text-gray-500">{item.realRole}</td>
                              <td className="p-3">
                                 <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                    {item.realType || item.type || 'Operacional'}
                                 </span>
                              </td>
                              <td className="p-3">
                                 <div 
                                    className="text-center rounded px-3 py-1.5 font-bold text-white text-sm"
                                    style={{ 
                                       backgroundColor: bgColor,
                                       opacity: 0.85
                                    }}
                                 >
                                    {score.toFixed(1)}
                                 </div>
                              </td>
                              <td className="p-3 text-center">
                                 {isDestaque ? (
                                    <Star size={18} className="text-yellow-500 fill-yellow-500 mx-auto" />
                                 ) : (
                                    <span className="text-gray-300 dark:text-gray-700">-</span>
                                 )}
                              </td>
                           </tr>
                         );
                       })
                     ) : (
                       <tr>
                         <td colSpan={7} className="p-6 text-center text-gray-500">Nenhum dado encontrado para o período.</td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] flex items-center justify-center gap-4 text-xs">
               <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Legenda:</span>
                  <div className="flex items-center gap-1">
                     <div className="w-4 h-4 rounded" style={{ backgroundColor: '#DC2626' }}></div>
                     <span className="text-gray-500">0-4</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
                     <span className="text-gray-500">5-6</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FCD34D' }}></div>
                     <span className="text-gray-500">7-8</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <div className="w-4 h-4 rounded" style={{ backgroundColor: '#34D399' }}></div>
                     <span className="text-gray-500">9-10</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Funcionário do Mês Card */}
         {topEmployee && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-20"><Award size={100} /></div>
               <h3 className="text-blue-100 uppercase tracking-widest text-xs font-bold mb-4">Destaque do Período</h3>
               
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                     {topEmployee.realName.charAt(0)}
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold line-clamp-1" title={topEmployee.realName}>{topEmployee.realName}</h2>
                     <p className="text-blue-200">{topEmployee.realRole}</p>
                  </div>
               </div>

               <div className="flex justify-between items-end border-t border-white/20 pt-4">
                  <div>
                     <p className="text-xs text-blue-200">Setor</p>
                     <p className="font-medium">{topEmployee.realSector}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs text-blue-200">Nota Média</p>
                     <p className="text-3xl font-bold">{topEmployee.score.toFixed(1)}</p>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};