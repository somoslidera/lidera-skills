import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ReferenceLine
} from 'recharts';

// Função para gerar cor baseada na nota (Heatmap simulado)
const getScoreColor = (score: number) => {
  if (score >= 9) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (score >= 8) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  if (score >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
};

export const PerformanceAnalysis = ({ data }: { data: any }) => {
  const { matrixData, evolutionData, allSectors } = data;

  // Transformar dados da matriz para GAP chart (exemplo usando o primeiro critério ou média)
  const gapData = matrixData.map((m: any) => ({
    name: m.criteria,
    Actual: m.average,
    Gap: 10 - m.average
  })).sort((a: any, b: any) => a.Actual - b.Actual);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Gráfico de Evolução (Linhas) */}
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Evolução do Desempenho</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{fontSize: 12}} />
              <YAxis domain={[0, 10]} stroke="#9ca3af" tick={{fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}} />
              <Legend />
              
              <Line type="monotone" dataKey="Líderes" stroke="#3B82F6" strokeWidth={2} dot={{r: 4}} name="Líderes" />
              <Line type="monotone" dataKey="Colaboradores" stroke="#10B981" strokeWidth={2} dot={{r: 4}} name="Colaboradores" />
              <Line type="monotone" dataKey="Geral" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" name="Geral" />
              <Line type="monotone" dataKey="Meta" stroke="#EF4444" strokeWidth={1} dot={false} name="Meta 9,0" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 2. Matriz de Competências (Heatmap) */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] overflow-hidden">
             <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-white">Matriz de Competências vs Setor</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-xs text-center">
                   <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500">
                      <tr>
                         <th className="p-3 text-left">Competência</th>
                         <th className="p-3">Geral</th>
                         {allSectors.slice(0, 5).map((s: string) => <th key={s} className="p-3 max-w-[80px] truncate" title={s}>{s}</th>)}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {matrixData.map((row: any) => (
                         <tr key={row.criteria}>
                            <td className="p-3 text-left font-medium text-gray-700 dark:text-gray-300">{row.criteria}</td>
                            <td className="p-2"><div className={`rounded py-1 ${getScoreColor(row.average)}`}>{row.average.toFixed(1)}</div></td>
                            {allSectors.slice(0, 5).map((s: string) => (
                               <td key={s} className="p-2">
                                  {row[s] ? (
                                    <div className={`rounded py-1 ${getScoreColor(row[s])}`}>{row[s].toFixed(1)}</div>
                                  ) : <span className="text-gray-300">-</span>}
                               </td>
                            ))}
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* 3. Gráfico de Gaps (Cascata/Stacked Bar) */}
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Gaps de Competência</h3>
             <p className="text-xs text-gray-500 mb-6">Distância entre a média atual e a nota máxima (10)</p>
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={gapData} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                      <XAxis type="number" domain={[0, 10]} hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}} />
                      <Legend />
                      <Bar dataKey="Actual" stackId="a" fill="#3B82F6" name="Nota Atual" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Gap" stackId="a" fill="#E5E7EB" name="Potencial de Melhoria" radius={[0, 4, 4, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

      </div>
    </div>
  );
};