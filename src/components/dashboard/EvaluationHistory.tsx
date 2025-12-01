import React, { useState, useMemo } from 'react';
import { ChevronRight, ArrowLeft, Calendar, User, FileText, TrendingUp } from 'lucide-react';

// --- Tipos baseados nos seus CSVs ---
interface Evaluation {
  id: string;
  funcionario: string;
  cargo: string;
  setor: string;
  tipo: 'Líder' | 'Colaborador';
  data: string; // Formato YYYY-MM-DD
  notaFinal: string;
  detalhes: Record<string, string>;
}

// --- Dados de Exemplo (Mock) ---
const MOCK_DATA: Evaluation[] = [
  {
    id: '4ba1f14d',
    funcionario: 'ADRIELE PATRICIA GARCIA ALVES DE LIMA',
    cargo: 'Operador de Caixa',
    setor: 'Caixa',
    tipo: 'Colaborador',
    data: '2025-08-01',
    notaFinal: '8,00',
    detalhes: {
      'Assiduidade e Pontualidade': '8,00',
      'Uso de Uniforme e EPI': '8,00',
      'Cumprimento das Tarefas': '8,00',
      'Organização e Limpeza': '9,00',
      'Proatividade': '8,00'
    }
  },
  {
    id: 'e963239f',
    funcionario: 'SABRINA RIBEIRO SOUZA MARTINS',
    cargo: 'Gerente',
    setor: 'Gerência',
    tipo: 'Líder',
    data: '2025-08-01',
    notaFinal: '9,00',
    detalhes: {
      'Acompanhamento de Processos': '9,00',
      'Comunicação Clara': '9,00',
      'Relacionamento': '9,00',
      'Tomada de Decisão': '9,00'
    }
  },
  {
    id: '8202b0b3',
    funcionario: 'JOÃO SILVA',
    cargo: 'Financeiro',
    setor: 'Financeiro',
    tipo: 'Colaborador',
    data: '2025-09-01',
    notaFinal: '7,50',
    detalhes: {
      'Assiduidade e Pontualidade': '7,00',
      'Uso de Uniforme e EPI': '8,00',
      'Cumprimento das Tarefas': '7,50'
    }
  }
];

export const EvaluationHistory = () => {
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  // --- Camada 1: Resumo ---
  const summaryData = useMemo(() => {
    const groups: Record<string, { count: number; totalScore: number; date: string }> = {};

    MOCK_DATA.forEach(item => {
      const dateObj = new Date(item.data);
      const periodKey = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const numericScore = parseFloat(item.notaFinal.replace(',', '.'));

      if (!groups[periodKey]) {
        groups[periodKey] = { count: 0, totalScore: 0, date: item.data };
      }
      groups[periodKey].count += 1;
      groups[periodKey].totalScore += numericScore;
    });

    return Object.entries(groups).map(([period, data]) => ({
      period,
      count: data.count,
      average: (data.totalScore / data.count).toFixed(2).replace('.', ','),
      rawDate: data.date
    }));
  }, []);

  // --- Camada 2: Filtro por período ---
  const periodEvaluations = useMemo(() => {
    if (!selectedPeriod) return [];
    return MOCK_DATA.filter(item => {
      const itemPeriod = new Date(item.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return itemPeriod === selectedPeriod;
    });
  }, [selectedPeriod]);

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
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          {viewLevel > 1 && (
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h2 className="text-xl font-bold text-gray-800">
            {viewLevel === 1 && "Histórico de Avaliações"}
            {viewLevel === 2 && `Avaliações de ${selectedPeriod}`}
            {viewLevel === 3 && `Detalhes: ${selectedEvaluation?.funcionario}`}
          </h2>
        </div>
        
        <div className="text-sm text-gray-500">
          <span className={viewLevel === 1 ? "font-bold text-blue-600" : ""}>Resumo</span>
          <span className="mx-2">/</span>
          <span className={viewLevel === 2 ? "font-bold text-blue-600" : ""}>Lista</span>
          <span className="mx-2">/</span>
          <span className={viewLevel === 3 ? "font-bold text-blue-600" : ""}>Detalhes</span>
        </div>
      </div>

      {/* Tabela de Resumo */}
      {viewLevel === 1 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 rounded-tl-lg">Período</th>
                <th className="p-4">Total de Avaliações</th>
                <th className="p-4">Média Geral</th>
                <th className="p-4 rounded-tr-lg text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaryData.map((row) => (
                <tr 
                  key={row.period} 
                  onClick={() => handlePeriodClick(row.period)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors group"
                >
                  <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {row.period}
                  </td>
                  <td className="p-4 text-gray-600">
                    {row.count} colaboradores avaliados
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      parseFloat(row.average.replace(',','.')) >= 8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {row.average}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de Avaliações */}
      {viewLevel === 2 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 rounded-tl-lg">Colaborador</th>
                <th className="p-4">Cargo / Setor</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Nota Final</th>
                <th className="p-4 rounded-tr-lg text-right">Ver Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periodEvaluations.map((evaluation) => (
                <tr 
                  key={evaluation.id}
                  onClick={() => handleEvaluationClick(evaluation)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors group"
                >
                  <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {evaluation.funcionario}
                  </td>
                  <td className="p-4 text-gray-600">
                    <div className="text-sm font-medium">{evaluation.cargo}</div>
                    <div className="text-xs text-gray-400">{evaluation.setor}</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded border ${
                      evaluation.tipo === 'Líder' ? 'border-purple-200 text-purple-700 bg-purple-50' : 'border-gray-200 text-gray-600'
                    }`}>
                      {evaluation.tipo}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-800">
                    {evaluation.notaFinal}
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
          <div className="bg-gray-50 p-6 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center border border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{selectedEvaluation.funcionario}</h3>
              <p className="text-gray-500">{selectedEvaluation.cargo} - {selectedEvaluation.setor}</p>
            </div>
            <div className="mt-4 md:mt-0 text-center bg-white px-6 py-3 rounded-lg shadow-sm border">
              <span className="block text-gray-400 text-xs uppercase font-bold">Nota Final</span>
              <span className="text-3xl font-bold text-blue-600">{selectedEvaluation.notaFinal}</span>
            </div>
          </div>

          <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Detalhamento dos Critérios
          </h4>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-600">Critério Avaliado</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 text-right">Nota / Avaliação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(selectedEvaluation.detalhes).map(([key, value], index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-700">{key}</td>
                    <td className="p-3 text-right font-medium text-gray-800">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
