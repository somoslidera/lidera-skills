import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchCollection, createCompany } from '../services/firebase';

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
}

const CompanyContext = createContext<CompanyContextType>({} as CompanyContextType);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(() => {
    // Tenta recuperar a última empresa selecionada do localStorage
    const saved = localStorage.getItem('lidera_selected_company');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompanies = async () => {
    setLoading(true);
    const data = await fetchCollection('companies');
    setCompanies(data as Company[]);
    setLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const setCompany = (company: Company | null) => {
    setCurrentCompanyState(company);
    if (company) {
      localStorage.setItem('lidera_selected_company', JSON.stringify(company));
    } else {
      localStorage.removeItem('lidera_selected_company');
    }
    // Força um reload da página para limpar estados antigos de outras empresas
    setTimeout(() => window.location.reload(), 100);
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
      loading 
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);