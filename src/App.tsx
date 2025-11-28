import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Settings, 
  Search, 
  Plus, 
  TrendingUp, 
  Award, 
  AlertCircle,
  ChevronRight,
  BarChart3,
  Save,
  Filter,
  FileText,
  PieChart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area
} from 'recharts';

// --- CONFIGURAÇÕES E MAPEAMENTOS (Baseado no AppScript) ---

const METRICAS_OPERADORES = {
  "Assiduidade_Pontualidade": "Assiduidade e Pontualidade",
  "Uso_Uniforme_EPI": "Uso de Uniforme e EPI",
  "Cumprimento_Tarefas": "Cumprimento das Tarefas",
  "Organizacao_Limpeza": "Organização e Limpeza",
  "Cumprimento_Rotina_Operacional": "Cumprimento da Rotina Operacional",
  "Proatividade": "Proatividade",
  "Trabalho_Equipe": "Trabalho em Equipe",
  "Comunicacao_Colegas_Lideres": "Comunicação com Colegas/Líderes",
  "Respeito_Normas_Cultura": "Respeito às Normas e Cultura",
  "Atendimento_Cliente": "Atendimento ao Cliente"
};

const METRICAS_LIDERES = {
  "Assiduidade_Pontualidade_Lider": "Assiduidade e Pontualidade",
  "Cumprimento_Metas_Setor": "Cumprimento das Metas do Setor",
  "Organizacao_Gestao_Setor": "Organização e Gestão do Setor",
  "Acompanhamento_Processos_Rotinas": "Acompanhamento de Processos",
  "Uso_Uniforme_Postura": "Uso de Uniforme e Postura",
  "Comunicacao_Clara_Coerente": "Comunicação Clara e Coerente",
  "Relacionamento_Colaboradores": "Relacionamento com Colaboradores",
  "Capacidade_Decisao_Resolucao": "Capacidade de Decisão e Resolução",
  "Reacao_Pressao_Conflitos": "Reação sob Pressão e Conflitos",
  "Atendimento_Cliente_Lider": "Atendimento ao Cliente",
  "Participacao_Treinamento_Novo": "Participação no Treinamento de Novos",
  "Acompanhamento_Membros_Equipe": "Acompanhamento da Equipe",
  "Incentivo_Crescimento_Profissional": "Incentivo ao Crescimento da Equipe",
  "Capacidade_Delegar_Acompanhar": "Capacidade de Delegar e Acompanhar"
};

const SECTORES = [
  "Gerência", "Recursos Humanos", "Financeiro", "Caixa", "Loja", 
  "Depósito", "Açougue", "Hortifruti", "Padaria"
];

// --- MOCK DATA (Enriquecido para testar as médias) ---

const INITIAL_EMPLOYEES = [
  { id: '8', name: 'EDILSON ROCHA', role: 'Chefe de Loja', sector: 'Loja', level: 'Líder', status: 'Ativo' },
  { id: '445', name: 'ITAMARA BORGES HOFFMANN', role: 'Auxiliar de Depósito', sector: 'Depósito', level: 'Colaborador', status: 'Ativo' },
  { id: '564', name: 'DANIEL BRAGA DA SILVA', role: 'Encarregado Açougue', sector: 'Açougue', level: 'Líder', status: 'Ativo' },
  { id: '596', name: 'SABRINA RIBEIRO SOUZA MARTINS', role: 'Gerente', sector: 'Gerência', level: 'Líder', status: 'Ativo' },
  { id: '602', name: 'FRANCIELE CRISTIANE GARCIA', role: 'Operador de Caixa', sector: 'Caixa', level: 'Colaborador', status: 'Ativo' },
  { id: '843', name: 'CRISTIANE JULIANE DA SILVA', role: 'Operador de Caixa', sector: 'Caixa', level: 'Colaborador', status: 'Ativo' },
  { id: '205', name: 'FERNANDO BRITO DA SILVA', role: 'Encarregado Depósito', sector: 'Depósito', level: 'Líder', status: 'Ativo' },
];

const INITIAL_EVALUATIONS = [
  { id: 'ev1', employeeId: '602', date: '2025-08-01', type: 'Colaborador', average: 7.8, scores: { "Assiduidade e Pontualidade": 8, "Proatividade": 7, "Trabalho em Equipe": 9, "Atendimento ao Cliente": 8 } },
  { id: 'ev2', employeeId: '564', date: '2025-08-01', type: 'Líder', average: 8.2, scores: { "Cumprimento das Metas do Setor": 8, "Organização e Gestão do Setor": 9 } },
  { id: 'ev3', employeeId: '445', date: '2025-09-01', type: 'Colaborador', average: 6.5, scores: { "Assiduidade e Pontualidade": 6, "Proatividade": 7, "Atendimento ao Cliente": 5 } },
  { id: 'ev4', employeeId: '596', date: '2025-09-01', type: 'Líder', average: 9.1, scores: { "Capacidade de Decisão e Resolução": 10, "Cumprimento das Metas do Setor": 9 } },
  { id: 'ev5', employeeId: '843', date: '2025-10-01', type: 'Colaborador', average: 8.5, scores: { "Assiduidade e Pontualidade": 9, "Proatividade": 8, "Atendimento ao Cliente": 9 } },
  { id: 'ev6', employeeId: '602', date: '2025-10-01', type: 'Colaborador', average: 8.0, scores: { "Assiduidade e Pontualidade": 9, "Proatividade": 8, "Trabalho em Equipe": 7, "Atendimento ao Cliente": 8 } },
];

// --- COMPONENTS ---

const Card = ({ title, value, icon: Icon, trend, color = "blue", subtitle }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-2 rounded-lg bg-${color}-50`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className={trend > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
        <span className="text-slate-400 ml-2">vs mês anterior</span>
      </div>
    )}
  </div>
);

export default function LideraApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [evaluations, setEvaluations] = useState(INITIAL_EVALUATIONS);
  
  // State for Evaluation Form
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [evaluationData, setEvaluationData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- BUSINESS INTELLIGENCE ENGINE (Inspirado no AppScript) ---
  
  const analytics = useMemo(() => {
    // Objetos para armazenar somas e contagens (SomasGerais e SomasSetor)
    const stats = {
      global: { sum: {}, count: {}, avg: {} },
      bySector: {}, // { "Caixa": { "Proatividade": { sum: 10, count: 2 } } }
      byMonth: {}
    };

    // 1. Processar dados brutos
    evaluations.forEach(ev => {
      const emp = employees.find(e => e.id === ev.employeeId);
      if (!emp) return;

      const sector = emp.sector;
      const month = new Date(ev.date).toLocaleString('pt-BR', { month: 'short' });

      // Inicializa estrutura do setor se não existir
      if (!stats.bySector[sector]) stats.bySector[sector] = { sum: {}, count: {}, avg: {}, rawScores: [] };
      if (!stats.byMonth[month]) stats.byMonth[month] = { sum: 0, count: 0, avg: 0 };

      // Dados Gerais do Mês
      stats.byMonth[month].sum += ev.average;
      stats.byMonth[month].count += 1;
      stats.bySector[sector].rawScores.push(ev.average);

      // Processar cada métrica individual da avaliação
      Object.entries(ev.scores).forEach(([metricName, score]) => {
        const val = parseFloat(score) || 0; // Trata nulos como 0 (Regra do Script)

        // Acumula Global
        stats.global.sum[metricName] = (stats.global.sum[metricName] || 0) + val;
        stats.global.count[metricName] = (stats.global.count[metricName] || 0) + 1;

        // Acumula por Setor
        stats.bySector[sector].sum[metricName] = (stats.bySector[sector].sum[metricName] || 0) + val;
        stats.bySector[sector].count[metricName] = (stats.bySector[sector].count[metricName] || 0) + 1;
      });
    });

    // 2. Calcular Médias Finais (Global)
    Object.keys(stats.global.sum).forEach(metric => {
      stats.global.avg[metric] = (stats.global.sum[metric] / stats.global.count[metric]).toFixed(2);
    });

    // 3. Calcular Médias Finais (Por Setor)
    Object.keys(stats.bySector).forEach(sector => {
      Object.keys(stats.bySector[sector].sum).forEach(metric => {
        stats.bySector[sector].avg[metric] = (stats.bySector[sector].sum[metric] / stats.bySector[sector].count[metric]).toFixed(2);
      });
      // Média Geral do Setor
      const sectorTotal = stats.bySector[sector].rawScores.reduce((a, b) => a + b, 0);
      stats.bySector[sector].overallAvg = (sectorTotal / stats.bySector[sector].rawScores.length).toFixed(1);
    });

    // 4. Dados para Gráficos
    const chartDataEvolution = Object.entries(stats.byMonth).map(([name, data]) => ({
      name,
      Média: (data.sum / data.count).toFixed(1)
    }));

    const chartDataSector = Object.entries(stats.bySector).map(([name, data]) => ({
      name,
      Media: parseFloat(data.overallAvg),
      Meta: 8.5 // Meta fictícia para visualização
    }));

    // KPI Geral
    const totalAvg = (evaluations.reduce((acc, curr) => acc + curr.average, 0) / evaluations.length).toFixed(1);

    return { stats, chartDataEvolution, chartDataSector, totalAvg };
  }, [evaluations, employees]);

  // --- HELPERS ---

  const handleStartEvaluation = (e) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    setEvaluationData({});
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  // Seleciona o objeto de métricas correto baseado no nível
  const currentMetricsMap = selectedEmployee?.level === 'Líder' ? METRICAS_LIDERES : METRICAS_OPERADORES;
  // Converte o objeto em array de labels para o formulário
  const currentMetricsList = Object.values(currentMetricsMap);

  const handleScoreChange = (metric, score) => {
    setEvaluationData(prev => ({
      ...prev,
      [metric]: parseFloat(score)
    }));
  };

  const submitEvaluation = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const scores = Object.values(evaluationData);
      const average = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      
      const newEval = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: selectedEmployeeId,
        date: new Date().toISOString().split('T')[0],
        type: selectedEmployee.level,
        average: parseFloat(average.toFixed(2)),
        scores: evaluationData
      };

      setEvaluations([newEval, ...evaluations]);
      setIsSubmitting(false);
      setSelectedEmployeeId('');
      setEvaluationData({});
      setActiveTab('dashboard'); // Volta pro dashboard para ver o impacto
      alert("Avaliação salva e médias recalculadas!");
    }, 800);
  };

  // --- VIEWS ---

  const DashboardView = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Avaliações Realizadas" value={evaluations.length} icon={ClipboardCheck} color="blue" subtitle="Total histórico" />
        <Card title="Média Global da Empresa" value={analytics.totalAvg} icon={TrendingUp} trend={2.1} color="emerald" subtitle="Meta: 8.5" />
        <Card title="Funcionários Ativos" value={employees.length} icon={Users} color="violet" subtitle={`${SECTORES.length} Setores`} />
        <Card title="Setor Destaque" value="Gerência" icon={Award} color="orange" subtitle="Média: 9.1" />
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução Temporal */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600"/>
            Evolução de Desempenho
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.chartDataEvolution}>
                <defs>
                  <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Média" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorMedia)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparativo por Setor vs Meta */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-violet-600"/>
            Desempenho por Setor vs Meta
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.chartDataSector} layout="vertical">
                <CartesianGrid stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend iconType="circle" />
                <Bar dataKey="Media" barSize={20} fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Média Setor" />
                <Line dataKey="Meta" type="monotone" stroke="#ef4444" strokeWidth={2} dot={false} name="Meta da Empresa" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Tabela Resumo Recente */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Últimas Avaliações Processadas</h3>
          <button className="text-blue-600 text-sm font-medium hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Colaborador</th>
                <th className="px-6 py-4 font-medium">Setor</th>
                <th className="px-6 py-4 font-medium">Nota</th>
                <th className="px-6 py-4 font-medium">Comp. Mercado</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluations.slice(0, 5).map((ev) => {
                const emp = employees.find(e => e.id === ev.employeeId);
                const globalDiff = (ev.average - analytics.totalAvg).toFixed(1);
                const isPositive = globalDiff >= 0;

                return (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{emp?.name}</p>
                        <p className="text-xs text-slate-500">{emp?.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{emp?.sector}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${ev.average >= 8 ? 'text-green-600' : ev.average >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
                        {ev.average.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isPositive ? '+' : ''}{globalDiff} pts (Geral)
                      </span>
                    </td>
                    <td className="px-6 py-4"><span className="text-slate-400 text-xs">Processado</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const EvaluationFormView = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Painel Esquerdo - Seleção e Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-4">1. Identificação</h3>
             <label className="block text-sm font-medium text-slate-700 mb-2">Colaborador</label>
             <select 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                onChange={handleStartEvaluation}
                value={selectedEmployeeId}
              >
                <option value="">Selecione...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              {selectedEmployee && (
                <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cargo:</span>
                    <span className="font-medium text-slate-800 text-right">{selectedEmployee.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Setor:</span>
                    <span className="font-medium text-slate-800">{selectedEmployee.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nível:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${selectedEmployee.level === 'Líder' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {selectedEmployee.level}
                    </span>
                  </div>
                </div>
              )}
          </div>
          
          {/* Card de BI Contextual (Novo) */}
          {selectedEmployee && (
            <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BarChart3 size={100} />
              </div>
              <h4 className="font-bold mb-2 z-10 relative">Contexto do Setor</h4>
              <p className="text-indigo-200 text-xs mb-4 z-10 relative">
                Médias atuais do setor <strong>{selectedEmployee.sector}</strong> para comparação.
              </p>
              <div className="space-y-3 z-10 relative">
                 <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Média Geral Setor</span>
                    <span className="font-bold text-lg">{analytics.bySector[selectedEmployee.sector]?.overallAvg || 'N/A'}</span>
                 </div>
                 <div className="h-px bg-indigo-700"></div>
                 <div className="text-xs opacity-70">
                   * Dados calculados em tempo real com base nas avaliações anteriores.
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Painel Direito - Formulário */}
        <div className="md:col-span-2">
           {selectedEmployee ? (
             <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Award className="text-blue-600" />
                    Avaliação de Desempenho
                  </h2>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                    Ref: {new Date().toLocaleDateString('pt-BR', {month:'long'})}
                  </span>
                </div>

                <div className="space-y-6">
                  {currentMetricsList.map((metric, index) => {
                    // Tenta buscar a média do setor para esta métrica específica para dar contexto visual
                    const sectorAvg = analytics.bySector[selectedEmployee.sector]?.avg[metric];

                    return (
                      <div key={index} className="pb-6 border-b border-slate-100 last:border-0">
                        <div className="flex justify-between items-end mb-3">
                          <label className="text-slate-700 font-medium w-2/3">{metric}</label>
                          <div className="text-right">
                             <span className="text-2xl font-bold text-blue-600 block leading-none">{evaluationData[metric] || 0}</span>
                             <span className="text-[10px] text-slate-400 uppercase tracking-wider">Nota</span>
                          </div>
                        </div>
                        
                        <input 
                          type="range" 
                          min="0" 
                          max="10" 
                          step="0.5"
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2"
                          value={evaluationData[metric] || 0}
                          onChange={(e) => handleScoreChange(metric, e.target.value)}
                        />
                        
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1 text-xs text-slate-400">
                            <span>0 (Ruim)</span>
                          </div>
                          
                          {/* Dica de Contexto (BI) */}
                          {sectorAvg && (
                            <div className="text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-500 flex items-center gap-1">
                              <TrendingUp size={10} />
                              Média Setor: <strong>{sectorAvg}</strong>
                            </div>
                          )}

                          <div className="flex gap-1 text-xs text-slate-400">
                            <span>10 (Excel.)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-8 flex justify-end gap-3">
                  <button 
                    onClick={() => setSelectedEmployeeId('')}
                    className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={submitEvaluation}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? 'Processando...' : (
                      <>
                        <Save size={18} />
                        Salvar Avaliação
                      </>
                    )}
                  </button>
                </div>
             </div>
           ) : (
             <div className="h-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12">
               <Users size={48} className="mb-4 opacity-50" />
               <p className="font-medium">Selecione um colaborador ao lado para iniciar</p>
               <p className="text-sm mt-2">O formulário será carregado automaticamente de acordo com o cargo.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );

  const EmployeesView = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar funcionário, cargo ou ID..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200">
            <Filter size={18} />
          </button>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ml-4">
          <Plus size={18} />
          Novo Cadastro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Nome</th>
              <th className="px-6 py-4 font-medium">Cargo</th>
              <th className="px-6 py-4 font-medium">Setor</th>
              <th className="px-6 py-4 font-medium">Nível</th>
              <th className="px-6 py-4 font-medium">Performance Média</th>
              <th className="px-6 py-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {employees.map((emp) => {
              // Calcula média pessoal baseada no histórico mockado
              const empEvals = evaluations.filter(e => e.employeeId === emp.id);
              const personalAvg = empEvals.length 
                ? (empEvals.reduce((a, b) => a + b.average, 0) / empEvals.length).toFixed(1)
                : '-';

              return (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.role}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs">
                      {emp.sector}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.level === 'Líder' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {emp.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {personalAvg !== '-' ? (
                      <div className="flex items-center gap-2">
                         <span className={`font-bold ${personalAvg >= 8 ? 'text-green-600' : 'text-slate-600'}`}>{personalAvg}</span>
                         {analytics.bySector[emp.sector]?.overallAvg && (
                           <span className="text-[10px] text-slate-400" title="Média do Setor">(Setor: {analytics.bySector[emp.sector].overallAvg})</span>
                         )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">Sem avaliações</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1">
                      Ver Histórico <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Award className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">Lidera<span className="text-blue-600">App</span></h1>
          </div>
          <p className="text-xs text-slate-400 mt-2 pl-11">Gestão de Performance</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard BI
          </button>
          <button 
             onClick={() => setActiveTab('evaluation')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'evaluation' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ClipboardCheck size={20} />
            Avaliações
          </button>
          <button 
             onClick={() => setActiveTab('employees')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'employees' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users size={20} />
            Colaboradores
          </button>
          <button 
             onClick={() => setActiveTab('settings')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings size={20} />
            Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate">Administrador</p>
              <p className="text-xs text-slate-400 truncate">admin@lidera.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Visão Geral & Inteligência'}
              {activeTab === 'evaluation' && 'Nova Avaliação'}
              {activeTab === 'employees' && 'Gestão de Talentos'}
              {activeTab === 'settings' && 'Configurações'}
            </h2>
            <p className="text-slate-500 mt-1">
              {activeTab === 'dashboard' && 'KPIs consolidados e comparação Mercado vs Setor.'}
              {activeTab === 'evaluation' && 'Formulário inteligente ajustado ao nível do cargo.'}
              {activeTab === 'employees' && 'Base de dados ativa de funcionários.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                <FileText size={14} className="text-blue-500"/>
                Relatório Mensal: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
             </span>
          </div>
        </header>

        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'evaluation' && <EvaluationFormView />}
        {activeTab === 'employees' && <EmployeesView />}
        {activeTab === 'settings' && (
          <div className="bg-white p-12 rounded-xl text-center border border-slate-100 shadow-sm">
            <Settings size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Configurações Avançadas</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
              Gerencie pesos, métricas personalizadas e regras de cálculo de média do sistema.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}