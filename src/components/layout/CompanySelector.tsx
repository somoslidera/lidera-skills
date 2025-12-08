import { useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Building2, Plus, Check } from 'lucide-react';

export const CompanySelector = () => {
  const { companies, currentCompany, setCompany, addNewCompany } = useCompany();
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

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
              } else {
                const selected = companies.find(c => c.id === e.target.value);
                setCompany(selected || null);
              }
            }}
          >
            <option value="" disabled>Selecione...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="new" className="text-blue-600 font-bold">+ Nova Empresa</option>
          </select>
        )}
      </div>
    </div>
  );
};