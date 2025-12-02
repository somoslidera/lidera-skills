import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Calendar, User, FileText, TrendingUp, Upload } from 'lucide-react';
import { fetchCollection } from '../../services/firebase';
import { DataImporter } from '../settings/DataImporter';

// Interface atualizada para refletir os dados do Firebase/CSV
interface Evaluation {
  id: string;
  employeeName: string; // Nome vindo do CSV ou cadastro
  cargo?: string; // Opcional, pois pode não vir em alguns casos
  role?: string;  // Alias para cargo
  setor?: string; // Alias
  sector?: string; // Alias
  tipo: 'Líder' | 'Colaborador';
  type?: string; // Alias para tipo vindo do CSV
  data: string;
  date?: string; // Alias
  notaFinal?: string;
  average?: number; // Nota numérica vinda do CSV
  detalhes?: Record<string, number>; // Detalhes numéricos
}

export const EvaluationHistory = () => {
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [showImporter, setShowImporter] = useState(false); // Estado para mostrar/esconder importador

  // Carrega dados reais do Firebase ao montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCollection('evaluations');
        setEvaluations(data as any[]);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      }
    };
    loadData();
  }, []);

  // --- Camada 1: Resumo ---
  const summaryData = useMemo(() => {
    const groups: Record<string, { count: number; totalScore: number; date: string }> = {};

    evaluations.forEach(item => {
      // Normaliza dados (compatibilidade entre mock antigo e novo import)
      const dateVal = item.date || item.data;
      const scoreVal = item.average !== undefined ? item.average : parseFloat((item.notaFinal || '0').replace(',', '.'));
      
      if (!dateVal) return;

      const dateObj = new Date(dateVal);
      // Garante data válida mesmo com formatos string diferentes
      if (isNaN(dateObj.getTime())) return; 

      const periodKey = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      if (!groups[periodKey]) {
        groups[periodKey] = { count: 0, totalScore: 0, date: dateVal };
      }
      groups[periodKey].count += 1;
      groups[periodKey].totalScore += scoreVal;
    });

    return Object.entries(groups).map(([period, data]) => ({
      period,
      count: data.count,
      average: (data.totalScore / data.count).toFixed(2).replace('.', ','),
      rawDate: data.date
    })).sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()); // Ordena por data decrescente
  }, [evaluations]);

  // --- Camada 2: Filtro por período ---
  const periodEvaluations = useMemo(() => {
    if (!selectedPeriod) return [];
    return evaluations.filter(item => {
      const dateVal = item.date || item.data;
      if(!dateVal) return false;
      const itemPeriod = new Date(dateVal).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return itemPeriod === selectedPeriod;
    });
  }, [selectedPeriod, evaluations]);

  // --- Navegação ---
  const handlePeriodClick = (period: string) => {
    setSelectedPeriod(period);
    setViewLevel(2);
  };

  const handleEvaluationClick = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setViewLevel(3);
  };

  const handleBack = () => {
    if (viewLevel === 3) {
      setViewLevel(2);
      setSelectedEvaluation(null);
    } else if (viewLevel === 2) {
      setViewLevel(1);
      setSelectedPeriod(null);
    }
  };

  // --- Renderização ---
  return (
    <div className="bg-white dark:bg-[#1E1E1E] shadow-md rounded-lg p-6 w-full max-w-6xl mx-auto border dark:border-[#121212]">
      
      {/* Botão de Importação (Toggle) */}
      {viewLevel === 1 && (
        <div className="mb-6">
          <button 
            onClick={() => setShowImporter(!showImporter)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4 transition-colors"
          >
            <Upload size={16} /> 
            {showImporter ? 'Ocultar Importação' : 'Importar Histórico (CSV)'}
          </button>
          
          {showImporter && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn bg-gray-50 dark:bg-[#121212] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <DataImporter target="evaluations_leaders" />
              <DataImporter target="evaluations_collaborators" />
            </div>
          )}
        </div>
      )}

      {/* Header da Navegação */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          {viewLevel > 1 && (
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {viewLevel === 1 && "Histórico de Avaliações"}
            {viewLevel === 2 && `Avaliações de ${selectedPeriod}`}
            {viewLevel === 3 && `Detalhes: ${selectedEvaluation?.employeeName || selectedEvaluation?.funcionario}`}
          </h2>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
          <span className={viewLevel === 1 ? "font-bold text-blue-600 dark:text-blue-400" : ""}>Resumo</span>
          <span className="mx-2">/</span>
          <span className={viewLevel === 2 ? "font-bold text-blue-600 dark:text-blue-400" : ""}>Lista</span>
          <span className="mx-2">/</span>
          <span className={viewLevel === 3 ? "font-bold text-blue-600 dark:text-blue-400" : ""}>Detalhes</span>
        </div>
      </div>

      {/* Tabela de Resumo */}
      {viewLevel === 1 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#121212] text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 rounded-tl-lg">Período</th>
                <th className="p-4">Total de Avaliações</th>
                <th className="p-4">Média Geral</th>
                <th className="p-4 rounded-tr-lg text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {summaryData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum histórico encontrado. Importe dados CSV acima.
                  </td>
                </tr>
              ) : (
                summaryData.map((row) => (
                  <tr 
                    key={row.period} 
                    onClick={() => handlePeriodClick(row.period)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {row.period}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {row.count} colaboradores avaliados
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        parseFloat(row.average.replace(',','.')) >= 8 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {row.average}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de Avaliações */}
      {viewLevel === 2 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#121212] text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 rounded-tl-lg">Colaborador</th>
                <th className="p-4">Cargo / Setor</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Nota Final</th>
                <th className="p-4 rounded-tr-lg text-right">Ver Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {periodEvaluations.map((evaluation) => (
                <tr 
                  key={evaluation.id}
                  onClick={() => handleEvaluationClick(evaluation)}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                >
                  <td className="p-4 font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {evaluation.employeeName || evaluation.funcionario}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    <div className="text-sm font-medium">{evaluation.role || evaluation.cargo}</div>
                    <div className="text-xs text-gray-400">{evaluation.sector || evaluation.setor}</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded border ${
                      (evaluation.type || evaluation.tipo) === 'Líder' 
                        ? 'border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' 
                        : 'border-gray-200 text-gray-600 dark:text-gray-400 dark:border-gray-700'
                    }`}>
                      {evaluation.type || evaluation.tipo}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                    {evaluation.average !== undefined ? evaluation.average.toFixed(2).replace('.', ',') : evaluation.notaFinal}
                  </td>
                  <td className="p-4 text-right">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500 inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalhes */}
      {viewLevel === 3 && selectedEvaluation && (
        <div className="animate-fade-in">
          <div className="bg-gray-50 dark:bg-[#121212] p-6 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center border border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {selectedEvaluation.employeeName || selectedEvaluation.funcionario}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedEvaluation.role || selectedEvaluation.cargo} - {selectedEvaluation.sector || selectedEvaluation.setor}
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-center bg-white dark:bg-[#1E1E1E] px-6 py-3 rounded-lg shadow-sm border dark:border-gray-700">
              <span className="block text-gray-400 text-xs uppercase font-bold">Nota Final</span>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {selectedEvaluation.average !== undefined ? selectedEvaluation.average.toFixed(2).replace('.', ',') : selectedEvaluation.notaFinal}
              </span>
            </div>
          </div>

          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Detalhamento dos Critérios
          </h4>

          <div className="border dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100 dark:bg-[#121212]">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Critério Avaliado</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#1E1E1E]">
                {selectedEvaluation.detalhes ? (
                  Object.entries(selectedEvaluation.detalhes).map(([key, value], index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 text-gray-700 dark:text-gray-300">{key}</td>
                      <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">
                        {typeof value === 'number' ? value.toFixed(2).replace('.', ',') : value}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-gray-500">Detalhes não disponíveis para este registro importado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
