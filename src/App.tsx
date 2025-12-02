import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './components/dashboard/Dashboard';
import { EvaluationHistory } from './components/dashboard/EvaluationHistory';
import { fetchCollection } from './services/firebase';

// Importa os componentes de cadastro que acabamos de criar
import { 
  CriteriaView, 
  SectorsView, 
  RolesView, 
  EmployeesView, 
  UsersView 
} from './components/settings/Registers';

import { 
  LayoutDashboard, 
  History, 
  LogOut, 
  Users, 
  Briefcase, 
  Layers, 
  UserCog,
  ClipboardList 
} from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'sectors' | 'roles' | 'employees' | 'users' | 'criteria'>('dashboard');
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const evaluationsData = await fetchCollection('evaluations');
        const employeesData = await fetchCollection('employees');
        setEvaluations(evaluationsData);
        setEmployees(employeesData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadData();
  }, []);

  const NavButton = ({ view, icon: Icon, label }: { view: typeof currentView, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium whitespace-nowrap ${
        currentView === view
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                
                <div className="flex items-center gap-3 mr-4">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <LayoutDashboard size={20} />
                  </div>
                  <h1 className="text-xl font-bold text-gray-800 hidden md:block">
                    LideraApp
                  </h1>
                </div>

                <nav className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar mask-gradient px-2">
                  <NavButton view="dashboard" icon={LayoutDashboard} label="Painel" />
                  <NavButton view="history" icon={History} label="Histórico" />
                  <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>
                  <NavButton view="criteria" icon={ClipboardList} label="Critérios" />
                  <NavButton view="sectors" icon={Layers} label="Setores" />
                  <NavButton view="roles" icon={Briefcase} label="Cargos" />
                  <NavButton view="employees" icon={Users} label="Funcionários" />
                  <NavButton view="users" icon={UserCog} label="Usuários" />
                </nav>

                <div className="flex items-center border-l pl-4 ml-4">
                  <button className="text-gray-400 hover:text-red-600 transition-colors" title="Sair">
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {currentView === 'dashboard' && <Dashboard evaluations={evaluations} employees={employees} />}
            {currentView === 'history' && (
              <div className="animate-fade-in-up">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Histórico de Desempenho</h2>
                  <p className="text-gray-500">Consulte avaliações passadas e evolução.</p>
                </div>
                <EvaluationHistory />
              </div>
            )}
            
            {/* Telas de Configuração renderizadas via componentes limpos */}
            {currentView === 'criteria' && <CriteriaView />}
            {currentView === 'sectors' && <SectorsView />}
            {currentView === 'roles' && <RolesView />}
            {currentView === 'employees' && <EmployeesView />}
            {currentView === 'users' && <UsersView />}
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
