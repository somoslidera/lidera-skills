import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { CompanySelector } from './components/layout/CompanySelector';
import { ThemeToggle } from './components/ui/ThemeToggle'; // Novo componente
// ... outros imports ...
import { 
  CriteriaView, 
  SectorsView, 
  RolesView, 
  EmployeesView, 
  UsersView,
  CompaniesView // Novo
} from './components/settings/Registers';
import { Building } from 'lucide-react';

function MainApp() {
  const { currentCompany, isMaster } = useCompany();
  
  // Persistência simples via localStorage para "manter na página" (Req 5)
  const [currentView, setCurrentView] = useState(() => {
     return localStorage.getItem('lidera_current_view') as any || 'dashboard';
  });

  const [settingsView, setSettingsView] = useState('criteria');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Efeito para salvar navegação
  useEffect(() => {
     localStorage.setItem('lidera_current_view', currentView);
  }, [currentView]);

  // ... (useEffect de loadData mantido) ...

  const NavButton = ({ view, icon: Icon, label }: any) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-md transition-all text-xs md:text-sm font-medium ${
        currentView === view
          ? 'bg-skills-blue-primary/10 text-skills-blue-primary dark:bg-lidera-gold/20 dark:text-lidera-gold'
          : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <Router>
      <div className="min-h-screen bg-skills-light dark:bg-lidera-dark flex flex-col font-sans transition-colors duration-300">
        
        {/* Header Style Atualizado */}
        <header className="bg-white dark:bg-lidera-gray shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16 items-center">
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {/* Ícone com gradiente */}
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
                {/* ... */}
              </nav>

              <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-4 ml-2 md:ml-4 gap-2">
                <ThemeToggle /> {/* Req 3 */}
                <button className="text-gray-400 hover:text-red-600 transition-colors" title="Sair">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ... Main Content ... */}
           {/* Seção Settings Atualizada para incluir CompaniesView se for Master */}
              <section className="flex-1 min-w-0">
                {settingsView === 'criteria' && <CriteriaView />}
                {settingsView === 'sectors' && <SectorsView />}
                {settingsView === 'roles' && <RolesView />}
                {settingsView === 'employees' && <EmployeesView />}
                {settingsView === 'users' && <UsersView />}
                {/* Req 9: Gerenciar Empresas */}
                {isMaster && settingsView === 'companies' && <CompaniesView />} 
              </section>
        
        {/* ... */}
      </div>
    </Router>
  );
}