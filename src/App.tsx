import { useState, useMemo, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/firebase';
import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';

import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Settings, 
  TrendingUp, 
  Award, 
  PieChart, 
  LogOut,
  Database,
  Target,
  List,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { 
  BarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Legend,
  Cell
} from 'recharts';

// --- TIPAGENS ---
interface Employee {
  id: string;
  name: string;
  role: string;
  sector: string;
  level: string;
  status: string;
}

interface Evaluation {
  id: string;
  employeeId: string;
  date: string;
  type: string;
  average: number;
  scores: Record<string, number>;
}

interface MetricsMap {
  [key: string]: string;
}

// --- CONFIGURAÇÕES ---
const METRICAS_OPERADORES: MetricsMap = {
  "Assiduidade_Pontualidade": "Assiduidade e Pontualidade",
  "Uso_Uniforme_EPI": "Uso de Uniforme e EPI",
  "Cumprimento_Tarefas": "Cumprimento das Tarefas",
  "Organizacao_Limpeza": "Organização e Limpeza",
  "Cumprimento_Rotina_Operacional": "Rotina Operacional",
  "Proatividade": "Proatividade",
  "Trabalho_Equipe": "Trabalho em Equipe",
  "Comunicacao_Colegas_Lideres": "Comunicação",
  "Respeito_Normas_Cultura": "Cultura e Normas",
  "Atendimento_Cliente": "Atendimento ao Cliente"
};

const METRICAS_LIDERES: MetricsMap = {
  "Assiduidade_Pontualidade_Lider": "Assiduidade",
  "Cumprimento_Metas_Setor": "Metas do Setor",
  "Organizacao_Gestao_Setor": "Gestão do Setor",
  "Acompanhamento_Processos_Rotinas": "Processos e Rotinas",
  "Uso_Uniforme_Postura": "Postura e Exemplo",
  "Comunicacao_Clara_Coerente": "Comunicação Clara",
  "Relacionamento_Colaboradores": "Relacionamento",
  "Capacidade_Decisao_Resolucao": "Tomada de Decisão",
  "Reacao_Pressao_Conflitos": "Inteligência Emocional",
  "Atendimento_Cliente_Lider": "Foco no Cliente",
  "Participacao_Treinamento_Novo": "Treinamento de Novos",
  "Acompanhamento_Membros_Equipe": "Gestão de Pessoas",
  "Incentivo_Crescimento_Profissional": "Formação de Líderes",
  "Capacidade_Delegar_Acompanhar": "Delegação"
};

const SEED_EMPLOYEES = [
  { name: 'EDILSON ROCHA', role: 'Chefe de Loja', sector: 'Loja', level: 'Líder', status: 'Ativo' },
  { name: 'ITAMARA BORGES HOFFMANN', role: 'Auxiliar de Depósito', sector: 'Depósito', level: 'Colaborador', status: 'Ativo' },
  { name: 'DANIEL BRAGA DA SILVA', role: 'Encarregado Açougue', sector: 'Açougue', level: 'Líder', status: 'Ativo' },
  { name: 'SABRINA RIBEIRO SOUZA MARTINS', role: 'Gerente', sector: 'Gerência', level: 'Líder', status: 'Ativo' },
  { name: 'FRANCIELE CRISTIANE GARCIA', role: 'Operador de Caixa', sector: 'Caixa', level: 'Colaborador', status: 'Ativo' },
  { name: 'CRISTIANE JULIANE DA SILVA', role: 'Operador de Caixa', sector: 'Caixa', level: 'Colaborador', status: 'Ativo' },
  { name: 'FERNANDO BRITO DA SILVA', role: 'Encarregado Depósito', sector: 'Depósito', level: 'Líder', status: 'Ativo' },
];

// --- COMPONENTES UI LUXURY ---

const Card = ({ title, value, icon: Icon, trend, subtitle }: { title: string; value: string | number; icon: LucideIcon; trend?: number; subtitle?: string }) => (
  <div className="bg-lidera-800 p-6 rounded-lg border border-lidera-700 hover:border-lidera-gold/50 transition-all shadow-lg group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase group-hover:text-lidera-gold transition-colors">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-2 font-medium border-l-2 border-lidera-gold pl-2">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-lg bg-lidera-900 border border-lidera-700 group-hover:bg-lidera-gold/10 transition-colors">
        <Icon className="w-6 h-6 text-lidera-gold" />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center text-sm">
        <span className={trend > 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
        <span className="text-gray-500 ml-2">vs mês anterior</span>
      </div>
    )}
  </div>
);

// --- DASHBOARD SUB-VIEWS ---

const DashboardGeral = ({ analytics, totalEvals, totalEmps, activeRoles, employeesList }: any) => {
  // Sort employees by performance for the table
  const sortedEmployees = [...employeesList].map(emp => {
    const score = analytics.employeeScores[emp.id] || 0;
    return { ...emp, score };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Saúde Geral" value={analytics.totalAvg} icon={Award} trend={1.2} subtitle="Média Geral da Empresa" />
        <Card title="Funcionários Ativos" value={totalEmps} icon={Users} />
        <Card title="Setores Ativos" value={Object.keys(analytics.bySector).length} icon={PieChart} />
        <Card title="Cargos Avaliados" value={activeRoles} icon={ClipboardCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ENGAGEMENT CHART */}
        <div className="lg:col-span-2 bg-lidera-800 p-6 rounded-lg border border-lidera-700">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-lidera-gold" />
            Engajamento por Setor
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartDataSector}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" stroke="#666" tick={{fontSize: 12}} />
                <YAxis stroke="#666" />
                <Tooltip 
                  cursor={{fill: '#2A2A2A'}}
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#D4AF37', color: '#FFF' }}
                />
                <Bar dataKey="Count" name="Avaliações" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP PERFORMERS MINI */}
        <div className="bg-lidera-800 p-6 rounded-lg border border-lidera-700">
          <h3 className="text-lg font-bold text-white mb-4">Destaques do Mês</h3>
          <div className="space-y-4">
            {sortedEmployees.slice(0, 5).map((emp, i) => (
              <div key={emp.id} className="flex items-center gap-3 p-3 bg-lidera-900 rounded border border-lidera-700">
                <div className="w-8 h-8 rounded-full bg-lidera-gold text-lidera-900 font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                  <p className="text-xs text-gray-500 truncate">{emp.role}</p>
                </div>
                <span className="text-lidera-gold font-bold">{emp.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-lidera-800 rounded-lg border border-lidera-700 overflow-hidden">
        <div className="p-6 border-b border-lidera-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Tabela Geral de Performance</h3>
          <button className="text-xs text-lidera-gold hover:text-white transition-colors uppercase font-bold tracking-wider">Ver Relatório Completo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-lidera-900 text-gray-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Nível</th>
                <th className="px-6 py-4">Setor</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4 text-right">Nota Média</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lidera-700 text-gray-300">
              {sortedEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-lidera-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${emp.level === 'Líder' ? 'border-yellow-600 text-yellow-500' : 'border-blue-800 text-blue-400'}`}>
                      {emp.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">{emp.sector}</td>
                  <td className="px-6 py-4">{emp.role}</td>
                  <td className="px-6 py-4 font-medium text-white">{emp.name}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-base font-bold ${emp.score >= 8.5 ? 'text-emerald-400' : emp.score >= 7 ? 'text-lidera-gold' : 'text-red-400'}`}>
                      {emp.score > 0 ? emp.score.toFixed(1) : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardEstrategico = ({ analytics }: any) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ALERTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h4 className="text-red-400 font-bold uppercase text-xs tracking-wider">Pontos de Atenção</h4>
          </div>
          <p className="text-2xl font-bold text-white mb-1">3 Setores</p>
          <p className="text-xs text-gray-400">Abaixo da média de mercado (7.0)</p>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-900/50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-emerald-500" size={20} />
            <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-wider">Alta Performance</h4>
          </div>
          <p className="text-2xl font-bold text-white mb-1">5 Líderes</p>
          <p className="text-xs text-gray-400">Acima da meta corporativa (9.0)</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-900/50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-blue-500" size={20} />
            <h4 className="text-blue-400 font-bold uppercase text-xs tracking-wider">Aderência</h4>
          </div>
          <p className="text-2xl font-bold text-white mb-1">94%</p>
          <p className="text-xs text-gray-400">Das avaliações planejadas realizadas</p>
        </div>
      </div>

      <div className="bg-lidera-800 p-6 rounded-lg border border-lidera-700">
        <h3 className="text-lg font-bold text-white mb-6">Matriz de Competência (Radar)</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.radarData}>
              <PolarGrid stroke="#444" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#666' }} />
              <RechartsRadar
                name="Média Geral"
                dataKey="A"
                stroke="#D4AF37"
                strokeWidth={3}
                fill="#D4AF37"
                fillOpacity={0.4}
              />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#D4AF37', color: '#FFF' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const DashboardCriterios = ({ analytics }: any) => {
  // Sort detailed metrics for ranking
  const sortedMetrics = Object.entries(analytics.stats.global.avg)
    .map(([key, val]) => ({
      name: METRICAS_OPERADORES[key] || METRICAS_LIDERES[key] || key,
      value: parseFloat(val as string)
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-lidera-800 p-8 rounded-lg border border-lidera-700 animate-fadeIn">
      <h3 className="text-lg font-bold text-white mb-2">Média por Critério de Avaliação</h3>
      <p className="text-sm text-gray-400 mb-8">Ranking detalhado das competências avaliadas em toda a organização.</p>
      
      <div className="space-y-6">
        {sortedMetrics.map((metric, i) => (
          <div key={i} className="relative">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span className="text-gray-300">{metric.name}</span>
              <span className={`font-bold ${metric.value >= 8 ? 'text-lidera-gold' : 'text-gray-500'}`}>{metric.value.toFixed(1)}</span>
            </div>
            <div className="w-full bg-lidera-900 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-lidera-gold to-yellow-600 rounded-full" 
                style={{ width: `${metric.value * 10}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- APP CONTENT ---
function AppContent() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardView, setDashboardView] = useState('geral');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [evaluationData, setEvaluationData] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empSnap = await getDocs(collection(db, 'employees'));
        const evalSnap = await getDocs(collection(db, 'evaluations'));
        setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
        setEvaluations(evalSnap.docs.map(d => ({ id: d.id, ...d.data() } as Evaluation)));
      } catch (error) {
        console.error("Erro dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const seedDatabase = async () => {
    if (!confirm("Confirmar carga inicial de dados?")) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      SEED_EMPLOYEES.forEach(emp => {
        const newRef = doc(collection(db, "employees"));
        batch.set(newRef, emp);
      });
      await batch.commit();
      alert("Dados inseridos! Atualize a página.");
      window.location.reload();
    } catch (e) {
      alert("Erro na carga.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const analytics = useMemo(() => {
    const stats = {
      global: { sum: {} as Record<string, number>, count: {} as Record<string, number>, avg: {} as Record<string, string> },
      bySector: {} as Record<string, any>, 
      byMonth: {} as Record<string, { sum: number; count: number; avg: number }>,
      employeeScores: {} as Record<string, number>
    };

    evaluations.forEach(ev => {
      const emp = employees.find(e => e.id === ev.employeeId);
      if (!emp) return;
      
      // Track latest score per employee for table
      stats.employeeScores[emp.id] = ev.average;

      const sector = emp.sector;
      const dateObj = new Date(ev.date + 'T12:00:00'); 
      const month = dateObj.toLocaleString('pt-BR', { month: 'short' });

      if (!stats.bySector[sector]) stats.bySector[sector] = { sum: {}, count: {}, avg: {}, rawScores: [], evalCount: 0 };
      if (!stats.byMonth[month]) stats.byMonth[month] = { sum: 0, count: 0, avg: 0 };

      stats.byMonth[month].sum += ev.average;
      stats.byMonth[month].count += 1;
      
      stats.bySector[sector].rawScores.push(ev.average);
      stats.bySector[sector].evalCount += 1;

      Object.entries(ev.scores).forEach(([metricName, score]) => {
        const val = score || 0;
        stats.global.sum[metricName] = (stats.global.sum[metricName] || 0) + val;
        stats.global.count[metricName] = (stats.global.count[metricName] || 0) + 1;
        stats.bySector[sector].sum[metricName] = (stats.bySector[sector].sum[metricName] || 0) + val;
        stats.bySector[sector].count[metricName] = (stats.bySector[sector].count[metricName] || 0) + 1;
      });
    });

    Object.keys(stats.global.sum).forEach(m => {
      stats.global.avg[m] = (stats.global.sum[m] / stats.global.count[m]).toFixed(2);
    });

    Object.keys(stats.bySector).forEach(s => {
      const total = stats.bySector[s].rawScores.reduce((a: number, b: number) => a + b, 0);
      stats.bySector[s].overallAvg = (total / stats.bySector[s].rawScores.length).toFixed(1);
    });

    const chartDataEvolution = Object.entries(stats.byMonth).map(([name, data]) => ({
      name,
      Média: parseFloat((data.sum / data.count).toFixed(1))
    }));

    const chartDataSector = Object.entries(stats.bySector).map(([name, data]) => ({
      name,
      Media: parseFloat(data.overallAvg),
      Count: data.evalCount
    })).sort((a, b) => b.Media - a.Media);

    // Radar Data
    const radarData = Object.entries(stats.global.avg).map(([key, value]) => {
        const friendlyName = METRICAS_OPERADORES[key] || METRICAS_LIDERES[key] || key.replace(/_/g, ' ');
        return {
          subject: friendlyName.length > 15 ? friendlyName.substring(0, 12) + '...' : friendlyName,
          A: parseFloat(value as string),
          fullMark: 10
        };
    }).slice(0, 6);

    const totalAvg = evaluations.length > 0 
      ? (evaluations.reduce((acc, curr) => acc + curr.average, 0) / evaluations.length).toFixed(1) 
      : "0";

    return { stats, bySector: stats.bySector, chartDataEvolution, chartDataSector, radarData, totalAvg, employeeScores: stats.employeeScores };
  }, [evaluations, employees]);

  // Count active roles
  const activeRoles = useMemo(() => {
    const roles = new Set(employees.map(e => e.role));
    return roles.size;
  }, [employees]);

  const submitEvaluation = async () => {
    if (!selectedEmployeeId) return;
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;

    setIsSubmitting(true);
    const metrics = emp.level === 'Líder' ? METRICAS_LIDERES : METRICAS_OPERADORES;
    const values = Object.values(metrics);
    const total = values.reduce((acc, m) => acc + (evaluationData[m] || 0), 0);
    const avg = total / values.length;

    try {
      const newEval = {
        employeeId: selectedEmployeeId,
        date: new Date().toISOString().split('T')[0],
        type: emp.level,
        average: parseFloat(avg.toFixed(2)),
        scores: evaluationData
      };
      const ref = await addDoc(collection(db, "evaluations"), newEval);
      setEvaluations([{ id: ref.id, ...newEval }, ...evaluations]);
      alert("Sucesso!");
      setSelectedEmployeeId('');
      setEvaluationData({});
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const currentMetricsList = selectedEmployee 
    ? Object.values(selectedEmployee.level === 'Líder' ? METRICAS_LIDERES : METRICAS_OPERADORES) 
    : [];

  if (isLoading) return <div className="min-h-screen bg-lidera-900 flex items-center justify-center text-lidera-gold">Carregando Sistema...</div>;

  return (
    <div className="min-h-screen bg-lidera-900 font-sans text-gray-200 flex">
      {/* SIDEBAR LUXURY */}
      <aside className="w-64 bg-lidera-900 border-r border-lidera-700 hidden md:flex flex-col fixed h-full z-10 shadow-2xl">
        <div className="p-8 border-b border-lidera-700">
          <h1 className="text-2xl font-bold tracking-widest text-white uppercase">
            Somos<span className="text-gold-gradient">Lidera</span>
          </h1>
          <p className="text-[10px] text-gray-500 mt-1 tracking-widest uppercase">Performance Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', label: 'BI Analytics', icon: LayoutDashboard },
            { id: 'evaluation', label: 'Nova Avaliação', icon: ClipboardCheck },
            { id: 'employees', label: 'Colaboradores', icon: Users },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-gradient-to-r from-lidera-800 to-lidera-900 border-l-4 border-lidera-gold text-lidera-gold shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-lidera-800'}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-lidera-700">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-lidera-800 transition-colors">
            <LogOut size={18} /> Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8">
        {/* HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {activeTab === 'dashboard' && 'Inteligência de Dados'}
              {activeTab === 'evaluation' && 'Central de Avaliação'}
              {activeTab === 'employees' && 'Gestão de Talentos'}
              {activeTab === 'settings' && 'Configurações do Sistema'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Bem-vindo, {user?.email}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lidera-gold to-yellow-700 p-[2px]">
            <div className="w-full h-full rounded-full bg-lidera-900 flex items-center justify-center text-lidera-gold font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* DASHBOARD TABS & CONTENT */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* SUB-MENU DO RELATÓRIO */}
            <div className="flex border-b border-lidera-700 gap-8 overflow-x-auto">
              {[
                { id: 'geral', label: 'Quadro Geral', icon: LayoutDashboard },
                { id: 'estrategico', label: 'Painel Estratégico', icon: Target },
                { id: 'criterios', label: 'Média Critérios', icon: List },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDashboardView(tab.id)}
                  className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative whitespace-nowrap
                    ${dashboardView === tab.id ? 'text-lidera-gold' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {dashboardView === tab.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lidera-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"></span>
                  )}
                </button>
              ))}
            </div>

            {/* DASHBOARD CONTENT SWITCHER */}
            {dashboardView === 'geral' && (
              <DashboardGeral 
                analytics={analytics} 
                totalEvals={evaluations.length} 
                totalEmps={employees.length}
                activeRoles={activeRoles}
                employeesList={employees}
              />
            )}
            {dashboardView === 'estrategico' && <DashboardEstrategico analytics={analytics} />}
            {dashboardView === 'criterios' && <DashboardCriterios analytics={analytics} />}
          </div>
        )}

        {/* EVALUATION FORM */}
        {activeTab === 'evaluation' && (
          <div className="max-w-4xl mx-auto bg-lidera-800 p-8 rounded-lg border border-lidera-700 shadow-xl">
            <h3 className="font-bold text-white mb-6 text-xl border-b border-lidera-700 pb-4">Nova Avaliação de Desempenho</h3>
            
            <div className="mb-8">
              <label className="block text-sm text-gray-400 mb-2">Selecione o Colaborador</label>
              <select 
                className="w-full p-4 bg-lidera-900 border border-lidera-700 text-white rounded-lg focus:border-lidera-gold focus:ring-1 focus:ring-lidera-gold outline-none transition-all" 
                onChange={handleStartEvaluation} 
                value={selectedEmployeeId}
              >
                <option value="">Buscar na base de dados...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
              </select>
            </div>

            {selectedEmployee && (
              <div className="space-y-8 animate-fadeIn">
                 <div className="bg-lidera-900/50 p-4 rounded border border-lidera-700 flex gap-4 text-sm text-gray-300">
                    <div><span className="text-gray-500 block text-xs uppercase">Setor</span> {selectedEmployee.sector}</div>
                    <div><span className="text-gray-500 block text-xs uppercase">Nível</span> <span className="text-lidera-gold">{selectedEmployee.level}</span></div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {currentMetricsList.map((metric, i) => (
                     <div key={i} className="p-4 bg-lidera-900 rounded border border-lidera-700 hover:border-gray-600 transition-colors">
                        <div className="flex justify-between mb-3">
                          <label className="text-sm font-medium text-gray-200 h-10 flex items-center">{metric}</label>
                          <span className="text-xl font-bold text-lidera-gold">{evaluationData[metric] || 0}</span>
                        </div>
                        <input 
                          type="range" min="0" max="10" step="0.5" 
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lidera-gold" 
                          value={evaluationData[metric] || 0} 
                          onChange={(e) => handleScoreChange(metric, e.target.value)} 
                        />
                     </div>
                   ))}
                 </div>

                 <div className="pt-6 border-t border-lidera-700">
                   <button 
                    onClick={submitEvaluation} 
                    disabled={isSubmitting} 
                    className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded-lg transition-all transform hover:scale-[1.01] shadow-lg shadow-yellow-900/20"
                   >
                     {isSubmitting ? 'Processando Avaliação...' : 'FINALIZAR AVALIAÇÃO'}
                   </button>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* EMPLOYEES LIST */}
        {activeTab === 'employees' && (
          <div className="bg-lidera-800 rounded-lg border border-lidera-700 overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-lidera-900 text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Nome</th>
                  <th className="px-6 py-4 font-medium">Cargo</th>
                  <th className="px-6 py-4 font-medium">Setor</th>
                  <th className="px-6 py-4 font-medium">Nível</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lidera-700 text-gray-300">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-lidera-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{emp.name}</td>
                    <td className="px-6 py-4">{emp.role}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-lidera-900 rounded text-xs border border-lidera-700">{emp.sector}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.level === 'Líder' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-900/50' : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'}`}>
                        {emp.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-lidera-800 p-12 rounded-lg border border-lidera-700 text-center shadow-xl">
            <div className="w-20 h-20 bg-lidera-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-lidera-700">
              <Database size={40} className="text-lidera-gold" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Administração de Dados</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Utilize esta ferramenta para reinicializar ou popular o banco de dados com informações de teste para validação dos dashboards.
            </p>
            <button onClick={seedDatabase} disabled={isSubmitting} className="px-8 py-3 bg-lidera-700 hover:bg-lidera-600 text-white rounded-lg transition-colors border border-lidera-600 font-medium">
              {isSubmitting ? 'Sincronizando...' : 'Executar Carga Inicial (Seed)'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// --- LOGIN SCREEN LUXURY ---
function LoginScreen() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-lidera-900 flex items-center justify-center p-4">
      <div className="bg-lidera-800 p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border border-lidera-700">
        <div className="w-16 h-16 bg-gradient-to-br from-lidera-gold to-yellow-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-900/20">
          <Award className="text-lidera-900" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Somos<span className="text-gold-gradient">Lidera</span></h1>
        <p className="text-gray-400 mb-10 font-light">Plataforma de Gestão de Performance</p>
        
        <button 
          onClick={signIn} 
          className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl transition-all font-bold shadow-lg transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Acessar com Google
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

function AuthWrapper() {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen bg-lidera-900 flex items-center justify-center text-lidera-gold">Carregando...</div>;
  if (!user) return <LoginScreen />;
  return <AppContent />;
}