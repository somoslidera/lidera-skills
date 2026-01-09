import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
// Card component não aceita children, usando divs estilizadas
import { CustomTooltip } from '../../ui/CustomTooltip';
import { Brain, Users, Briefcase, Layers, BarChart3, Database } from 'lucide-react';
import { db } from '../../../services/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { useCompany } from '../../../contexts/CompanyContext';
import { toast } from '../../../utils/toast';

interface DISCProfile {
  D: number; // Dominância
  I: number; // Influência
  S: number; // Estabilidade
  C: number; // Conformidade
}

interface EmployeeProfile {
  id: string;
  name: string;
  sector: string;
  role: string;
  level: string;
  disc: DISCProfile;
  primaryType: 'D' | 'I' | 'S' | 'C';
}

type ViewType = 'geral' | 'setor' | 'cargo' | 'nivel';

// Dados fictícios para 5 funcionários de exemplo
const SAMPLE_EMPLOYEES: EmployeeProfile[] = [
  {
    id: 'sample-1',
    name: 'Ana Silva',
    sector: 'Vendas',
    role: 'Gerente de Vendas',
    level: 'Estratégico',
    disc: { D: 85, I: 70, S: 45, C: 60 },
    primaryType: 'D'
  },
  {
    id: 'sample-2',
    name: 'Carlos Mendes',
    sector: 'Marketing',
    role: 'Analista de Marketing',
    level: 'Tático',
    disc: { D: 60, I: 90, S: 70, C: 50 },
    primaryType: 'I'
  },
  {
    id: 'sample-3',
    name: 'Maria Santos',
    sector: 'RH',
    role: 'Coordenadora de RH',
    level: 'Líder',
    disc: { D: 50, I: 55, S: 85, C: 70 },
    primaryType: 'S'
  },
  {
    id: 'sample-4',
    name: 'João Oliveira',
    sector: 'TI',
    role: 'Desenvolvedor Sênior',
    level: 'Operacional',
    disc: { D: 40, I: 45, S: 60, C: 90 },
    primaryType: 'C'
  },
  {
    id: 'sample-5',
    name: 'Patricia Costa',
    sector: 'Vendas',
    role: 'Vendedora',
    level: 'Colaborador',
    disc: { D: 70, I: 80, S: 50, C: 55 },
    primaryType: 'I'
  }
];

const DISC_COLORS = {
  D: '#EF4444', // Vermelho - Dominância
  I: '#F59E0B', // Amarelo/Laranja - Influência
  S: '#10B981', // Verde - Estabilidade
  C: '#3B82F6'  // Azul - Conformidade
};

export const BehavioralProfile = () => {
  const { currentCompany } = useCompany();
  const [viewType, setViewType] = useState<ViewType>('geral');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar ou criar dados de exemplo
  useEffect(() => {
    const loadData = async () => {
      if (!currentCompany) return;
      
      try {
        setLoading(true);
        
        // Buscar funcionários existentes
        let employeesSnap;
        if (currentCompany.id === 'all') {
          // Se for "all", buscar todos os funcionários
          employeesSnap = await getDocs(collection(db, 'employees'));
        } else {
          // Buscar por companyId
          const employeesQuery = query(
            collection(db, 'employees'),
            where('companyId', '==', currentCompany.id)
          );
          employeesSnap = await getDocs(employeesQuery);
        }
        
        const existingEmployees: EmployeeProfile[] = [];
        employeesSnap.forEach((doc) => {
          const data = doc.data();
          if (data.discProfile) {
            // Converter perfil DISC do formato string (ex: "D" ou "DI") para objeto numérico
            const discProfile = parseDiscProfile(data.discProfile);
            existingEmployees.push({
              id: doc.id,
              name: data.name || 'Desconhecido',
              sector: data.sector || 'Não definido',
              role: data.role || 'Não definido',
              level: data.jobLevel || 'Operacional',
              disc: discProfile,
              primaryType: getPrimaryType(discProfile)
            });
          }
        });

        // Se não houver funcionários com DISC, criar os 5 de exemplo
        if (existingEmployees.length === 0) {
          // Verificar se a empresa é Lidera ou se não há funcionários
          const isLidera = currentCompany.name?.toLowerCase().includes('lidera') || 
                          currentCompany.id === 'all' ||
                          !currentCompany.id;
          
          if (isLidera) {
            // Verificar se os funcionários de exemplo já existem
            const sampleNames = SAMPLE_EMPLOYEES.map(e => e.name);
            const sampleExists = existingEmployees.some(e => sampleNames.includes(e.name));
            
            if (!sampleExists) {
              // Criar funcionários de exemplo no Firestore
              const createdEmployees: EmployeeProfile[] = [];
              for (const sample of SAMPLE_EMPLOYEES) {
                try {
                  const companyId = currentCompany.id === 'all' ? null : currentCompany.id;
                  const docRef = await addDoc(collection(db, 'employees'), {
                    name: sample.name,
                    ...(companyId && { companyId }),
                    sector: sample.sector,
                    role: sample.role,
                    jobLevel: sample.level,
                    discProfile: sample.primaryType,
                    status: 'Ativo',
                    discScores: sample.disc, // Armazenar scores numéricos
                    createdAt: new Date().toISOString()
                  });
                  createdEmployees.push({
                    ...sample,
                    id: docRef.id
                  });
                } catch (error) {
                  console.error(`Erro ao criar funcionário ${sample.name}:`, error);
                }
              }
              
              if (createdEmployees.length > 0) {
                setEmployees(createdEmployees);
                toast.success(`${createdEmployees.length} funcionários de exemplo criados com sucesso!`);
              } else {
                // Se não conseguiu criar, usar os exemplos em memória
                setEmployees(SAMPLE_EMPLOYEES);
              }
            } else {
              setEmployees(existingEmployees);
            }
          } else {
            // Se não é Lidera, usar dados fictícios apenas em memória
            setEmployees(SAMPLE_EMPLOYEES);
          }
        } else {
          setEmployees(existingEmployees);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Em caso de erro, usar dados fictícios
        setEmployees(SAMPLE_EMPLOYEES);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentCompany]);

  // Função para converter perfil DISC string em objeto numérico
  const parseDiscProfile = (profile: string): DISCProfile => {
    // Se já for um objeto, retornar
    if (typeof profile === 'object' && profile !== null) {
      return profile as DISCProfile;
    }
    
    // Se for string, tentar encontrar funcionário de exemplo correspondente
    const sample = SAMPLE_EMPLOYEES.find(e => e.primaryType === profile);
    if (sample) return sample.disc;
    
    // Valores padrão baseados no tipo primário
    const defaults: Record<string, DISCProfile> = {
      'D': { D: 85, I: 50, S: 40, C: 50 },
      'I': { D: 50, I: 85, S: 50, C: 40 },
      'S': { D: 40, I: 50, S: 85, C: 50 },
      'C': { D: 40, I: 40, S: 50, C: 85 }
    };
    
    return defaults[profile] || { D: 50, I: 50, S: 50, C: 50 };
  };

  // Função para determinar tipo primário
  const getPrimaryType = (disc: DISCProfile): 'D' | 'I' | 'S' | 'C' => {
    const max = Math.max(disc.D, disc.I, disc.S, disc.C);
    if (disc.D === max) return 'D';
    if (disc.I === max) return 'I';
    if (disc.S === max) return 'S';
    return 'C';
  };

  // Filtrar dados baseado no tipo de visualização
  const filteredData = useMemo(() => {
    let filtered = employees;
    
    if (selectedFilter) {
      switch (viewType) {
        case 'setor':
          filtered = employees.filter(e => e.sector === selectedFilter);
          break;
        case 'cargo':
          filtered = employees.filter(e => e.role === selectedFilter);
          break;
        case 'nivel':
          filtered = employees.filter(e => e.level === selectedFilter);
          break;
      }
    }
    
    return filtered;
  }, [employees, viewType, selectedFilter]);

  // Calcular médias DISC por categoria
  const discAverages = useMemo(() => {
    if (filteredData.length === 0) {
      return { D: 0, I: 0, S: 0, C: 0 };
    }
    
    const totals = filteredData.reduce((acc, emp) => ({
      D: acc.D + emp.disc.D,
      I: acc.I + emp.disc.I,
      S: acc.S + emp.disc.S,
      C: acc.C + emp.disc.C
    }), { D: 0, I: 0, S: 0, C: 0 });
    
    return {
      D: totals.D / filteredData.length,
      I: totals.I / filteredData.length,
      S: totals.S / filteredData.length,
      C: totals.C / filteredData.length
    };
  }, [filteredData]);

  // Dados para gráfico de pizza (distribuição de tipos primários)
  const primaryTypeDistribution = useMemo(() => {
    const counts = { D: 0, I: 0, S: 0, C: 0 };
    filteredData.forEach(emp => {
      counts[emp.primaryType]++;
    });
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        name: type,
        value: count,
        label: `${type} (${count})`
      }));
  }, [filteredData]);

  // Dados para gráfico de barras (médias DISC)
  const discBarData = [
    { name: 'Dominância (D)', value: discAverages.D, color: DISC_COLORS.D },
    { name: 'Influência (I)', value: discAverages.I, color: DISC_COLORS.I },
    { name: 'Estabilidade (S)', value: discAverages.S, color: DISC_COLORS.S },
    { name: 'Conformidade (C)', value: discAverages.C, color: DISC_COLORS.C }
  ];

  // Dados para radar chart (perfil médio)
  const radarData = [
    { dimension: 'Dominância', value: discAverages.D },
    { dimension: 'Influência', value: discAverages.I },
    { dimension: 'Estabilidade', value: discAverages.S },
    { dimension: 'Conformidade', value: discAverages.C }
  ];

  // Listas únicas para filtros
  const uniqueSectors = Array.from(new Set(employees.map(e => e.sector))).sort();
  const uniqueRoles = Array.from(new Set(employees.map(e => e.role))).sort();
  const uniqueLevels = Array.from(new Set(employees.map(e => e.level))).sort();

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] text-center">
        <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Brain className="text-purple-500" size={28} />
              Perfil Comportamental (DISC)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Análise de perfis comportamentais por setor, cargo e nível
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Tipo de Visualização */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => { setViewType('geral'); setSelectedFilter(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewType === 'geral'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <BarChart3 size={16} className="inline mr-1" />
                Geral
              </button>
              <button
                onClick={() => { setViewType('setor'); setSelectedFilter(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewType === 'setor'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Users size={16} className="inline mr-1" />
                Setor
              </button>
              <button
                onClick={() => { setViewType('cargo'); setSelectedFilter(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewType === 'cargo'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Briefcase size={16} className="inline mr-1" />
                Cargo
              </button>
              <button
                onClick={() => { setViewType('nivel'); setSelectedFilter(''); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewType === 'nivel'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Layers size={16} className="inline mr-1" />
                Nível
              </button>
            </div>

            {/* Filtro Específico */}
            {viewType !== 'geral' && (
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 ring-blue-500/20 outline-none"
              >
                <option value="">Todos {viewType === 'setor' ? 'Setores' : viewType === 'cargo' ? 'Cargos' : 'Níveis'}</option>
                {(viewType === 'setor' ? uniqueSectors :
                  viewType === 'cargo' ? uniqueRoles :
                  uniqueLevels).map((item: string) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] text-center">
          <p className="text-gray-500 dark:text-gray-400">Nenhum dado encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <>
          {/* Gráfico de Distribuição de Tipos Primários */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Distribuição de Tipos Primários
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={primaryTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {primaryTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DISC_COLORS[entry.name as keyof typeof DISC_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Barras - Médias DISC */}
            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Médias DISC
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={discBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8884d8">
                    {discBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico Radar - Perfil Médio (apenas se houver dados válidos) */}
          {discAverages.D > 0 || discAverages.I > 0 || discAverages.S > 0 || discAverages.C > 0 ? (
            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Perfil DISC Médio do Grupo
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[radarData]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Perfil Médio"
                    dataKey="value"
                    stroke={DISC_COLORS.D}
                    fill={DISC_COLORS.D}
                    fillOpacity={0.6}
                  />
                  <Tooltip 
                    content={(props: any) => {
                      if (!props?.active || !props?.payload) return null;
                      const data = props.payload[0]?.payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="font-semibold text-gray-900 dark:text-white">{data?.dimension}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Valor: <span className="font-bold">{data?.value?.toFixed(1)}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Mostra a média dos perfis DISC de todos os funcionários filtrados
              </p>
            </div>
          ) : null}

          {/* Tabela de Funcionários */}
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#121212] overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Detalhamento por Funcionário
            </h3>
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Setor</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Cargo</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nível</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tipo Primário</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">D</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">I</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">S</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.sector}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.role}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.level}</td>
                    <td className="px-4 py-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: DISC_COLORS[emp.primaryType] }}
                      >
                        {emp.primaryType}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium" style={{ color: DISC_COLORS.D }}>
                      {emp.disc.D}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium" style={{ color: DISC_COLORS.I }}>
                      {emp.disc.I}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium" style={{ color: DISC_COLORS.S }}>
                      {emp.disc.S}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium" style={{ color: DISC_COLORS.C }}>
                      {emp.disc.C}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
