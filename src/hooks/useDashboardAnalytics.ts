import { useMemo } from 'react';

// Tipos auxiliares
interface Evaluation {
  id: string;
  employeeId?: string;
  employeeName: string; 
  role?: string;
  sector?: string;
  type?: string; 
  date: string;
  average?: number; 
  details?: Record<string, number>;
}

interface FilterState {
  searchTerm: string;
  selectedSector: string;
  dateStart: string;
  dateEnd: string;
}

// Função auxiliar para formatar Mês/Ano (ex: jan/24)
const formatMonthYear = (dateStr: string) => {
  if (!dateStr || dateStr.length < 7) return 'N/A';
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
};

// Função para agrupar dados do gráfico de rosca (Top 5 + Outros)
const aggregateDonutData = (data: { name: string; value: number }[]) => {
  if (data.length <= 5) return data.sort((a, b) => b.value - a.value);
  
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top5 = sorted.slice(0, 5);
  const othersValue = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
  
  if (othersValue > 0) {
    top5.push({ name: 'Outros', value: othersValue });
  }
  return top5;
};

export const useDashboardAnalytics = (evaluations: any[], employees: any[], filters: FilterState) => {
  
  // 1. Processamento Inicial e Normalização
  const processedData = useMemo(() => {
    // Mapa para busca rápida de nome por ID
    const empMapById = new Map(employees.map(e => [e.id, e.name]));
    // Mapa secundário por nome (caso o ID falhe)
    const empMapByName = new Map(employees.map(e => [e.name?.toLowerCase().trim(), e.name]));

    return evaluations.map((ev: any) => {
      // Normalização de nota
      let score = typeof ev.average === 'number' ? ev.average : parseFloat((ev.notaFinal || '0').replace(',', '.'));
      if (isNaN(score)) score = 0;

      // Normalização de detalhes
      const details: Record<string, number> = {};
      if (ev.details) {
         Object.entries(ev.details).forEach(([k, v]: [string, any]) => {
            details[k] = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.') || '0');
         });
      } else if (ev.detalhes) {
         Object.entries(ev.detalhes).forEach(([k, v]: [string, any]) => {
            details[k] = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.') || '0');
         });
      }

      // Resolução Inteligente de Nome
      let resolvedName = ev.employeeName || ev.displayName;
      if (ev.employeeId && empMapById.has(ev.employeeId)) {
        resolvedName = empMapById.get(ev.employeeId);
      } else if (resolvedName && empMapByName.has(resolvedName.toLowerCase().trim())) {
        resolvedName = empMapByName.get(resolvedName.toLowerCase().trim());
      }

      return {
        ...ev,
        realName: resolvedName || 'Colaborador Desconhecido',
        realSector: ev.sector || 'Geral',
        realRole: ev.role || 'Não definido',
        realType: ev.type || 'Operacional', // Nível: Estratégico, Tático, Operacional
        score,
        details,
        dateRaw: ev.date || '', // Mantém data original YYYY-MM-DD para filtro
        monthYear: formatMonthYear(ev.date), // Data formatada para agrupamento
        funcionarioMes: ev.funcionarioMes || ev.funcionario_mes || 'Não' // Destaque do mês
      };
    });
  }, [evaluations, employees]);

  // 2. Aplicação de Filtros
  const filteredData = useMemo(() => {
    return processedData.filter((item) => {
      const searchMatch = !filters.searchTerm || 
        item.realName.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const sectorMatch = !filters.selectedSector || item.realSector === filters.selectedSector;
      
      let dateMatch = true;
      if (filters.dateStart) dateMatch = dateMatch && item.dateRaw >= filters.dateStart;
      if (filters.dateEnd) dateMatch = dateMatch && item.dateRaw <= filters.dateEnd;

      return searchMatch && sectorMatch && dateMatch;
    });
  }, [processedData, filters]);

  // 3. Métricas Gerais (Aba 1)
  const generalMetrics = useMemo(() => {
    const total = filteredData.length;
    const avg = total > 0 ? filteredData.reduce((acc, curr) => acc + curr.score, 0) / total : 0;
    
    // Contagens únicas
    const sectorsSet = new Set(filteredData.map(d => d.realSector));
    const rolesSet = new Set(filteredData.map(d => d.realRole));
    const employeesSet = new Set(filteredData.map(d => d.realName));

    // Distribuição bruta para gráficos
    const rawSectorDist = Array.from(sectorsSet).map(sec => ({
        name: sec,
        value: filteredData.filter(d => d.realSector === sec).length
    }));

    const rawRoleDist = Array.from(rolesSet).map(role => ({
        name: role,
        value: filteredData.filter(d => d.realRole === role).length
    }));

    // Agrupamento Top 5 + Outros
    const sectorDistribution = aggregateDonutData(rawSectorDist);
    const roleDistribution = aggregateDonutData(rawRoleDist);

    // Funcionário do Mês (Top 1) e Lista de Performance
    const sortedByScore = [...filteredData].sort((a, b) => b.score - a.score);
    const topEmployee = sortedByScore[0];
    const performanceList = sortedByScore.slice(0, 10).map(item => ({
      ...item,
      funcionarioMes: item.funcionarioMes || 'Não' // Garante que sempre tenha o campo
    })); // Top 10 para a tabela

    return {
        healthScore: avg,
        totalEvaluations: total,
        activeSectorsCount: sectorsSet.size,
        activeRolesCount: rolesSet.size,
        activeEmployeesCount: employeesSet.size,
        sectorDistribution,
        roleDistribution,
        topEmployee,
        performanceList
    };
  }, [filteredData]);

  // 4. Análise de Competências e Evolução (Aba 2)
  const competenceMetrics = useMemo(() => {
    const compMatrix: Record<string, Record<string, { sum: number, count: number }>> = {};
    const allCriteria = new Set<string>();
    const criteriaTypeMap: Record<string, string> = {}; // Mapa de critério -> tipo (nível)
    
    // Mapa para evolução mensal por nível (Estratégico, Tático, Operacional)
    // Chave: YYYY-MM para ordenação
    const timelineMap: Record<string, { 
      label: string, 
      estrategicoSum: number, estrategicoCount: number,
      taticoSum: number, taticoCount: number,
      operacionalSum: number, operacionalCount: number
    }> = {};
    
    // Mapa para evolução por setor
    const sectorTimelineMap: Record<string, Record<string, { sum: number, count: number }>> = {};

    filteredData.forEach(ev => {
        // Matriz
        if (ev.details) {
            Object.entries(ev.details).forEach(([criteria, value]: [string, any]) => {
                const numericValue = Number(value) || 0;
                allCriteria.add(criteria);
                
                // Armazena o tipo (nível) do critério baseado no tipo da avaliação
                if (!criteriaTypeMap[criteria]) {
                    criteriaTypeMap[criteria] = ev.realType || ev.type || 'Operacional';
                }
                
                if (!compMatrix[criteria]) compMatrix[criteria] = {};
                if (!compMatrix[criteria][ev.realSector]) compMatrix[criteria][ev.realSector] = { sum: 0, count: 0 };
                
                compMatrix[criteria][ev.realSector].sum += numericValue;
                compMatrix[criteria][ev.realSector].count += 1;
            });
        }

        // Evolução Mensal por Nível
        const dateKey = ev.dateRaw ? ev.dateRaw.substring(0, 7) : null; // YYYY-MM
        if (dateKey) {
            if (!timelineMap[dateKey]) {
                timelineMap[dateKey] = { 
                    label: formatMonthYear(ev.dateRaw), // Rótulo visual (jan/24)
                    estrategicoSum: 0, estrategicoCount: 0,
                    taticoSum: 0, taticoCount: 0,
                    operacionalSum: 0, operacionalCount: 0
                };
            }
            
            const nivel = ev.realType || ev.type || 'Operacional';
            
            if (nivel === 'Estratégico') {
                timelineMap[dateKey].estrategicoSum += ev.score;
                timelineMap[dateKey].estrategicoCount++;
            } else if (nivel === 'Tático') {
                timelineMap[dateKey].taticoSum += ev.score;
                timelineMap[dateKey].taticoCount++;
            } else {
                timelineMap[dateKey].operacionalSum += ev.score;
                timelineMap[dateKey].operacionalCount++;
            }
            
            // Evolução por Setor
            if (!sectorTimelineMap[dateKey]) {
                sectorTimelineMap[dateKey] = {};
            }
            if (!sectorTimelineMap[dateKey][ev.realSector]) {
                sectorTimelineMap[dateKey][ev.realSector] = { sum: 0, count: 0 };
            }
            sectorTimelineMap[dateKey][ev.realSector].sum += ev.score;
            sectorTimelineMap[dateKey][ev.realSector].count += 1;
        }
    });

    // Formatar Matriz para Tabela
    const matrixData = Array.from(allCriteria).map(criteria => {
        const row: any = { 
            criteria,
            type: criteriaTypeMap[criteria] || 'Operacional' // Adiciona o nível do critério
        };
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

    // Formatar Evolução por Nível (Ordenado por YYYY-MM mas exibindo MMM/YY)
    const evolutionData = Object.entries(timelineMap).sort().map(([_, vals]) => {
      const totalSum = vals.estrategicoSum + vals.taticoSum + vals.operacionalSum;
      const totalCount = vals.estrategicoCount + vals.taticoCount + vals.operacionalCount;
      
      return {
        date: vals.label, // Usa o rótulo formatado (jan/24)
        Estratégico: vals.estrategicoCount ? Number((vals.estrategicoSum / vals.estrategicoCount).toFixed(1)) : 0,
        Tático: vals.taticoCount ? Number((vals.taticoSum / vals.taticoCount).toFixed(1)) : 0,
        Operacional: vals.operacionalCount ? Number((vals.operacionalSum / vals.operacionalCount).toFixed(1)) : 0,
        'Média Geral': totalCount > 0 ? Number((totalSum / totalCount).toFixed(1)) : 0,
        Meta: 9.0
      };
    });
    
    // Formatar Evolução por Setor
    const allSectorsList = Array.from(new Set(filteredData.map(d => d.realSector)));
    const sectorEvolutionData = Object.entries(sectorTimelineMap).sort().map(([dateKey, sectorData]) => {
      const dateLabel = formatMonthYear(dateKey + '-01');
      const result: any = { date: dateLabel };
      
      allSectorsList.forEach(sector => {
        if (sectorData[sector]) {
          result[sector] = Number((sectorData[sector].sum / sectorData[sector].count).toFixed(1));
        } else {
          result[sector] = 0;
        }
      });
      
      return result;
    });

    return { 
      matrixData, 
      evolutionData, 
      sectorEvolutionData,
      allSectors: Array.from(generalMetrics.sectorDistribution.map(s => s.name)) 
    };
  }, [filteredData, generalMetrics]);

  // 5. Comparativo (Aba 3)
  const comparativeMetrics = useMemo(() => {
     const sectorAverages: Record<string, number> = {};
     // Usamos filteredData para calcular médias do setor baseadas no filtro atual
     const sectors = new Set(filteredData.map(d => d.realSector));
     
     sectors.forEach(sec => {
        const sectorEvs = filteredData.filter(e => e.realSector === sec);
        const sum = sectorEvs.reduce((a, b) => a + b.score, 0);
        sectorAverages[sec] = sectorEvs.length ? sum / sectorEvs.length : 0;
     });

     const companyAvg = generalMetrics.healthScore;

     const individualData = filteredData.map(ev => ({
        name: ev.realName,
        metric: 'Nota Geral',
        individualScore: Number(ev.score.toFixed(2)),
        sectorAvg: Number((sectorAverages[ev.realSector] || 0).toFixed(2)),
        companyAvg: Number(companyAvg.toFixed(2)),
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