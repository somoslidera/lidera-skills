import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar, Award, User } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCompany } from '../../contexts/CompanyContext';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine, ReferenceArea } from 'recharts';
import { CustomTooltip } from '../ui/CustomTooltip';

export const EmployeeHistoryView: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]); // Todas as avaliações para comparação
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeHistory = async () => {
      if (!currentCompany || !employeeId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Buscar dados do funcionário
        let foundEmployee: any = null;
        let employeeCode: string | null = null;
        const decodedName = decodeURIComponent(employeeId);
        
        try {
          // Estratégia 1: Tentar buscar por ID do documento
          try {
            const empDoc = await getDoc(doc(db, 'employees', employeeId));
            if (empDoc.exists()) {
              foundEmployee = { id: empDoc.id, ...empDoc.data() };
              employeeCode = foundEmployee.employeeCode || null;
              setEmployee(foundEmployee);
              console.log('✅ Funcionário encontrado por ID do documento:', { id: empDoc.id, name: foundEmployee.name, employeeCode });
            }
          } catch (err) {
            // ID inválido, continuar para próxima estratégia
            console.log('ℹ️ ID do documento não encontrado, tentando outras estratégias...');
          }
          
          // Estratégia 2: Buscar por employeeCode
          if (!foundEmployee) {
            try {
              const codeQuery = query(
                collection(db, 'employees'),
                where('employeeCode', '==', employeeId)
              );
              const codeSnap = await getDocs(codeQuery);
              if (!codeSnap.empty) {
                foundEmployee = { id: codeSnap.docs[0].id, ...codeSnap.docs[0].data() };
                employeeCode = foundEmployee.employeeCode || null;
                setEmployee(foundEmployee);
                console.log('✅ Funcionário encontrado por employeeCode:', { id: foundEmployee.id, name: foundEmployee.name, employeeCode });
              }
            } catch (err) {
              console.log('ℹ️ Busca por employeeCode não retornou resultados');
            }
          }
          
          // Estratégia 3: Tentar por nome
          if (!foundEmployee) {
            try {
              const nameQuery = query(
                collection(db, 'employees'),
                where('name', '==', decodedName)
              );
              const nameSnap = await getDocs(nameQuery);
              if (!nameSnap.empty) {
                foundEmployee = { id: nameSnap.docs[0].id, ...nameSnap.docs[0].data() };
                employeeCode = foundEmployee.employeeCode || null;
                setEmployee(foundEmployee);
                console.log('✅ Funcionário encontrado por nome:', { id: foundEmployee.id, name: foundEmployee.name, employeeCode });
              }
            } catch (err) {
              console.log('ℹ️ Busca por nome não retornou resultados');
            }
          }
          
          // Se ainda não encontrou, criar um objeto básico com o nome
          if (!foundEmployee) {
            foundEmployee = {
              id: employeeId,
              name: decodedName,
              employeeCode: null
            };
            setEmployee(foundEmployee);
            console.log('⚠️ Funcionário não encontrado no cadastro, usando dados da URL:', { name: decodedName });
          }
        } catch (err) {
          console.warn('⚠️ Erro ao buscar funcionário:', err);
          // Criar objeto básico mesmo em caso de erro
          foundEmployee = {
            id: employeeId,
            name: decodedName,
            employeeCode: null
          };
          setEmployee(foundEmployee);
        }

        // Buscar avaliações do funcionário
        // Simplificar: buscar todas e filtrar manualmente (mais confiável)
        let employeeEvals: any[] = [];
        const searchName = foundEmployee?.name || decodedName;
        
        console.log('🔍 Buscando avaliações para:', { 
          employeeId, 
          employeeCode,
          employeeName: searchName,
          foundEmployeeId: foundEmployee?.id,
          currentCompany: currentCompany.id 
        });
        
        try {
          // Buscar todas as avaliações da empresa
          let allEvalsQuery;
          if (currentCompany.id === 'all') {
            allEvalsQuery = query(collection(db, 'evaluations'));
          } else {
            allEvalsQuery = query(
              collection(db, 'evaluations'),
              where('companyId', '==', currentCompany.id)
            );
          }
          const allSnap = await getDocs(allEvalsQuery);
          const allEvals = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          // Filtrar manualmente por múltiplos critérios
          // employeeId na avaliação pode ser: código do funcionário (ex: "17e2e57e"), ID do documento, ou employeeCode
          // employeeName na avaliação pode ser: nome completo do funcionário
          // evaluationId também pode conter o código do funcionário
          employeeEvals = allEvals.filter((evaluation: any) => {
            const evEmployeeId = (evaluation.employeeId || '').toString().toLowerCase().trim();
            const evEmployeeName = (evaluation.employeeName || '').toLowerCase().trim();
            const evEmployeeCode = (evaluation.employeeCode || '').toString().toLowerCase().trim();
            const evEvaluationId = (evaluation.evaluationId || '').toString().toLowerCase().trim();
            
            const searchId = employeeId.toLowerCase().trim();
            const searchNameLower = searchName.toLowerCase().trim();
            const searchCode = employeeCode ? employeeCode.toString().toLowerCase().trim() : '';
            const searchFoundId = foundEmployee?.id ? foundEmployee.id.toLowerCase().trim() : '';
            const searchFoundCode = foundEmployee?.employeeCode ? foundEmployee.employeeCode.toString().toLowerCase().trim() : '';
            
            // Múltiplas comparações possíveis
            // 1. employeeId da avaliação pode ser o código do funcionário (ex: "17e2e57e")
            // 2. employeeId da avaliação pode ser o ID do documento do funcionário
            // 3. employeeId da avaliação pode ser o employeeCode
            // 4. evaluationId pode ser o código do funcionário
            // 5. employeeName deve corresponder ao nome do funcionário
            // 6. employeeCode da avaliação deve corresponder ao employeeCode do funcionário
            return evEmployeeId === searchId ||
                   evEmployeeId === searchFoundId ||
                   evEmployeeId === searchCode ||
                   evEmployeeId === searchFoundCode ||
                   evEvaluationId === searchId ||
                   evEvaluationId === searchFoundId ||
                   evEvaluationId === searchCode ||
                   evEvaluationId === searchFoundCode ||
                   evEmployeeName === searchNameLower ||
                   evEmployeeName === searchId ||
                   (evEmployeeCode && (evEmployeeCode === searchCode || evEmployeeCode === searchId || evEmployeeCode === searchFoundCode));
          });
          
          console.log(`✅ Encontradas ${employeeEvals.length} avaliações para o funcionário`);
          if (employeeEvals.length > 0) {
            console.log('📋 Primeira avaliação:', {
              id: employeeEvals[0].id,
              employeeId: employeeEvals[0].employeeId,
              employeeName: employeeEvals[0].employeeName,
              employeeCode: employeeEvals[0].employeeCode,
              date: employeeEvals[0].date
            });
          }
        } catch (err) {
          console.error('❌ Erro ao buscar avaliações:', err);
        }
        
        employeeEvals.sort((a: any, b: any) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        setEvaluations(employeeEvals);

        // Buscar todas as avaliações da empresa para comparação
        try {
          let allEvalsQuery;
          if (currentCompany.id === 'all') {
            allEvalsQuery = query(collection(db, 'evaluations'));
          } else {
            allEvalsQuery = query(
              collection(db, 'evaluations'),
              where('companyId', '==', currentCompany.id)
            );
          }
          const allSnap = await getDocs(allEvalsQuery);
          const allEvals = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          setAllEvaluations(allEvals);
        } catch (err) {
          console.warn('Erro ao buscar todas as avaliações:', err);
          setAllEvaluations([]);
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        setEvaluations([]);
        setAllEvaluations([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeHistory();
  }, [currentCompany, employeeId]);

  // Calcular médias por setor e empresa por mês
  const comparisonData = useMemo(() => {
    if (!evaluations.length || !allEvaluations.length) return {};

    const sector = evaluations[0]?.sector || employee?.sector || '';
    const comparisons: Record<string, { sectorAvg: number; companyAvg: number }> = {};

    // Agrupar avaliações por mês
    const monthlyGroups: Record<string, any[]> = {};
    allEvaluations.forEach((evaluation: any) => {
      const monthKey = evaluation.date?.substring(0, 7) || ''; // YYYY-MM
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(evaluation);
    });

    // Calcular médias por mês
    Object.keys(monthlyGroups).forEach(monthKey => {
      const monthEvals = monthlyGroups[monthKey];
      
      // Média do setor
      const sectorEvals = monthEvals.filter((e: any) => (e.sector || '') === sector);
      const sectorAvg = sectorEvals.length > 0
        ? sectorEvals.reduce((sum: number, e: any) => sum + (typeof e.average === 'number' ? e.average : parseFloat(String(e.average)) || 0), 0) / sectorEvals.length
        : 0;

      // Média da empresa
      const companyAvg = monthEvals.length > 0
        ? monthEvals.reduce((sum: number, e: any) => sum + (typeof e.average === 'number' ? e.average : parseFloat(String(e.average)) || 0), 0) / monthEvals.length
        : 0;

      comparisons[monthKey] = { sectorAvg, companyAvg };
    });

    return comparisons;
  }, [evaluations, allEvaluations, employee]);

  // Preparar dados para gráfico de evolução
  const chartData = useMemo(() => {
    return evaluations.map((evaluation: any) => {
      const monthKey = evaluation.date?.substring(0, 7) || '';
      const comparison = comparisonData[monthKey] || { sectorAvg: 0, companyAvg: 0 };
      
      return {
        date: new Date(evaluation.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        month: monthKey,
        average: typeof evaluation.average === 'number' ? evaluation.average : parseFloat(String(evaluation.average)),
        sectorAvg: comparison.sectorAvg,
        companyAvg: comparison.companyAvg,
        fullDate: evaluation.date
      };
    });
  }, [evaluations, comparisonData]);

  // Obter todos os critérios únicos
  const allCriteria = useMemo(() => {
    const criteriaSet = new Set<string>();
    evaluations.forEach((evaluation: any) => {
      if (evaluation.details) {
        Object.keys(evaluation.details).forEach(key => criteriaSet.add(key));
      }
    });
    return Array.from(criteriaSet).sort();
  }, [evaluations]);

  // Calcular tempo de empresa
  const tenureInfo = useMemo(() => {
    if (!employee?.admissionDate) return null;
    
    const admission = new Date(employee.admissionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - admission.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    return {
      years,
      months,
      days: diffDays,
      formatted: years > 0 ? `${years} ano${years > 1 ? 's' : ''} e ${months} mês${months > 1 ? 'es' : ''}` : `${months} mês${months > 1 ? 'es' : ''}`
    };
  }, [employee]);

  // Formatar mês da avaliação
  const formatMonth = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando histórico...</div>
      </div>
    );
  }

  const employeeName = employee?.name || evaluations[0]?.employeeName || 'Colaborador';
  const latestEval = evaluations[evaluations.length - 1];
  const firstEval = evaluations[0];
  const overallAverage = evaluations.length > 0
    ? evaluations.reduce((sum: number, e: any) => sum + (typeof e.average === 'number' ? e.average : parseFloat(String(e.average)) || 0), 0) / evaluations.length
    : 0;

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{employeeName}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            {employee?.sector && (
              <span>Setor: {employee.sector}</span>
            )}
            {employee?.role && (
              <span>Cargo: {employee.role}</span>
            )}
            {employee?.jobLevel && (
              <span>Nível: {employee.jobLevel}</span>
            )}
            {employee?.discProfile && (
              <span className="flex items-center gap-1">
                <User size={14} />
                Perfil DISC: <span className="font-semibold text-gray-700 dark:text-gray-300">{employee.discProfile}</span>
              </span>
            )}
            {tenureInfo && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Tempo de Empresa: <span className="font-semibold text-gray-700 dark:text-gray-300">{tenureInfo.formatted}</span>
              </span>
            )}
          </div>
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
              {overallAverage.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Primeira Avaliação</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {firstEval ? formatMonth(firstEval.date) : '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Última Avaliação</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {latestEval ? formatMonth(latestEval.date) : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Gráfico de Evolução da Média com Comparações */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Evolução da Média Geral</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradientAverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradientSector" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradientCompany" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis domain={[0, 10]} stroke="#6b7280" />
                <Tooltip 
                  content={(props: any) => {
                    if (!props?.active || !props?.payload || props.payload.length === 0) return null;
                    return (
                      <CustomTooltip
                        {...props}
                        formatter={(value: number, name: string) => {
                          if (name === 'average') return [`${Number(value).toFixed(2)}`, 'Funcionário'];
                          if (name === 'sectorAvg') return [`${Number(value).toFixed(2)}`, 'Setor'];
                          if (name === 'companyAvg') return [`${Number(value).toFixed(2)}`, 'Empresa'];
                          return [`${Number(value).toFixed(2)}`, name];
                        }}
                      />
                    );
                  }}
                />
                <Legend />
                {/* Zonas de referência */}
                <ReferenceArea y1={9} y2={10} fill="#10B981" fillOpacity={0.1} stroke="none" />
                <ReferenceArea y1={7} y2={9} fill="#EAB308" fillOpacity={0.1} stroke="none" />
                <ReferenceArea y1={0} y2={7} fill="#EF4444" fillOpacity={0.1} stroke="none" />
                {/* Linha de meta */}
                <ReferenceLine y={9} stroke="#D4AF37" strokeWidth={2} strokeDasharray="3 3" strokeOpacity={0.6} />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fill="url(#gradientAverage)"
                  fillOpacity={1}
                  name="Funcionário"
                  dot={{ fill: '#3B82F6', r: 4 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Area 
                  type="monotone" 
                  dataKey="sectorAvg" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#gradientSector)"
                  fillOpacity={0.5}
                  name="Média do Setor"
                  dot={{ fill: '#10B981', r: 3 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Area 
                  type="monotone" 
                  dataKey="companyAvg" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#gradientCompany)"
                  fillOpacity={0.5}
                  name="Média da Empresa"
                  dot={{ fill: '#F59E0B', r: 3 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela Detalhada por Critério com Comparações */}
      {evaluations.length > 0 && allCriteria.length > 0 && (
        <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-gray-200 dark:border-navy-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-navy-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Evolução por Critério de Avaliação</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-navy-900">
                <tr>
                  <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium">Mês</th>
                  {allCriteria.map(criteria => (
                    <th key={criteria} className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                      {criteria}
                    </th>
                  ))}
                  <th className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium">Média</th>
                  <th className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium">vs Setor</th>
                  <th className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium">vs Empresa</th>
                  <th className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium">Evolução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-700">
                {evaluations.map((evaluation: any, index: number) => {
                  const avg = typeof evaluation.average === 'number' ? evaluation.average : parseFloat(String(evaluation.average)) || 0;
                  const prevEvaluation = evaluations[index - 1];
                  const prevAvg = prevEvaluation ? (typeof prevEvaluation.average === 'number' ? prevEvaluation.average : parseFloat(String(prevEvaluation.average)) || 0) : null;
                  const diff = prevAvg !== null ? avg - prevAvg : 0;
                  const diffPercent = prevAvg !== null && prevAvg > 0 ? ((diff / prevAvg) * 100) : 0;
                  
                  const monthKey = evaluation.date?.substring(0, 7) || '';
                  const comparison = comparisonData[monthKey] || { sectorAvg: 0, companyAvg: 0 };
                  const vsSector = avg - comparison.sectorAvg;
                  const vsCompany = avg - comparison.companyAvg;
                  
                  return (
                    <tr key={evaluation.id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {formatMonth(evaluation.date)}
                      </td>
                      {allCriteria.map(criteria => {
                        const score = evaluation.details?.[criteria] || 0;
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
                        <span className={`font-bold text-lg ${
                          avg >= 8 ? 'text-green-600 dark:text-green-400' :
                          avg >= 6 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {avg.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${
                          vsSector > 0 ? 'text-green-600 dark:text-green-400' :
                          vsSector < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-gray-400'
                        }`}>
                          {vsSector > 0 ? '+' : ''}{vsSector.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${
                          vsCompany > 0 ? 'text-green-600 dark:text-green-400' :
                          vsCompany < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-gray-400'
                        }`}>
                          {vsCompany > 0 ? '+' : ''}{vsCompany.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {prevAvg !== null ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`flex items-center gap-1 text-xs font-semibold ${
                              diff > 0 ? 'text-green-600 dark:text-green-400' :
                              diff < 0 ? 'text-red-600 dark:text-red-400' :
                              'text-gray-400'
                            }`}>
                              {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                              {diff !== 0 && `${diff > 0 ? '+' : ''}${diff.toFixed(2)}`}
                              {diff === 0 && '0.00'}
                            </span>
                            <span className={`text-[10px] ${
                              diffPercent > 0 ? 'text-green-600 dark:text-green-400' :
                              diffPercent < 0 ? 'text-red-600 dark:text-red-400' :
                              'text-gray-400'
                            }`}>
                              {diffPercent !== 0 && `${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1)}%`}
                              {diffPercent === 0 && '0.0%'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
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
