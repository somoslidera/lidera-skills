import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

// Função para gerar cor baseada na nota (Heatmap)
const getScoreColor = (score: number) => {
  if (score >= 9) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
  if (score >= 7.5) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
  if (score >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
};

export const PerformanceAnalysis = ({ data }: { data: any }) => {
  const { matrixData, evolutionData, allSectors } = data;

  // Ordena os dados da matriz pelas menores notas gerais para destacar problemas
  const sortedMatrix = useMemo(() => {
    return [...matrixData].sort((a, b) => a.average - b.average);
  }, [matrixData]);

  // Dados para o gráfico de Gaps (Melhores vs Piores Competências)
  const gapData = useMemo(() => {
    return sortedMatrix.map((m: any) => ({
      name: m.criteria,
      Actual: m.average,
      Gap: parseFloat((10 - m.average).toFixed(2))
    }));
  }, [sortedMatrix]);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Gráfico de Evolução (Linhas) */}
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Evolução Temporal</h3>
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
              
              <Line type="monotone" dataKey="Líder" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4}} name="Líderes" />
              <Line type="monotone" dataKey="Colaborador" stroke="#10B981" strokeWidth={3} dot={{r: 4}} name="Colaboradores" />
              <Line type="monotone" dataKey="Geral" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" name="Média Geral" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 2. Matriz de Competências (Heatmap) */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col">
             <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Heatmap de Competências</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cruzamento de médias: Competência vs Setor</p>
             </div>
             
             <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-xs text-center border-collapse">
                   <thead className="text-gray-500 dark:text-gray-400 font-medium">
                      <tr>
                         <th className="p-3 text-left min-w-[120px] sticky left-0 bg-white dark:bg-[#1E1E1E] z-10 border-b dark:border-gray-700">
                           Competência
                         </th>
                         <th className="p-3 border-b dark:border-gray-700 min-w-[60px]">Geral</th>
                         {allSectors.map((s: string) => (
                           <th key={s} className="p-3 border-b dark:border-gray-700 min-w-[80px] max-w-[100px] truncate" title={s}>
                             {s}
                           </th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sortedMatrix.map((row: any) => (
                         <tr key={row.criteria} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                              {row.criteria}
                            </td>
                            <td className="p-2">
                              <div className={`flex items-center justify-center w-full h-full rounded px-2 py-1 font-bold ${getScoreColor(row.average)}`}>
                                {row.average.toFixed(1)}
                              </div>
                            </td>
                            {allSectors.map((s: string) => (
                               <td key={s} className="p-2">
                                  {row[s] !== undefined ? (
                                    <div 
                                      className={`flex items-center justify-center w-full h-full rounded px-2 py-1 font-medium text-[11px] ${getScoreColor(row[s])}`}
                                      title={`Setor: ${s}\nNota: ${row[s].toFixed(2)}`}
                                    >
                                      {row[s].toFixed(1)}
                                    </div>
                                  ) : (
                                    <span className="text-gray-200 dark:text-gray-800">-</span>
                                  )}
                               </td>
                            ))}
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-4 text-xs justify-end">
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span> Crítico (&lt;6)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></span> Atenção (6-7.5)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span> Bom (7.5-9)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></span> Excelente (&gt;9)</div>
             </div>
          </div>

          {/* 3. Gráfico de Gaps (Cascata/Stacked Bar) */}
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Análise de Gaps</h3>
             <p className="text-sm text-gray-500 mb-6">Competências que mais precisam de treinamento (Menor nota primeiro).</p>
             
             <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={gapData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                      <XAxis type="number" domain={[0, 10]} hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={140} 
                        tick={{fontSize: 11, fill: '#6B7280'}} 
                        interval={0}
                      />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                        contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}} 
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Bar dataKey="Actual" stackId="a" fill="#3B82F6" name="Performance Atual" radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="Gap" stackId="a" fill="#E5E7EB" name="Gap (Oportunidade)" radius={[0, 4, 4, 0]} barSize={20} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

      </div>
    </div>
  );
};