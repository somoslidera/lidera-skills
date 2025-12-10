import { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, query, where, CollectionReference, DocumentData } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

// Tipos de importação
type ImportTarget = 'criteria' | 'sectors' | 'roles' | 'employees' | 'evaluations_leaders' | 'evaluations_collaborators';

export const DataImporter = ({ target }: { target: ImportTarget }) => {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  // Função auxiliar para converter "8,50" em 8.5
  const parseScore = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(',', '.')) || 0;
  };

  // Configuração de processamento para cada tipo de importação
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
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, companyId: string) => 
        query(ref, where("name", "==", data.name), where("type", "==", data.type), where("companyId", "==", companyId))
    },
    sectors: {
      label: 'Setores',
      collection: 'sectors',
      process: (item: any) => {
        const name = item.Nome_Setor || item.Setor || item.Nome;
        if (!name) return null;
        return { name, manager: '' };
      },
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any) => 
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
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any) => 
        query(ref, where("name", "==", data.name))
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
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any) => 
        query(ref, where("name", "==", data.name))
    },
    evaluations_leaders: {
      label: 'Histórico (Líderes)',
      collection: 'evaluations',
      process: (item: any) => {
        const name = item.Nome_Lider_Avaliado || item.Nome_Colaborador;
        const dateRaw = item.Mes_Referencia; // Esperado YYYY-MM-DD
        if (!name || !dateRaw) return null;

        const average = parseScore(item.Pontuacao_Lider);
        
        const details = {
          'Comunicação': parseScore(item.Comunicacao_Clara_Coerente),
          'Gestão de Equipe': parseScore(item.Acompanhamento_Membros_Equipe),
          'Metas': parseScore(item.Cumprimento_Metas_Setor),
          'Decisão': parseScore(item.Capacidade_Decisao_Resolucao),
          'Assiduidade': parseScore(item.Assiduidade_Pontualidade_Lider)
        };

        return {
          employeeName: name,
          employeeId: item.ID_Funcionario || '',
          role: item.Cargo,
          sector: item.Setor,
          type: 'Líder',
          date: dateRaw,
          average: average,
          details: details
        };
      },
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, companyId: string) => 
        query(ref, where("employeeName", "==", data.employeeName), where("date", "==", data.date), where("companyId", "==", companyId))
    },
    evaluations_collaborators: {
      label: 'Histórico (Colaboradores)',
      collection: 'evaluations',
      process: (item: any) => {
        const name = item.Nome_Colaborador || `Func. ${item.ID_Funcionario}`;
        const dateRaw = item.Mes_Referencia;
        if (!dateRaw) return null;

        const average = parseScore(item.Pontuacao_Colaborador);

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
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, companyId: string) => 
        query(ref, where("employeeName", "==", data.employeeName), where("date", "==", data.date), where("companyId", "==", companyId))
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Apenas critérios e avaliações precisam de empresa selecionada
    const needsCompanyId = target === 'criteria' || target === 'evaluations_leaders' || target === 'evaluations_collaborators';
    
    if (needsCompanyId && !currentCompany) {
      alert("Por favor, selecione uma empresa no topo da página antes de importar dados.");
      event.target.value = ''; // Limpa o input para permitir selecionar o mesmo arquivo novamente
      return;
    }

    setLoading(true);
    setStatus({ type: null, msg: 'Lendo arquivo...' });

    const currentConfig = config[target];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: async (results: any) => { // Tipagem explícita para evitar erro TS7006
        try {
          const data = results.data as any[];
          let importedCount = 0;
          let skippedCount = 0;

          const collectionRef = collection(db, currentConfig.collection);

          // Determina se precisa de companyId (apenas para criteria e evaluations)
          const needsCompanyId = target === 'criteria' || target === 'evaluations_leaders' || target === 'evaluations_collaborators';

          for (const item of data) {
            const processedData = currentConfig.process(item);

            if (processedData) {
              // Verifica duplicidade
              let q;
              if (needsCompanyId) {
                q = currentConfig.checkDuplicity(collectionRef, processedData, currentCompany.id);
              } else {
                q = currentConfig.checkDuplicity(collectionRef, processedData);
              }
              const querySnapshot = await getDocs(q);

              if (querySnapshot.empty) {
                // Injeta o ID da empresa apenas se necessário
                const docData = needsCompanyId
                  ? {
                      ...processedData,
                      companyId: currentCompany.id,
                      importedAt: new Date().toISOString()
                    }
                  : {
                      ...processedData,
                      importedAt: new Date().toISOString()
                    };
                await addDoc(collectionRef, docData);
                importedCount++;
              } else {
                skippedCount++;
              }
            }
          }

          const successMsg = needsCompanyId
            ? `Sucesso! ${importedCount} registros importados em "${currentCompany.name}". (${skippedCount} ignorados/duplicados).`
            : `Sucesso! ${importedCount} registros importados. (${skippedCount} ignorados/duplicados).`;
          
          setStatus({ 
            type: 'success', 
            msg: successMsg
          });

        } catch (error: any) {
          console.error(error);
          setStatus({ type: 'error', msg: 'Erro ao processar dados: ' + (error.message || error) });
        } finally {
          setLoading(false);
          event.target.value = '';
        }
      },
      error: (error: any) => {
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