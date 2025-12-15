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
type ImportTarget = 
  | 'criteria' 
  | 'sectors' 
  | 'roles' 
  | 'employees' 
  | 'evaluations_leaders' 
  | 'evaluations_collaborators'
  | 'evaluations_gomes';

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

  // --- Helpers de Parsing ---
  const parseScore = (val: string) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.replace(',', '.')) || 0;
  };

  const parseGomesDate = (rawDate: string): string => {
    if (!rawDate) return new Date().toISOString().split('T')[0];
    const cleanDate = rawDate.replace(/\//g, '').trim().toLowerCase();
    
    const months: { [key: string]: string } = {
      'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
      'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
    };

    let monthPart = '';
    let yearPart = '';

    for (const m in months) {
      if (cleanDate.includes(m)) {
        monthPart = months[m];
        break;
      }
    }

    const yearMatch = cleanDate.match(/\d{2,4}$/);
    if (yearMatch) {
      yearPart = yearMatch[0];
      if (yearPart.length === 2) yearPart = '20' + yearPart;
    }

    if (monthPart && yearPart) {
      return `${yearPart}-${monthPart}-01`;
    }
    return rawDate;
  };

  // --- Helpers de Banco de Dados (Upsert) ---
  
  // Garante que o setor existe, cria se não existir e retorna o ID
  const ensureSector = async (name: string, companyId: string, cache: Map<string, string>) => {
    if (!name) return '';
    if (cache.has(name)) return cache.get(name)!;

    const ref = collection(db, 'sectors');
    const q = query(ref, where("name", "==", name));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      // Atualiza vinculo com empresa se necessário
      if (companyId) {
        const data = docSnap.data();
        if (!data.companyIds?.includes(companyId)) {
          await updateDoc(doc(db, 'sectors', docSnap.id), { companyIds: arrayUnion(companyId) });
        }
      }
      cache.set(name, docSnap.id);
      return docSnap.id;
    }

    const newDoc = await addDoc(ref, {
      name,
      companyIds: companyId ? [companyId] : [],
      importedAt: new Date().toISOString(),
      createdFrom: 'gomes-import'
    });
    cache.set(name, newDoc.id);
    return newDoc.id;
  };

  // Garante que o cargo existe
  const ensureRole = async (name: string, level: string, companyId: string, cache: Map<string, string>) => {
    if (!name) return '';
    if (cache.has(name)) return cache.get(name)!;

    const ref = collection(db, 'roles');
    const q = query(ref, where("name", "==", name));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      if (companyId) {
        const data = docSnap.data();
        if (!data.companyIds?.includes(companyId)) {
          await updateDoc(doc(db, 'roles', docSnap.id), { companyIds: arrayUnion(companyId) });
        }
      }
      cache.set(name, docSnap.id);
      return docSnap.id;
    }

    const newDoc = await addDoc(ref, {
      name,
      level: level || 'Colaborador',
      companyIds: companyId ? [companyId] : [],
      importedAt: new Date().toISOString(),
      createdFrom: 'gomes-import'
    });
    cache.set(name, newDoc.id);
    return newDoc.id;
  };

  // Garante que o critério existe
  const ensureCriteria = async (name: string, type: string, cache: Map<string, string>) => {
    if (!name) return '';
    const key = `${name}-${type}`;
    if (cache.has(key)) return cache.get(key)!;

    const ref = collection(db, 'evaluation_criteria');
    const q = query(ref, where("name", "==", name), where("type", "==", type));
    const snap = await getDocs(q);

    if (!snap.empty) {
      cache.set(key, snap.docs[0].id);
      return snap.docs[0].id;
    }

    const newDoc = await addDoc(ref, {
      name,
      type,
      section: 'Geral', // Default para importação automática
      description: 'Importado automaticamente',
      importedAt: new Date().toISOString()
    });
    cache.set(key, newDoc.id);
    return newDoc.id;
  };

  // Garante que o funcionário existe
  const ensureEmployee = async (data: any, companyId: string, cache: Map<string, string>) => {
    if (!data.name) return '';
    if (cache.has(data.name)) return cache.get(data.name)!;

    const ref = collection(db, 'employees');
    // Verifica primeiro por código se existir, senão por nome
    let q;
    if (data.employeeCode) {
       q = query(ref, where("employeeCode", "==", data.employeeCode), where("companyId", "==", companyId));
    } else {
       q = query(ref, where("name", "==", data.name), where("companyId", "==", companyId));
    }
    
    const snap = await getDocs(q);

    if (!snap.empty) {
      cache.set(data.name, snap.docs[0].id);
      return snap.docs[0].id;
    }

    // Cria novo funcionário
    const newDoc = await addDoc(ref, {
      ...data,
      companyId,
      status: 'Ativo',
      importedAt: new Date().toISOString(),
      source: 'gomes-import'
    });
    cache.set(data.name, newDoc.id);
    return newDoc.id;
  };

  // Configuração de processamento
  const config = {
    criteria: {
      label: 'Critérios de Avaliação',
      collection: 'evaluation_criteria',
      process: (item: any) => {
        const type = item.Categoria_Avaliacao === 'Operadores' ? 'Colaborador' : 
                     item.Categoria_Avaliacao === 'Líderes' ? 'Líder' : null;
        const name = item.ID_Avaliacao ? item.ID_Avaliacao.replace(/_/g, ' ') : null;
        if (!type || !name) return null;
        const section = item.Secao || item.Seção || item.Categoria || '';
        return { name, type, section, description: '' };
      },
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, _companyId: string) => 
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
        const dateRaw = item.Mes_Referencia;
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
    },
    evaluations_gomes: {
      label: 'Histórico Completo (Layout Gomes)',
      collection: 'evaluations',
      process: (_item: any) => null, // Processamento customizado
      checkDuplicity: (ref: CollectionReference<DocumentData>, data: any, companyId: string) => 
        query(ref, where("employeeName", "==", data.employeeName), where("date", "==", data.date), where("companyId", "==", companyId))
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isEmployeeImport = target === 'employees';

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

    const needsCompanyId = target.startsWith('evaluations_');
    if (needsCompanyId && !currentCompany) {
      alert("Por favor, selecione uma empresa no topo da página antes de importar dados.");
      event.target.value = '';
      return;
    }

    setLoading(true);
    setStatus({ type: null, msg: 'Lendo arquivo...' });

    const currentConfig = config[target];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: async (results: any) => {
        try {
          const data = results.data as any[];
          let importedCount = 0;
          let skippedCount = 0;
          const safeCompanyId = currentCompany?.id || '';

          const collectionRef = collection(db, currentConfig.collection);

          // --- SUPER IMPORTAÇÃO GOMES ---
          if (target === 'evaluations_gomes') {
             // 1. Agrupar Avaliações
             const groupedEvaluations = new Map<string, any>();
             const cacheSectors = new Map<string, string>();
             const cacheRoles = new Map<string, string>();
             const cacheCriteria = new Map<string, string>();
             const cacheEmployees = new Map<string, string>();

             setStatus({ type: null, msg: 'Processando estrutura (Setores, Cargos, Critérios)...' });

             // Pré-processamento: Agrupar e garantir dependências
             for (const row of data) {
               const name = row.Nome_Colaborador || row.Nome;
               const dateRaw = row.Mes_Referencia;
               const metricName = row.Nome_Metrica;
               const sectorName = row.Setor;
               const roleName = row.Cargo;
               const level = row.Nivel || 'Colaborador';
               const employeeCode = row.ID_Avaliacao; // Usar ID do CSV como código

               if (!name || !dateRaw) continue;

               // A. Garante Setor e Cargo
               const sectorId = await ensureSector(sectorName, safeCompanyId, cacheSectors);
               const roleId = await ensureRole(roleName, level, safeCompanyId, cacheRoles);

               // B. Garante Critério
               if (metricName) {
                 await ensureCriteria(metricName, level, cacheCriteria);
               }

               // C. Garante Funcionário
               await ensureEmployee({
                 name,
                 employeeCode,
                 sector: sectorName,
                 role: roleName,
                 sectorId,
                 roleId,
                 jobLevel: level
               }, safeCompanyId, cacheEmployees);

               // D. Agrupa Avaliação
               const formattedDate = parseGomesDate(dateRaw);
               const key = `${name}-${formattedDate}`;
               const score = parseScore(row.Nota);

               if (!groupedEvaluations.has(key)) {
                 groupedEvaluations.set(key, {
                   employeeName: name,
                   employeeId: employeeCode,
                   role: roleName,
                   sector: sectorName,
                   type: level,
                   date: formattedDate,
                   details: {},
                   totalScore: 0,
                   metricCount: 0
                 });
               }

               const evalObj = groupedEvaluations.get(key);
               if (metricName) {
                evalObj.details[metricName] = score;
                evalObj.totalScore += score;
                evalObj.metricCount += 1;
               }
             }

             // 2. Salvar Avaliações Agrupadas
             setStatus({ type: null, msg: 'Salvando avaliações...' });
             
             for (const item of groupedEvaluations.values()) {
               const average = item.metricCount > 0 
                 ? parseFloat((item.totalScore / item.metricCount).toFixed(2)) 
                 : 0;

               const finalDoc = {
                 employeeName: item.employeeName,
                 employeeId: item.employeeId,
                 role: item.role,
                 sector: item.sector,
                 type: item.type,
                 date: item.date,
                 average: average,
                 details: item.details,
                 companyId: safeCompanyId,
                 importedAt: new Date().toISOString(),
                 source: 'gomes-full-import'
               };

               const q = currentConfig.checkDuplicity(collectionRef, finalDoc, safeCompanyId);
               const querySnapshot = await getDocs(q);

               if (querySnapshot.empty) {
                 await addDoc(collectionRef, finalDoc);
                 importedCount++;
               } else {
                 skippedCount++;
               }
             }

             setStatus({ 
               type: 'success', 
               msg: `Importação Completa! ${importedCount} avaliações geradas. Dependências (Funcionários, Setores, Cargos, Critérios) verificadas e criadas.` 
             });

          } else {
            // Importação Padrão (Legado)
            for (const item of data) {
              const processedData = currentConfig.process(item);
              if (processedData) {
                const q = currentConfig.checkDuplicity(collectionRef, processedData, safeCompanyId);
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                  const docData = needsCompanyId
                    ? { ...processedData, companyId: safeCompanyId, importedAt: new Date().toISOString() }
                    : { ...processedData, importedAt: new Date().toISOString(), source: 'csv-import' };
                  await addDoc(collectionRef, docData);
                  importedCount++;
                } else {
                  skippedCount++;
                }
              }
            }
            setStatus({ type: 'success', msg: `Sucesso! ${importedCount} registros importados. (${skippedCount} ignorados).` });
          }

        } catch (error: any) {
          console.error(error);
          setStatus({ type: 'error', msg: 'Erro: ' + (error.message || error) });
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

  const buildDefaultMapping = (headers: string[]) => {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findHeader = (candidates: string[]) => {
      const foundIdx = lowerHeaders.findIndex(h => candidates.some(c => h.includes(c)));
      return foundIdx >= 0 ? headers[foundIdx] : '';
    };

    return {
      name: findHeader(['colaborador', 'nome', 'name']),
      email: findHeader(['email', 'e-mail']),
      sector: findHeader(['setor', 'depart', 'area']),
      role: findHeader(['cargo', 'funcao', 'função', 'role'])
    };
  };

  const resetFileInput = (event?: React.ChangeEvent<HTMLInputElement>) => {
    if (event?.target) event.target.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Helpers duplicados para o modo Manual de Funcionários ---
  // (Mantido para compatibilidade com a importação 'employees' antiga que usa o modal)
  const processEmployeeRows = async () => {
    if (!currentCompany || currentCompany.id === 'all') {
      setStatus({ type: 'error', msg: 'Selecione uma empresa.' });
      return;
    }
    setLoading(true);
    try {
      const collectionRef = collection(db, 'employees');
      const cacheSectors = new Map<string, string>();
      const cacheRoles = new Map<string, string>();
      let importedCount = 0;
      let skippedCount = 0;

      for (const row of pendingRows) {
        const name = row[columnMapping.name];
        if (!name) { skippedCount++; continue; }
        
        // Verifica duplicidade simples (pelo nome) para evitar criar repetido
        const q = query(collectionRef, where("name", "==", name), where("companyId", "==", currentCompany.id));
        const snap = await getDocs(q);
        if(!snap.empty) { skippedCount++; continue; }

        const sectorName = row[columnMapping.sector];
        const roleName = row[columnMapping.role];
        
        const sectorId = await ensureSector(sectorName, currentCompany.id, cacheSectors);
        const roleId = await ensureRole(roleName, 'Colaborador', currentCompany.id, cacheRoles);

        await addDoc(collectionRef, {
            name,
            email: row[columnMapping.email] || '',
            sector: sectorName,
            role: roleName,
            sectorId,
            roleId,
            companyId: currentCompany.id,
            status: 'Ativo',
            importedAt: new Date().toISOString()
        });
        importedCount++;
      }
      setStatus({ type: 'success', msg: `${importedCount} funcionários importados.` });
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
      setIsMappingOpen(false);
      setPendingRows([]);
      resetFileInput();
    }
  };

  const getTemplateByTarget = () => {
    const defaultCsv = "Nome,Cargo\nExemplo,Teste";
    const gomesCsv = "ID_Avaliacao,Nome_Colaborador,Cargo,Setor,Nivel,Mes_Referencia,Nome_Metrica,Nota\n1,João,Op,Ops,Colaborador,/ago./25,Assiduidade,8";
    
    switch (target) {
      case 'evaluations_gomes': return { csv: gomesCsv, filename: 'modelo_gomes.csv' };
      default: return { csv: defaultCsv, filename: 'modelo.csv' };
    }
  };

  const downloadTemplate = () => {
    const template = getTemplateByTarget();
    if (!template) return;
    const blob = new Blob([template.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', template.filename);
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
            Importar CSV: {config[target].label}.
          </p>
          <button onClick={downloadTemplate} className="mt-2 text-xs text-blue-700 dark:text-blue-300 font-semibold underline">
            Baixar modelo
          </button>
        </div>
        
        <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded shadow transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {loading ? 'Processando...' : 'Selecionar Arquivo'}
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} ref={fileInputRef} disabled={loading} />
        </label>
      </div>

      {status.type && (
        <div className={`mt-3 p-2 rounded text-xs font-medium flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {status.msg}
        </div>
      )}

      {/* Modal mantido para importação manual de employees */}
      {target === 'employees' && (
        <Modal isOpen={isMappingOpen} onClose={() => setIsMappingOpen(false)} title="Confirmar Colunas">
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select value={columnMapping.name} onChange={e => setColumnMapping({...columnMapping, name: e.target.value})} className="border p-2 rounded">
                    <option value="">Nome (Coluna)</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={columnMapping.sector} onChange={e => setColumnMapping({...columnMapping, sector: e.target.value})} className="border p-2 rounded">
                    <option value="">Setor (Coluna)</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={columnMapping.role} onChange={e => setColumnMapping({...columnMapping, role: e.target.value})} className="border p-2 rounded">
                    <option value="">Cargo (Coluna)</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <button onClick={processEmployeeRows} className="w-full bg-blue-600 text-white p-2 rounded">Importar</button>
           </div>
        </Modal>
      )}
    </div>
  );
};