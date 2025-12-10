import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchCollection, createCompany } from '../services/firebase';
import { useAuth } from './AuthContext'; // Integrado para verificação de Master

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
  isMaster: boolean; // Flag para UI
}

// Lista de e-mails Master (Super Admins)
const MASTER_EMAILS = [
  'admin@somoslidera.com.br', 
  'suporte@lidera.com',
  // Adicione seu e-mail de teste aqui se necessário
];

const CompanyContext = createContext<CompanyContextType>({} as CompanyContextType);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(() => {
    const saved = localStorage.getItem('lidera_selected_company');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário logado é Master
  const isMasterUser = () => {
    return user && user.email && MASTER_EMAILS.includes(user.email);
  };

  const loadCompanies = async () => {
    setLoading(true);
    // Nota: Por padrão, fetchCollection('companies') já busca tudo no firebase.ts
    // Se no futuro houver restrição por usuário no backend, aqui seria o lugar para
    // passar um parâmetro extra se for Master.
    const data = await fetchCollection('companies');
    setCompanies(data as Company[]);
    setLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, [user]); // Recarrega se o usuário mudar

  const setCompany = (company: Company | null) => {
    setCurrentCompanyState(company);
    if (company) {
      localStorage.setItem('lidera_selected_company', JSON.stringify(company));
    } else {
      localStorage.removeItem('lidera_selected_company');
    }
    // Pequeno reload para limpar estados de outras views
    setTimeout(() => window.location.reload(), 50);
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
      isMaster: !!isMasterUser() 
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);