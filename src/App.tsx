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
  Settings,
  Users, 
  Briefcase, 
  Layers, 
  UserCog,
  ClipboardList,
  Menu,
  X,
  FileCheck,
  HelpCircle
} from 'lucide-react';

function MainApp() {
  const { currentCompany } = useCompany();
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'evaluations' | 'history' | 'settings' | 'help'>('dashboard');
  const [settingsView, setSettingsView] = useState<'criteria' | 'sectors' | 'roles' | 'employees' | 'users'>('criteria');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentCompany) return;
      try {
        const evaluationsData = await fetchCollection('evaluations', currentCompany.id === 'all' ? null : currentCompany.id);
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
        
        <header className="bg-white dark:bg-[#1E1E1E] shadow-sm border-b border-gray-200 dark:border-[#121212] sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16 items-center">
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-600/20">
                    <LayoutDashboard size={22} />
                  </div>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden md:block tracking-tight">
                    LideraApp
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
                <NavButton view="history" icon={History} label="Histórico" /> {/* Req 4: Renomeado */}
                <NavButton view="settings" icon={Settings} label="Configurações" />
                <NavButton view="help" icon={HelpCircle} label="Ajuda" />
              </nav>

              <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-4 ml-2 md:ml-4">
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
}

{
type: uploaded file
fileName: somoslidera/lidera-skills/lidera-skills-214706217fb646e399e2be7e0f0d81b180172230/src/components/settings/DataImporter.tsx
fullContent:
import { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, query, where, CollectionReference, DocumentData } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

// Tipos de importação
type ImportTarget = 'criteria' | 'sectors' | 'roles' | 'employees' | 'evaluations_leaders' | 'evaluations_collaborators';

export const DataImporter = ({ target }: { target: ImportTarget }) => {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  // Função auxiliar para converter "8,50" em 8.5
  const parseScore = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(',', '.')) || 0;
  };

  // Configuração de processamento
  const config = {
    criteria: {
      label: 'Critérios de Avaliação',
      collection: 'evaluation_criteria',
      process: (item: any) => {
        const type = item.Categoria_Avaliacao === 'Operadores' ? 'Colaborador' : 
                     item.Categoria_Avaliacao === 'Líderes' ? 'Líder' : null;
        const name = item.ID_Avaliacao ? item.ID_Avaliacao.replace(/_/g, ' ') : null;
        if (!type || !name) return null;
        return { name, type, description: '' };
      },
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, companyId: string) => 
        query(ref, where("name", "==", data.name), where("type", "==", data.type), where("companyId", "==", companyId))
    },
    sectors: {
      label: 'Setores',
      collection: 'sectors',
      process: (item: any) => {
        const name = item.Nome_Setor || item.Setor || item.Nome;
        if (!name) return null;
        return { name, manager: '' };
      },
      // Setores agora são globais, sem check de companyId
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, _companyId: string) => 
        query(ref, where("name", "==", data.name))
    },
    roles: {
      label: 'Cargos',
      collection: 'roles',
      process: (item: any) => {
        const name = item.Nome_Cargo || item.Cargo || item.Nome;
        const level = item['Nível'] || item.Nivel || 'Colaborador';
        if (!name) return null;
        return { name, level: level };
      },
      // Cargos agora são globais
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, _companyId: string) => 
        query(ref, where("name", "==", data.name))
    },
    employees: {
      label: 'Funcionários',
      collection: 'employees',
      process: (item: any) => {
        const name = item.Nome || item.Name || item.Funcionario || item.Nome_Completo;
        const email = item.Email || item['E-mail'] || '';
        const sector = item.Setor || item.Departamento || '';
        const role = item.Cargo || item.Funcao || '';
        if (!name) return null;
        return { name, email, sector, role, status: 'Ativo' };
      },
      // Funcionários continuam específicos por empresa? Normalmente sim, ou um para muitos.
      // O código original vincula funcionário a uma empresa. Vamos manter isso por enquanto.
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, companyId: string) => 
        query(ref, where("name", "==", data.name), where("companyId", "==", companyId))
    },
    evaluations_leaders: {
      label: 'Histórico (Líderes)',
      collection: 'evaluations',
      process: (item: any) => {
        const name = item.Nome_Lider_Avaliado || item.Nome_Colaborador;
        const dateRaw = item.Mes_Referencia; // Esperado YYYY-MM-DD
        if (!name || !dateRaw) return null;

        const average = parseScore(item.Pontuacao_Lider);
        
        const details = {
          'Comunicação': parseScore(item.Comunicacao_Clara_Coerente),
          'Gestão de Equipe': parseScore(item.Acompanhamento_Membros_Equipe),
          'Metas': parseScore(item.Cumprimento_Metas_Setor),
          'Decisão': parseScore(item.Capacidade_Decisao_Resolucao),
          'Assiduidade': parseScore(item.Assiduidade_Pontualidade_Lider)
        };

        return {
          employeeName: name,
          employeeId: item.ID_Funcionario || '',
          role: item.Cargo,
          sector: item.Setor,
          type: 'Líder',
          date: dateRaw,
          average: average,
          details: details
        };
      },
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, companyId: string) => 
        query(ref, where("employeeName", "==", data.employeeName), where("date", "==", data.date), where("companyId", "==", companyId))
    },
    evaluations_collaborators: {
      label: 'Histórico (Colaboradores)',
      collection: 'evaluations',
      process: (item: any) => {
        const name = item.Nome_Colaborador || `Func. ${item.ID_Funcionario}`;
        const dateRaw = item.Mes_Referencia;
        if (!dateRaw) return null;

        const average = parseScore(item.Pontuacao_Colaborador);

        const details = {
          'Assiduidade': parseScore(item.Assiduidade_Pontualidade),
          'Tarefas': parseScore(item.Cumprimento_Tarefas),
          'Proatividade': parseScore(item.Proatividade),
          'Organização': parseScore(item.Organizacao_Limpeza),
          'Uniforme': parseScore(item.Uso_Uniforme_EPI)
        };

        return {
          employeeName: name,
          employeeId: item.ID_Funcionario || '',
          role: item.Cargo,
          sector: item.Setor,
          type: 'Colaborador',
          date: dateRaw,
          average: average,
          details: details
        };
      },
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, companyId: string) => 
        query(ref, where("employeeName", "==", data.employeeName), where("date", "==", data.date), where("companyId", "==", companyId))
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Setores e Cargos agora são universais, não precisam de empresa selecionada
    const isUniversal = target === 'sectors' || target === 'roles';
    // Apenas critérios e avaliações precisam de empresa selecionada (e funcionários neste modelo)
    const needsCompanyId = !isUniversal;
    
    if (needsCompanyId && (!currentCompany || currentCompany.id === 'all')) {
      alert("Por favor, selecione uma empresa específica no topo da página antes de importar dados.");
      event.target.value = ''; 
      return;
    }

    setLoading(true);
    setStatus({ type: null, msg: 'Lendo arquivo...' });

    const currentConfig = config[target];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: async (results: any) => { 
        try {
          const data = results.data as any[];
          let importedCount = 0;
          let skippedCount = 0;

          const collectionRef = collection(db, currentConfig.collection);
          
          const safeCompanyId = currentCompany?.id || '';
          const safeCompanyName = currentCompany?.name || '';

          if (needsCompanyId && !safeCompanyId) {
             throw new Error("ID da empresa não encontrado.");
          }

          for (const item of data) {
            const processedData = currentConfig.process(item);

            if (processedData) {
              const q = currentConfig.checkDuplicity(collectionRef, processedData, safeCompanyId);
              const querySnapshot = await getDocs(q);

              if (querySnapshot.empty) {
                const docData = needsCompanyId
                  ? {
                      ...processedData,
                      companyId: safeCompanyId,
                      importedAt: new Date().toISOString()
                    }
                  : {
                      ...processedData,
                      importedAt: new Date().toISOString()
                    };
                await addDoc(collectionRef, docData);
                importedCount++;
              } else {
                skippedCount++;
              }
            }
          }

          const successMsg = needsCompanyId
            ? `Sucesso! ${importedCount} registros importados em "${safeCompanyName}". (${skippedCount} ignorados/duplicados).`
            : `Sucesso! ${importedCount} registros importados (Globais). (${skippedCount} ignorados/duplicados).`;
          
          setStatus({ 
            type: 'success', 
            msg: successMsg
          });

        } catch (error: any) {
          console.error(error);
          setStatus({ type: 'error', msg: 'Erro ao processar dados: ' + (error.message || error) });
        } finally {
          setLoading(false);
          event.target.value = '';
        }
      },
      error: (error: any) => {
        setLoading(false);
        setStatus({ type: 'error', msg: `Erro ao ler CSV: ${error.message}` });
      }
    });
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg mb-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Upload size={18} /> {config[target].label}
          </h4>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Importar CSV para {config[target].label.toLowerCase()}.
          </p>
        </div>
        
        <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded shadow transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {loading ? 'Processando...' : 'Selecionar Arquivo'}
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={loading}
          />
        </label>
      </div>

      {status.type && (
        <div className={`mt-3 p-2 rounded text-xs font-medium flex items-center gap-2 ${
          status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {status.msg}
        </div>
      )}
    </div>
  );
};