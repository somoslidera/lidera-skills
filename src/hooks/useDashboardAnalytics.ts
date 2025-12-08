import { useMemo } from 'react';

// Tipos auxiliares
interface Evaluation {
  id: string;
  employeeId?: string;
  employeeName: string; // Nome display
  role?: string;
  sector?: string;
  type?: string; // Líder ou Colaborador
  date: string;
  average?: number; // Nota normalizada
  details?: Record<string, number>; // Critérios
}

interface FilterState {
  searchTerm: string;
  selectedSector: string;
  dateStart: string;
  dateEnd: string;
}

export const useDashboardAnalytics = (evaluations: any[], employees: any[], filters: FilterState) => {
  
  // 1. Processamento Inicial e Normalização
  const processedData = useMemo(() => {
    return evaluations.map((ev: any) => {
      // Normalização de nota (lida com ',' ou number)
      let score = typeof ev.average === 'number' ? ev.average : parseFloat((ev.notaFinal || '0').replace(',', '.'));
      if (isNaN(score)) score = 0;

      // Normalização de detalhes
      const details: Record<string, number> = {};
      if (ev.details) {
         Object.entries(ev.details).forEach(([k, v]: [string, any]) => {
            details[k] = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.') || '0');
         });
      } else if (ev.detalhes) { // Fallback para dados legados
         Object.entries(ev.detalhes).forEach(([k, v]: [string, any]) => {
            details[k] = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.') || '0');
         });
      }

      return {
        ...ev,
        realName: ev.employeeName || ev.displayName || 'Desconhecido',
        realSector: ev.sector || 'Geral',
        realRole: ev.role || 'Não definido',
        score,
        details,
        dateObj: new Date(ev.date)
      };
    });
  }, [evaluations]);

  // 2. Aplicação de Filtros
  const filteredData = useMemo(() => {
    return processedData.filter((item) => {
      const searchMatch = !filters.searchTerm || 
        item.realName.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const sectorMatch = !filters.selectedSector || item.realSector === filters.selectedSector;
      
      let dateMatch = true;
      if (filters.dateStart) dateMatch = dateMatch && item.date >= filters.dateStart;
      if (filters.dateEnd) dateMatch = dateMatch && item.date <= filters.dateEnd;

      return searchMatch && sectorMatch && dateMatch;
    });
  }, [processedData, filters]);

  // 3. Métricas Gerais (Aba 1)
  const generalMetrics = useMemo(() => {
    const total = filteredData.length;
    const avg = total > 0 ? filteredData.reduce((acc, curr) => acc + curr.score, 0) / total : 0;
    
    // Contagens
    const sectorsSet = new Set(filteredData.map(d => d.realSector));
    const rolesSet = new Set(filteredData.map(d => d.realRole));
    const employeesSet = new Set(filteredData.map(d => d.realName));

    // Dados para Gráficos de Rosca
    const sectorDistribution = Array.from(sectorsSet).map(sec => ({
        name: sec,
        value: filteredData.filter(d => d.realSector === sec).length
    }));

    const roleDistribution = Array.from(rolesSet).map(role => ({
        name: role,
        value: filteredData.filter(d => d.realRole === role).length
    }));

    // Funcionário do Mês (Maior nota no período)
    const topEmployee = [...filteredData].sort((a, b) => b.score - a.score)[0];

    return {
        healthScore: avg,
        totalEvaluations: total,
        activeSectorsCount: sectorsSet.size,
        activeRolesCount: rolesSet.size,
        activeEmployeesCount: employeesSet.size,
        sectorDistribution,
        roleDistribution,
        topEmployee
    };
  }, [filteredData]);

  // 4. Análise de Competências e Evolução (Aba 2)
  const competenceMetrics = useMemo(() => {
    // Matriz de Competências (Heatmap Data)
    const compMatrix: Record<string, Record<string, { sum: number, count: number }>> = {};
    const allCriteria = new Set<string>();

    // Evolução Temporal
    const timelineMap: Record<string, { leaderSum: number, leaderCount: number, colabSum: number, colabCount: number }> = {};

    filteredData.forEach(ev => {
        // Matriz
        if (ev.details) {
            Object.entries(ev.details).forEach(([criteria, value]: [string, any]) => {
                const numericValue = Number(value) || 0; // Conversão segura
                
                allCriteria.add(criteria);
                if (!compMatrix[criteria]) compMatrix[criteria] = {};
                if (!compMatrix[criteria][ev.realSector]) compMatrix[criteria][ev.realSector] = { sum: 0, count: 0 };
                
                compMatrix[criteria][ev.realSector].sum += numericValue;
                compMatrix[criteria][ev.realSector].count += 1;
            });
        }

        // Evolução
        const monthKey = ev.date ? ev.date.substring(0, 7) : 'N/A'; // YYYY-MM
        if (monthKey !== 'N/A') {
            if (!timelineMap[monthKey]) timelineMap[monthKey] = { leaderSum: 0, leaderCount: 0, colabSum: 0, colabCount: 0 };
            
            const isLeader = ev.type === 'Líder' || (ev.role && (ev.role.toLowerCase().includes('líder') || ev.role.toLowerCase().includes('lider')));
            
            if (isLeader) {
                timelineMap[monthKey].leaderSum += ev.score;
                timelineMap[monthKey].leaderCount++;
            } else {
                timelineMap[monthKey].colabSum += ev.score;
                timelineMap[monthKey].colabCount++;
            }
        }
    });

    // Formatar Matriz para Tabela
    const matrixData = Array.from(allCriteria).map(criteria => {
        const row: any = { criteria };
        let totalSum = 0;
        let totalCount = 0;
        
        Object.keys(compMatrix[criteria] || {}).forEach(sector => {
            const { sum, count } = compMatrix[criteria][sector];
            row[sector] = sum / count;
            totalSum += sum;
            totalCount += count;
        });
        row['average'] = totalCount > 0 ? totalSum / totalCount : 0;
        return row;
    });

    // Formatar Evolução
    const evolutionData = Object.entries(timelineMap).sort().map(([date, vals]) => ({
        date,
        Líderes: vals.leaderCount ? vals.leaderSum / vals.leaderCount : 0,
        Colaboradores: vals.colabCount ? vals.colabSum / vals.colabCount : 0,
        Geral: (vals.leaderCount + vals.colabCount) > 0 ? (vals.leaderSum + vals.colabSum) / (vals.leaderCount + vals.colabCount) : 0,
        Meta: 9.0 // Meta fixa exemplo
    }));

    return { matrixData, evolutionData, allSectors: Array.from(generalMetrics.sectorDistribution.map(s => s.name)) };
  }, [filteredData, generalMetrics]);

  // 5. Comparativo (Aba 3)
  const comparativeMetrics = useMemo(() => {
     // Médias por Setor (Pré-calculo)
     const sectorAverages: Record<string, number> = {};
     generalMetrics.sectorDistribution.forEach(sec => {
        const sectorEvs = filteredData.filter(e => e.realSector === sec.name);
        const sum = sectorEvs.reduce((a, b) => a + b.score, 0);
        sectorAverages[sec.name] = sectorEvs.length ? sum / sectorEvs.length : 0;
     });

     const companyAvg = generalMetrics.healthScore;

     const individualData = filteredData.map(ev => ({
        name: ev.realName,
        metric: 'Nota Geral', // Pode expandir para critérios específicos se desejar
        individualScore: ev.score,
        sectorAvg: sectorAverages[ev.realSector] || 0,
        companyAvg: companyAvg,
        sector: ev.realSector
     }));

     return { individualData };
  }, [filteredData, generalMetrics]);

  return {
    filteredData,
    generalMetrics,
    competenceMetrics,
    comparativeMetrics
  };
};