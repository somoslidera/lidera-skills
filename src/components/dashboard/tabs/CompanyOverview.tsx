import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Card } from '../../ui/Card';
import { Users, Briefcase, Award, TrendingUp, AlertCircle, CheckCircle, Star, Filter } from 'lucide-react';

const COLORS = ['#0F52BA', '#4CA1AF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];
const COLOR_OTHER = '#9CA3AF'; // Cor cinza para "Outros"

// Função para calcular luminosidade de uma cor (0-255)
const getLuminance = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b);
};

// Função para gerar cor de gradiente baseada na escala de 10 cores (0-10)
// Gradiente: Vermelho → Laranja → Amarelo → Verde
const getHeatmapColor = (score: number): { bg: string; text: string } => {
  // Normaliza o score para 0-10
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  let bgColor: string;
  // Mapeia para 10 segmentos de cores (0-1, 1-2, ..., 9-10)
  if (normalizedScore >= 9) bgColor = '#166534'; // Verde escuro (9-10)
  else if (normalizedScore >= 8) bgColor = '#22C55E'; // Verde médio (8-9)
  else if (normalizedScore >= 7) bgColor = '#4ADE80'; // Verde claro (7-8)
  else if (normalizedScore >= 6) bgColor = '#84CC16'; // Verde-amarelo (6-7)
  else if (normalizedScore >= 5) bgColor = '#EAB308'; // Amarelo (5-6)
  else if (normalizedScore >= 4) bgColor = '#F59E0B'; // Laranja claro (4-5)
  else if (normalizedScore >= 3) bgColor = '#F97316'; // Laranja (3-4)
  else if (normalizedScore >= 2) bgColor = '#FB923C'; // Laranja claro (2-3)
  else if (normalizedScore >= 1) bgColor = '#EF4444'; // Vermelho-laranja (1-2)
  else bgColor = '#DC2626'; // Vermelho escuro (0-1)
  
  // Determina cor do texto baseado na luminosidade (escura para cores claras, clara para cores escuras)
  const luminance = getLuminance(bgColor);
  const textColor = luminance > 128 ? '#1F2937' : '#FFFFFF'; // Escuro se claro, branco se escuro
  
  return { bg: bgColor, text: textColor };
};

// Função para gerar cor de fundo com opacidade (estilo Looker Studio)
const getHeatmapBgColor = (score: number): string => {
  const color = getHeatmapColor(score);
  // Converte hex para rgba com opacidade baseada na nota
  const opacity = Math.min(0.3 + (score / 10) * 0.4, 0.7); // Opacidade entre 0.3 e 0.7
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
};

export const CompanyOverview = ({ data, employees = [] }: { data: any; employees?: any[] }) => {
  const { 
    healthScore, 
    activeSectorsCount, 
    activeEmployeesCount, 
    activeRolesCount, 
    sectorDistribution, 
    roleDistribution, 
    topEmployee, 
    totalEvaluations,
    performanceList,
    highlightedByScore,
    highlightedBySelection,
    discPerformanceBySector,
    discPerformanceByRole
  } = data;
  
  // Funcionários mais novos e mais antigos
  const newestEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    return employees
      .filter((emp: any) => emp.admissionDate && emp.status === 'Ativo')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.admissionDate).getTime();
        const dateB = new Date(b.admissionDate).getTime();
        return dateB - dateA; // Mais recente primeiro
      })
      .slice(0, 3);
  }, [employees]);
  
  const oldestEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    return employees
      .filter((emp: any) => emp.admissionDate && emp.status === 'Ativo')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.admissionDate).getTime();
        const dateB = new Date(b.admissionDate).getTime();
        return dateA - dateB; // Mais antigo primeiro
      })
      .slice(0, 3);
  }, [employees]);
  
  const [selectedLevel, setSelectedLevel] = useState<string>('Todos');

  // Cor do Health Score (com gradiente dourado)
  const healthColor = healthScore >= 8 
    ? 'text-emerald-500' 
    : healthScore >= 6 
    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent' 
    : 'text-red-500';
  
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
  
  // Calcular ranking de setores (média de notas por setor)
  const sectorRanking = useMemo(() => {
    const sectorScores: Record<string, { sum: number; count: number }> = {};
    
    performanceList.forEach((item: any) => {
      const sector = item.realSector || 'Geral';
      if (!sectorScores[sector]) {
        sectorScores[sector] = { sum: 0, count: 0 };
      }
      sectorScores[sector].sum += item.score || 0;
      sectorScores[sector].count += 1;
    });
    
    return Object.entries(sectorScores)
      .map(([name, data]) => ({
        name,
        average: data.count > 0 ? data.sum / data.count : 0,
        count: data.count
      }))
      .sort((a, b) => b.average - a.average);
  }, [performanceList]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Scorecards Superiores */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Colaboradores" value={activeEmployeesCount} icon={Users} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20" />
        <Card title="Setores" value={activeSectorsCount} icon={Briefcase} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20" />
        <Card title="Cargos" value={activeRolesCount} icon={Award} className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20" />
        <Card title="Avaliações" value={totalEvaluations} icon={TrendingUp} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20" />
        <Card title="Férias" value={0} icon={CheckCircle} subtitle="Mock Data" className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20" /> 
        <Card title="Afastados" value={0} icon={AlertCircle} subtitle="Mock Data" className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20" />
      </div>

      {/* 1.1. Ranking de Setores (Barras Laterais) */}
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Ranking de Setores</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Média de performance por setor (ordenado do maior para o menor)</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorRanking} layout="vertical" margin={{ left: 100, right: 20, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
              <XAxis type="number" domain={[0, 10]} stroke="#9ca3af" tick={{fontSize: 12}} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={90} 
                tick={{fontSize: 11, fill: '#6B7280'}} 
                interval={0}
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}}
                formatter={(value: any) => [`${Number(value).toFixed(1)}`, 'Média']}
                labelFormatter={(label) => `Setor: ${label}`}
              />
              <Bar 
                dataKey="average" 
                fill="#3B82F6" 
                radius={[0, 4, 4, 0]}
                name="Média"
              >
                {sectorRanking.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Medidor de Saúde */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1E1E1E] dark:to-[#171717] p-6 rounded-xl shadow-lg border border-gray-200 dark:border-[#121212] flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 absolute top-6 left-6">Saúde da Empresa</h3>
          <div className="relative mt-8">
            <ResponsiveContainer width={250} height={250}>
               <PieChart>
                 <defs>
                   <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#D4AF37" />
                     <stop offset="100%" stopColor="#F3E5AB" />
                   </linearGradient>
                 </defs>
                 <Pie
                    data={[{ value: healthScore }, { value: 10 - healthScore }]}
                    cx="50%" cy="50%"
                    innerRadius={80} outerRadius={100}
                    startAngle={180} endAngle={0}
                    dataKey="value"
                 >
                    <Cell fill={healthScore >= 8 ? '#10B981' : healthScore >= 6 ? 'url(#goldGradient)' : '#EF4444'} />
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
                         const colorInfo = getHeatmapColor(score);
                         // Verificar funcionarioMes: pode ser 'Sim', 'sim', 'SIM', true, ou boolean
                         const funcionarioMesValue = item.funcionarioMes || item.funcionario_mes || false;
                         const isDestaque = funcionarioMesValue === 'Sim' || 
                                           funcionarioMesValue === 'sim' || 
                                           funcionarioMesValue === 'SIM' ||
                                           funcionarioMesValue === true ||
                                           funcionarioMesValue === 'true';
                         
                         return (
                           <tr key={item.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="p-3 text-gray-400 font-mono text-xs">#{idx + 1}</td>
                              <td className="p-3 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                 {isDestaque && (
                                   <div className="relative group">
                                     <Star size={16} className="text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                                     <span className="absolute left-6 top-0 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                       Funcionário Destaque do Mês
                                     </span>
                                   </div>
                                 )}
                                 {item.realName}
                              </td>
                              <td className="p-3 text-gray-500">{item.realSector}</td>
                              <td className="p-3 text-gray-500">{item.realRole}</td>
                              <td className="p-3">
                                 <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                    {item.realType || item.type || 'Operacional'}
                                 </span>
                              </td>
                              <td className="p-0">
                                 <div 
                                    className="flex items-center justify-center w-full h-full font-bold text-sm min-h-[48px]"
                                    style={{ 
                                       backgroundColor: colorInfo.bg,
                                       color: colorInfo.text
                                    }}
                                 >
                                    {score.toFixed(1)}
                                 </div>
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

         {/* Cards de Destaques */}
         <div className="space-y-4">
            {/* Destaque por Pontuação (Azul) */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-20"><Award size={80} /></div>
               <h3 className="text-blue-100 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Destaque por Pontuação
               </h3>
               
               <div className="space-y-3 max-h-64 overflow-y-auto">
                  {highlightedByScore && highlightedByScore.length > 0 ? (
                     highlightedByScore.map((emp: any, idx: number) => (
                        <div key={emp.id || idx} className="flex items-center gap-3 p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                           <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {idx + 1}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm line-clamp-1" title={emp.realName || emp.employeeName}>
                                 {emp.realName || emp.employeeName}
                              </p>
                              <p className="text-xs text-blue-200 line-clamp-1">{emp.realRole || emp.role}</p>
                           </div>
                           <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold">{emp.score?.toFixed(1) || '0.0'}</p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <p className="text-blue-200 text-sm text-center py-4">Nenhum destaque por pontuação</p>
                  )}
               </div>
            </div>

            {/* Destaque por Seleção (Dourado) */}
            <div className="bg-gradient-to-br from-yellow-500 via-yellow-600 to-amber-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-20"><Star size={80} className="fill-white" /></div>
               <h3 className="text-yellow-100 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2">
                  <Star size={16} className="fill-yellow-200" />
                  Destaque por Seleção
               </h3>
               
               <div className="space-y-3 max-h-64 overflow-y-auto">
                  {highlightedBySelection && highlightedBySelection.length > 0 ? (
                     highlightedBySelection.map((emp: any, idx: number) => (
                        <div key={emp.id || idx} className="flex items-center gap-3 p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                           <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <Star size={20} className="fill-yellow-200 text-yellow-200" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm line-clamp-1" title={emp.realName || emp.employeeName}>
                                 {emp.realName || emp.employeeName}
                              </p>
                              <p className="text-xs text-yellow-200 line-clamp-1">{emp.realRole || emp.role}</p>
                           </div>
                           <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold">{emp.score?.toFixed(1) || '0.0'}</p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <p className="text-yellow-200 text-sm text-center py-4">Nenhum destaque por seleção</p>
                  )}
               </div>
            </div>
         </div>
      </div>
      
      {/* Destaques de Funcionários (Mais Novos e Mais Antigos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Funcionários Mais Novos */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg p-6 border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
            Funcionários Mais Novos
          </h3>
          <div className="space-y-3">
            {newestEmployees.length > 0 ? (
              newestEmployees.map((emp: any, idx: number) => {
                const admissionDate = new Date(emp.admissionDate);
                const daysSince = Math.floor((new Date().getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={emp.id || idx} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1" title={emp.name}>
                        {emp.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{emp.role || 'Sem cargo'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {admissionDate.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {daysSince} dias
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhum funcionário novo encontrado</p>
            )}
          </div>
        </div>

        {/* Funcionários Mais Antigos */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl shadow-lg p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Award size={20} className="text-amber-600 dark:text-amber-400" />
            Funcionários Mais Antigos
          </h3>
          <div className="space-y-3">
            {oldestEmployees.length > 0 ? (
              oldestEmployees.map((emp: any, idx: number) => {
                const admissionDate = new Date(emp.admissionDate);
                const daysSince = Math.floor((new Date().getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
                const years = Math.floor(daysSince / 365);
                return (
                  <div key={emp.id || idx} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1" title={emp.name}>
                        {emp.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{emp.role || 'Sem cargo'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {admissionDate.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {years > 0 ? `${years} ano${years > 1 ? 's' : ''}` : `${daysSince} dias`}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhum funcionário antigo encontrado</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Dashboard de Perfil Comportamental (DISC) */}
      {(discPerformanceBySector && discPerformanceBySector.length > 0) || (discPerformanceByRole && discPerformanceByRole.length > 0) ? (
        <div className="space-y-6 mt-6">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Award size={24} className="text-purple-600 dark:text-purple-400" />
              Análise de Perfil Comportamental (DISC)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Identifique quais perfis DISC estão performando melhor em cada setor e cargo
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance DISC por Setor */}
            {discPerformanceBySector && discPerformanceBySector.length > 0 && (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-[#121212]">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Performance por Setor</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {discPerformanceBySector.map((item: any) => (
                    <div key={item.sector} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-bold text-gray-800 dark:text-white">{item.sector}</h5>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.profiles.reduce((acc: number, p: any) => acc + p.count, 0)} avaliações
                        </span>
                      </div>
                      <div className="space-y-2">
                        {item.profiles.slice(0, 3).map((profile: any, idx: number) => (
                          <div key={profile.profile} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded">
                            <div className="flex items-center gap-2">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 
                                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' 
                                  : idx === 1
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                                  : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{profile.profile}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-800 dark:text-white">{profile.average.toFixed(1)}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({profile.count})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Performance DISC por Cargo */}
            {discPerformanceByRole && discPerformanceByRole.length > 0 && (
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-[#121212]">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Performance por Cargo</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {discPerformanceByRole.map((item: any) => (
                    <div key={item.role} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-bold text-gray-800 dark:text-white">{item.role}</h5>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.profiles.reduce((acc: number, p: any) => acc + p.count, 0)} avaliações
                        </span>
                      </div>
                      <div className="space-y-2">
                        {item.profiles.slice(0, 3).map((profile: any, idx: number) => (
                          <div key={profile.profile} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded">
                            <div className="flex items-center gap-2">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 
                                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' 
                                  : idx === 1
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                                  : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{profile.profile}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-800 dark:text-white">{profile.average.toFixed(1)}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({profile.count})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};