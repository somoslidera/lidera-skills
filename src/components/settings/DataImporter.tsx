import { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Added 'employees' to the supported types
type ImportTarget = 'criteria' | 'sectors' | 'roles' | 'employees';

export const DataImporter = ({ target }: { target: ImportTarget }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const config = {
    criteria: {
      label: 'Critérios de Avaliação',
      collection: 'evaluation_criteria',
      process: (item: any) => {
        const type = item.Categoria_Avaliacao === 'Operadores' ? 'Colaborador' : 
                     item.Categoria_Avaliacao === 'Líderes' ? 'Líder' : null;
        const name = item.ID_Avaliacao ? item.ID_Avaliacao.replace(/_/g, ' ') : null;
        
        if (!type || !name) return null;
        return { name, type, description: '' };
      },
      checkDuplicity: (ref: any, data: any) => 
        query(ref, where("name", "==", data.name), where("type", "==", data.type))
    },
    sectors: {
      label: 'Setores',
      collection: 'sectors',
      process: (item: any) => {
        const name = item.Nome_Setor || item.Setor || item.Nome;
        if (!name) return null;
        return { name, manager: '' };
      },
      checkDuplicity: (ref: any, data: any) => 
        query(ref, where("name", "==", data.name))
    },
    roles: {
      label: 'Cargos',
      collection: 'roles',
      process: (item: any) => {
        const name = item.Nome_Cargo || item.Cargo || item.Nome;
        const level = item['Nível'] || item.Nivel || 'Colaborador';
        if (!name) return null;
        return { name, level: level };
      },
      checkDuplicity: (ref: any, data: any) => 
        query(ref, where("name", "==", data.name))
    },
    // New Configuration for Employees
    employees: {
      label: 'Funcionários',
      collection: 'employees',
      process: (item: any) => {
        // Supports multiple header variations
        const name = item.Nome || item.Name || item.Funcionario || item.Nome_Completo;
        const email = item.Email || item['E-mail'] || '';
        const sector = item.Setor || item.Departamento || '';
        const role = item.Cargo || item.Funcao || '';
        
        if (!name) return null;
        return { 
          name, 
          email, 
          sector, 
          role, 
          status: 'Ativo' 
        };
      },
      checkDuplicity: (ref: any, data: any) => 
        query(ref, where("name", "==", data.name)) // Checks by name to avoid duplicates
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus({ type: null, msg: 'Lendo arquivo...' });

    const currentConfig = config[target];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: async (results) => {
        try {
          const data = results.data as any[];
          let importedCount = 0;
          let skippedCount = 0;

          const collectionRef = collection(db, currentConfig.collection);

          for (const item of data) {
            const docData = currentConfig.process(item);

            if (docData) {
              const q = currentConfig.checkDuplicity(collectionRef, docData);
              const querySnapshot = await getDocs(q);

              if (querySnapshot.empty) {
                await addDoc(collectionRef, docData);
                importedCount++;
              } else {
                skippedCount++;
              }
            }
          }

          setStatus({ 
            type: 'success', 
            msg: `Sucesso! ${importedCount} ${currentConfig.label} importados. (${skippedCount} ignorados/duplicados).` 
          });

        } catch (error) {
          console.error(error);
          setStatus({ type: 'error', msg: 'Erro ao processar dados. Verifique o arquivo.' });
        } finally {
          setLoading(false);
          event.target.value = '';
        }
      },
      error: (error) => {
        setLoading(false);
        setStatus({ type: 'error', msg: `Erro ao ler CSV: ${error.message}` });
      }
    });
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Upload size={18} /> Importar {config[target].label}
          </h4>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Selecione um arquivo CSV para importar {config[target].label.toLowerCase()}.
          </p>
        </div>
        
        <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
          {loading ? 'Processando...' : 'Selecionar CSV'}
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={loading}
          />
        </label>
      </div>

      {status.type && (
        <div className={`mt-4 p-3 rounded text-sm font-medium flex items-center gap-2 ${
          status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {status.msg}
        </div>
      )}
    </div>
  );
};
