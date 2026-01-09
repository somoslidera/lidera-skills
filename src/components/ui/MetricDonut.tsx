import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MetricDonutProps {
  name: string;
  score: number;
  maxScore?: number;
}

// Função para gerar cor baseada na pontuação (mesma lógica do heatmap)
const getScoreColor = (score: number): string => {
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  if (normalizedScore >= 9) return '#166534'; // Verde escuro
  else if (normalizedScore >= 8) return '#22C55E'; // Verde médio
  else if (normalizedScore >= 7) return '#4ADE80'; // Verde claro
  else if (normalizedScore >= 6) return '#84CC16'; // Verde-amarelo
  else if (normalizedScore >= 5) return '#EAB308'; // Amarelo
  else if (normalizedScore >= 4) return '#F59E0B'; // Laranja claro
  else if (normalizedScore >= 3) return '#F97316'; // Laranja
  else if (normalizedScore >= 2) return '#FB923C'; // Laranja claro
  else if (normalizedScore >= 1) return '#EF4444'; // Vermelho-laranja
  else return '#DC2626'; // Vermelho escuro
};

export const MetricDonut: React.FC<MetricDonutProps> = ({ 
  name, 
  score, 
  maxScore = 10 
}) => {
  const color = getScoreColor(score);
  const remaining = maxScore - score;

  return (
    <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700 flex flex-col items-center">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center line-clamp-2 min-h-[2.5rem]">
        {name}
      </h4>
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[{ value: score }, { value: remaining }]}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
              startAngle={180}
              endAngle={0}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            >
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {score.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">de {maxScore}</span>
        </div>
      </div>
    </div>
  );
};
