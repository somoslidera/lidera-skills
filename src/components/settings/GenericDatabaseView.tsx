import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { Database, Plus, Search, Edit, Trash, Save, Loader2, Filter, ArrowUp, ArrowDown, CheckSquare, Square, Building } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useCompany } from '../../contexts/CompanyContext';

interface Entity {
  id: string;
  [key: string]: any;
}

interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'select' | 'multi-select-companies'; // Novo tipo
  options?: string[]; 
  linkedCollection?: string; 
  linkedField?: string;
}

export const GenericDatabaseView = ({ collectionName, title, columns, customFieldsAllowed = true }: { collectionName: string, title: string, columns: ColumnConfig[], customFieldsAllowed?: boolean }) => {
  const { currentCompany, companies, isMaster } = useCompany();
  const [data, setData] = useState<Entity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [linkedOptions, setLinkedOptions] = useState<Record<string, string[]>>({});

  // Coleções Universais
  const isUniversalCollection = collectionName === 'sectors' || collectionName === 'roles' || collectionName === 'companies';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let q;
      if (isUniversalCollection) {
        q = collection(db, collectionName);
      } else {
        if (!currentCompany) { setData([]); setIsLoading(false); return; }
        if (currentCompany.id === 'all') {
           q = collection(db, collectionName);
        } else {
           q = query(collection(db, collectionName), where("companyId", "==", currentCompany.id));
        }
      }
      
      const snap = await getDocs(q);
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, currentCompany, isUniversalCollection]);

  useEffect(() => {
    fetchData();
    const loadLinkedData = async () => {
      const newLinkedOptions: Record<string, string[]> = {};
      for (const col of columns) {
        if (col.linkedCollection) {
          try {
            const q = collection(db, col.linkedCollection);
            const snap = await getDocs(q);
            const field = col.linkedField || 'name';
            newLinkedOptions[col.key] = snap.docs.map(d => d.data()[field]).filter(Boolean);
          } catch (error) {
            console.error(`Erro ao carregar dados vinculados:`, error);
          }
        }
      }
      setLinkedOptions(newLinkedOptions);
    };
    loadLinkedData();
  }, [fetchData, columns]);

  const handleSave = async () => {
    // Validação básica
    if (!isUniversalCollection && (!currentCompany || currentCompany.id === 'all')) {
      if (!currentItem.companyId) {
         alert("Por favor, selecione a empresa vinculada.");
         return;
      }
    }
    
    try {
      let itemToSave = { ...currentItem };

      // Vincula a empresa se for um registro específico (ex: funcionário) criado dentro de uma empresa
      if (!isUniversalCollection && !itemToSave.companyId && currentCompany && currentCompany.id !== 'all') {
         itemToSave.companyId = currentCompany.id;
      }

      if (currentItem.id) {
        await updateDoc(doc(db, collectionName, currentItem.id), itemToSave);
      } else {
        await addDoc(collection(db, collectionName), itemToSave);
      }
      setIsModalOpen(false);
      setCurrentItem({});
      fetchData();
    } catch (error) {
      alert("Erro ao salvar: " + error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Excluir ${selectedIds.size} registros?`)) return;

    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        const ref = doc(db, collectionName, id);
        batch.delete(ref);
      });
      await batch.commit();
      fetchData();
    } catch (error) {
      alert("Erro: " + error);
      setIsLoading(false);
    }
  };

  // ... (handleSelectAll, toggleSelect, handleSort, columnOptions, filteredData mantidos)

  // --- Renderização de Inputs ---
  const renderInput = (col: ColumnConfig) => {
    const value = currentItem[col.key] || '';
    
    // Multi-Select para Empresas (Req 6 & 7)
    if (col.type === 'multi-select-companies') {
        const selectedCompanyIds: string[] = currentItem[col.key] || [];
        
        return (
            <div className="border rounded dark:border-gray-700 p-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-black">
                {companies.map(comp => (
                    <label key={comp.id} className="flex items-center gap-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={selectedCompanyIds.includes(comp.id)}
                            onChange={(e) => {
                                let newIds;
                                if (e.target.checked) {
                                    newIds = [...selectedCompanyIds, comp.id];
                                } else {
                                    newIds = selectedCompanyIds.filter(id => id !== comp.id);
                                }
                                setCurrentItem({...currentItem, [col.key]: newIds});
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{comp.name}</span>
                    </label>
                ))}
            </div>
        );
    }

    if (col.type === 'select' || col.linkedCollection) {
      const optionsList = col.linkedCollection ? (linkedOptions[col.key] || []) : (col.options || []);
      return (
        <select
          className="w-full p-2 rounded border bg-white dark:bg-lidera-gray dark:border-gray-700 text-gray-800 dark:text-gray-200"
          value={value}
          onChange={(e) => setCurrentItem({...currentItem, [col.key]: e.target.value})}
        >
          <option value="">Selecione...</option>
          {optionsList.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    return (
      <input 
        type={col.type || "text"}
        className="w-full p-2 rounded border bg-white dark:bg-lidera-gray dark:border-gray-700 text-gray-800 dark:text-gray-200"
        value={value}
        onChange={(e) => setCurrentItem({...currentItem, [col.key]: e.target.value})}
      />
    );
  };

  return (
    <> 
      <div className="space-y-6 animate-fadeIn">
        {/* Header Style Atualizado */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-lidera-gray p-6 rounded-lg shadow-md border-l-4 border-skills-blue-primary dark:border-lidera-gold">
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Database size={24} className="text-skills-blue-primary dark:text-lidera-gold" /> {title}
             </h2>
             {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold hover:bg-red-200 transition-colors flex items-center gap-1">
                   <Trash size={12}/> Excluir ({selectedIds.size})
                </button>
             )}
          </div>
          <button onClick={() => { setCurrentItem({}); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-gradient rounded-lg font-bold shadow-lg hover:opacity-90 transition-all">
             <Plus size={16} className="text-white dark:text-black"/> 
             <span className="text-white dark:text-black">Novo Registro</span>
          </button>
        </div>

        {/* ... (Search Bar e Table Structure similar ao anterior, mas com classes de cores atualizadas) ... */}
        {/* Por brevidade, focando nas partes lógicas e estilos chaves */}
        
        <div className="bg-white dark:bg-lidera-gray rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
             {/* ... Filters Area ... */}
             
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 dark:text-gray-400 uppercase text-xs">
                      <tr>
                         {/* ... Headers ... */}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredData.map(item => (
                         <tr key={item.id} className="hover:bg-blue-50 dark:hover:bg-white/5 transition-colors group">
                            {/* ... Rows ... */}
                            <td className="px-6 py-4 flex justify-end gap-2">
                               <button onClick={() => { setCurrentItem(item); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"><Edit size={16} /></button>
                               <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"><Trash size={16} /></button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentItem.id ? "Editar Registro" : "Novo Registro"}>
         <div className="space-y-4">
            {/* Vinculação de Empresa para registros específicos */}
            {!isUniversalCollection && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-black/30 rounded-lg border dark:border-gray-700">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Vinculado à Empresa</label>
                    <select 
                        className="w-full p-2 bg-white dark:bg-lidera-gray border dark:border-gray-700 rounded text-sm text-gray-800 dark:text-gray-200"
                        value={currentItem.companyId || (currentCompany?.id !== 'all' ? currentCompany?.id : '')}
                        onChange={e => setCurrentItem({...currentItem, companyId: e.target.value})}
                    >
                        <option value="">Selecione a empresa...</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columns.map((col) => (
                <div key={col.key} className={col.type === 'multi-select-companies' || col.label.includes('Nome') ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{col.label}</label>
                    {renderInput(col)}
                </div>
                ))}
            </div>
            
            <button onClick={handleSave} className="w-full py-3 bg-brand-gradient rounded-lg mt-6 flex justify-center items-center gap-2 transition-all shadow-md font-bold text-white dark:text-black">
               <Save size={18} /> Salvar Registro
            </button>
         </div>
      </Modal>
    </>
  );
};