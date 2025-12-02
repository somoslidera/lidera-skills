import { useState, useMemo } from 'react';
import { 
  Award, Users, PieChart, TrendingUp, Calendar, Search, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Card } from '../ui/Card';

// Função auxiliar para formatar data (YYYY-MM-DD -> MM/YYYY)
const formatMonth = (dateStr: string) => {
  if (!dateStr) return '-';
  const [year, month] = dateStr.split('-');
  return `${month}/${year}`;
};

// Interfaces para tipagem
interface Employee {
  id: string;
  name: string;
  role?: string;
  sector?: string;
}

interface DashboardProps {
  evaluations: any[];
  employees: Employee[];
}

export const Dashboard = ({ evaluations = [], employees = [] }: DashboardProps) => {
  // --- Estados dos Filtros ---
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  // --- 1. Processamento e Tratamento de Dados ---
  const processedData = useMemo(() => {
    if (!evaluations.length) return [];

    // Cria um mapa de funcionários para acesso rápido
    const empMap = new Map(employees.map((e) => [e.name, e]));

    return evaluations.map((ev: any) => {
      // Tenta encontrar o funcionário pelo nome
      const empName = ev.employeeName?.trim();
      const registeredEmp = empMap.get(empName);

      return {
        ...ev,
        // Prioriza dados do cadastro oficial, fallback para o dado da avaliação
        realName: registeredEmp?.name || ev.employeeName,
        realSector: registeredEmp?.sector || ev.sector || 'Não Definido',
        realRole: registeredEmp?.role || ev.role || 'Não Definido',
        realId: registeredEmp?.id || ev.employeeId || 'N/A',
        // Garante que a nota seja número
        score: typeof ev.average === 'number' ? ev.average : parseFloat((ev.notaFinal || '0').replace(',', '.'))
      };
    }).filter((item: any) => !isNaN(item.score));
  }, [evaluations, employees]);

  // --- 2. Aplicação de Filtros ---
  const filteredData = useMemo(() => {
    return processedData.filter((item: any) => {
      // Filtro de Texto (Nome, ID ou Cargo)
      const searchMatch = !searchTerm || 
        (item.realName && item.realName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(item.realId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.realRole && item.realRole.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro de Setor
      const sectorMatch = !selectedSector || item.realSector === selectedSector;

      // Filtro de Data
      let dateMatch = true;
      if (dateStart) dateMatch = dateMatch && item.date >= dateStart;
      if (dateEnd) dateMatch = dateMatch && item.date <= dateEnd;

      return searchMatch && sectorMatch && dateMatch;
    });
  }, [processedData, searchTerm, selectedSector, dateStart, dateEnd]);

  // --- 3. Cálculos de Métricas (Analytics) ---
  const analytics = useMemo(() => {
    const totalCount = filteredData.length;
    if (totalCount === 0) return null;

    const totalSum = filteredData.reduce((acc: number, curr: any) => acc + curr.score, 0);
    const globalAvg = totalSum / totalCount;

    // Agrupamento por Mês (Evolução)
    const timelineMap: Record<string, { sum: number; count: number }> = {};
    filteredData.forEach((item: any) => {
      // Chave de ordenação: YYYY-MM
      const monthKey = item.date ? item.date.substring(0, 7) : 'Unknown'; 
      if (!timelineMap[monthKey]) timelineMap[monthKey] = { sum: 0, count: 0 };
      timelineMap[monthKey].sum += item.score;
      timelineMap[monthKey].count += 1;
    });

    const timelineData = Object.entries(timelineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        date: key,
        formattedDate: formatMonth(key + '-01'),
        Média: parseFloat((val.sum / val.count).toFixed(2))
      }));

    // Agrupamento por Setor
    const sectorMap: Record<string, { sum: number; count: number }> = {};
    filteredData.forEach((item: any) => {
      const sec = item.realSector;
      if (!sectorMap[sec]) sectorMap[sec] = { sum: 0, count: 0 };
      sectorMap[sec].sum += item.score;
      sectorMap[sec].count += 1;
    });

    const sectorData = Object.entries(sectorMap)
      .map(([key, val]) => ({
        name: key,
        Média: parseFloat((val.sum / val.count).toFixed(2)),
        Avaliações: val.count
      }))
      .sort((a, b) => b.Média - a.Média); // Melhores primeiro

    return { globalAvg, totalCount, timelineData, sectorData };
  }, [filteredData]);

  // Lista única de setores para o filtro (Cast explícito para string[])
  const uniqueSectors = useMemo(() => {
    const sectors = new Set(processedData.map((d: any) => d.realSector));
    return Array.from(sectors).sort() as string[];
  }, [processedData]);

  if (!evaluations.length) {
    return <div className="p-8 text-center text-gray-500">Nenhum dado disponível. Importe avaliações no Histórico.</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212] flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Busca */}
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador..." 
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 ring-blue-500/20 w-full sm:w-64 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro Setor */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select 
              className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer w-full sm:w-48 appearance-none"
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
            >
              <option value="">Todos Setores</option>
              {uniqueSectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Filtro Data */}
        <div className="flex items-center gap-2 w-full lg:w-auto bg-gray-50 dark:bg-[#121212] p-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <Calendar size={16} className="text-gray-400 ml-2" />
          <input 
            type="date" 
            className="bg-transparent text-sm outline-none text-gray-600 dark:text-gray-300"
            value={dateStart}
            onChange={e => setDateStart(e.target.value)}
          />
          <span className="text-gray-400">-</span>
          <input 
            type="date" 
            className="bg-transparent text-sm outline-none text-gray-600 dark:text-gray-300"
            value={dateEnd}
            onChange={e => setDateEnd(e.target.value)}
          />
        </div>
      </div>

      {/* --- CARTÕES DE KPI --- */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            title="Média Geral do Período" 
            value={analytics.globalAvg.toFixed(2)} 
            icon={Award} 
            trend={0} 
            subtitle="Baseado nos filtros atuais"
          />
          <Card 
            title="Total de Avaliações" 
            value={analytics.totalCount} 
            icon={Users} 
          />
          <Card 
            title="Setores Analisados" 
            value={analytics.sectorData.length} 
            icon={PieChart} 
          />
          <Card 
            title="Melhor Média Mensal" 
            value={Math.max(...analytics.timelineData.map(d => d.Média) || [0]).toFixed(2)} 
            icon={TrendingUp} 
            className="border-l-4 border-l-emerald-500"
          />
        </div>
      )}

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- GRÁFICO DE EVOLUÇÃO (LINHA) --- */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              Evolução da Nota Média
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timelineData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="formattedDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Média" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- RANKING DE SETORES (BARRAS) --- */}
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <PieChart className="text-purple-600" size={20} />
              Performance por Setor
            </h3>
            <div className="h-80 w-full overflow-y-auto pr-2 custom-scrollbar">
              {analytics.sectorData.map((sector, index) => (
                <div key={sector.name} className="mb-4 last:mb-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {index + 1}. {sector.name}
                    </span>
                    <span className={`font-bold ${sector.Média >= 8 ? 'text-green-600' : sector.Média >= 6 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {sector.Média.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        sector.Média >= 8 ? 'bg-green-500' : sector.Média >= 6 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} 
                      style={{ width: `${(sector.Média / 10) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{sector.Avaliações} avaliações</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
