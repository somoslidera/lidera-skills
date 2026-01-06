import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Building2, Check } from 'lucide-react';
import { debugCompanies } from '../../utils/debugCompanies';

export const CompanySelector = () => {
  const { companies, currentCompany, setCompany, addNewCompany, isMaster, loading } = useCompany();
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  // Debug: log das empresas carregadas
  useEffect(() => {
    console.log('CompanySelector - companies:', companies, 'loading:', loading);
    
    // Se não há empresas e não está carregando, executa diagnóstico
    if (companies.length === 0 && !loading) {
      console.warn('⚠️ Nenhuma empresa encontrada. Executando diagnóstico...');
      debugCompanies().catch(err => {
        console.error('Erro no diagnóstico:', err);
      });
    }
  }, [companies, loading]);

  const handleCreate = async () => {
    if (!newCompanyName.trim()) return;
    await addNewCompany(newCompanyName);
    setNewCompanyName('');
    setIsCreating(false);
  };

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-[#1E1E1E] p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
        <Building2 size={20} />
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Empresa Ativa</span>
        
        {isCreating ? (
          <div className="flex items-center gap-2 mt-1">
            <input 
              autoFocus
              className="text-sm border-b border-blue-500 bg-transparent outline-none w-32 dark:text-white"
              placeholder="Nome da Empresa..."
              value={newCompanyName}
              onChange={e => setNewCompanyName(e.target.value)}
            />
            <button onClick={handleCreate} className="text-green-500 hover:text-green-600"><Check size={16}/></button>
            <button onClick={() => setIsCreating(false)} className="text-red-500 hover:text-red-600 text-xs">X</button>
          </div>
        ) : (
          <select 
            className="text-sm font-bold text-gray-800 dark:text-white bg-transparent outline-none cursor-pointer min-w-[150px]"
            value={currentCompany?.id || ''}
            onChange={(e) => {
              if (e.target.value === 'new') {
                setIsCreating(true);
              } else if (e.target.value === 'all') {
                setCompany({ id: 'all', name: 'Todas as Empresas' });
              } else {
                const selected = companies.find(c => c.id === e.target.value);
                setCompany(selected || null);
              }
            }}
          >
            <option value="" disabled>
              {loading ? 'Carregando...' : companies.length === 0 ? 'Nenhuma empresa encontrada' : 'Selecione...'}
            </option>
            
            {/* Opção TODAS AS EMPRESAS (Apenas para Master) */}
            {isMaster && (
              <option value="all" className="font-bold text-blue-600">🌐 Todas as Empresas</option>
            )}

            {companies.length === 0 && !loading && (
              <option value="" disabled className="text-red-500">
                ⚠️ Nenhuma empresa cadastrada. Crie uma nova empresa.
              </option>
            )}

            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            
            {isMaster && (
              <option value="new" className="text-green-600 font-bold">+ Nova Empresa</option>
            )}
          </select>
        )}
      </div>
    </div>
  );
};