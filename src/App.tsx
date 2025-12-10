import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { CompanySelector } from './components/layout/CompanySelector';
import { Dashboard } from './components/dashboard/Dashboard';
import { EvaluationHistory } from './components/dashboard/EvaluationHistory';
import { EvaluationsView } from './components/evaluations/EvaluationsView';
import { HelpView } from './components/help/HelpView';
import { fetchCollection } from './services/firebase';
import { ThemeToggle } from './components/ui/ThemeToggle';

import { 
  CriteriaView, 
  SectorsView, 
  RolesView, 
  EmployeesView, 
  UsersView,
  CompaniesView
} from './components/settings/Registers';

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
  X,
  FileCheck,
  HelpCircle,
  Building // Novo ícone
} from 'lucide-react';

function MainApp() {
  const { currentCompany, isMaster } = useCompany();
  
  const [currentView, setCurrentView] = useState(() => {
     return localStorage.getItem('lidera_current_view') as any || 'dashboard';
  });

  const [settingsView, setSettingsView] = useState('criteria');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
     localStorage.setItem('lidera_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentCompany) return;
      try {
        const companyFilter = currentCompany.id === 'all' ? null : currentCompany.id;
        const evaluationsData = await fetchCollection('evaluations', companyFilter);
        const employeesData = await fetchCollection('employees'); 
        
        setEvaluations(evaluationsData);
        setEmployees(employeesData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadData();
  }, [currentCompany]); 

  if (!currentCompany) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-skills-light dark:bg-lidera-dark text-center p-4">
        <div className="bg-white dark:bg-lidera-gray p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-md w-full animate-fadeIn">
          <div className="mb-6 flex justify-center">
             <div className="bg-brand-gradient p-4 rounded-full">
               <Briefcase size={48} className="text-white dark:text-black" />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Bem-vindo ao Lidera Skills</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Para acessar os painéis, selecione ou cadastre uma empresa cliente.</p>
          <div className="flex justify-center">
            <CompanySelector />
          </div>
        </div>
      </div>
    );
  }

  const NavButton = ({ view, icon: Icon, label }: any) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-md transition-all text-xs md:text-sm font-medium ${
        currentView === view
          ? 'bg-skills-blue-primary/10 text-skills-blue-primary dark:bg-lidera-gold/20 dark:text-lidera-gold'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const SettingsButton = ({ view, icon: Icon, label }: any) => (
    <button
      onClick={() => { setSettingsView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
        settingsView === view
          ? 'bg-brand-gradient text-white dark:text-black shadow-md'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <Router>
      <div className="min-h-screen bg-skills-light dark:bg-lidera-dark flex flex-col font-sans transition-colors duration-300">
        
        <header className="bg-white dark:bg-lidera-gray shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16 items-center">
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-gradient p-2 rounded-lg shadow-lg">
                    <LayoutDashboard size={22} className="text-white dark:text-black" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden md:block tracking-tight">
                    Lidera Skills
                  </h1>
                </div>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
                <div className="hidden md:block">
                  <CompanySelector />
                </div>
              </div>

              <nav className="flex items-center gap-1 md:gap-2">
                <NavButton view="dashboard" icon={LayoutDashboard} label="Painel" />
                <NavButton view="evaluations" icon={FileCheck} label="Avaliações" />
                <NavButton view="history" icon={History} label="Histórico" />
                <NavButton view="settings" icon={Settings} label="Configurações" />
                <NavButton view="help" icon={HelpCircle} label="Ajuda" />
              </nav>

              <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-4 ml-2 md:ml-4 gap-2">
                <ThemeToggle />
                <button className="text-gray-400 hover:text-red-600 transition-colors" title="Sair">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
          
          {currentView === 'dashboard' && (
            <Dashboard evaluations={evaluations} employees={employees} />
          )}

          {currentView === 'evaluations' && (
            <EvaluationsView />
          )}

          {currentView === 'history' && (
            <div className="animate-fade-in-up">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Histórico Legado</h2>
                  <p className="text-gray-500 dark:text-gray-400">Visualização de avaliações importadas antigas.</p>
                </div>
              </div>
              <EvaluationHistory />
            </div>
          )}

          {currentView === 'help' && (
             <HelpView />
          )}

          {currentView === 'settings' && (
            <div className="flex flex-col md:flex-row gap-6 animate-fadeIn">
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

              <aside className={`md:w-64 flex-shrink-0 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
                <div className="bg-white dark:bg-lidera-gray rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sticky top-24">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Cadastros Gerais</h3>
                  <div className="space-y-1">
                    <SettingsButton view="criteria" icon={ClipboardList} label="Critérios" />
                    <SettingsButton view="sectors" icon={Layers} label="Setores" />
                    <SettingsButton view="roles" icon={Briefcase} label="Cargos" />
                    <div className="my-4 border-t border-gray-100 dark:border-gray-800"></div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Pessoas</h3>
                    <SettingsButton view="employees" icon={Users} label="Funcionários" />
                    <SettingsButton view="users" icon={UserCog} label="Usuários" />
                    {isMaster && (
                      <>
                        <div className="my-4 border-t border-gray-100 dark:border-gray-800"></div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Admin</h3>
                        <SettingsButton view="companies" icon={Building} label="Empresas" />
                      </>
                    )}
                  </div>
                </div>
              </aside>

              <section className="flex-1 min-w-0">
                {settingsView === 'criteria' && <CriteriaView />}
                {settingsView === 'sectors' && <SectorsView />}
                {settingsView === 'roles' && <RolesView />}
                {settingsView === 'employees' && <EmployeesView />}
                {settingsView === 'users' && <UsersView />}
                {isMaster && settingsView === 'companies' && <CompaniesView />}
              </section>
            </div>
          )}

        </main>
      </div>
    </Router>
  );
}

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