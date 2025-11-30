import { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Database, Plus, Search, Edit, Trash, Save, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface Entity {
  id: string;
  [key: string]: any;
}

interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'select';
  options?: string[]; // Opções estáticas (ex: Nível)
  linkedCollection?: string; // Nome da coleção para buscar opções (ex: 'cargos')
  linkedField?: string; // Campo a ser exibido da coleção vinculada (ex: 'nome')
}

export const GenericDatabaseView = ({ collectionName, title, columns, customFieldsAllowed = true }: { collectionName: string, title: string, columns: ColumnConfig[], customFieldsAllowed?: boolean }) => {
  const [data, setData] = useState<Entity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // CORREÇÃO AQUI: Removido o erro de digitação "HZ"
  const [linkedOptions, setLinkedOptions] = useState<Record<string, string[]>>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const snap = await getDocs(collection(db, collectionName));
    setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setIsLoading(false);
  }, [collectionName]);

  // Busca dados de coleções vinculadas (ex: Cargos, Setores)
  useEffect(() => {
    fetchData();
    
    const loadLinkedData = async () => {
      const newLinkedOptions: Record<string, string[]> = {};
      
      for (const col of columns) {
        if (col.linkedCollection) {
          try {
            const snap = await getDocs(collection(db, col.linkedCollection));
            // Mapeia apenas o campo desejado (ex: 'nome') para criar a lista de opções
            const field = col.linkedField || 'nome';
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
    try {
      if (currentItem.id) {
        await updateDoc(doc(db, collectionName, currentItem.id), currentItem);
      } else {
        await addDoc(collection(db, collectionName), currentItem);
      }
      setIsModalOpen(false);
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

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Renderizador de Input Dinâmico (Select, Date, Text)
  const renderInput = (col: ColumnConfig) => {
    const value = currentItem[col.key] || '';
    
    if (col.type === 'select' || col.linkedCollection) {
      // Prioriza opções vinculadas, senão usa as opções estáticas
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-lidera-gray p-6 rounded-lg shadow-sm border border-gray-200 dark:border-lidera-dark">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
           <Database size={24} className="text-skills-blue-primary dark:text-lidera-gold" /> {title}
        </h2>
        <div className="flex gap-3">
          <button onClick={() => { setCurrentItem({}); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-skills-blue-primary hover:bg-blue-700 text-white rounded font-bold shadow-lg shadow-blue-500/20">
             <Plus size={16} /> Novo Registro
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-lidera-gray rounded-lg shadow-lg border border-gray-200 dark:border-lidera-dark overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
           <div className="relative">
             <Search className="absolute left-3 top-3 text-gray-400" size={18} />
             <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-lidera-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 ring-skills-blue-primary outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-lidera-dark text-gray-500 uppercase text-xs">
              <tr>
                {columns.map((col) => <th key={col.key} className="px-6 py-4 whitespace-nowrap">{col.label}</th>)}
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={columns.length + 1} className="p-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Carregando...</td></tr>
              ) : filteredData.map(item => (
                <tr key={item.id} className="hover:bg-blue-50 dark:hover:bg-lidera-dark/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                       {col.key === 'status' ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                             item[col.key] === 'Ativo' ? 'bg-green-100 text-green-700' : 
                             item[col.key] === 'Inativo' ? 'bg-red-100 text-red-700' : 
                             'bg-gray-100 text-gray-700'
                          }`}>
                             {item[col.key]}
                          </span>
                       ) : (
                          item[col.key] || '-'
                       )}
                    </td>
                  ))}
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => { setCurrentItem(item); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentItem.id ? "Editar Registro" : "Novo Registro"}>
         <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columns.map((col) => (
                <div key={col.key} className={col.type === 'email' || col.label.includes('Nome') ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{col.label}</label>
                    {renderInput(col)}
                </div>
                ))}
            </div>
            
            {customFieldsAllowed && (
              <div className="pt-4 border-t dark:border-gray-700 mt-4">
                 <h4 className="font-bold mb-2 text-sm text-gray-500">Campos Extras</h4>
                 <div className="grid grid-cols-2 gap-2 mb-2">
                    <input id="newKey" placeholder="Novo campo..." className="p-2 border rounded dark:bg-lidera-dark dark:border-gray-700 text-sm" />
                    <button type="button" onClick={() => {
                        const key = (document.getElementById('newKey') as HTMLInputElement).value;
                        if(key) {
                           setCurrentItem({...currentItem, [key]: ''});
                           (document.getElementById('newKey') as HTMLInputElement).value = '';
                        }
                    }} className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-xs font-bold">+ Add</button>
                 </div>
                 {Object.keys(currentItem).filter(k => !columns.find(c => c.key === k) && k !== 'id').map(key => (
                    <div key={key} className="flex gap-2 items-center mb-2">
                       <span className="text-xs font-bold w-1/3 truncate" title={key}>{key}:</span>
                       <input 
                          className="w-2/3 p-2 border rounded dark:bg-lidera-dark dark:border-gray-700 text-sm"
                          value={currentItem[key]}
                          onChange={(e) => setCurrentItem({...currentItem, [key]: e.target.value})}
                       />
                    </div>
                 ))}
              </div>
            )}

            <button onClick={handleSave} className="w-full py-3 bg-skills-blue-primary text-white font-bold rounded-lg mt-6 flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors">
               <Save size={18} /> Salvar Registro
            </button>
         </div>
      </Modal>
    </div>
  );
};
