import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext'; // Contexto de Empresa
import { CompanySelector } from './components/layout/CompanySelector'; // Seletor Visual
import { Dashboard } from './components/dashboard/Dashboard';
import { EvaluationHistory } from './components/dashboard/EvaluationHistory';
import { fetchCollection } from './services/firebase';

// Import Views
import { 
  CriteriaView, 
  SectorsView, 
  RolesView, 
  EmployeesView, 
  UsersView 
} from './components/settings/Registers';

// Icons
import { 
  LayoutDashboard, 
  History, 
  LogOut, 
  Settings,
  Users, 
  Briefcase, 
  Layers, 
  UserCog,
  ClipboardList,
  Menu,
  X
} from 'lucide-react';

// Componente Principal Interno (Onde a mágica acontece)
function MainApp() {
  const { currentCompany } = useCompany(); // Hook da Empresa
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [settingsView, setSettingsView] = useState<'criteria' | 'sectors' | 'roles' | 'employees' | 'users'>('criteria');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Carrega dados filtrados pela empresa selecionada
  useEffect(() => {
    const loadData = async () => {
      if (!currentCompany) return; // Não carrega se não tiver empresa

      try {
        // Passa o ID da empresa para filtrar no Firebase
        const evaluationsData = await fetchCollection('evaluations', currentCompany.id);
        const employeesData = await fetchCollection('employees', currentCompany.id);
        
        setEvaluations(evaluationsData);
        setEmployees(employeesData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadData();
  }, [currentCompany]); // Recarrega sempre que mudar a empresa

  // Se não tiver empresa selecionada, mostra tela de boas-vindas/seleção
  if (!currentCompany) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-[#121212] text-center p-4">
        <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-md w-full animate-fadeIn">
          <div className="mb-6 flex justify-center">
             <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full text-blue-600 dark:text-blue-400">
               <Briefcase size={48} />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Bem-vindo ao LideraApp</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Para acessar os painéis, selecione ou cadastre uma empresa cliente.</p>
          <div className="flex justify-center">
            <CompanySelector />
          </div>
        </div>
      </div>
    );
  }

  // --- Botões de Navegação ---
  const NavButton = ({ view, icon: Icon, label }: { view: typeof currentView, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-md transition-colors text-xs md:text-sm font-medium ${
        currentView === view
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const SettingsButton = ({ view, icon: Icon, label }: { view: typeof settingsView, icon: any, label: string }) => (
    <button
      onClick={() => { setSettingsView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
        settingsView === view
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-[#121212] flex flex-col font-sans">
        
        {/* --- TOP HEADER --- */}
        <header className="bg-white dark:bg-[#1E1E1E] shadow-sm border-b border-gray-200 dark:border-[#121212] sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16 items-center">
              
              {/* Logo e Seletor de Empresa */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-600/20">
                    <LayoutDashboard size={22} />
                  </div>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden md:block tracking-tight">
                    LideraApp
                  </h1>
                </div>
                {/* Separador */}
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
                {/* Seletor de Empresa no Header */}
                <div className="hidden md:block">
                  <CompanySelector />
                </div>
              </div>

              {/* Main Nav Items */}
              <nav className="flex items-center gap-1 md:gap-4">
                <NavButton view="dashboard" icon={LayoutDashboard} label="Painel" />
                <NavButton view="history" icon={History} label="Histórico" />
                <NavButton view="settings" icon={Settings} label="Configurações" />
              </nav>

              {/* User / Logout */}
              <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-4 ml-2 md:ml-4">
                <button className="text-gray-400 hover:text-red-600 transition-colors" title="Sair">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
          
          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <Dashboard evaluations={evaluations} employees={employees} />
          )}

          {/* VIEW: HISTORY */}
          {currentView === 'history' && (
            <div className="animate-fade-in-up">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Histórico de Desempenho</h2>
                  <p className="text-gray-500 dark:text-gray-400">Consulte avaliações passadas e evolução.</p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  Empresa: <span className="font-bold text-gray-600 dark:text-gray-300">{currentCompany.name}</span>
                </div>
              </div>
              <EvaluationHistory />
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
            <div className="flex flex-col md:flex-row gap-6 animate-fadeIn">
              
              {/* Mobile Sidebar Toggle */}
              <div className="md:hidden mb-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center gap-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg shadow-sm text-gray-700 dark:text-white w-full justify-between"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Menu size={18} /> Menu de Cadastros
                  </span>
                  {isSidebarOpen ? <X size={18} /> : <Settings size={18} />}
                </button>
              </div>

              {/* Sidebar */}
              <aside className={`
                md:w-64 flex-shrink-0 
                ${isSidebarOpen ? 'block' : 'hidden md:block'}
              `}>
                <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] p-4 sticky top-24">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Cadastros Gerais</h3>
                  <div className="space-y-1">
                    <SettingsButton view="criteria" icon={ClipboardList} label="Critérios" />
                    <SettingsButton view="sectors" icon={Layers} label="Setores" />
                    <SettingsButton view="roles" icon={Briefcase} label="Cargos" />
                    <div className="my-4 border-t border-gray-100 dark:border-gray-800"></div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Pessoas</h3>
                    <SettingsButton view="employees" icon={Users} label="Funcionários" />
                    <SettingsButton view="users" icon={UserCog} label="Usuários" />
                  </div>
                </div>
              </aside>

              {/* Content Area */}
              <section className="flex-1 min-w-0">
                {settingsView === 'criteria' && <CriteriaView />}
                {settingsView === 'sectors' && <SectorsView />}
                {settingsView === 'roles' && <RolesView />}
                {settingsView === 'employees' && <EmployeesView />}
                {settingsView === 'users' && <UsersView />}
              </section>

            </div>
          )}

        </main>
      </div>
    </Router>
  );
}

// App Wrapper com os Providers
function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <MainApp />
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;