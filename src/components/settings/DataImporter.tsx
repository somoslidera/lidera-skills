import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../services/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  CollectionReference, 
  DocumentData,
  doc,
  updateDoc,
  arrayUnion 
} from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { Modal } from '../ui/Modal';

// Tipos de importação
type ImportTarget = 'criteria' | 'sectors' | 'roles' | 'employees' | 'evaluations_leaders' | 'evaluations_collaborators';

export const DataImporter = ({ target }: { target: ImportTarget }) => {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Estados exclusivos para importação de Funcionários ---
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [pendingRows, setPendingRows] = useState<any[]>([]);
  const [pendingFileName, setPendingFileName] = useState('');
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    email: '',
    sector: '',
    role: ''
  });

  // Função auxiliar para converter "8,50" em 8.5
  const parseScore = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(',', '.')) || 0;
  };

  // Configuração de processamento para cada tipo de importação
  // Padronizamos checkDuplicity para sempre receber (ref, data, companyId)
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
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, _companyId: string) => 
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
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, _companyId: string) => 
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
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, _companyId: string) => 
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

    const isEmployeeImport = target === 'employees';

    // Funcionários: exige empresa e abre modal de mapeamento de colunas
    if (isEmployeeImport) {
      if (!currentCompany || currentCompany.id === 'all') {
        alert("Selecione uma empresa antes de importar funcionários.");
        resetFileInput(event);
        return;
      }

      setLoading(true);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results: any) => {
          const rows = (results.data as any[]).filter(Boolean);
          const headers = results.meta?.fields || [];

          if (!rows.length) {
            setStatus({ type: 'error', msg: 'O CSV está vazio.' });
            setLoading(false);
            resetFileInput(event);
            return;
          }

          const guessedMapping = buildDefaultMapping(headers);
          setColumnMapping(guessedMapping);
          setCsvHeaders(headers);
          setPendingRows(rows);
          setPendingFileName(file.name);
          setIsMappingOpen(true);
          setLoading(false);
        },
        error: (error: any) => {
          setLoading(false);
          setStatus({ type: 'error', msg: `Erro ao ler CSV: ${error.message}` });
          resetFileInput(event);
        }
      });
      return;
    }

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
          
          // Snapshot seguro dos dados da empresa para uso no loop assíncrono
          const safeCompanyId = currentCompany?.id || '';
          const safeCompanyName = currentCompany?.name || '';

          if (needsCompanyId && !safeCompanyId) {
             throw new Error("ID da empresa não encontrado.");
          }

          for (const item of data) {
            const processedData = currentConfig.process(item);

            if (processedData) {
              // Verifica duplicidade usando o ID seguro
              // Agora todos os checkDuplicity aceitam 3 argumentos, então passamos safeCompanyId sempre
              const q = currentConfig.checkDuplicity(collectionRef, processedData, safeCompanyId);
              
              const querySnapshot = await getDocs(q);

              if (querySnapshot.empty) {
                // Injeta o ID da empresa apenas se necessário
                const docData = needsCompanyId
                  ? {
                      ...processedData,
                      companyId: safeCompanyId,
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
            ? `Sucesso! ${importedCount} registros importados em "${safeCompanyName}". (${skippedCount} ignorados/duplicados).`
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
        resetFileInput(event);
      }
    });
  };

  // --- Helpers específicos para funcionários ---
  const buildDefaultMapping = (headers: string[]) => {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findHeader = (candidates: string[]) => {
      const foundIdx = lowerHeaders.findIndex(h => candidates.some(c => h.includes(c)));
      return foundIdx >= 0 ? headers[foundIdx] : '';
    };

    return {
      // Ex: "Colaborador"
      name: findHeader(['colaborador', 'nome', 'name']),
      email: findHeader(['email', 'e-mail']),
      sector: findHeader(['setor', 'depart', 'area']),
      role: findHeader(['cargo', 'funcao', 'função', 'role'])
    };
  };

  const resetFileInput = (event?: React.ChangeEvent<HTMLInputElement>) => {
    if (event?.target) event.target.value = '';
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const ensureSector = async (name: string, companyId: string, cache: Map<string, string>) => {
    if (!name) return { id: '', name: '' };
    if (cache.has(name)) return { id: cache.get(name) || '', name };

    const sectorRef = collection(db, 'sectors');
    const q = query(sectorRef, where("name", "==", name));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      // Garante vínculo com a empresa
      if (companyId) {
        const companyIds = data.companyIds || [];
        if (!companyIds.includes(companyId)) {
          await updateDoc(doc(db, 'sectors', docSnap.id), { companyIds: arrayUnion(companyId) });
        }
      }
      cache.set(name, docSnap.id);
      return { id: docSnap.id, name };
    }

    const newDoc = await addDoc(sectorRef, {
      name,
      companyIds: companyId ? [companyId] : [],
      importedAt: new Date().toISOString(),
      createdFrom: 'csv-import'
    });
    cache.set(name, newDoc.id);
    return { id: newDoc.id, name };
  };

  const ensureRole = async (name: string, companyId: string, cache: Map<string, string>) => {
    if (!name) return { id: '', name: '' };
    if (cache.has(name)) return { id: cache.get(name) || '', name };

    const roleRef = collection(db, 'roles');
    const q = query(roleRef, where("name", "==", name));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      if (companyId) {
        const companyIds = data.companyIds || [];
        if (!companyIds.includes(companyId)) {
          await updateDoc(doc(db, 'roles', docSnap.id), { companyIds: arrayUnion(companyId) });
        }
      }
      cache.set(name, docSnap.id);
      return { id: docSnap.id, name };
    }

    const newDoc = await addDoc(roleRef, {
      name,
      level: 'Colaborador',
      companyIds: companyId ? [companyId] : [],
      importedAt: new Date().toISOString(),
      createdFrom: 'csv-import'
    });
    cache.set(name, newDoc.id);
    return { id: newDoc.id, name };
  };

  const processEmployeeRows = async () => {
    if (!currentCompany || currentCompany.id === 'all') {
      setStatus({ type: 'error', msg: 'Selecione uma empresa para continuar.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, msg: 'Processando funcionários...' });

    try {
      const collectionRef = collection(db, 'employees');
      const sectorCache = new Map<string, string>();
      const roleCache = new Map<string, string>();

      let importedCount = 0;
      let skippedCount = 0;

      for (const row of pendingRows) {
        const name = row[columnMapping.name] || row.Colaborador || row.Nome || row.Name;
        const email = row[columnMapping.email] || row.Email || row['E-mail'] || '';
        const sectorName = row[columnMapping.sector] || row.Setor || '';
        const roleName = row[columnMapping.role] || row.Cargo || '';

        // Novos campos do layout padrão:
        const employeeCode = row.ID || row.Id || '';
        const area = row['Área de Atuação'] || row.Area || '';
        const funcao = row.Função || row.Funcao || row['Função'] || '';
        const seniority = row.Senioridade || '';
        const jobLevel = row['Nível de Cargo'] || row.NivelCargo || '';
        const phone = row.Telefone || row['Telefone'] || '';
        const contractType = row['Tipo de Vínculo'] || row['Tipo de Vinculo'] || '';
        const managerName = row['Gestor Imediato'] || row['Gestor'] || '';
        const unit = row['Unidade/Filial'] || row['Unidade'] || row['Filial'] || '';
        const costCenter = row['Centro de Custo'] || row['Centro de custo'] || '';
        const discProfile = row['Perfil DISC'] || row['DISC'] || '';
        const admissionDate = row['Data de Admissão'] || row['Data Admissão'] || '';
        const terminationDate = row['Data de Desligamento'] || row['Data Desligamento'] || '';

        if (!name) {
          skippedCount++;
          continue;
        }

        // Checa duplicidade por email ou nome dentro da empresa
        let exists = false;
        if (email) {
          const q = query(collectionRef, where("email", "==", email));
          const snap = await getDocs(q);
          exists = snap.docs.some(d => d.data().companyId === currentCompany.id);
        }
        if (!exists) {
          const qName = query(collectionRef, where("name", "==", name));
          const snapName = await getDocs(qName);
          exists = snapName.docs.some(d => d.data().companyId === currentCompany.id);
        }

        if (exists) {
          skippedCount++;
          continue;
        }

        const { id: sectorId } = await ensureSector(sectorName, currentCompany.id, sectorCache);
        const { id: roleId } = await ensureRole(roleName, currentCompany.id, roleCache);

        const docData = {
          employeeCode,
          name,
          email,
          phone,
          sector: sectorName,
          area,
          role: roleName,
          function: funcao,
          seniority,
          jobLevel,
          contractType,
          managerName,
          unit,
          costCenter,
          discProfile,
          admissionDate,
          terminationDate,
          sectorId,
          roleId,
          companyId: currentCompany.id,
          status: 'Ativo',
          importedAt: new Date().toISOString(),
          source: 'csv-import'
        };

        await addDoc(collectionRef, docData);
        importedCount++;
      }

      setStatus({ 
        type: 'success', 
        msg: `Importação concluída: ${importedCount} funcionários adicionados. (${skippedCount} ignorados por duplicidade ou dados incompletos).`
      });
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Erro ao processar funcionários: ' + (error.message || error) });
    } finally {
      setLoading(false);
      setIsMappingOpen(false);
      setPendingRows([]);
      setPendingFileName('');
      resetFileInput();
    }
  };

  const employeeTemplateCsv = useMemo(() => {
    const rows = [
      [
        'ID',
        'Colaborador',
        'Setor',
        'Área de Atuação',
        'Cargo',
        'Função',
        'Senioridade',
        'Nível de Cargo',
        'Tipo de Vínculo',
        'Gestor Imediato',
        'Unidade/Filial',
        'Centro de Custo',
        'Perfil DISC',
        'Email',
        'Telefone',
        'Data de Admissão',
        'Data de Desligamento'
      ],
      [
        '001',
        'Maria Silva',
        'Financeiro',
        'Controladoria',
        'Analista Financeiro',
        'Financeiro Pleno',
        'Pleno',
        'Operacional',
        'CLT',
        'Carlos Lima',
        'Matriz',
        'CC-100-FIN',
        'D/I',
        'maria@empresa.com',
        '(11) 99999-0000',
        '2021-03-15',
        ''
      ],
      [
        '002',
        'João Souza',
        'Operações',
        'Logística',
        'Coordenador de Operações',
        'Coordenação',
        'Sênior',
        'Tático',
        'PJ',
        'Ana Ribeiro',
        'Filial SP',
        'CC-200-OPS',
        'S/C',
        'joao@empresa.com',
        '(11) 98888-1111',
        '2020-08-01',
        ''
      ]
    ];
    return rows.map(r => r.join(',')).join('\n');
  }, []);

  const downloadTemplate = () => {
    const blob = new Blob([employeeTemplateCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_funcionarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          {target === 'employees' && (
            <button
              onClick={downloadTemplate}
              className="mt-2 text-xs text-blue-700 dark:text-blue-300 font-semibold underline"
            >
              Baixar modelo de CSV (Funcionários)
            </button>
          )}
        </div>
        
        <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded shadow transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {loading ? 'Processando...' : 'Selecionar Arquivo'}
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={handleFileUpload}
            ref={fileInputRef}
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

      {/* Modal de mapeamento de colunas para Funcionários */}
      {target === 'employees' && (
        <Modal 
          isOpen={isMappingOpen} 
          onClose={() => { setIsMappingOpen(false); resetFileInput(); }} 
          title="Confirmar mapeamento das colunas"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Revise como cada coluna do CSV <strong>{pendingFileName || ''}</strong> será usada. Ajuste se necessário antes de finalizar a importação.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Nome do funcionário *</label>
                <select
                  className="w-full p-2 rounded border bg-white dark:bg-lidera-dark dark:border-gray-700"
                  value={columnMapping.name}
                  onChange={(e) => setColumnMapping({...columnMapping, name: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Email (opcional)</label>
                <select
                  className="w-full p-2 rounded border bg-white dark:bg-lidera-dark dark:border-gray-700"
                  value={columnMapping.email}
                  onChange={(e) => setColumnMapping({...columnMapping, email: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Setor *</label>
                <select
                  className="w-full p-2 rounded border bg-white dark:bg-lidera-dark dark:border-gray-700"
                  value={columnMapping.sector}
                  onChange={(e) => setColumnMapping({...columnMapping, sector: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Cargo *</label>
                <select
                  className="w-full p-2 rounded border bg-white dark:bg-lidera-dark dark:border-gray-700"
                  value={columnMapping.role}
                  onChange={(e) => setColumnMapping({...columnMapping, role: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {pendingRows.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-300">
                <p className="font-semibold mb-2">Pré-visualização da primeira linha:</p>
                <pre className="whitespace-pre-wrap text-[11px]">
{JSON.stringify(pendingRows[0], null, 2)}
                </pre>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={processEmployeeRows}
                disabled={loading || !columnMapping.name || !columnMapping.sector || !columnMapping.role}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                Confirmar mapeamento e importar
              </button>
              <button
                onClick={() => { setIsMappingOpen(false); resetFileInput(); }}
                className="w-full py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};