import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, Settings, LogOut, Briefcase, 
  Layers, UserCog, Sun, Moon, ChevronDown, ChevronRight, Search, List, Award
} from 'lucide-react';

// Imports dos Módulos
import { Card } from './components/ui/Card';
import { GenericDatabaseView } from './components/settings/GenericDatabaseView';
import { Dashboard } from './components/dashboard/Dashboard';

// Configurações
const METRICAS_OPERADOR = ["Assiduidade e Pontualidade", "Uso de Uniforme e EPI", "Cumprimento das Tarefas", "Organização", "Proatividade", "Trabalho em Equipe", "Comunicação"];
const METRICAS_LIDER = ["Gestão de Equipe", "Metas", "Processos", "Postura", "Comunicação", "Decisão", "Inteligência Emocional"];

function AppContent() {
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState('home');
  const [settingsSubOpen, setSettingsSubOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Estados de Dados
  const [evalType, setEvalType] = useState<'leader' | 'team'>('team');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [evalForm, setEvalForm] = useState<any>({});
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
        const empSnap = await getDocs(collection(db, 'employees'));
        const evalSnap = await getDocs(collection(db, 'evaluations'));
        setEmployeesList(empSnap.docs.map(d => ({id: d.id, ...d.data()})));
        setEvaluationsList(evalSnap.docs.map(d => ({id: d.id, ...d.data()})));
    };
    load();
  }, [activeView]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const startEvaluation = (type: 'leader' | 'team') => {
    setEvalType(type);
    setEvalForm({});
    setActiveView('evaluation-select');
  };

  const submitEvaluation = async () => {
     if(!selectedEmployee) return;
     const scoresValues = Object.values(evalForm) as number[];
     const average = scoresValues.length ? scoresValues.reduce((a,b) => a+b, 0) / scoresValues.length : 0;
     
     await addDoc(collection(db, 'evaluations'), {
        employeeId: selectedEmployee.id,
        tempName: selectedEmployee.name,
        role: selectedEmployee.role,
        sector: selectedEmployee.sector,
        type: evalType === 'leader' ? 'Líder' : 'Colaborador',
        date: new Date().toISOString().split('T')[0],
        average: parseFloat(average.toFixed(2)),
        scores: evalForm
     });
     alert("Avaliação salva!");
     setActiveView('home');
  };

  const menuItems = [
    { id: 'home', label: 'Início', icon: Briefcase },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Configurações', icon: Settings, hasSub: true },
  ];

  // CORREÇÃO: Adicionado 'as const' nos tipos para satisfazer o TypeScript
  const settingsItems = [
    { 
      id: 'settings-cargos', 
      label: 'Cargos', 
      icon: UserCog, 
      col: 'cargos', 
      cols: [
        {key: 'nome', label: 'Nome do Cargo', type: 'text' as const}, 
        {key: 'nivel', label: 'Nível Hierárquico', type: 'select' as const, options: ['Estratégico', 'Tático', 'Operacional']}
      ] 
    },
    { 
      id: 'settings-setores', 
      label: 'Setores', 
      icon: Layers, 
      col: 'setores', 
      cols: [
        {key: 'nome', label: 'Nome do Setor', type: 'text' as const},
        {key: 'gestor', label: 'Gestor Responsável', type: 'text' as const} 
      ] 
    },
    { 
      id: 'settings-funcionarios', 
      label: 'Funcionários', 
      icon: Users, 
      col: 'employees', 
      cols: [
        { key: 'customId', label: 'ID Func.', type: 'text' as const },
        { key: 'name', label: 'Nome Completo', type: 'text' as const },
        { key: 'email', label: 'Email', type: 'email' as const },
        // Campos Vinculados
        { key: 'role', label: 'Cargo', type: 'select' as const, linkedCollection: 'cargos', linkedField: 'nome' },
        { key: 'sector', label: 'Setor', type: 'select' as const, linkedCollection: 'setores', linkedField: 'nome' },
        { key: 'level', label: 'Nível', type: 'select' as const, options: ['Líder', 'Colaborador'] },
        { key: 'hiringDate', label: 'Data Contratação', type: 'date' as const },
        { key: 'status', label: 'Status', type: 'select' as const, options: ['Ativo', 'Inativo', 'Férias', 'Afastado'] }
      ] 
    },
    { 
      id: 'settings-usuarios', 
      label: 'Usuários do Sistema', 
      icon: Users, 
      col: 'users', 
      cols: [
        {key: 'email', label: 'Email Google', type: 'email' as const}, 
        {key: 'role', label: 'Permissão', type: 'select' as const, options: ['Admin', 'Líder', 'Visualizador']}
      ] 
    },
  ];

  return (
    <div className="min-h-screen bg-skills-light dark:bg-lidera-dark font-sans text-gray-600 dark:text-gray-300 flex transition-colors duration-300">
       <aside className="w-64 bg-white dark:bg-lidera-dark border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full z-20 shadow-xl overflow-y-auto">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-tighter">
                Lidera<span className="text-brand-gradient">Skills</span>
            </h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
             {menuItems.map(item => (
                <div key={item.id}>
                    <button 
                        onClick={() => item.hasSub ? setSettingsSubOpen(!settingsSubOpen) : setActiveView(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all mb-1
                        ${activeView === item.id ? 'bg-blue-50 dark:bg-gray-800 text-skills-blue-primary dark:text-lidera-gold' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <div className="flex items-center gap-3"><item.icon size={18}/> {item.label}</div>
                        {item.hasSub && (settingsSubOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
                    </button>
                    {item.hasSub && settingsSubOpen && (
                        <div className="pl-4 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 ml-4 my-2">
                            {settingsItems.map(sub => (
                                <button key={sub.id} onClick={() => setActiveView(sub.id)} className={`w-full text-left px-4 py-2 text-xs rounded-md ${activeView === sub.id ? 'text-skills-blue-primary font-bold dark:text-white' : 'hover:text-gray-900 dark:hover:text-white'}`}>
                                    {sub.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
             ))}
          </nav>
          <div className="p-4 border-t dark:border-gray-800">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-3 w-full px-4 py-3 mb-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                {isDarkMode ? <Sun size={16}/> : <Moon size={16}/>} Tema
             </button>
             <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                <LogOut size={16} /> Sair
             </button>
          </div>
       </aside>

       <main className="flex-1 md:ml-64 p-8 min-h-screen transition-all">
          <header className="flex justify-between items-center mb-8">
             <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
                {activeView === 'home' ? 'Bem-vindo' : activeView === 'dashboard' ? 'Inteligência' : 'Sistema'}
             </h2>
          </header>

          {activeView === 'home' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn mt-12">
                <Card title="Liderança" value="Avaliar Líder" icon={Award} className="border-l-4 border-l-yellow-500" onClick={() => startEvaluation('leader')} />
                <Card title="Operacional" value="Avaliar Equipe" icon={Users} className="border-l-4 border-l-blue-500" onClick={() => startEvaluation('team')} />
                <Card title="Histórico" value="Ver Avaliações" icon={List} className="border-l-4 border-l-gray-500" onClick={() => setActiveView('dashboard')} />
             </div>
          )}

          {activeView === 'dashboard' && <Dashboard evaluations={evaluationsList} employees={employeesList} />}

          {activeView.startsWith('settings-') && (() => {
             const config = settingsItems.find(i => i.id === activeView);
             // O TypeScript agora deve aceitar config.cols pois usamos 'as const'
             return config ? <GenericDatabaseView collectionName={config.col} title={config.label} columns={config.cols} /> : null;
          })()}

          {/* Fluxo de Avaliação (Simplificado) */}
          {activeView === 'evaluation-select' && (
             <div className="bg-white dark:bg-lidera-gray p-8 rounded-xl shadow-lg border dark:border-lidera-dark">
                 <h3 className="text-xl font-bold mb-6 dark:text-white">Selecione o Colaborador</h3>
                 <div className="relative mb-6">
                    <Search className="absolute left-4 top-4 text-gray-400" />
                    <input className="w-full p-4 pl-12 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg" placeholder="Buscar..." />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employeesList.filter(e => (evalType === 'leader' ? e.level === 'Líder' : e.level !== 'Líder')).map(emp => (
                        <div key={emp.id} onClick={() => { setSelectedEmployee(emp); setActiveView('evaluation-form'); }} className="p-4 border dark:border-gray-700 rounded hover:bg-blue-50 cursor-pointer dark:text-white">
                            <p className="font-bold">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.role}</p>
                        </div>
                    ))}
                 </div>
             </div>
          )}

          {activeView === 'evaluation-form' && selectedEmployee && (
             <div className="bg-white dark:bg-lidera-gray p-8 rounded-xl shadow-lg border dark:border-lidera-dark">
                 <h3 className="text-2xl font-bold mb-6 dark:text-white">Avaliando: {selectedEmployee.name}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {(evalType === 'leader' ? METRICAS_LIDER : METRICAS_OPERADOR).map(metric => (
                        <div key={metric} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex justify-between mb-2">
                                <label className="font-medium text-sm dark:text-gray-300">{metric}</label>
                                <span className="font-bold text-skills-blue-primary">{evalForm[metric] || 0}</span>
                            </div>
                            <input type="range" min="0" max="10" step="0.5" className="w-full" value={evalForm[metric] || 0} onChange={(e) => setEvalForm({...evalForm, [metric]: parseFloat(e.target.value)})} />
                        </div>
                    ))}
                 </div>
                 <button onClick={submitEvaluation} className="w-full py-4 bg-skills-blue-primary text-white font-bold rounded-lg">Finalizar</button>
             </div>
          )}
       </main>
    </div>
  );
}

function LoginScreen() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-skills-light flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-xl text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Lidera<span className="text-skills-blue-primary">Skills</span></h1>
        <button onClick={signIn} className="px-6 py-3 bg-white border rounded-lg shadow-sm hover:bg-gray-50 font-bold">Entrar com Google</button>
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
  if (loading) return <div>Carregando...</div>;
  if (!user) return <LoginScreen />;
  return <AppContent />;
}
