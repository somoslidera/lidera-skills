import { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Adicionando os novos tipos de importação
type ImportTarget = 'criteria' | 'sectors' | 'roles' | 'employees' | 'evaluations_leaders' | 'evaluations_collaborators';

export const DataImporter = ({ target }: { target: ImportTarget }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  // Função auxiliar para converter "8,50" em 8.5
  const parseScore = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(',', '.')) || 0;
  };

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
      checkDuplicity: (ref: any, data: any) => query(ref, where("name", "==", data.name), where("type", "==", data.type))
    },
    sectors: {
      label: 'Setores',
      collection: 'sectors',
      process: (item: any) => {
        const name = item.Nome_Setor || item.Setor || item.Nome;
        if (!name) return null;
        return { name, manager: '' };
      },
      checkDuplicity: (ref: any, data: any) => query(ref, where("name", "==", data.name))
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
      checkDuplicity: (ref: any, data: any) => query(ref, where("name", "==", data.name))
    },
    employees: {
      label: 'Funcionários',
      collection: 'employees',
      process: (item: any) => {
        const name = item.Nome || item.Name || item.Funcionario || item.Nome_Completo;
        const email = item.Email || item['E-mail'] || '';
        const sector = item.Setor || item.Departamento || '';
        const role = item.Cargo || item.Funcao || '';
        if (!name) return null;
        return { name, email, sector, role, status: 'Ativo' };
      },
      checkDuplicity: (ref: any, data: any) => query(ref, where("name", "==", data.name))
    },
    // --- IMPORTAÇÃO DE AVALIAÇÕES DE LÍDERES ---
    evaluations_leaders: {
      label: 'Histórico (Líderes)',
      collection: 'evaluations',
      process: (item: any) => {
        const name = item.Nome_Lider_Avaliado || item.Nome_Colaborador;
        const dateRaw = item.Mes_Referencia; // Esperado YYYY-MM-DD ou DD/MM/YYYY
        if (!name || !dateRaw) return null;

        const average = parseScore(item.Pontuacao_Lider);
        
        // Mapear detalhes específicos de líderes
        const details = {
          'Comunicação': parseScore(item.Comunicacao_Clara_Coerente),
          'Gestão de Equipe': parseScore(item.Acompanhamento_Membros_Equipe),
          'Metas': parseScore(item.Cumprimento_Metas_Setor),
          'Decisão': parseScore(item.Capacidade_Decisao_Resolucao),
          'Assiduidade': parseScore(item.Assiduidade_Pontualidade_Lider)
        };

        return {
          employeeName: name, // Nome temporário para exibição
          employeeId: item.ID_Funcionario || '', // ID se houver
          role: item.Cargo,
          sector: item.Setor,
          type: 'Líder',
          date: dateRaw, // Formato string YYYY-MM-DD é ideal para ordenação
          average: average,
          details: details
        };
      },
      checkDuplicity: (ref: any, data: any) => 
        query(ref, where("employeeName", "==", data.employeeName), where("date", "==", data.date))
    },
    // --- IMPORTAÇÃO DE AVALIAÇÕES DE COLABORADORES ---
    evaluations_collaborators: {
      label: 'Histórico (Colaboradores)',
      collection: 'evaluations',
      process: (item: any) => {
        // Tenta pegar o nome ou usa o ID como fallback se o nome estiver vazio no CSV
        const name = item.Nome_Colaborador || `Func. ${item.ID_Funcionario}`;
        const dateRaw = item.Mes_Referencia;
        if (!dateRaw) return null;

        const average = parseScore(item.Pontuacao_Colaborador);

        // Mapear detalhes específicos de colaboradores
        const details = {
          'Assiduidade': parseScore(item.Assiduidade_Pontualidade),
          'Tarefas': parseScore(item.Cumprimento_Tarefas),
          'Proatividade': parseScore(item.Proatividade),
          'Organização': parseScore(item.Organizacao_Limpeza),
          'Uniforme': parseScore(item.Uso_Uniforme_EPI)
        };

        return {
          employeeName: name,
          employeeId: item.ID_Funcionario || '',
          role: item.Cargo,
          sector: item.Setor,
          type: 'Colaborador',
          date: dateRaw,
          average: average,
          details: details
        };
      },
      checkDuplicity: (ref: any, data: any) => 
        query(ref, where("employeeName", "==", data.employeeName), where("date", "==", data.date))
    }
  };

// ... importações existentes
import { useCompany } from '../../contexts/CompanyContext'; // <--- IMPORTANTE

export const DataImporter = ({ target }: { target: ImportTarget }) => {
  const { currentCompany } = useCompany(); // <--- IMPORTANTE
  // ... estados

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... validações iniciais

    if (!currentCompany) {
      alert("Por favor, selecione uma empresa no topo da página antes de importar dados.");
      return;
    }

    // ... lógica do Papa.parse
      complete: async (results) => {
        // ...
          for (const item of data) {
            const processedItem = currentConfig.process(item); // Processa

            if (processedItem) {
              // --- AQUI ESTÁ A MÁGICA ---
              const docData = {
                ...processedItem,
                companyId: currentCompany.id, // Vínculo automático
                importedAt: new Date().toISOString()
              };
              
              // Adiciona verificação de duplicidade filtrando TAMBÉM pela empresa
              const q = query(
                 collectionRef, 
                 where("companyId", "==", currentCompany.id), // Filtra só desta empresa
                 // ... adicione as outras cláusulas do checkDuplicity aqui se necessário
                 // Sugestão: Atualizar o config.checkDuplicity para aceitar companyId
              );
              
              // ... addDoc(collectionRef, docData);
            }
          }
        // ...
      }
    // ...
  };
  // ...
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
            msg: `Sucesso! ${importedCount} registros importados. (${skippedCount} ignorados/duplicados).` 
          });

        } catch (error) {
          console.error(error);
          setStatus({ type: 'error', msg: 'Erro ao processar dados.' });
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
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg mb-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Upload size={18} /> {config[target].label}
          </h4>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Importar CSV para {config[target].label.toLowerCase()}.
          </p>
        </div>
        
        <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded shadow transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {loading ? 'Processando...' : 'Selecionar Arquivo'}
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
        <div className={`mt-3 p-2 rounded text-xs font-medium flex items-center gap-2 ${
          status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {status.msg}
        </div>
      )}
    </div>
  );
};
