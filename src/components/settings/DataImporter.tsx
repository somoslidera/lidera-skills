import { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const DataImporter = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus({ type: null, msg: 'Lendo arquivo...' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          let importedCount = 0;
          let skippedCount = 0;

          const criteriaRef = collection(db, 'evaluation_criteria');

          for (const item of data) {
            // 1. Mapeamento dos campos do CSV para o App
            // CSV: Categoria_Avaliacao (Operadores/Líderes) -> App: type (Colaborador/Líder)
            const type = item.Categoria_Avaliacao === 'Operadores' ? 'Colaborador' : 
                         item.Categoria_Avaliacao === 'Líderes' ? 'Líder' : null;

            // CSV: ID_Avaliacao (ex: Assiduidade_Pontualidade) -> App: name (Assiduidade Pontualidade)
            const name = item.ID_Avaliacao ? item.ID_Avaliacao.replace(/_/g, ' ') : null;

            if (type && name) {
              // Verifica duplicidade antes de adicionar
              const q = query(criteriaRef, where("name", "==", name), where("type", "==", type));
              const querySnapshot = await getDocs(q);

              if (querySnapshot.empty) {
                await addDoc(criteriaRef, {
                  name: name,
                  type: type,
                  description: '' // Descrição vazia por padrão
                });
                importedCount++;
              } else {
                skippedCount++;
              }
            }
          }

          setStatus({ 
            type: 'success', 
            msg: `Processo finalizado! ${importedCount} novos critérios importados. (${skippedCount} duplicados ignorados).` 
          });

        } catch (error) {
          console.error(error);
          setStatus({ type: 'error', msg: 'Erro ao importar dados. Verifique o console.' });
        } finally {
          setLoading(false);
          // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
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
            <Upload size={18} /> Importação Inicial
          </h4>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Selecione o arquivo CSV de Avaliações para preencher o banco de dados automaticamente.
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
