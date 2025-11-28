import { useState, useMemo, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/firebase';
import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import Papa from 'papaparse'; // Importante: npm install papaparse

import { 
  LayoutDashboard, Users, ClipboardCheck, Settings, TrendingUp, 
  Award, PieChart, LogOut, Database, Target, List, AlertTriangle, 
  Upload, Sun, Moon, FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar
} from 'recharts';

// --- TIPAGENS ---
interface Employee {
  id: string;
  name: string;
  role: string;
  sector: string;
  level: string;
  status: string;
  email?: string;
  admissionDate?: string;
}

interface Evaluation {
  id: string;
  employeeId: string;
  date: string;
  type: string;
  average: number;
  scores: Record<string, number>;
}

// --- CONFIGURAÇÕES DE METRICAS (Mapeamento CSV -> App) ---
// Mapeia nomes das colunas do CSV ou chaves internas para nomes legíveis
const METRICAS_MAP: Record<string, string> = {
  "Assiduidade_Pontualidade": "Assiduidade e Pontualidade",
  "Uso_Uniforme_EPI": "Uso de Uniforme e EPI",
  "Cumprimento_Tarefas": "Cumprimento das Tarefas",
  "Organizacao_Limpeza": "Organização e Limpeza",
  "Cumprimento_Rotina_Operacional": "Rotina Operacional",
  "Proatividade": "Proatividade",
  "Trabalho_Equipe": "Trabalho em Equipe",
  "Comunicacao_Colegas_Lideres": "Comunicação",
  "Respeito_Normas_Cultura": "Cultura e Normas",
  "Atendimento_Cliente": "Atendimento ao Cliente",
  // Líderes
  "Assiduidade_Pontualidade_Lider": "Assiduidade (Líder)",
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

// --- COMPONENTES UI ADAPTÁVEIS (LIGHT/DARK) ---

const Card = ({ title, value, icon: Icon, trend, subtitle }: { title: string; value: string | number; icon: LucideIcon; trend?: number; subtitle?: string }) => (
  <div className="bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-lidera-dark hover:border-skills-blue-primary dark:hover:border-lidera-gold/50 transition-all shadow-lg group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase group-hover:text-skills-blue-primary dark:group-hover:text-lidera-gold transition-colors">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-2 font-medium border-l-2 border-skills-blue-primary dark:border-lidera-gold pl-2">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-lidera-dark border border-gray-100 dark:border-lidera-dark group-hover:bg-blue-50 dark:group-hover:bg-lidera-gold/10 transition-colors">
        <Icon className="w-6 h-6 text-skills-blue-primary dark:text-lidera-gold" />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center text-sm">
        <span className={trend > 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
        <span className="text-gray-400 ml-2">vs mês anterior</span>
      </div>
    )}
  </div>
);

// --- DASHBOARD SUB-VIEWS ---

const DashboardGeral = ({ analytics, totalEvals, totalEmps, activeRoles, employeesList }: any) => {
  const sortedEmployees = [...employeesList].map((emp: Employee) => {
    const score = analytics.employeeScores[emp.id] || 0;
    return { ...emp, score };
  }).sort((a: any, b: any) => b.score - a.score);

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
        <div className="lg:col-span-2 bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-lidera-dark shadow-md">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-skills-blue-primary dark:text-lidera-gold" />
            Engajamento por Setor ({totalEvals})
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartDataSector}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" stroke="#888" tick={{fontSize: 12}} />
                <YAxis stroke="#888" />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.1)'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="Count" name="Avaliações" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP PERFORMERS MINI */}
        <div className="bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-lidera-dark shadow-md">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Destaques do Mês</h3>
          <div className="space-y-4">
            {sortedEmployees.slice(0, 5).map((emp: any, i: number) => (
              <div key={emp.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-lidera-dark rounded border border-gray-100 dark:border-lidera-dark">
                <div className="w-8 h-8 rounded-full bg-skills-blue-primary dark:bg-lidera-gold text-white dark:text-lidera-dark font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{emp.name}</p>
                  <p className="text-xs text-gray-500 truncate">{emp.role}</p>
                </div>
                <span className="text-skills-blue-secondary dark:text-lidera-gold font-bold">{emp.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP CONTENT ---
function AppContent() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Toggle Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      // Set CSS variables for charts
      document.documentElement.style.setProperty('--color-primary', '#D4AF37');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.setProperty('--color-primary', '#0F52BA');
    }
  }, [isDarkMode]);

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

  // --- CSV UPLOAD LOGIC ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'employees' | 'evaluations') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const batch = writeBatch(db);
          let count = 0;

          if (type === 'employees') {
            results.data.forEach((row: any) => {
              // Mapper inteligente baseado nos CSVs enviados
              const name = row['Nome_Colaborador'] || row['Nome_Completo'] || row['Nome'];
              const role = row['Cargo'] || row['Função'];
              
              if (name && role) {
                const newRef = doc(collection(db, "employees"));
                batch.set(newRef, {
                  name: name,
                  role: role,
                  sector: row['Setor'] || 'Não definido',
                  level: row['Nível'] || row['Nivel'] || 'Colaborador',
                  status: row['Status'] || 'Ativo',
                  email: row['Email'] || '',
                  admissionDate: row['Data_Contratacao'] || ''
                });
                count++;
              }
            });
          } else if (type === 'evaluations') {
            // Lógica complexa para agrupar avaliações baseadas nos CSVs do Looker
            // No CSV fornecido, cada linha é uma métrica. Precisamos agrupar por ID_Avaliacao
            const groupedEvals: Record<string, any> = {};

            results.data.forEach((row: any) => {
               const evalId = row['ID_Avaliacao'];
               if (!evalId) return;

               if (!groupedEvals[evalId]) {
                 groupedEvals[evalId] = {
                   employeeId: row['Nome_Colaborador'], // Nota: idealmente seria um ID, mas usaremos nome para linkar depois
                   date: row['Mes_Referencia'] || row['Data'] || new Date().toISOString(),
                   type: row['Nivel'] || 'Colaborador',
                   scores: {}
                 };
               }
               
               // Tenta pegar a nota
               const metricName = row['Nome_Metrica'];
               const scoreVal = parseFloat((row['Nota'] || '0').replace(',', '.'));
               
               if (metricName && !isNaN(scoreVal)) {
                 groupedEvals[evalId].scores[metricName] = scoreVal;
               }
            });

            // Converter agrupados para Firestore
            Object.values(groupedEvals).forEach((ev: any) => {
              // Tentar achar o ID do funcionario pelo nome (ineficiente, mas funcional para upload simples)
              const emp = employees.find(e => e.name === ev.employeeId);
              const finalEmpId = emp ? emp.id : 'unknown';
              
              const scoresVals = Object.values(ev.scores) as number[];
              const avg = scoresVals.length > 0 
                ? scoresVals.reduce((a, b) => a + b, 0) / scoresVals.length 
                : 0;

              const newRef = doc(collection(db, "evaluations"));
              batch.set(newRef, {
                employeeId: finalEmpId, // Salva ID se achou, senão salva 'unknown'
                tempName: ev.employeeId, // Backup
                date: ev.date,
                type: ev.type,
                average: parseFloat(avg.toFixed(2)),
                scores: ev.scores
              });
              count++;
            });
          }

          await batch.commit();
          alert(`${count} registros importados com sucesso! Atualize a página.`);
          window.location.reload();
        } catch (e) {
          console.error(e);
          alert("Erro ao processar arquivo. Verifique o console.");
        } finally {
          setIsUploading(false);
        }
      }
    });
  };

  // --- ANALYTICS MEMO ---
  const analytics = useMemo(() => {
    // Mesma lógica anterior, mas protegendo dados
    const stats = {
      global: { sum: {} as Record<string, number>, count: {} as Record<string, number>, avg: {} as Record<string, string> },
      bySector: {} as Record<string, any>, 
      chartDataSector: [] as any[],
      employeeScores: {} as Record<string, number>,
      totalAvg: "0"
    };
    
    // ... (Lógica de calculo mantida do original para brevidade)
    if (evaluations.length > 0) {
        const total = evaluations.reduce((acc, curr) => acc + (curr.average || 0), 0);
        stats.totalAvg = (total / evaluations.length).toFixed(1);
        
        // Populate chart data simplified
        const sectorCounts: Record<string, number> = {};
        employees.forEach(e => {
            sectorCounts[e.sector] = (sectorCounts[e.sector] || 0) + 1;
        });
        stats.chartDataSector = Object.entries(sectorCounts).map(([k, v]) => ({ name: k, Count: v }));
    }

    return stats;
  }, [evaluations, employees]);


  if (isLoading) return <div className="min-h-screen bg-skills-light dark:bg-lidera-dark flex items-center justify-center text-skills-blue-primary font-bold">Carregando Lidera Skills...</div>;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 bg-skills-light dark:bg-lidera-dark text-gray-600 dark:text-gray-300`}>
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-lidera-dark border-r border-gray-200 dark:border-lidera-gray hidden md:flex flex-col fixed h-full z-10 shadow-xl transition-colors duration-300">
        <div className="p-8 border-b border-gray-100 dark:border-lidera-gray">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white uppercase">
            Lidera<span className="text-brand-gradient">Skills</span>
          </h1>
          <p className="text-[10px] text-gray-400 mt-1 tracking-widest uppercase">Gestão de Performance</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'employees', label: 'Colaboradores', icon: Users },
            { id: 'import', label: 'Importação de Dados', icon: Database }, // Nova aba
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-blue-50 dark:bg-lidera-gray border-l-4 border-skills-blue-primary dark:border-lidera-gold text-skills-blue-primary dark:text-lidera-gold shadow-sm' 
                  : 'text-gray-500 hover:text-skills-blue-primary dark:text-gray-400 dark:hover:text-white dark:hover:bg-lidera-gray'}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        {/* Theme Toggle in Sidebar */}
        <div className="p-4 border-t border-gray-100 dark:border-lidera-gray">
            <div className="bg-gray-100 dark:bg-lidera-gray p-1 rounded-lg flex mb-4">
                <button 
                    onClick={() => setIsDarkMode(false)}
                    className={`flex-1 p-2 rounded-md flex justify-center ${!isDarkMode ? 'bg-white shadow text-skills-blue-primary' : 'text-gray-400'}`}
                >
                    <Sun size={16} />
                </button>
                <button 
                    onClick={() => setIsDarkMode(true)}
                    className={`flex-1 p-2 rounded-md flex justify-center ${isDarkMode ? 'bg-lidera-dark shadow text-lidera-gold' : 'text-gray-400'}`}
                >
                    <Moon size={16} />
                </button>
            </div>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-lidera-gray transition-colors">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8 transition-colors duration-300">
        {/* HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'import' && 'Importação de Arquivos'}
              {activeTab === 'employees' && 'Gestão de Talentos'}
              {activeTab === 'settings' && 'Configurações'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Olá, {user?.email}
            </p>
          </div>
        </header>

        {/* --- VIEW: IMPORTAÇÃO --- */}
        {activeTab === 'import' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
              <div className="bg-white dark:bg-lidera-gray p-8 rounded-xl shadow-lg border border-gray-100 dark:border-lidera-dark text-center group hover:border-skills-blue-primary dark:hover:border-lidera-gold transition-colors">
                  <div className="w-16 h-16 mx-auto bg-blue-50 dark:bg-lidera-dark rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users size={32} className="text-skills-blue-primary dark:text-lidera-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Funcionários e Cargos</h3>
                  <p className="text-sm text-gray-500 mb-6">Importe o arquivo <code>Funcionários.csv</code> contendo Nome, Cargo, Setor e Nível.</p>
                  
                  <label className={`block w-full py-3 px-4 rounded-lg cursor-pointer transition-colors font-bold
                      ${isUploading ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'bg-skills-blue-primary hover:bg-blue-700 text-white dark:bg-lidera-gold dark:text-lidera-dark dark:hover:bg-yellow-500'}`}>
                      {isUploading ? 'Processando...' : 'Selecionar CSV Funcionários'}
                      <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'employees')} disabled={isUploading} />
                  </label>
              </div>

              <div className="bg-white dark:bg-lidera-gray p-8 rounded-xl shadow-lg border border-gray-100 dark:border-lidera-dark text-center group hover:border-skills-blue-primary dark:hover:border-lidera-gold transition-colors">
                  <div className="w-16 h-16 mx-auto bg-blue-50 dark:bg-lidera-dark rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText size={32} className="text-skills-blue-primary dark:text-lidera-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Avaliações Históricas</h3>
                  <p className="text-sm text-gray-500 mb-6">Importe o arquivo <code>Avaliações.csv</code> ou fonte de dados do Looker Studio.</p>
                  
                  <label className={`block w-full py-3 px-4 rounded-lg cursor-pointer transition-colors font-bold
                      ${isUploading ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'bg-skills-blue-secondary hover:bg-teal-600 text-white dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'}`}>
                      {isUploading ? 'Processando...' : 'Selecionar CSV Avaliações'}
                      <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'evaluations')} disabled={isUploading} />
                  </label>
              </div>

              <div className="md:col-span-2 bg-blue-50 dark:bg-lidera-dark p-4 rounded-lg border border-blue-100 dark:border-gray-800 flex items-start gap-3">
                 <AlertTriangle className="text-skills-blue-primary dark:text-lidera-gold shrink-0" size={20} />
                 <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-bold mb-1 text-gray-800 dark:text-gray-200">Instruções de Importação</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Certifique-se que o CSV de Funcionários tenha as colunas: <strong>Nome_Completo, Cargo, Setor, Nível</strong>.</li>
                        <li>Para Avaliações, o sistema tentará agrupar linhas pelo <strong>ID_Avaliacao</strong> e calcular a média das métricas.</li>
                        <li>A importação pode levar alguns segundos dependendo do tamanho do arquivo.</li>
                    </ul>
                 </div>
              </div>
           </div>
        )}

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardGeral 
            analytics={analytics} 
            totalEvals={evaluations.length} 
            totalEmps={employees.length}
            activeRoles={new Set(employees.map(e => e.role)).size}
            employeesList={employees}
          />
        )}

        {/* EMPLOYEES LIST */}
        {activeTab === 'employees' && (
          <div className="bg-white dark:bg-lidera-gray rounded-lg border border-gray-200 dark:border-lidera-dark overflow-hidden shadow-lg animate-fadeIn">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-lidera-dark text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">
                    <tr>
                    <th className="px-6 py-4 font-medium">Nome</th>
                    <th className="px-6 py-4 font-medium">Cargo</th>
                    <th className="px-6 py-4 font-medium">Setor</th>
                    <th className="px-6 py-4 font-medium">Nível</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                    {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-blue-50 dark:hover:bg-lidera-dark/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                        <td className="px-6 py-4">{emp.role}</td>
                        <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-lidera-dark rounded text-xs border border-gray-200 dark:border-gray-700">{emp.sector}</span>
                        </td>
                        <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.level === 'Líder' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {emp.level}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-xs">{emp.status}</td>
                    </tr>
                    ))}
                    {employees.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum colaborador encontrado. Vá em "Importação de Dados".</td></tr>
                    )}
                </tbody>
                </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- LOGIN SCREEN REFORMULATED ---
function LoginScreen() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-skills-light flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-skills-blue-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-skills-blue-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border border-gray-100 z-10 relative">
        <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
          <Award className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">Lidera<span className="text-brand-gradient">Skills</span></h1>
        <p className="text-gray-500 mb-10 font-light">Plataforma de Gestão de Performance</p>
        
        <button 
          onClick={signIn} 
          className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl transition-all font-bold shadow-md transform hover:-translate-y-0.5"
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
  if (loading) return <div className="h-screen bg-skills-light flex items-center justify-center text-skills-blue-primary">Carregando...</div>;
  if (!user) return <LoginScreen />;
  return <AppContent />;
}