import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCompany } from '../../contexts/CompanyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const EmployeeHistoryView: React.FC = () => {
  const { employeeName } = useParams<{ employeeName: string }>();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeHistory = async () => {
      if (!currentCompany || !employeeName) return;
      
      try {
        setLoading(true);
        let q;
        if (currentCompany.id === 'all') {
          q = query(
            collection(db, 'evaluations'),
            where('employeeName', '==', decodeURIComponent(employeeName))
          );
        } else {
          q = query(
            collection(db, 'evaluations'),
            where('companyId', '==', currentCompany.id),
            where('employeeName', '==', decodeURIComponent(employeeName))
          );
        }
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvaluations(data);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeHistory();
  }, [currentCompany, employeeName]);

  // Preparar dados para gráfico de evolução
  const chartData = useMemo(() => {
    return evaluations.map((eval: any) => ({
      date: new Date(eval.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      average: typeof eval.average === 'number' ? eval.average : parseFloat(String(eval.average)),
      fullDate: eval.date
    }));
  }, [evaluations]);

  // Obter todos os critérios únicos
  const allCriteria = useMemo(() => {
    const criteriaSet = new Set<string>();
    evaluations.forEach((eval: any) => {
      if (eval.details) {
        Object.keys(eval.details).forEach(key => criteriaSet.add(key));
      }
    });
    return Array.from(criteriaSet).sort();
  }, [evaluations]);

  // Preparar dados de evolução por critério
  const criteriaEvolution = useMemo(() => {
    const evolution: Record<string, { date: string; score: number }[]> = {};
    
    allCriteria.forEach(criteria => {
      evolution[criteria] = evaluations.map((eval: any) => ({
        date: new Date(eval.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        score: eval.details?.[criteria] || 0
      }));
    });
    
    return evolution;
  }, [evaluations, allCriteria]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando histórico...</div>
      </div>
    );
  }

  const decodedName = employeeName ? decodeURIComponent(employeeName) : 'Colaborador';
  const latestEval = evaluations[evaluations.length - 1];
  const firstEval = evaluations[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/evaluations?tab=list')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{decodedName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Histórico completo de avaliações
          </p>
        </div>
      </div>

      {/* Resumo Geral */}
      {evaluations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Avaliações</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{evaluations.length}</p>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Média Geral</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {evaluations.reduce((sum: number, e: any) => sum + (typeof e.average === 'number' ? e.average : parseFloat(String(e.average))), 0) / evaluations.length || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Primeira Avaliação</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {firstEval ? new Date(firstEval.date).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Última Avaliação</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {latestEval ? new Date(latestEval.date).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Gráfico de Evolução da Média */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Evolução da Média Geral</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis domain={[0, 10]} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Média"
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela Detalhada por Critério */}
      {evaluations.length > 0 && allCriteria.length > 0 && (
        <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-navy-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Evolução por Critério de Avaliação</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-navy-900">
                <tr>
                  <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium">Data</th>
                  {allCriteria.map(criteria => (
                    <th key={criteria} className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                      {criteria}
                    </th>
                  ))}
                  <th className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-700">
                {evaluations.map((eval: any) => {
                  const avg = typeof eval.average === 'number' ? eval.average : parseFloat(String(eval.average));
                  const prevEval = evaluations[evaluations.indexOf(eval) - 1];
                  const prevAvg = prevEval ? (typeof prevEval.average === 'number' ? prevEval.average : parseFloat(String(prevEval.average))) : null;
                  const diff = prevAvg !== null ? avg - prevAvg : 0;
                  
                  return (
                    <tr key={eval.id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {new Date(eval.date).toLocaleDateString('pt-BR')}
                      </td>
                      {allCriteria.map(criteria => {
                        const score = eval.details?.[criteria] || 0;
                        return (
                          <td key={criteria} className="p-3 text-center">
                            <span className={`font-semibold ${
                              score >= 8 ? 'text-green-600 dark:text-green-400' :
                              score >= 6 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {score.toFixed(1)}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-bold text-lg ${
                            avg >= 8 ? 'text-green-600 dark:text-green-400' :
                            avg >= 6 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {avg.toFixed(1)}
                          </span>
                          {prevAvg !== null && (
                            <span className={`flex items-center gap-1 text-xs ${
                              diff > 0 ? 'text-green-600 dark:text-green-400' :
                              diff < 0 ? 'text-red-600 dark:text-red-400' :
                              'text-gray-400'
                            }`}>
                              {diff > 0 ? <TrendingUp size={14} /> : diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                              {diff !== 0 && Math.abs(diff).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {evaluations.length === 0 && (
        <div className="bg-white dark:bg-navy-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700 text-center">
          <p className="text-gray-500 dark:text-gray-400">Nenhuma avaliação encontrada para este colaborador.</p>
        </div>
      )}
    </div>
  );
};
