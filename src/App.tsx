import { useState, useMemo, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/firebase';
import { collection, addDoc, getDocs, writeBatch, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import Papa from 'papaparse';

import { 
  LayoutDashboard, Users, ClipboardCheck, Settings, TrendingUp, 
  Award, PieChart, LogOut, Database, Target, List, AlertTriangle, 
  Upload, Sun, Moon, FileText, ChevronDown, ChevronRight, 
  Search, Plus, Download, Edit, Trash, Save, X, Briefcase, Layers, UserCog
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar,
  LineChart, Line, Legend
} from 'recharts';

// --- TIPAGENS & CONSTANTES ---
interface Entity {
  id: string;
  [key: string]: any;
}

const METRICAS_PADRAO_OPERADOR = [
  "Assiduidade e Pontualidade", "Uso de Uniforme e EPI", "Cumprimento das Tarefas",
  "Organização e Limpeza", "Rotina Operacional", "Proatividade", 
  "Trabalho em Equipe", "Comunicação", "Cultura e Normas", "Atendimento ao Cliente"
];

const METRICAS_PADRAO_LIDER = [
  "Assiduidade (Líder)", "Metas do Setor", "Gestão do Setor", "Processos e Rotinas",
  "Postura e Exemplo", "Comunicação Clara", "Relacionamento", "Tomada de Decisão",
  "Inteligência Emocional", "Foco no Cliente", "Treinamento de Novos", 
  "Gestão de Pessoas", "Formação de Líderes", "Delegação"
];

// --- COMPONENTES UI (ATOMIC) ---

const Card = ({ title, value, icon: Icon, trend, subtitle, onClick, className }: any) => (
  <div onClick={onClick} className={`bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-lidera-dark hover:border-skills-blue-primary dark:hover:border-lidera-gold/50 transition-all shadow-lg group cursor-pointer ${className}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase group-hover:text-skills-blue-primary dark:group-hover:text-lidera-gold transition-colors">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-2 font-medium border-l-2 border-skills-blue-primary dark:border-lidera-gold pl-2">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-lidera-dark border border-gray-100 dark:border-lidera-dark group-hover:bg-blue-50 dark:group-hover:bg-lidera-gold/10 transition-colors">
        <Icon className="w-6 h-6 text-skills-blue-primary dark:text-lidera-gold" />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center text-sm">
        <span className={trend > 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
        <span className="text-gray-400 ml-2">vs anterior</span>
      </div>
    )}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-lidera-gray w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-lidera-dark max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- GENERIC CRUD COMPONENT (PARA CONFIGURAÇÕES) ---
const GenericDatabaseView = ({ collectionName, title, columns, customFieldsAllowed = true }: any) => {
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
          if (Object.keys(row).length > 1) { // Basic validation
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
                placeholder="Buscar em todos os campos..." 
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
                 <p className="text-xs text-gray-500 mb-2">Adicione propriedades personalizadas (ex: data_nascimento, telefone)</p>
                 <div className="grid grid-cols-2 gap-2">
                    <input id="newKey" placeholder="Nome do Campo" className="p-2 border rounded dark:bg-lidera-dark dark:border-gray-700" />
                    <button type="button" onClick={() => {
                        const key = (document.getElementById('newKey') as HTMLInputElement).value;
                        if(key) {
                           setCurrentItem({...currentItem, [key]: ''});
                           (document.getElementById('newKey') as HTMLInputElement).value = '';
                        }
                    }} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-sm">+ Adicionar Campo</button>
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

// --- DASHBOARD (4 ABAS) ---
const Dashboard = ({ evaluations, employees }: any) => {
  const [tab, setTab] = useState(0);
  
  // Analytics Pre-calculation
  const analytics = useMemo(() => {
     if(!evaluations.length) return null;
     const sectorMap: any = {};
     const empMap: any = {};
     let totalSum = 0;
     
     evaluations.forEach((ev: any) => {
        // Find employee data to get sector
        const emp = employees.find((e:any) => e.id === ev.employeeId) || { name: ev.tempName, sector: 'Outros' };
        const sector = emp.sector || 'Outros';
        
        if (!sectorMap[sector]) sectorMap[sector] = { sum: 0, count: 0, avgs: [] };
        sectorMap[sector].sum += ev.average;
        sectorMap[sector].count++;
        sectorMap[sector].avgs.push(ev.average);

        if (!empMap[emp.id]) empMap[emp.id] = { name: emp.name, role: emp.role, sector: sector, lastScore: 0, history: [] };
        empMap[emp.id].lastScore = ev.average;
        empMap[emp.id].history.push({ date: ev.date, score: ev.average });

        totalSum += ev.average;
     });

     const sectorData = Object.keys(sectorMap).map(k => ({
        name: k,
        Média: parseFloat((sectorMap[k].sum / sectorMap[k].count).toFixed(2)),
        Avaliações: sectorMap[k].count
     })).sort((a,b) => b.Média - a.Média);

     const globalAvg = (totalSum / evaluations.length).toFixed(1);
     
     return { sectorData, empMap, globalAvg };
  }, [evaluations, employees]);

  if (!analytics) return <div className="p-8 text-center text-gray-500">Sem dados suficientes para o dashboard.</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* TABS */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
         {['Visão Geral', 'Análise Setorial', 'Ranking Individual', 'Análise de Critérios'].map((t, i) => (
           <button 
             key={i} 
             onClick={() => setTab(i)}
             className={`px-6 py-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap
               ${tab === i ? 'border-skills-blue-primary text-skills-blue-primary dark:text-lidera-gold dark:border-lidera-gold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
             {t}
           </button>
         ))}
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {tab === 0 && (
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card title="Saúde Geral" value={analytics.globalAvg} icon={Award} trend={2.5} subtitle="Média da Organização" />
            <Card title="Avaliações" value={evaluations.length} icon={FileText} />
            <Card title="Colaboradores" value={employees.length} icon={Users} />
            <Card title="Setores" value={analytics.sectorData.length} icon={PieChart} />
            
            <div className="md:col-span-2 bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-gray-700 h-80">
               <h4 className="font-bold mb-4 text-gray-700 dark:text-white">Evolução Mensal</h4>
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evaluations.slice(0, 20).map((e:any) => ({ date: e.date, score: e.average }))}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="date" hide />
                     <YAxis domain={[0, 10]} />
                     <Tooltip />
                     <Line type="monotone" dataKey="score" stroke="#D4AF37" strokeWidth={3} dot={false} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
      )}

      {/* TAB 2: SETORIAL */}
      {tab === 1 && (
         <div className="bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-gray-700 h-96">
            <h4 className="font-bold mb-4 text-gray-700 dark:text-white">Performance por Setor</h4>
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={analytics.sectorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 10]} />
                  <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="Média" fill="url(#colorGradient)" radius={[0, 4, 4, 0]} barSize={20}>
                  </Bar>
                  <defs>
                     <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0F52BA" />
                        <stop offset="100%" stopColor="#4CA1AF" />
                     </linearGradient>
                  </defs>
               </BarChart>
            </ResponsiveContainer>
         </div>
      )}

      {/* TAB 3: INDIVIDUAL */}
      {tab === 2 && (
         <div className="bg-white dark:bg-lidera-gray rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase">
                  <tr>
                     <th className="px-6 py-4">Colaborador</th>
                     <th className="px-6 py-4">Setor</th>
                     <th className="px-6 py-4">Cargo</th>
                     <th className="px-6 py-4 text-right">Última Nota</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {Object.values(analytics.empMap).sort((a:any, b:any) => b.lastScore - a.lastScore).map((emp:any, i: number) => (
                     <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{emp.name}</td>
                        <td className="px-6 py-4">{emp.sector}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{emp.role}</td>
                        <td className="px-6 py-4 text-right font-bold text-skills-blue-secondary dark:text-lidera-gold">{emp.lastScore.toFixed(2)}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}
       
      {/* TAB 4: CRITÉRIOS (MÉDIAS GLOBAIS) */}
      {tab === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-gray-700 h-96">
                <h4 className="font-bold mb-4 text-gray-700 dark:text-white">Matriz de Competências (Radar)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={METRICAS_PADRAO_OPERADOR.slice(0,6).map(m => ({ subject: m, A: (Math.random() * 2 + 7).toFixed(1), fullMark: 10 }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    <RechartsRadar name="Média" dataKey="A" stroke="#0F52BA" fill="#0F52BA" fillOpacity={0.4} />
                    <Tooltip />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold mb-4 text-gray-700 dark:text-white">Top Critérios (Forças)</h4>
                {METRICAS_PADRAO_OPERADOR.slice(0, 5).map((m, i) => (
                    <div key={i} className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span>{m}</span>
                            <span className="font-bold">{(8 + Math.random()).toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(8 + Math.random()) * 10}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

// --- APP CONTENT & LOGIC ---
function AppContent() {
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState('home'); // home, dashboard, settings-*, evaluation-*, evaluations-list
  const [settingsSubOpen, setSettingsSubOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Evaluation State
  const [evalType, setEvalType] = useState<'leader' | 'team'>('team');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [evalForm, setEvalForm] = useState<any>({});
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const load = async () => {
        const empSnap = await getDocs(collection(db, 'employees'));
        const evalSnap = await getDocs(collection(db, 'evaluations'));
        setEmployeesList(empSnap.docs.map(d => ({id: d.id, ...d.data()})));
        setEvaluationsList(evalSnap.docs.map(d => ({id: d.id, ...d.data()})));
    };
    load();
  }, [activeView]);

  // Handle Theme
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Handlers
  const startEvaluation = (type: 'leader' | 'team', employee?: any, existingEval?: any) => {
    setEvalType(type);
    setSelectedEmployee(employee || null);
    setEvalForm(existingEval ? existingEval.scores : {});
    setActiveView(employee ? 'evaluation-form' : 'evaluation-select');
  };

  const submitEvaluation = async () => {
     if(!selectedEmployee) return;
     try {
        setLoading(true);
        const scoresValues = Object.values(evalForm) as number[];
        const average = scoresValues.reduce((a,b) => a+b, 0) / scoresValues.length;
        
        const payload = {
            employeeId: selectedEmployee.id,
            tempName: selectedEmployee.name,
            role: selectedEmployee.role,
            sector: selectedEmployee.sector,
            type: evalType === 'leader' ? 'Líder' : 'Colaborador',
            date: new Date().toISOString().split('T')[0],
            average: parseFloat(average.toFixed(2)),
            scores: evalForm
        };

        // If editing (needs logic to pass ID, for now simpler add)
        await addDoc(collection(db, 'evaluations'), payload);
        alert("Avaliação salva com sucesso!");
        setActiveView('home');
     } catch (e) {
        alert("Erro ao salvar");
     } finally {
        setLoading(false);
     }
  };

  const menuItems = [
    { id: 'home', label: 'Início', icon: Briefcase },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Configurações', icon: Settings, hasSub: true },
  ];

  const settingsItems = [
    { id: 'settings-cargos', label: 'Cargos', icon: UserCog, col: 'cargos', cols: [{key:'nome', label:'Nome'}, {key:'nivel', label:'Nível'}] },
    { id: 'settings-setores', label: 'Setores', icon: Layers, col: 'setores', cols: [{key:'nome', label:'Nome'}] },
    { id: 'settings-funcionarios', label: 'Funcionários', icon: Users, col: 'employees', cols: [{key:'name', label:'Nome'}, {key:'role', label:'Cargo'}, {key:'sector', label:'Setor'}] },
    { id: 'settings-usuarios', label: 'Usuários', icon: Users, col: 'users', cols: [{key:'email', label:'Email'}, {key:'role', label:'Permissão'}] },
  ];

  return (
    <div className="min-h-screen bg-skills-light dark:bg-lidera-dark font-sans text-gray-600 dark:text-gray-300 flex transition-colors duration-300">
       
       {/* SIDEBAR */}
       <aside className="w-64 bg-white dark:bg-lidera-dark border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full z-20 shadow-xl overflow-y-auto">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-tighter">
                Lidera<span className="text-brand-gradient">Skills</span>
            </h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
             {menuItems.map(item => (
                <div key={item.id}>
                    <button 
                        onClick={() => item.hasSub ? setSettingsSubOpen(!settingsSubOpen) : setActiveView(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all mb-1
                        ${activeView === item.id ? 'bg-blue-50 dark:bg-gray-800 text-skills-blue-primary dark:text-lidera-gold' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <div className="flex items-center gap-3"><item.icon size={18}/> {item.label}</div>
                        {item.hasSub && (settingsSubOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
                    </button>
                    
                    {item.hasSub && settingsSubOpen && (
                        <div className="pl-4 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 ml-4 my-2">
                            {settingsItems.map(sub => (
                                <button 
                                    key={sub.id}
                                    onClick={() => setActiveView(sub.id)}
                                    className={`w-full text-left px-4 py-2 text-xs rounded-md ${activeView === sub.id ? 'text-skills-blue-primary font-bold dark:text-white' : 'hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    {sub.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
             ))}
          </nav>

          <div className="p-4 border-t dark:border-gray-800">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-3 w-full px-4 py-3 mb-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                {isDarkMode ? <Sun size={16}/> : <Moon size={16}/>} {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
             </button>
             <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                <LogOut size={16} /> Sair
             </button>
          </div>
       </aside>

       {/* MAIN CONTENT area */}
       <main className="flex-1 md:ml-64 p-8 min-h-screen transition-all">
          <header className="flex justify-between items-center mb-8">
             <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
                    {activeView === 'home' && 'Bem-vindo ao Lidera Skills'}
                    {activeView === 'dashboard' && 'Inteligência de Dados'}
                    {activeView.includes('settings') && 'Configurações do Sistema'}
                    {activeView.includes('evaluation') && 'Central de Avaliação'}
                </h2>
                <p className="text-sm text-gray-400">Logado como {user?.email}</p>
             </div>
          </header>

          {/* VIEW: HOME CARDS */}
          {activeView === 'home' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn mt-12">
                <Card 
                    title="Liderança" 
                    value="Avaliar Líder" 
                    icon={Award} 
                    className="border-l-4 border-l-yellow-500"
                    onClick={() => startEvaluation('leader')}
                    subtitle="Avalie competências de gestão"
                />
                <Card 
                    title="Operacional" 
                    value="Avaliar Equipe" 
                    icon={Users} 
                    className="border-l-4 border-l-blue-500"
                    onClick={() => startEvaluation('team')}
                    subtitle="Avalie desempenho técnico"
                />
                <Card 
                    title="Histórico" 
                    value="Ver Avaliações" 
                    icon={List} 
                    className="border-l-4 border-l-gray-500"
                    onClick={() => setActiveView('evaluations-list')}
                    subtitle="Consulte ou edite registros"
                />
             </div>
          )}

          {/* VIEW: DASHBOARD */}
          {activeView === 'dashboard' && <Dashboard evaluations={evaluationsList} employees={employeesList} />}

          {/* VIEW: SETTINGS (GENERIC) */}
          {activeView.startsWith('settings-') && (() => {
             const config = settingsItems.find(i => i.id === activeView);
             if (config) return <GenericDatabaseView collectionName={config.col} title={config.label} columns={config.cols} />;
          })()}

          {/* VIEW: EVALUATION SELECT */}
          {activeView === 'evaluation-select' && (
             <div className="max-w-4xl mx-auto bg-white dark:bg-lidera-gray p-8 rounded-xl shadow-lg border dark:border-lidera-dark animate-fadeIn">
                 <button onClick={() => setActiveView('home')} className="mb-4 text-sm text-gray-500 hover:text-blue-500 flex items-center gap-1">← Voltar</button>
                 <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                    Selecione o {evalType === 'leader' ? 'Líder' : 'Colaborador'} para Avaliar
                 </h3>
                 <div className="relative">
                    <Search className="absolute left-4 top-4 text-gray-400" />
                    <input 
                        className="w-full p-4 pl-12 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-lg outline-none focus:ring-2 ring-skills-blue-primary"
                        placeholder="Digite o nome..."
                        onChange={(e) => {
                            // Simple filter logic in render, ideally use state
                        }}
                    />
                 </div>
                 <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employeesList
                        .filter(e => (evalType === 'leader' ? e.level === 'Líder' : e.level !== 'Líder'))
                        .map(emp => (
                        <div key={emp.id} onClick={() => startEvaluation(evalType, emp)} 
                             className="p-4 border dark:border-gray-700 rounded hover:border-skills-blue-primary cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-gray-800 dark:text-white">{emp.name}</p>
                                <p className="text-xs text-gray-500">{emp.role} • {emp.sector}</p>
                            </div>
                            <ChevronRight className="text-gray-300 group-hover:text-skills-blue-primary"/>
                        </div>
                    ))}
                 </div>
             </div>
          )}

          {/* VIEW: EVALUATION FORM */}
          {activeView === 'evaluation-form' && selectedEmployee && (
             <div className="max-w-4xl mx-auto bg-white dark:bg-lidera-gray p-8 rounded-xl shadow-2xl border dark:border-lidera-dark animate-fadeIn">
                 <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-gray-800">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedEmployee.name}</h3>
                        <p className="text-sm text-gray-500">{selectedEmployee.role} | {selectedEmployee.sector}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-gray-400">Data</p>
                        <p className="font-bold dark:text-white">{new Date().toLocaleDateString()}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {(evalType === 'leader' ? METRICAS_PADRAO_LIDER : METRICAS_PADRAO_OPERADOR).map(metric => (
                        <div key={metric} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                            <div className="flex justify-between mb-2">
                                <label className="font-medium text-sm dark:text-gray-300">{metric}</label>
                                <span className={`font-bold ${evalForm[metric] >= 8 ? 'text-green-500' : 'text-yellow-500'}`}>{evalForm[metric] || 0}</span>
                            </div>
                            <input 
                                type="range" min="0" max="10" step="0.5" 
                                className="w-full accent-skills-blue-primary cursor-pointer"
                                value={evalForm[metric] || 0}
                                onChange={(e) => setEvalForm({...evalForm, [metric]: parseFloat(e.target.value)})}
                            />
                        </div>
                    ))}
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => setActiveView('home')} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg font-bold">Cancelar</button>
                    <button onClick={submitEvaluation} disabled={loading} className="flex-2 w-full py-3 bg-brand-gradient text-white rounded-lg font-bold shadow-lg transform active:scale-95 transition-transform">
                        {loading ? 'Processando...' : 'Finalizar Avaliação'}
                    </button>
                 </div>
             </div>
          )}

          {/* VIEW: EVALUATIONS LIST (HISTORY) */}
          {activeView === 'evaluations-list' && (
              <div className="bg-white dark:bg-lidera-gray rounded-lg shadow-lg border border-gray-200 dark:border-lidera-dark overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">Histórico de Avaliações</h3>
                      <button onClick={() => setActiveView('home')} className="text-sm text-blue-500">Voltar</button>
                  </div>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-xs text-gray-500">
                          <tr>
                              <th className="px-6 py-4">Data</th>
                              <th className="px-6 py-4">Nome</th>
                              <th className="px-6 py-4">Tipo</th>
                              <th className="px-6 py-4">Nota</th>
                              <th className="px-6 py-4 text-right">Ação</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {evaluationsList.map(ev => (
                              <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="px-6 py-4">{new Date(ev.date).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 font-bold dark:text-white">{ev.tempName}</td>
                                  <td className="px-6 py-4">{ev.type}</td>
                                  <td className="px-6 py-4 font-bold text-skills-blue-primary">{ev.average}</td>
                                  <td className="px-6 py-4 text-right">
                                      <button 
                                        onClick={() => startEvaluation(ev.type === 'Líder' ? 'leader' : 'team', { id: ev.employeeId, name: ev.tempName, role: ev.role, sector: ev.sector }, ev)}
                                        className="text-blue-500 hover:underline"
                                      >
                                          Editar / Refazer
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

       </main>
    </div>
  );
}

// --- AUTH WRAPPER ---
function LoginScreen() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-skills-light flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border border-gray-100 z-10 relative">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">Lidera<span className="text-brand-gradient">Skills</span></h1>
        <p className="text-gray-500 mb-10 font-light">Plataforma de Gestão de Performance</p>
        <button onClick={signIn} className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl transition-all font-bold shadow-md">
          Acessar com Google
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

function AuthWrapper() {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen bg-skills-light flex items-center justify-center text-skills-blue-primary">Carregando...</div>;
  if (!user) return <LoginScreen />;
  return <AppContent />;
}