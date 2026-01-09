import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Card component não aceita children, usando divs estilizadas
import { CustomTooltip } from '../../ui/CustomTooltip';
import { Trophy, Star, Award, TrendingUp, Filter, Users, Briefcase, Layers, BarChart3 } from 'lucide-react';

interface RankingViewProps {
  evaluations: any[];
  employees: any[];
  filters: {
    dateStart?: string;
    dateEnd?: string;
    selectedStatuses?: string[];
  };
}

type RankingType = 'geral' | 'setor' | 'cargo' | 'nivel';

export const RankingView = ({ evaluations = [], employees = [], filters }: RankingViewProps) => {
  const [rankingType, setRankingType] = useState<RankingType>('geral');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [selectedFilter, setSelectedFilter] = useState<string>('');

  // Mapa de funcionários para busca rápida
  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((emp: any) => {
      map.set(emp.id, emp);
      map.set(emp.name?.toLowerCase().trim(), emp);
    });
    return map;
  }, [employees]);

  // Processar avaliações e calcular pontuação acumulada
  const processedRankings = useMemo(() => {
    // Filtrar avaliações por período e status
    let filtered = evaluations.filter((ev: any) => {
      // Filtro de data
      if (filters.dateStart || filters.dateEnd) {
        const evDate = ev.date ? new Date(ev.date) : null;
        if (!evDate) return false;
        
        if (filters.dateStart) {
          const startDate = new Date(filters.dateStart);
          if (evDate < startDate) return false;
        }
        if (filters.dateEnd) {
          const endDate = new Date(filters.dateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (evDate > endDate) return false;
        }
      }

      // Filtro de status
      if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
        const emp = employeeMap.get(ev.employeeId) || employeeMap.get(ev.employeeName?.toLowerCase().trim());
        if (!emp || !filters.selectedStatuses.includes(emp.status || 'Ativo')) {
          return false;
        }
      }

      return true;
    });

    // Agrupar por funcionário e calcular pontuação acumulada
    const employeeScores = new Map<string, {
      name: string;
      employeeId: string;
      sector: string;
      role: string;
      level: string;
      scores: number[];
      dates: string[];
      totalScore: number;
      averageScore: number;
      evaluationCount: number;
      highlights: {
        bySelection: number;
        byScore: number;
      };
    }>();

    filtered.forEach((ev: any) => {
      const score = typeof ev.average === 'number' ? ev.average : parseFloat((ev.notaFinal || '0').replace(',', '.'));
      if (isNaN(score)) return;

      const emp = employeeMap.get(ev.employeeId) || employeeMap.get(ev.employeeName?.toLowerCase().trim());
      const employeeName = emp?.name || ev.employeeName || 'Desconhecido';
      const employeeId = ev.employeeId || ev.employeeName;
      const sector = emp?.sector || ev.sector || 'Não definido';
      const role = emp?.role || ev.role || 'Não definido';
      const level = emp?.jobLevel || ev.level || ev.type || 'Operacional';

      if (!employeeScores.has(employeeId)) {
        employeeScores.set(employeeId, {
          name: employeeName,
          employeeId,
          sector,
          role,
          level,
          scores: [],
          dates: [],
          totalScore: 0,
          averageScore: 0,
          evaluationCount: 0,
          highlights: {
            bySelection: 0,
            byScore: 0
          }
        });
      }

      const empData = employeeScores.get(employeeId)!;
      empData.scores.push(score);
      empData.dates.push(ev.date || new Date().toISOString());
      empData.totalScore += score;
      empData.evaluationCount++;
      empData.averageScore = empData.totalScore / empData.evaluationCount;

      // Contar destaques
      if (ev.funcionarioMes === 'Sim' || ev.funcionarioMes === true || ev.funcionarioMes === 'sim') {
        empData.highlights.bySelection++;
      }
      // Se está no top 5 do período, conta como destaque por pontuação
      // Isso será calculado depois
    });

    // Calcular destaques por pontuação (top 5 de cada período)
    const dates = Array.from(new Set(filtered.map((ev: any) => ev.date || ev.month))).sort();
    dates.forEach((date: string) => {
      const periodEvaluations = filtered.filter((ev: any) => (ev.date || ev.month) === date);
      const top5 = [...periodEvaluations]
        .sort((a: any, b: any) => {
          const scoreA = typeof a.average === 'number' ? a.average : parseFloat((a.notaFinal || '0').replace(',', '.'));
          const scoreB = typeof b.average === 'number' ? b.average : parseFloat((b.notaFinal || '0').replace(',', '.'));
          return scoreB - scoreA;
        })
        .slice(0, 5);

      top5.forEach((ev: any) => {
        const emp = employeeMap.get(ev.employeeId) || employeeMap.get(ev.employeeName?.toLowerCase().trim());
        const employeeId = ev.employeeId || ev.employeeName;
        const empData = employeeScores.get(employeeId);
        if (empData) {
          empData.highlights.byScore++;
        }
      });
    });

    // Converter para array e ordenar por pontuação média
    const rankings = Array.from(employeeScores.values())
      .sort((a, b) => b.averageScore - a.averageScore);

    // Separar por tipo
    const byType: Record<RankingType, typeof rankings> = {
      geral: rankings,
      setor: [],
      cargo: [],
      nivel: []
    };

    if (selectedFilter) {
      byType.setor = rankings.filter(r => r.sector === selectedFilter);
      byType.cargo = rankings.filter(r => r.role === selectedFilter);
      byType.nivel = rankings.filter(r => r.level === selectedFilter);
    } else {
      byType.setor = rankings;
      byType.cargo = rankings;
      byType.nivel = rankings;
    }

    return {
      rankings: byType[rankingType],
      allRankings: rankings,
      uniqueSectors: Array.from(new Set(rankings.map(r => r.sector))).sort(),
      uniqueRoles: Array.from(new Set(rankings.map(r => r.role))).sort(),
      uniqueLevels: Array.from(new Set(rankings.map(r => r.level))).sort()
    };
  }, [evaluations, employees, filters, rankingType, selectedFilter, employeeMap]);

  // Preparar dados para gráfico de linhas (evolução temporal CUMULATIVA - SOMA)
  const chartData = useMemo(() => {
    const top10 = processedRankings.rankings.slice(0, 10);
    
    // Obter todas as datas únicas ordenadas de TODAS as avaliações dos top10
    const allDates = Array.from(new Set(
      evaluations
        .filter(ev => {
          // Verificar se esta avaliação pertence a algum dos top10
          const evEmployeeId = (ev.employeeId || '').toString().toLowerCase().trim();
          const evEmployeeName = (ev.employeeName || '').toString().toLowerCase().trim();
          
          return top10.some(emp => {
            const empEmployeeId = (emp.employeeId || '').toString().toLowerCase().trim();
            const empName = (emp.name || '').toString().toLowerCase().trim();
            return evEmployeeId === empEmployeeId ||
                   evEmployeeName === empName ||
                   evEmployeeId === empName ||
                   evEmployeeName === empEmployeeId;
          });
        })
        .map(ev => ev.date || ev.month)
        .filter(Boolean)
    )).sort();

    // Calcular SOMA acumulada por funcionário
    // Para cada funcionário, calcular a soma acumulada em cada data
    const cumulativeData: Array<Record<string, any>> = [];
    
    allDates.forEach((currentDate, dateIdx) => {
      const dataPoint: any = { date: currentDate };
      
      top10.forEach((emp) => {
        // Buscar TODAS as avaliações deste funcionário
        // Identificar funcionário por employeeId ou employeeName (comparação case-insensitive)
        const allEmpEvals = evaluations.filter((e: any) => {
          const evEmployeeId = (e.employeeId || '').toString().toLowerCase().trim();
          const evEmployeeName = (e.employeeName || '').toLowerCase().trim();
          const empEmployeeId = (emp.employeeId || '').toString().toLowerCase().trim();
          const empName = (emp.name || '').toLowerCase().trim();
          
          return evEmployeeId === empEmployeeId ||
                 evEmployeeName === empName ||
                 evEmployeeId === empName ||
                 evEmployeeName === empEmployeeId;
        }).sort((a: any, b: any) => {
          const dateA = (a.date || a.month || '').toString();
          const dateB = (b.date || b.month || '').toString();
          return dateA.localeCompare(dateB);
        });

        // Filtrar avaliações até a data atual (inclusive) e somar
        const empEvals = allEmpEvals.filter((e: any) => {
          const evDate = (e.date || e.month || '').toString();
          if (!evDate) return false;
          // Comparar datas como strings (formato YYYY-MM-DD ou YYYY-MM)
          return evDate <= currentDate;
        });

        if (empEvals.length > 0) {
          // SOMA ACUMULADA: somar TODAS as notas médias até esta data
          const cumulativeSum = empEvals.reduce((sum: number, e: any) => {
            const score = typeof e.average === 'number' ? e.average : parseFloat((e.notaFinal || '0').replace(',', '.'));
            return sum + (isNaN(score) ? 0 : score);
          }, 0);
          dataPoint[emp.name] = cumulativeSum;
        } else {
          // Se não tem avaliação ainda nesta data, usar o valor anterior ou null
          if (dateIdx > 0 && cumulativeData.length > 0) {
            const previousValue = cumulativeData[dateIdx - 1]?.[emp.name];
            dataPoint[emp.name] = previousValue !== undefined && previousValue !== null ? previousValue : null;
          } else {
            dataPoint[emp.name] = null;
          }
        }
      });
      
      cumulativeData.push(dataPoint);
    });

    return cumulativeData;
  }, [processedRankings.rankings, evaluations, employeeMap]);

  const colors = ['#0F52BA', '#4CA1AF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Filtros */}
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Trophy className="text-yellow-500" size={28} />
              Ranking de Pontuação
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Visualização acumulada das pontuações dos funcionários
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Tipo de Ranking */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => { setRankingType('geral'); setSelectedFilter(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  rankingType === 'geral'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <BarChart3 size={16} className="inline mr-1" />
                Geral
              </button>
              <button
                onClick={() => { setRankingType('setor'); setSelectedFilter(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  rankingType === 'setor'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Users size={16} className="inline mr-1" />
                Setor
              </button>
              <button
                onClick={() => { setRankingType('cargo'); setSelectedFilter(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  rankingType === 'cargo'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Briefcase size={16} className="inline mr-1" />
                Cargo
              </button>
              <button
                onClick={() => { setRankingType('nivel'); setSelectedFilter(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  rankingType === 'nivel'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Layers size={16} className="inline mr-1" />
                Nível
              </button>
            </div>

            {/* Filtro Específico */}
            {rankingType !== 'geral' && (
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 ring-blue-500/20 outline-none"
              >
                <option value="">Todos {rankingType === 'setor' ? 'Setores' : rankingType === 'cargo' ? 'Cargos' : 'Níveis'}</option>
                {(rankingType === 'setor' ? processedRankings.uniqueSectors :
                  rankingType === 'cargo' ? processedRankings.uniqueRoles :
                  processedRankings.uniqueLevels).map((item: string) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            )}

            {/* Modo de Visualização */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'chart'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Gráfico
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Tabela
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {processedRankings.rankings.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] text-center">
          <p className="text-gray-500 dark:text-gray-400">Nenhum dado encontrado para os filtros selecionados.</p>
        </div>
      ) : viewMode === 'chart' ? (
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212]">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Evolução Temporal - Top 10
          </h3>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                }}
              />
              <YAxis 
                stroke="#666" 
                domain={['auto', 'auto']}
                label={{ value: 'Pontuação Acumulada', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {processedRankings.rankings.slice(0, 10).map((emp, idx) => (
                <Line
                  key={emp.employeeId}
                  type="monotone"
                  dataKey={emp.name}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] overflow-x-auto">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Tabela de Ranking - {rankingType === 'geral' ? 'Geral' : rankingType === 'setor' ? 'Por Setor' : rankingType === 'cargo' ? 'Por Cargo' : 'Por Nível'}
          </h3>
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Posição</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Destaques</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                {rankingType === 'geral' && <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Setor</th>}
                {rankingType === 'geral' && <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Cargo</th>}
                {rankingType === 'geral' && <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nível</th>}
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Pontuação Acumulada</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Avaliações</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tendência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {processedRankings.rankings.map((emp, idx) => {
                const trend = emp.scores.length >= 2 
                  ? emp.scores[emp.scores.length - 1] - emp.scores[0]
                  : 0;
                return (
                  <tr key={emp.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {idx < 3 ? (
                          <Trophy 
                            size={20} 
                            className={idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-orange-600'} 
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-500">#{idx + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {emp.highlights.bySelection > 0 && (
                          <span className="flex items-center gap-1" title={`${emp.highlights.bySelection}x destaque por seleção`}>
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                            {emp.highlights.bySelection > 1 && <span className="text-xs text-gray-500">{emp.highlights.bySelection}</span>}
                          </span>
                        )}
                        {emp.highlights.byScore > 0 && (
                          <span className="flex items-center gap-1" title={`${emp.highlights.byScore}x destaque por pontuação`}>
                            <Award size={16} className="text-blue-500" />
                            {emp.highlights.byScore > 1 && <span className="text-xs text-gray-500">{emp.highlights.byScore}</span>}
                          </span>
                        )}
                        {emp.highlights.bySelection === 0 && emp.highlights.byScore === 0 && (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                    {rankingType === 'geral' && <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.sector}</td>}
                    {rankingType === 'geral' && <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.role}</td>}
                    {rankingType === 'geral' && <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.level}</td>}
                    <td className="px-4 py-4">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400" title="Pontuação acumulada (soma de todas as notas)">
                        {emp.totalScore.toFixed(2)}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1" title="Média histórica">
                        Média: {emp.averageScore.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.evaluationCount}</td>
                    <td className="px-4 py-4">
                      {trend > 0 ? (
                        <TrendingUp size={16} className="text-green-500" />
                      ) : trend < 0 ? (
                        <TrendingUp size={16} className="text-red-500 rotate-180" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
