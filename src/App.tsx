import { useState, useMemo, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/firebase';
import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';

import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Settings, 
  Search, 
  Plus, 
  TrendingUp, 
  Award, 
  FileText,
  PieChart,
  BarChart3,
  Save,
  Filter,
  ChevronRight,
  LogOut,
  Database
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Line,
  ComposedChart,
  AreaChart,
  Area
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
  "Cumprimento_Rotina_Operacional": "Cumprimento da Rotina Operacional",
  "Proatividade": "Proatividade",
  "Trabalho_Equipe": "Trabalho em Equipe",
  "Comunicacao_Colegas_Lideres": "Comunicação com Colegas/Líderes",
  "Respeito_Normas_Cultura": "Respeito às Normas e Cultura",
  "Atendimento_Cliente": "Atendimento ao Cliente"
};

const METRICAS_LIDERES: MetricsMap = {
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

// --- DADOS PARA CARGA INICIAL (SEED) ---
const SEED_EMPLOYEES = [
  { name: 'EDILSON ROCHA', role: 'Chefe de Loja', sector: 'Loja', level: 'Líder', status: 'Ativo' },
  { name: 'ITAMARA BORGES HOFFMANN', role: 'Auxiliar de Depósito', sector: 'Depósito', level: 'Colaborador', status: 'Ativo' },
  { name: 'DANIEL BRAGA DA SILVA', role: 'Encarregado Açougue', sector: 'Açougue', level: 'Líder', status: 'Ativo' },
  { name: 'SABRINA RIBEIRO SOUZA MARTINS', role: 'Gerente', sector: 'Gerência', level: 'Líder', status: 'Ativo' },
  { name: 'FRANCIELE CRISTIANE GARCIA', role: 'Operador de Caixa', sector: 'Caixa', level: 'Colaborador', status: 'Ativo' },
  { name: 'CRISTIANE JULIANE DA SILVA', role: 'Operador de Caixa', sector: 'Caixa', level: 'Colaborador', status: 'Ativo' },
  { name: 'FERNANDO BRITO DA SILVA', role: 'Encarregado Depósito', sector: 'Depósito', level: 'Líder', status: 'Ativo' },
];

// --- COMPONENTES UI ---
const colorVariants: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
};

interface CardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: keyof typeof colorVariants;
  subtitle?: string;
}

const Card = ({ title, value, icon: Icon, trend, color = "blue", subtitle }: CardProps) => {
  const styles = colorVariants[color] || colorVariants.blue;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${styles.bg}`}>
          <Icon className={`w-6 h-6 ${styles.text}`} />
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
};

// --- APP CONTENT (Logado) ---
function AppContent() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [evaluationData, setEvaluationData] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const empSnap = await getDocs(collection(db, 'employees'));
        const evalSnap = await getDocs(collection(db, 'evaluations'));
        
        const empData = empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        const evalData = evalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluation));
        
        setEmployees(empData);
        setEvaluations(evalData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- SEED DATABASE FUNCTION ---
  const seedDatabase = async () => {
    if (!confirm("Isso adicionará dados de teste ao banco de dados real. Continuar?")) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      
      // Seed Employees
      SEED_EMPLOYEES.forEach(emp => {
        const newRef = doc(collection(db, "employees"));
        batch.set(newRef, emp);
      });

      await batch.commit();
      alert("Dados de teste inseridos! Recarregue a página.");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao inserir dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- BI ENGINE ---
  const analytics = useMemo(() => {
    interface SectorStats {
      sum: Record<string, number>;
      count: Record<string, number>;
      avg: Record<string, string>;
      rawScores: number[];
      overallAvg?: string;
    }

    const stats = {
      global: { sum: {} as Record<string, number>, count: {} as Record<string, number>, avg: {} as Record<string, string> },
      bySector: {} as Record<string, SectorStats>, 
      byMonth: {} as Record<string, { sum: number; count: number; avg: number }>
    };

    evaluations.forEach(ev => {
      const emp = employees.find(e => e.id === ev.employeeId);
      if (!emp) return;

      const sector = emp.sector;
      const dateObj = new Date(ev.date + 'T12:00:00'); 
      const month = dateObj.toLocaleString('pt-BR', { month: 'short' });

      if (!stats.bySector[sector]) stats.bySector[sector] = { sum: {}, count: {}, avg: {}, rawScores: [] };
      if (!stats.byMonth[month]) stats.byMonth[month] = { sum: 0, count: 0, avg: 0 };

      stats.byMonth[month].sum += ev.average;
      stats.byMonth[month].count += 1;
      stats.bySector[sector].rawScores.push(ev.average);

      Object.entries(ev.scores).forEach(([metricName, score]) => {
        const val = score || 0;
        stats.global.sum[metricName] = (stats.global.sum[metricName] || 0) + val;
        stats.global.count[metricName] = (stats.global.count[metricName] || 0) + 1;
        stats.bySector[sector].sum[metricName] = (stats.bySector[sector].sum[metricName] || 0) + val;
        stats.bySector[sector].count[metricName] = (stats.bySector[sector].count[metricName] || 0) + 1;
      });
    });

    Object.keys(stats.global.sum).forEach(metric => {
      stats.global.avg[metric] = (stats.global.sum[metric] / stats.global.count[metric]).toFixed(2);
    });

    Object.keys(stats.bySector).forEach(sector => {
      Object.keys(stats.bySector[sector].sum).forEach(metric => {
        stats.bySector[sector].avg[metric] = (stats.bySector[sector].sum[metric] / stats.bySector[sector].count[metric]).toFixed(2);
      });
      const sectorTotal = stats.bySector[sector].rawScores.reduce((a, b) => a + b, 0);
      stats.bySector[sector].overallAvg = (sectorTotal / stats.bySector[sector].rawScores.length).toFixed(1);
    });

    const chartDataEvolution = Object.entries(stats.byMonth).map(([name, data]) => ({
      name,
      Média: parseFloat((data.sum / data.count).toFixed(1))
    }));

    const chartDataSector = Object.entries(stats.bySector).map(([name, data]) => ({
      name,
      Media: data.overallAvg ? parseFloat(data.overallAvg) : 0,
      Meta: 8.5
    }));

    const totalAvg = evaluations.length > 0 
      ? (evaluations.reduce((acc, curr) => acc + curr.average, 0) / evaluations.length).toFixed(1) 
      : "0";

    return { stats, bySector: stats.bySector, chartDataEvolution, chartDataSector, totalAvg };
  }, [evaluations, employees]);

  // --- ACTIONS ---
  const handleStartEvaluation = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEmployeeId(e.target.value);
    setEvaluationData({});
  };

  const handleScoreChange = (metric: string, score: string) => {
    setEvaluationData(prev => ({ ...prev, [metric]: parseFloat(score) }));
  };

  const submitEvaluation = async () => {
    if (!selectedEmployeeId) return;
    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    
    // Calcular Média
    const currentMetricsMap = selectedEmployee.level === 'Líder' ? METRICAS_LIDERES : METRICAS_OPERADORES;
    const expectedMetrics = Object.values(currentMetricsMap);
    const totalScore = expectedMetrics.reduce((acc, metric) => acc + (evaluationData[metric] || 0), 0);
    const average = totalScore / expectedMetrics.length;

    const newEval = {
      employeeId: selectedEmployeeId,
      date: new Date().toISOString().split('T')[0],
      type: selectedEmployee.level,
      average: parseFloat(average.toFixed(2)),
      scores: evaluationData
    };

    try {
      const docRef = await addDoc(collection(db, "evaluations"), newEval);
      setEvaluations([{ id: docRef.id, ...newEval }, ...evaluations]);
      alert("Avaliação salva com sucesso!");
      setSelectedEmployeeId('');
      setEvaluationData({});
      setActiveTab('dashboard');
    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Erro ao salvar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const currentMetricsList = selectedEmployee 
    ? Object.values(selectedEmployee.level === 'Líder' ? METRICAS_LIDERES : METRICAS_OPERADORES) 
    : [];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando dados...</div>;
  }

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
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} /> Dashboard BI
          </button>
          <button onClick={() => setActiveTab('evaluation')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'evaluation' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ClipboardCheck size={20} /> Avaliações
          </button>
          <button onClick={() => setActiveTab('employees')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'employees' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Users size={20} /> Colaboradores
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Settings size={20} /> Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8">
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'evaluation' && 'Nova Avaliação'}
              {activeTab === 'employees' && 'Gestão de Talentos'}
              {activeTab === 'settings' && 'Configurações'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {user?.email}
             </span>
          </div>
        </header>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card title="Avaliações" value={evaluations.length} icon={ClipboardCheck} color="blue" />
              <Card title="Média Global" value={analytics.totalAvg} icon={TrendingUp} color="emerald" subtitle="Meta: 8.5" />
              <Card title="Colaboradores" value={employees.length} icon={Users} color="violet" />
              <Card title="Setores" value={SECTORES.length} icon={PieChart} color="orange" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
               <h3 className="font-bold mb-4">Média por Setor</h3>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.chartDataSector}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="Media" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* EVALUATIONS */}
        {activeTab === 'evaluation' && (
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">Nova Avaliação</h3>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg mb-6" onChange={handleStartEvaluation} value={selectedEmployeeId}>
              <option value="">Selecione um colaborador...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.role}</option>)}
            </select>

            {selectedEmployee && (
              <div className="space-y-6">
                 {currentMetricsList.map((metric, i) => (
                   <div key={i} className="pb-4 border-b border-slate-100 last:border-0">
                      <div className="flex justify-between mb-2">
                        <label>{metric}</label>
                        <span className="font-bold text-blue-600">{evaluationData[metric] || 0}</span>
                      </div>
                      <input type="range" min="0" max="10" step="0.5" className="w-full h-2 bg-slate-200 rounded-lg accent-blue-600" 
                        value={evaluationData[metric] || 0} onChange={(e) => handleScoreChange(metric, e.target.value)} />
                   </div>
                 ))}
                 <button onClick={submitEvaluation} disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
                   {isSubmitting ? 'Salvando...' : 'Finalizar Avaliação'}
                 </button>
              </div>
            )}
          </div>
        )}

        {/* EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Setor</th>
                  <th className="px-6 py-4">Nível</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td className="px-6 py-4 font-medium">{emp.name}</td>
                    <td className="px-6 py-4">{emp.role}</td>
                    <td className="px-6 py-4">{emp.sector}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.level === 'Líder' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
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
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
            <Database size={48} className="mx-auto text-blue-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Banco de Dados</h3>
            <p className="text-slate-500 mb-6">Use esta função apenas na configuração inicial para popular o banco.</p>
            <button onClick={seedDatabase} disabled={isSubmitting} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition">
              {isSubmitting ? 'Enviando...' : 'Carga Inicial (Seed Data)'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// --- LOGIN SCREEN ---
function LoginScreen() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Award className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Lidera Skills</h1>
        <p className="text-slate-500 mb-8">Faça login para acessar o painel.</p>
        
        <button onClick={signIn} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Entrar com Google
        </button>
      </div>
    </div>
  );
}

// --- MAIN ENTRY POINT ---
export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

function AuthWrapper() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <LoginScreen />;
  
  return <AppContent />;
}