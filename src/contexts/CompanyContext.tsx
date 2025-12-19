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
  const { isMaster: userIsMaster } = useAuth();
  
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(() => {
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
  }, [user]);

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