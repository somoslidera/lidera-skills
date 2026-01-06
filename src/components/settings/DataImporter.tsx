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
import { Upload, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { Modal } from '../ui/Modal';
import { toast } from '../../utils/toast';
import { ErrorHandler } from '../../utils/errorHandler';

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

  // --- Estados para Mapeamento de Colunas (De/Para) ---
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [pendingRows, setPendingRows] = useState<any[]>([]);
  const [pendingFileName, setPendingFileName] = useState('');
  
  // Estado unificado de mapeamento
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    email: '',
    sector: '',
    role: '',
    // Novos campos para histórico
    level: '',
    date: '',
    metric: '',
    score: ''
  });

  // --- Helpers de Parsing ---
  const parseScore = (val: string | number | undefined): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') {
      // Garante que está entre 0 e 10
      return Math.max(0, Math.min(10, val));
    }
    
    // Remove espaços e converte string
    const cleanVal = String(val).trim().replace(/\s+/g, '');
    if (!cleanVal) return 0;
    
    // Trata casos como "8,5" ou "8.5" ou "8" ou "8,50"
    const parsed = parseFloat(cleanVal.replace(',', '.'));
    if (isNaN(parsed)) {
      console.warn(`Valor de nota inválido: ${val}, usando 0`);
      return 0;
    }
    
    // Garante que está entre 0 e 10
    return Math.max(0, Math.min(10, parsed));
  };

  const parseGomesDate = (rawDate: string): string => {
    if (!rawDate) return new Date().toISOString().split('T')[0];
    
    // Se já está no formato YYYY-MM-DD, retorna direto
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
      return rawDate.trim();
    }
    
    // Se está no formato DD/MM/YYYY ou DD-MM-YYYY
    const dateMatch = rawDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const fullYear = year.length === 2 ? '20' + year : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const cleanDate = rawDate.replace(/\//g, '').trim().toLowerCase();
    
    const months: { [key: string]: string } = {
      'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
      'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
      'jan.': '01', 'fev.': '02', 'mar.': '03', 'abr.': '04', 'mai.': '05', 'jun.': '06',
      'jul.': '07', 'ago.': '08', 'set.': '09', 'out.': '10', 'nov.': '11', 'dez.': '12'
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
    
    // Fallback: tenta parsear como data ISO
    try {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignora erro
    }
    
    // Último fallback: retorna data atual
    console.warn(`Não foi possível parsear a data: ${rawDate}, usando data atual`);
    return new Date().toISOString().split('T')[0];
  };

  // --- Helpers de Banco de Dados (Upsert) ---
  /**
   * Garante que um setor existe no banco (não duplica)
   * Comportamento:
   * - Se setor já existe (mesmo nome), retorna o ID existente (IGNORA duplicata)
   * - Se não existe, cria novo setor
   * - Se existe mas não está vinculado à empresa, adiciona empresa ao array companyIds
   */
  const ensureSector = async (name: string, companyId: string, cache: Map<string, string>) => {
    if (!name) return '';
    if (cache.has(name)) return cache.get(name)!;

    const ref = collection(db, 'sectors');
    const q = query(ref, where("name", "==", name));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Setor já existe - retorna ID existente (NÃO duplica)
      const docSnap = snap.docs[0];
      if (companyId) {
        const data = docSnap.data();
        // Se setor não está vinculado à empresa, adiciona ao array
        if (!data.companyIds?.includes(companyId)) {
          await updateDoc(doc(db, 'sectors', docSnap.id), { companyIds: arrayUnion(companyId) });
        }
      }
      cache.set(name, docSnap.id);
      return docSnap.id;
    }

    // Setor não existe - cria novo
    const newDoc = await addDoc(ref, {
      name,
      companyIds: companyId ? [companyId] : [],
      importedAt: new Date().toISOString(),
      createdFrom: 'csv-import'
    });
    cache.set(name, newDoc.id);
    return newDoc.id;
  };

  /**
   * Garante que um cargo existe no banco (não duplica)
   * Comportamento:
   * - Se cargo já existe (mesmo nome), retorna o ID existente (IGNORA duplicata)
   * - Se não existe, cria novo cargo
   * - Se existe mas não está vinculado à empresa, adiciona empresa ao array companyIds
   */
  const ensureRole = async (name: string, level: string, companyId: string, cache: Map<string, string>) => {
    if (!name) return '';
    if (cache.has(name)) return cache.get(name)!;

    const ref = collection(db, 'roles');
    const q = query(ref, where("name", "==", name));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Cargo já existe - retorna ID existente (NÃO duplica)
      const docSnap = snap.docs[0];
      if (companyId) {
        const data = docSnap.data();
        // Se cargo não está vinculado à empresa, adiciona ao array
        if (!data.companyIds?.includes(companyId)) {
          await updateDoc(doc(db, 'roles', docSnap.id), { companyIds: arrayUnion(companyId) });
        }
      }
      cache.set(name, docSnap.id);
      return docSnap.id;
    }

    // Cargo não existe - cria novo
    const newDoc = await addDoc(ref, {
      name,
      level: level || 'Operacional', // Fallback se não tiver nível
      companyIds: companyId ? [companyId] : [],
      importedAt: new Date().toISOString(),
      createdFrom: 'csv-import'
    });
    cache.set(name, newDoc.id);
    return newDoc.id;
  };

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
      type: type || 'Geral',
      section: 'Geral',
      description: 'Importado via histórico',
      importedAt: new Date().toISOString()
    });
    cache.set(key, newDoc.id);
    return newDoc.id;
  };

  const ensureEmployee = async (data: any, companyId: string, cache: Map<string, string>) => {
    if (!data.name) return '';
    if (cache.has(data.name)) return cache.get(data.name)!;

    const ref = collection(db, 'employees');
    let q;
    // Tenta buscar por ID se existir, senão por nome
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

    const newDoc = await addDoc(ref, {
      ...data,
      companyId,
      status: 'Ativo',
      importedAt: new Date().toISOString(),
      source: 'history-import'
    });
    cache.set(data.name, newDoc.id);
    return newDoc.id;
  };

  // --- Configurações Legadas (Mantidas para compatibilidade com outros CSVs) ---
  const config = {
    criteria: { label: 'Critérios', collection: 'evaluation_criteria', process: (item: any) => ({ name: item.name, type: 'Geral' }), checkDuplicity: () => query(collection(db, 'dummy')) },
    sectors: { label: 'Setores', collection: 'sectors', process: (item: any) => ({ name: item.name }), checkDuplicity: () => query(collection(db, 'dummy')) },
    roles: { label: 'Cargos', collection: 'roles', process: (item: any) => ({ name: item.name }), checkDuplicity: () => query(collection(db, 'dummy')) },
    employees: { label: 'Funcionários', collection: 'employees', process: (item: any) => ({ name: item.name }), checkDuplicity: () => query(collection(db, 'dummy')) },
    evaluations_leaders: { label: 'Histórico (Líderes)', collection: 'evaluations', process: (item: any) => ({ ...item }), checkDuplicity: () => query(collection(db, 'dummy')) },
    evaluations_collaborators: { label: 'Histórico (Colaboradores)', collection: 'evaluations', process: (item: any) => ({ ...item }), checkDuplicity: () => query(collection(db, 'dummy')) },
    evaluations_gomes: { label: 'Histórico Detalhado (Gomes/Geral)', collection: 'evaluations', process: (item: any) => null, checkDuplicity: () => query(collection(db, 'dummy')) }
  };

  // --- Processamento de Arquivo ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações iniciais
    const isEmployeeImport = target === 'employees';
    const isHistoryImport = target === 'evaluations_gomes';
    const needsCompanyId = isEmployeeImport || isHistoryImport;

    if (needsCompanyId && (!currentCompany || currentCompany.id === 'all')) {
      toast.warning("Selecione uma empresa específica no topo da página antes de importar.");
      resetFileInput(event);
      return;
    }

    setLoading(true);
    setStatus({ type: null, msg: 'Lendo arquivo...' });

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

        // Se for importação complexa (Funcionários ou Histórico), abre o Modal de Mapeamento
        if (isEmployeeImport || isHistoryImport) {
          const guessedMapping = buildDefaultMapping(headers, target);
          setColumnMapping(guessedMapping);
          setCsvHeaders(headers);
          setPendingRows(rows);
          setPendingFileName(file.name);
          setIsMappingOpen(true); // <--- Abre o modal aqui
          setLoading(false);
        } else {
          // Importações simples (Critérios, Setores isolados) seguem fluxo antigo (não implementado full aqui para economizar espaço, focado no problema)
          // Se necessário, pode-se manter a lógica antiga aqui.
          setStatus({ type: 'error', msg: 'Importação direta simplificada não suportada neste modo. Use as opções avançadas.' });
          setLoading(false);
        }
      },
      error: (error: any) => {
        setLoading(false);
        setStatus({ type: 'error', msg: `Erro ao ler CSV: ${error.message}` });
        resetFileInput(event);
      }
    });
  };

  // --- Função Principal: Processa Histórico após Mapeamento ---
  const processHistoryRows = async () => {
    if (!currentCompany || currentCompany.id === 'all') return;
    setLoading(true);
    setStatus({ type: null, msg: 'Analisando dados e dependências...' });

    try {
      const collectionRef = collection(db, 'evaluations');
      const safeCompanyId = currentCompany.id;

      // Caches para evitar leituras repetidas no banco
      // Agrupa por ID_Avaliacao para consolidar múltiplas métricas em uma avaliação
      const groupedEvaluations = new Map<string, any>();
      const cacheSectors = new Map<string, string>();
      const cacheRoles = new Map<string, string>();
      const cacheCriteria = new Map<string, string>();
      const cacheEmployees = new Map<string, string>();

      let processedRows = 0;

      // 1. Iterar sobre as linhas do CSV usando o Mapeamento
      for (const row of pendingRows) {
        // Extrai dados usando as colunas mapeadas pelo usuário
        const name = row[columnMapping.name];
        const rawDate = row[columnMapping.date];
        const metricName = row[columnMapping.metric];
        const score = parseScore(row[columnMapping.score]);
        
        const sectorName = row[columnMapping.sector] || 'Geral';
        const roleName = row[columnMapping.role] || 'Não informado';
        // AQUI: Lê o nível diretamente do CSV mapeado. Se vazio, usa 'Operacional'
        const level = row[columnMapping.level] || 'Operacional'; 
        
        // ID da avaliação (ID_Avaliacao do CSV) - usado como chave única para agrupar métricas
        // Tenta múltiplas variações de nome de coluna
        const evaluationId = row['ID_Avaliacao'] || row['ID'] || row['id_avaliacao'] || row['id'] || 
                             row['Matricula'] || row['matricula'] || row['ID_Funcionario'] || row['id_funcionario'] ||
                             `${name}-${rawDate}-${processedRows}`;
        const employeeCode = evaluationId; // Usa o mesmo ID como employeeCode

        // Validação: pula linhas sem dados essenciais
        if (!name || !rawDate) {
          console.warn(`Linha ${processedRows + 1} ignorada: falta nome ou data`, { name, rawDate });
          continue;
        }
        
        // Validação: garante que há pelo menos uma métrica/nota
        if (!metricName && score === 0) {
          console.warn(`Linha ${processedRows + 1} ignorada: falta métrica e nota válida`, { name, metricName, score });
          continue;
        }

        // 2. Garantir Dependências (Upsert)
        const sectorId = await ensureSector(sectorName, safeCompanyId, cacheSectors);
        const roleId = await ensureRole(roleName, level, safeCompanyId, cacheRoles);

        if (metricName) {
          await ensureCriteria(metricName, level, cacheCriteria);
        }

        await ensureEmployee({
          name,
          employeeCode,
          sector: sectorName,
          role: roleName,
          jobLevel: level, // Salva o nível (Estratégico/Tático) no cadastro do funcionário também
          sectorId,
          roleId
        }, safeCompanyId, cacheEmployees);

        // 3. Agrupar Avaliação por ID_Avaliacao (cada ID_Avaliacao = uma avaliação única)
        const formattedDate = parseGomesDate(rawDate);
        const key = evaluationId; // Usa ID_Avaliacao como chave única
        
        // Captura funcionario_mes (Sim/Não) - pega da primeira linha do grupo
        const funcionarioMes = row['Funcionario_Mes'] || row['funcionario_mes'] || row['Funcionario_Mes'] || 'Não';

        if (!groupedEvaluations.has(key)) {
          groupedEvaluations.set(key, {
            evaluationId: evaluationId, // ID único da avaliação
            employeeName: name,
            employeeId: employeeCode,
            role: roleName,
            sector: sectorName,
            type: level, // <--- Aqui garante que usa Estratégico/Tático/Operacional
            date: formattedDate,
            details: {},
            totalScore: 0,
            metricCount: 0,
            funcionarioMes: funcionarioMes === 'Sim' || funcionarioMes === 'sim' || funcionarioMes === 'SIM' ? 'Sim' : 'Não'
          });
        }

        const evalObj = groupedEvaluations.get(key);
        if (metricName && score > 0) {
          // Normaliza o nome da métrica (remove espaços extras, capitaliza)
          const normalizedMetricName = metricName.trim();
          evalObj.details[normalizedMetricName] = score;
          evalObj.totalScore += score;
          evalObj.metricCount += 1;
        }
        processedRows++;
      }

      setStatus({ type: null, msg: `Salvando ${groupedEvaluations.size} avaliações...` });

      // 4. Salvar no Firebase - cada avaliação com ID único e média própria
      let savedCount = 0;
      let skippedCount = 0;

      for (const item of groupedEvaluations.values()) {
        // Calcula média por avaliação (soma das notas desta avaliação / quantidade de critérios)
        const average = item.metricCount > 0 
          ? parseFloat((item.totalScore / item.metricCount).toFixed(2)) 
          : 0;

        // Validação: garante que há pelo menos um detalhe/critério
        if (Object.keys(item.details).length === 0) {
          console.warn(`Avaliação ignorada: sem critérios/métricas`, item);
          skippedCount++;
          continue;
        }
        
        const finalDoc = {
          employeeName: item.employeeName.trim(),
          employeeId: item.employeeId || '',
          role: item.role || 'Não informado',
          sector: item.sector || 'Geral',
          type: item.type || 'Operacional', // Persiste o nível correto, fallback para Operacional
          date: item.date,
          average: average, // Média desta avaliação específica
          details: item.details,
          companyId: safeCompanyId,
          importedAt: new Date().toISOString(),
          source: 'history-import',
          evaluationId: item.evaluationId, // ID único da avaliação (para referência)
          funcionarioMes: item.funcionarioMes || 'Não' // Destaque do mês (Sim/Não)
        };

        // Verifica duplicidade por evaluationId (ID_Avaliacao) + empresa
        // Isso garante que cada avaliação tenha ID único, mesmo que seja do mesmo funcionário/mês
        // Fallback: se evaluationId não existir em avaliações antigas, verifica por nome + data
        let querySnapshot;
        try {
          const q = query(
            collectionRef, 
            where("evaluationId", "==", item.evaluationId), 
            where("companyId", "==", safeCompanyId)
          );
          querySnapshot = await getDocs(q);
          
          // Se não encontrou por evaluationId, tenta por nome + data (compatibilidade com dados antigos)
          if (querySnapshot.empty) {
            const qFallback = query(
              collectionRef, 
              where("employeeName", "==", item.employeeName), 
              where("date", "==", item.date), 
              where("companyId", "==", safeCompanyId)
            );
            querySnapshot = await getDocs(qFallback);
          }
        } catch (error) {
          // Se der erro (campo evaluationId não indexado), usa fallback
          const qFallback = query(
            collectionRef, 
            where("employeeName", "==", item.employeeName), 
            where("date", "==", item.date), 
            where("companyId", "==", safeCompanyId)
          );
          querySnapshot = await getDocs(qFallback);
        }

        if (querySnapshot.empty) {
          try {
            await addDoc(collectionRef, finalDoc);
            savedCount++;
          } catch (error: any) {
            console.error(`Erro ao salvar avaliação ${item.evaluationId}:`, error);
            // Se for erro de permissão, para o processamento
            if (error?.code === 'permission-denied') {
              throw new Error('Erro de permissão ao salvar avaliações. Verifique as regras do Firestore.');
            }
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      const successMsg = `✅ Processamento concluído! 
        • ${savedCount} avaliações criadas
        • ${skippedCount} avaliações já existiam (ignoradas)
        • ${processedRows} linhas processadas
        • ${groupedEvaluations.size} avaliações únicas agrupadas`;
      
      setStatus({ 
        type: 'success', 
        msg: successMsg
      });
      
      toast.success(`Importação concluída: ${savedCount} avaliações importadas com sucesso!`);

    } catch (error: any) {
      console.error('Erro na importação de avaliações:', error);
      const errorMsg = error?.message || 'Erro desconhecido na importação';
      setStatus({ type: 'error', msg: `❌ Erro fatal: ${errorMsg}` });
      toast.error(`Erro na importação: ${errorMsg}`);
      
      // Log detalhado para debug
      if (error?.code) {
        console.error('Código do erro:', error.code);
        if (error.code === 'permission-denied') {
          console.error('⚠️ Erro de permissão. Verifique:');
          console.error('   1. Se você está autenticado');
          console.error('   2. Se as regras do Firestore foram deployadas');
          console.error('   3. Se você tem permissão para criar avaliações');
        }
      }
    } finally {
      setLoading(false);
      setIsMappingOpen(false);
      resetFileInput();
    }
  };

  // --- Função Legada para Funcionários (Mantida e Ajustada) ---
  const processEmployeeRows = async () => {
    // Mesma lógica anterior, mas usando o novo estado unificado columnMapping
    if (!currentCompany || currentCompany.id === 'all') return;
    setLoading(true);
    try {
        const collectionRef = collection(db, 'employees');
        const cacheSectors = new Map();
        const cacheRoles = new Map();
        let imported = 0;
        
        for (const row of pendingRows) {
            const name = row[columnMapping.name];
            if (!name) continue;
            
            // Verifica duplicidade básica
            const q = query(collectionRef, where("name", "==", name), where("companyId", "==", currentCompany.id));
            const snap = await getDocs(q);
            if (!snap.empty) continue;

            const sector = row[columnMapping.sector];
            const role = row[columnMapping.role];
            
            const sectorId = await ensureSector(sector, currentCompany.id, cacheSectors);
            const roleId = await ensureRole(role, 'Operacional', currentCompany.id, cacheRoles);

            await addDoc(collectionRef, {
                name,
                email: row[columnMapping.email] || '',
                sector,
                role,
                sectorId,
                roleId,
                companyId: currentCompany.id,
                status: 'Ativo',
                importedAt: new Date().toISOString()
            });
            imported++;
        }
        setStatus({ type: 'success', msg: `${imported} funcionários importados.` });
    } catch (e: any) {
        setStatus({ type: 'error', msg: e.message });
    } finally {
        setLoading(false);
        setIsMappingOpen(false);
        resetFileInput();
    }
  };

  // --- Auto-Detecção de Colunas ---
  const buildDefaultMapping = (headers: string[], mode: string) => {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findHeader = (candidates: string[]) => {
      const foundIdx = lowerHeaders.findIndex(h => candidates.some(c => h.includes(c)));
      return foundIdx >= 0 ? headers[foundIdx] : '';
    };

    const mapping = {
      name: findHeader(['colaborador', 'nome', 'name', 'funcionario']),
      email: findHeader(['email', 'e-mail']),
      sector: findHeader(['setor', 'depart', 'area']),
      role: findHeader(['cargo', 'funcao', 'role']),
      level: '',
      date: '',
      metric: '',
      score: ''
    };

    if (mode === 'evaluations_gomes') {
      mapping.level = findHeader(['nivel', 'nível', 'level', 'tipo']); // Procura por Nível
      mapping.date = findHeader(['data', 'mes', 'mês', 'date', 'periodo']);
      mapping.metric = findHeader(['metrica', 'métrica', 'criterio', 'pergunta', 'competencia']);
      mapping.score = findHeader(['nota', 'pontuacao', 'score', 'valor']);
    }

    return mapping;
  };

  const resetFileInput = (event?: React.ChangeEvent<HTMLInputElement>) => {
    if (event?.target) event.target.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Renderização condicional do label do botão de confirmação
  const handleConfirm = () => {
    if (target === 'employees') {
        processEmployeeRows();
    } else {
        processHistoryRows();
    }
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

      {/* MODAL UNIFICADO DE MAPEAMENTO */}
      <Modal 
        isOpen={isMappingOpen} 
        onClose={() => { setIsMappingOpen(false); resetFileInput(); }} 
        title="Vincular Colunas do CSV"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Identificamos o arquivo <strong>{pendingFileName}</strong>. Por favor, indique qual coluna do CSV corresponde a cada campo do sistema.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campos Comuns */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nome do Colaborador *</label>
              <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={columnMapping.name} onChange={e => setColumnMapping({...columnMapping, name: e.target.value})}>
                <option value="">Selecione...</option>
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Cargo</label>
              <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={columnMapping.role} onChange={e => setColumnMapping({...columnMapping, role: e.target.value})}>
                <option value="">Selecione...</option>
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Setor</label>
              <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={columnMapping.sector} onChange={e => setColumnMapping({...columnMapping, sector: e.target.value})}>
                <option value="">Selecione...</option>
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            {/* Campos Específicos para Histórico */}
            {target === 'evaluations_gomes' && (
              <>
                <div className="md:col-span-2 border-t pt-2 mt-2">
                  <p className="text-xs font-bold text-blue-600 mb-2">Dados da Avaliação</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    Nível do Cargo <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mb-1">Deve conter: Operacional, Tático ou Estratégico</p>
                  <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 border-blue-300" value={columnMapping.level} onChange={e => setColumnMapping({...columnMapping, level: e.target.value})}>
                    <option value="">Selecione...</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Mês/Data da Avaliação *</label>
                  <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={columnMapping.date} onChange={e => setColumnMapping({...columnMapping, date: e.target.value})}>
                    <option value="">Selecione...</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome da Métrica/Critério *</label>
                  <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={columnMapping.metric} onChange={e => setColumnMapping({...columnMapping, metric: e.target.value})}>
                    <option value="">Selecione...</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nota/Pontuação *</label>
                  <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={columnMapping.score} onChange={e => setColumnMapping({...columnMapping, score: e.target.value})}>
                    <option value="">Selecione...</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Campos Específicos para Funcionários */}
            {target === 'employees' && (
               <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email (Opcional)</label>
                <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" value={columnMapping.email} onChange={e => setColumnMapping({...columnMapping, email: e.target.value})}>
                  <option value="">Selecione...</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleConfirm}
              disabled={loading || !columnMapping.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              Confirmar e Importar
            </button>
            <button 
              onClick={() => { setIsMappingOpen(false); resetFileInput(); }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};