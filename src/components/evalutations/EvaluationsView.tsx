import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, FileText, Search, Download, Filter, Save, 
  Calendar, TrendingUp, CheckCircle, AlertCircle
} from 'lucide-react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCompany } from '../../contexts/CompanyContext';
import Papa from 'papaparse';

// --- Subcomponente: Formulário de Avaliação ---
const EvaluationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { currentCompany } = useCompany();
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  
  // Estado do Formulário
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [formType, setFormType] = useState<'Líder' | 'Colaborador' | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (!currentCompany) return;
    const loadAux = async () => {
      // Carrega Funcionários
      const empSnap = await getDocs(query(collection(db, 'employees'), where("companyId", "==", currentCompany.id)));
      setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Carrega Cargos (para saber o nível)
      const roleSnap = await getDocs(query(collection(db, 'roles'), where("companyId", "==", currentCompany.id)));
      setRoles(roleSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Carrega Critérios
      const critSnap = await getDocs(query(collection(db, 'evaluation_criteria'), where("companyId", "==", currentCompany.id)));
      setCriteriaList(critSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadAux();
  }, [currentCompany]);

  // Ao selecionar funcionário
  useEffect(() => {
    if (!selectedEmployeeId) {
      setCurrentEmployee(null);
      setFormType(null);
      return;
    }
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (emp) {
      setCurrentEmployee(emp);
      // Descobrir nível do cargo
      const roleData = roles.find(r => r.name === emp.role);
      const level = roleData?.level === 'Líder' ? 'Líder' : 'Colaborador';
      setFormType(level);
      setScores({}); // Limpa notas
    }
  }, [selectedEmployeeId, employees, roles]);

  // Filtrar critérios pelo tipo
  const activeCriteria = useMemo(() => {
    if (!formType) return [];
    return criteriaList.filter(c => c.type === formType);
  }, [formType, criteriaList]);

  // Calcular média em tempo real
  const currentAverage = useMemo(() => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }, [scores]);

  const handleSubmit = async () => {
    if (!currentEmployee || !evalDate) return;
    
    setLoading(true);
    try {
      const payload = {
        companyId: currentCompany?.id,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        role: currentEmployee.role,
        sector: currentEmployee.sector,
        type: formType,
        date: evalDate,
        average: currentAverage,
        details: scores, // Salva nota de cada critério
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'evaluations'), payload);
      alert("Avaliação salva com sucesso!");
      onSuccess(); // Limpa/Muda aba
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar avaliação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
        <FileText className="text-blue-600" /> Nova Avaliação de Desempenho
      </h3>

      {/* Seleção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colaborador</label>
          <select 
            className="w-full p-2 border rounded dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Referência</label>
          <input 
            type="date" 
            className="w-full p-2 border rounded dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300"
            value={evalDate}
            onChange={(e) => setEvalDate(e.target.value)}
          />
        </div>
      </div>

      {currentEmployee && (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg mb-6 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div><span className="font-bold">Cargo:</span> {currentEmployee.role}</div>
          <div><span className="font-bold">Setor:</span> {currentEmployee.sector}</div>
          <div><span className="font-bold">Tipo de Avaliação:</span> <span className="bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded text-blue-900 dark:text-blue-100">{formType}</span></div>
        </div>
      )}

      {/* Critérios Dinâmicos */}
      {formType && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {activeCriteria.length > 0 ? (
              activeCriteria.map(crit => (
                <div key={crit.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="mb-2 md:mb-0 md:w-2/3">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{crit.name}</p>
                    {crit.description && <p className="text-xs text-gray-500">{crit.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" min="0" max="10" step="0.1"
                      className="w-32"
                      value={scores[crit.name] || 0}
                      onChange={(e) => setScores({...scores, [crit.name]: parseFloat(e.target.value)})}
                    />
                    <input 
                      type="number" min="0" max="10"
                      className="w-16 p-1 text-center border rounded dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      value={scores[crit.name] || 0}
                      onChange={(e) => setScores({...scores, [crit.name]: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                Nenhum critério encontrado para o tipo "{formType}". Vá em Configurações &gt; Critérios e cadastre.
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-6">
            <div className="text-lg text-gray-800 dark:text-gray-200">
              Média Final: <span className={`font-bold text-2xl ${currentAverage >= 8 ? 'text-green-600' : currentAverage >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>{currentAverage.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || activeCriteria.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4 md:mt-0 w-full md:w-auto justify-center"
            >
              {loading ? 'Salvando...' : <><Save size={20} /> Salvar Avaliação</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Subcomponente: Tabela Histórica (Core Table) ---
const EvaluationsTable = () => {
  const { currentCompany } = useCompany();
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterSector, setFilterSector] = useState('');
  
  useEffect(() => {
    if (!currentCompany) return;
    const load = async () => {
      const snap = await getDocs(query(collection(db, 'evaluations'), where("companyId", "==", currentCompany.id)));
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Ordenar por data desc
      raw.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setData(raw);
      setFilteredData(raw);
    };
    load();
  }, [currentCompany]);

  // Filtros
  useEffect(() => {
    let res = data;
    if (filterName) res = res.filter(d => d.employeeName.toLowerCase().includes(filterName.toLowerCase()));
    if (filterSector) res = res.filter(d => d.sector === filterSector);
    setFilteredData(res);
  }, [filterName, filterSector, data]);

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredData.map(d => ({
      Nome: d.employeeName,
      Cargo: d.role,
      Setor: d.sector,
      Tipo: d.type,
      Data: d.date,
      Nota_Final: typeof d.average === 'number' ? d.average.toFixed(2) : d.average,
      ...d.details // Expande as colunas de critérios
    })));
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `avaliacoes_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const sectors = Array.from(new Set(data.map(d => d.sector))).sort();

  return (
    <div className="space-y-4">
      {/* Filtros Toolbar */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500" size={18} />
            <input 
              placeholder="Buscar por nome..."
              className="w-full pl-10 p-2 border rounded-lg dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 ring-blue-500/20"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
            />
          </div>
          <div className="relative w-48 hidden md:block">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select 
              className="w-full pl-10 p-2 border rounded-lg dark:bg-[#121212] dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none appearance-none"
              value={filterSector}
              onChange={e => setFilterSector(e.target.value)}
            >
              <option value="">Todos Setores</option>
              {sectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium px-4 py-2 hover:bg-green-50 rounded transition-colors">
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500 uppercase font-medium">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Setor</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 text-right">Nota Média</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredData.map((ev) => (
                <tr key={ev.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="p-4 text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-2"><Calendar size={14}/> {new Date(ev.date).toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td className="p-4 font-bold text-gray-800 dark:text-white">{ev.employeeName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{ev.role}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{ev.sector}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded border ${ev.type === 'Líder' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'}`}>
                      {ev.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-bold px-2 py-1 rounded ${
                      ev.average >= 8 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                      ev.average >= 6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {typeof ev.average === 'number' ? ev.average.toFixed(2) : ev.average}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal da View ---
export const EvaluationsView = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('list');

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header com Abas */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão de Avaliações</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Central de lançamento e histórico de desempenho.</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'list' 
              ? 'bg-white dark:bg-[#121212] text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Histórico Completo
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'new' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Plus size={16} /> Nova Avaliação
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mt-6">
        {activeTab === 'new' ? (
          <EvaluationForm onSuccess={() => setActiveTab('list')} />
        ) : (
          <EvaluationsTable />
        )}
      </div>
    </div>
  );
};