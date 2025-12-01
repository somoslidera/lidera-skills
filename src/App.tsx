import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom'; // <--- Adicionado
import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './components/dashboard/Dashboard';
import { EvaluationHistory } from './components/dashboard/EvaluationHistory';
import { LayoutDashboard, History, LogOut } from 'lucide-react';

function App() {
  // Estado para controlar qual tela está visível
  const [currentView, setCurrentView] = useState<'dashboard' | 'history'>('dashboard');

  return (
    <AuthProvider>
      {/* O Router precisa envolver a aplicação para que links e navegação funcionem */}
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          
          {/* --- Cabeçalho da Aplicação --- */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                
                {/* Logo / Título */}
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <LayoutDashboard size={20} />
                  </div>
                  <h1 className="text-xl font-bold text-gray-800">
                    LideraApp <span className="text-blue-600 font-light">| Gomes RH</span>
                  </h1>
                </div>

                {/* Menu de Navegação */}
                <nav className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                      currentView === 'dashboard'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    Painel Principal
                  </button>

                  <button
                    onClick={() => setCurrentView('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                      currentView === 'history'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <History size={18} />
                    Histórico de Avaliações
                  </button>
                </nav>

                {/* Área do Usuário / Sair */}
                <div className="flex items-center border-l pl-4 ml-4">
                  <button className="text-gray-400 hover:text-red-600 transition-colors" title="Sair">
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* --- Conteúdo Principal --- */}
          <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {currentView === 'dashboard' ? (
              <Dashboard />
            ) : (
              <div className="animate-fade-in-up">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Histórico de Desempenho</h2>
                  <p className="text-gray-500">
                    Consulte as avaliações passadas, analise a evolução das notas e veja os detalhes de cada ciclo.
                  </p>
                </div>
                <EvaluationHistory />
              </div>
            )}
          </main>

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
