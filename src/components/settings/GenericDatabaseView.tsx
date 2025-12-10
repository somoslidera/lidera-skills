import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { Database, Plus, Search, Edit, Trash, Save, Loader2, Filter, ArrowUp, ArrowDown, Tag as TagIcon, X, CheckSquare, Square } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useCompany } from '../../contexts/CompanyContext';

interface Entity {
  id: string;
  [key: string]: any;
}

interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'select' | 'multi-select-companies';
  options?: string[]; 
  linkedCollection?: string; 
  linkedField?: string;
}

export const GenericDatabaseView = ({ collectionName, title, columns, customFieldsAllowed = true }: { collectionName: string, title: string, columns: ColumnConfig[], customFieldsAllowed?: boolean }) => {
  const { currentCompany, companies } = useCompany();
  const [data, setData] = useState<Entity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para Ordenação e Filtros
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  // Seleção em Massa
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [linkedOptions, setLinkedOptions] = useState<Record<string, string[]>>({});

  // Lógica de coleções universais
  const isUniversalCollection = collectionName === 'sectors' || collectionName === 'roles' || collectionName === 'companies';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let q;
      
      if (isUniversalCollection) {
        q = collection(db, collectionName);
      } else {
        if (!currentCompany) {
          setData([]);
          setIsLoading(false);
          return;
        }
        if (currentCompany.id === 'all') {
           q = collection(db, collectionName);
        } else {
           q = query(collection(db, collectionName), where("companyId", "==", currentCompany.id));
        }
      }
      
      const snap = await getDocs(q);
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSelectedIds(new Set()); // Limpa seleção ao recarregar
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setData([]);
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
            console.error(`Erro ao carregar dados vinculados de ${col.linkedCollection}:`, error);
          }
        }
      }
      setLinkedOptions(newLinkedOptions);
    };
    loadLinkedData();
  }, [fetchData, columns]);

  const handleSave = async () => {
    if (!isUniversalCollection && (!currentCompany || currentCompany.id === 'all')) {
      if (!currentItem.companyId) {
         alert("Por favor, selecione a empresa vinculada a este registro.");
         return;
      }
    }
    
    try {
      let itemToSave = { ...currentItem };

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

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    await deleteDoc(doc(db, collectionName, id));
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} registros selecionados?`)) return;

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
      alert("Erro ao excluir em massa: " + error);
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const columnOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    columns.forEach(col => {
      const values = Array.from(new Set(data.map(item => item[col.key]).filter(val => val !== undefined && val !== ''))).sort();
      options[col.key] = values as string[];
    });
    return options;
  }, [data, columns]);

  const filteredData = useMemo(() => {
    let processed = data.filter(item => {
      const matchesSearch = Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesFilters = Object.entries(activeFilters).every(([key, filterVal]) => {
        if (!filterVal) return true;
        return String(item[key]) === filterVal;
      });
      return matchesSearch && matchesFilters;
    });

    if (sortConfig) {
      processed.sort((a, b) => {
        const valA = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : '';
        const valB = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return processed;
  }, [data, searchTerm, activeFilters, sortConfig]);

  const renderInput = (col: ColumnConfig) => {
    const value = currentItem[col.key] || '';
    
    // Multi-Select para Empresas
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
          className="w-full p-2 rounded border bg-white dark:bg-lidera-dark dark:border-gray-700"
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
        className="w-full p-2 rounded border bg-white dark:bg-lidera-dark dark:border-gray-700"
        value={value}
        onChange={(e) => setCurrentItem({...currentItem, [col.key]: e.target.value})}
      />
    );
  };

  return (
    <> 
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212]">
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Database size={24} className="text-blue-600" /> {title}
             </h2>
             {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold hover:bg-red-200 transition-colors flex items-center gap-1">
                   <Trash size={12}/> Excluir ({selectedIds.size})
                </button>
             )}
          </div>
          <button onClick={() => { setCurrentItem({}); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-md transition-all">
             <Plus size={16} /> Novo Registro
          </button>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-[#121212] overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4">
             <div className="relative w-full">
               <Search className="absolute left-3 top-3 text-gray-400" size={18} />
               <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 ring-blue-500/50 outline-none transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />
             </div>
             
             <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-thin">
                {columns.map(col => {
                   const options = columnOptions[col.key] || [];
                   if(options.length === 0 && !activeFilters[col.key]) return null;

                   return (
                     <div key={col.key} className="relative min-w-[140px]">
                        <Filter size={12} className="absolute left-2 top-3 text-gray-400" />
                        <select 
                           className={`w-full pl-6 pr-2 py-2 text-sm border rounded-lg outline-none cursor-pointer appearance-none transition-colors ${
                             activeFilters[col.key] 
                               ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' 
                               : 'bg-gray-50 dark:bg-[#121212] dark:border-gray-700 dark:text-gray-300'
                           }`}
                           value={activeFilters[col.key] || ''}
                           onChange={(e) => setActiveFilters({...activeFilters, [col.key]: e.target.value})}
                        >
                           <option value="">{col.label}: Todos</option>
                           {options.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                        </select>
                     </div>
                   );
                })}
                {(searchTerm || Object.values(activeFilters).some(Boolean)) && (
                   <button 
                     onClick={() => { setSearchTerm(''); setActiveFilters({}); }}
                     className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap px-2 self-center font-medium"
                   >
                     Limpar Filtros
                   </button>
                )}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-blue-500">
                       {selectedIds.size > 0 && selectedIds.size === filteredData.length ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap w-24">ID</th>
                  {columns.map((col) => (
                    <th 
                      key={col.key} 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group select-none"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <span className="text-gray-400">
                          {sortConfig?.key === col.key ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-500" /> : <ArrowDown size={14} className="text-blue-500" />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                          )}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#1E1E1E]">
                {isLoading ? (
                  <tr><td colSpan={columns.length + 3} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2"/> Carregando dados...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={columns.length + 3} className="p-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
                ) : filteredData.map(item => (
                  <tr key={item.id} className={`hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group ${selectedIds.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    
                    <td className="px-6 py-4">
                       <button onClick={() => toggleSelect(item.id)} className="text-gray-400 hover:text-blue-500">
                          {selectedIds.has(item.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                       </button>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded select-all">
                        {item.id.slice(0, 5)}...
                      </span>
                    </td>

                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                         {col.key === 'status' ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                               item[col.key] === 'Ativo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                               item[col.key] === 'Inativo' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                               'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                               {item[col.key]}
                            </span>
                         ) : (
                            <span className="font-medium">{item[col.key] || '-'}</span>
                         )}
                      </td>
                    ))}
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => { setCurrentItem(item); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash size={16} /></button>
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
            {!isUniversalCollection && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Vinculado à Empresa</label>
                    <select 
                        className="w-full p-2 bg-white dark:bg-black border rounded text-sm"
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
                <div key={col.key} className={col.type === 'email' || col.type === 'multi-select-companies' || col.label.includes('Nome') ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{col.label}</label>
                    {renderInput(col)}
                </div>
                ))}
            </div>
            
            {/* Sistema de Tags */}
            <div className="pt-4 border-t dark:border-gray-700 mt-4">
               <h4 className="font-bold mb-2 text-sm text-gray-500 flex items-center gap-2">
                 <TagIcon size={14}/> Tags / Categorias
               </h4>
               
               <div className="flex gap-2 mb-3">
                  <input 
                    id="newTagInput" 
                    placeholder="Adicionar tag (ex: Proativo, SQL, Inglês)..." 
                    className="flex-1 p-2 border rounded dark:bg-[#121212] dark:border-gray-700 text-sm outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          const currentTags = currentItem.tags || [];
                          if (!currentTags.includes(val)) {
                            setCurrentItem({...currentItem, tags: [...currentTags, val]});
                          }
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                        const input = document.getElementById('newTagInput') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          const currentTags = currentItem.tags || [];
                          if (!currentTags.includes(val)) {
                            setCurrentItem({...currentItem, tags: [...currentTags, val]});
                          }
                          input.value = '';
                        }
                    }} 
                    className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
                  >
                    + Add
                  </button>
               </div>

               <div className="flex flex-wrap gap-2 min-h-[30px]">
                 {(currentItem.tags || []).map((tag: string, idx: number) => (
                   <span key={idx} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                     {tag}
                     <button 
                       type="button"
                       onClick={() => {
                         const newTags = currentItem.tags.filter((t: string) => t !== tag);
                         setCurrentItem({...currentItem, tags: newTags});
                       }}
                       className="hover:text-red-500"
                     >
                       <X size={12} />
                     </button>
                   </span>
                 ))}
               </div>
            </div>

            <button onClick={handleSave} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg mt-6 flex justify-center items-center gap-2 transition-all shadow-md">
               <Save size={18} /> Salvar Registro
            </button>
         </div>
      </Modal>
    </>
  );
};