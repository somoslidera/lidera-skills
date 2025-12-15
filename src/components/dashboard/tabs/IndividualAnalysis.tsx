import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

export const IndividualAnalysis = ({ data }: { data: any }) => {
  const { individualData } = data;
  const [localSearch, setLocalSearch] = useState('');

  // Filtro local para a tabela (além dos filtros globais do dashboard)
  const displayData = individualData.filter((d: any) => 
     d.name.toLowerCase().includes(localSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
           <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Análise Comparativa</h3>
              <p className="text-sm text-gray-500">Comparação: Colaborador vs Setor vs Empresa</p>
           </div>
           <input 
              type="text" 
              placeholder="Filtrar nesta tabela..." 
              className="p-2 border rounded dark:bg-[#121212] dark:border-gray-700 outline-none text-sm"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
           />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500 uppercase text-xs">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Setor</th>
                <th className="p-4 text-center bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200">Nota Individual</th>
                <th className="p-4 text-center">Média Setor</th>
                <th className="p-4 text-center">Média Empresa</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
               {displayData.map((item: any, idx: number) => {
                  const diffSector = item.individualScore - item.sectorAvg;
                  return (
                     <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 font-medium text-gray-800 dark:text-white">{item.name}</td>
                        <td className="p-4 text-gray-500">{item.sector}</td>
                        <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-900/5 font-bold text-blue-600">
                           {item.individualScore.toFixed(1)}
                        </td>
                        <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                           {item.sectorAvg.toFixed(1)}
                        </td>
                        <td className="p-4 text-center text-gray-400">
                           {item.companyAvg.toFixed(1)}
                        </td>
                        <td className="p-4 text-center">
                           <span className={`text-xs font-bold px-2 py-1 rounded ${
                              diffSector > 0 ? 'bg-green-100 text-green-700' : 
                              diffSector > -1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                           }`}>
                              {diffSector > 0 ? 'Acima da Média' : 'Abaixo da Média'}
                           </span>
                        </td>
                     </tr>
                  );
               })}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t dark:border-gray-800 mt-4">
           <p className="text-xs text-gray-400 text-center">
              Mostrando {displayData.length} registros baseados nos filtros ativos.
           </p>
        </div>
      </div>

    </div>
  );
};