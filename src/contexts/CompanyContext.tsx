import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchCollection, createCompany } from '../services/firebase';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
}

interface CompanyContextType {
  currentCompany: Company | null;
  setCompany: (company: Company | null) => void;
  companies: Company[];
  refreshCompanies: () => void;
  addNewCompany: (name: string) => Promise<void>;
  loading: boolean;
  isMaster: boolean;
}

const CompanyContext = createContext<CompanyContextType>({} as CompanyContextType);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { isMaster: userIsMaster, user, loading: authLoading } = useAuth();
  
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(() => {
    const saved = localStorage.getItem('lidera_selected_company');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompanies = async () => {
    // Não tenta carregar se não estiver autenticado
    if (authLoading || !user) {
      console.log('Aguardando autenticação...');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Tentando carregar empresas...');
      console.log('Usuário autenticado:', user?.email);
      const data = await fetchCollection('companies');
      console.log('✅ Companies loaded:', data);
      setCompanies(data as Company[]);
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      if (error instanceof Error) {
        console.error('   Mensagem:', error.message);
        console.error('   Código:', (error as any).code);
      }
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só carrega empresas após autenticação estar completa
    if (!authLoading) {
      loadCompanies();
    }
  }, [userIsMaster, user, authLoading]);

  const setCompany = (company: Company | null) => {
    setCurrentCompanyState(company);
    if (company) {
      localStorage.setItem('lidera_selected_company', JSON.stringify(company));
    } else {
      localStorage.removeItem('lidera_selected_company');
    }
  };

  const addNewCompany = async (name: string) => {
    await createCompany(name);
    await loadCompanies();
  };

  return (
    <CompanyContext.Provider value={{ 
      currentCompany, 
      setCompany, 
      companies, 
      refreshCompanies: loadCompanies,
      addNewCompany,
      loading,
      isMaster: userIsMaster
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);