import { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase'; // Ajuste o caminho se necessário
import { collection, addDoc, getDocs, writeBatch, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import { Database, Upload, Download, Plus, Search, Edit, Trash, Save } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface Entity {
  id: string;
  [key: string]: any;
}

export const GenericDatabaseView = ({ collectionName, title, columns, customFieldsAllowed = true }: any) => {
  const [data, setData] = useState<Entity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const snap = await getDocs(collection(db, collectionName));
    setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setIsLoading(false);
  }, [collectionName]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    if (!confirm("Tem certeza?")) return;
    await deleteDoc(doc(db, collectionName, id));
    fetchData();
  };

  const handleExport = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${collectionName}_export.csv`;
    link.click();
  };

  const handleImport = (e: any) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const batch = writeBatch(db);
        results.data.forEach((row: any) => {
          if (Object.keys(row).length > 1) { 
             const ref = doc(collection(db, collectionName));
             batch.set(ref, row);
          }
        });
        await batch.commit();
        fetchData();
        alert("Importação concluída!");
      }
    });
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-lidera-gray p-6 rounded-lg shadow-sm border border-gray-200 dark:border-lidera-dark">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
           <Database size={24} className="text-skills-blue-primary dark:text-lidera-gold" /> {title}
        </h2>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 cursor-pointer text-sm font-medium">
             <Upload size={16} /> Importar CSV
             <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 text-sm font-medium">
             <Download size={16} /> Exportar
          </button>
          <button onClick={() => { setCurrentItem({}); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-skills-blue-primary hover:bg-blue-700 text-white rounded font-bold shadow-lg shadow-blue-500/20">
             <Plus size={16} /> Novo Registro
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-lidera-gray rounded-lg shadow-lg border border-gray-200 dark:border-lidera-dark overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-4">
           <div className="relative flex-1">
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
                {columns.map((col: any) => <th key={col.key} className="px-6 py-4">{col.label}</th>)}
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-blue-50 dark:hover:bg-lidera-dark/50">
                  {columns.map((col: any) => (
                    <td key={col.key} className="px-6 py-4 text-gray-700 dark:text-gray-300">{item[col.key] || '-'}</td>
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
            {columns.map((col: any) => (
               <div key={col.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{col.label}</label>
                  <input 
                    type={col.type || "text"}
                    className="w-full p-2 rounded border dark:bg-lidera-dark dark:border-gray-700"
                    value={currentItem[col.key] || ''}
                    onChange={(e) => setCurrentItem({...currentItem, [col.key]: e.target.value})}
                  />
               </div>
            ))}
            {customFieldsAllowed && (
              <div className="pt-4 border-t dark:border-gray-700">
                 <h4 className="font-bold mb-2">Campos Adicionais</h4>
                 <div className="grid grid-cols-2 gap-2">
                    <input id="newKey" placeholder="Nome do Campo" className="p-2 border rounded dark:bg-lidera-dark dark:border-gray-700" />
                    <button type="button" onClick={() => {
                        const key = (document.getElementById('newKey') as HTMLInputElement).value;
                        if(key) {
                           setCurrentItem({...currentItem, [key]: ''});
                           (document.getElementById('newKey') as HTMLInputElement).value = '';
                        }
                    }} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-sm">+ Adicionar</button>
                 </div>
                 {Object.keys(currentItem).filter(k => !columns.find((c:any) => c.key === k) && k !== 'id').map(key => (
                    <div key={key} className="mt-2">
                       <label className="text-xs uppercase font-bold text-skills-blue-primary">{key}</label>
                       <input 
                          className="w-full p-2 border rounded dark:bg-lidera-dark dark:border-gray-700"
                          value={currentItem[key]}
                          onChange={(e) => setCurrentItem({...currentItem, [key]: e.target.value})}
                       />
                    </div>
                 ))}
              </div>
            )}
            <button onClick={handleSave} className="w-full py-3 bg-skills-blue-primary text-white font-bold rounded-lg mt-4 flex justify-center items-center gap-2">
               <Save size={18} /> Salvar Registro
            </button>
         </div>
      </Modal>
    </div>
  );
};