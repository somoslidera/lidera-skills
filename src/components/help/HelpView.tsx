import React, { useState } from 'react';
import { BookOpen, Code, Github, ExternalLink, FileText, Info } from 'lucide-react';

export const HelpView = () => {
  const [activeTab, setActiveTab] = useState<'user' | 'dev'>('user');

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Central de Ajuda</h2>
          <p className="text-gray-500 dark:text-gray-400">Documentação e links úteis do Lidera Skills.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'user' 
                ? 'bg-white dark:bg-[#1E1E1E] text-blue-600 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <BookOpen size={16} /> Guia do Usuário
          </button>
          <button
            onClick={() => setActiveTab('dev')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'dev' 
                ? 'bg-white dark:bg-[#1E1E1E] text-blue-600 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Code size={16} /> Desenvolvedor
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-xl shadow-sm border border-gray-200 dark:border-[#121212]">
        
        {/* --- ABA USUÁRIO --- */}
        {activeTab === 'user' && (
          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                <Info size={20} /> Introdução
              </h3>
              <p className="mb-4">
                Bem-vindo ao <strong>Lidera Skills</strong>. Este aplicativo foi desenhado para centralizar a gestão de desempenho 
                da sua empresa. Aqui você pode acompanhar a evolução dos colaboradores, comparar setores e identificar talentos.
              </p>
            </section>

            <hr className="border-gray-100 dark:border-gray-800" />

            <section>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Como Importar Dados?</h3>
              <p className="mb-4 text-sm">
                O sistema funciona melhor quando alimentado por planilhas CSV. Vá até a aba <strong>Configurações</strong> ou <strong>Histórico</strong> e procure pelo botão "Importar".
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <FileText size={16}/> Formato Obrigatório do CSV
                </h4>
                <ul className="list-disc list-inside text-xs space-y-1 text-blue-700 dark:text-blue-400 font-mono">
                  <li><strong>Mes_Referencia:</strong> Data no formato YYYY-MM-DD (ex: 2024-03-01)</li>
                  <li><strong>Nome_Colaborador:</strong> Nome completo do avaliado</li>
                  <li><strong>Pontuacao_Lider / Pontuacao_Colaborador:</strong> Nota final (use vírgula ou ponto)</li>
                  <li><strong>Setor / Cargo:</strong> Identificação correta para filtros</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Navegação</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>Painel (Dashboard):</strong> Visão macro. Use os filtros no topo para ver dados de um setor específico ou período.</li>
                <li><strong>Avaliações:</strong> Central de lançamento. Cadastre novas avaliações manualmente para Líderes ou Colaboradores.</li>
                <li><strong>Histórico Antigo:</strong> Lista de avaliações importadas de sistemas anteriores via CSV.</li>
                <li><strong>Configurações:</strong> Onde você cadastra manualmente Funcionários, Cargos e Setores.</li>
              </ul>
            </section>
          </div>
        )}

        {/* --- ABA DESENVOLVEDOR --- */}
        {activeTab === 'dev' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a 
                href="https://github.com/somoslidera/lidera-skills" 
                target="_blank" 
                rel="noreferrer"
                className="group block p-6 bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <Github size={32} className="text-gray-700 dark:text-white group-hover:text-blue-500" />
                  <ExternalLink size={16} className="text-gray-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Repositório GitHub</h3>
                <p className="text-sm text-gray-500 mt-2">Acesse o código fonte, issues e documentação técnica completa.</p>
              </a>

              <a 
                href="https://vercel.com" 
                target="_blank" 
                rel="noreferrer"
                className="group block p-6 bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <svg className="w-8 h-8 text-gray-700 dark:text-white group-hover:text-black dark:group-hover:text-white" viewBox="0 0 1155 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M577.344 0L1154.69 1000H0L577.344 0Z" />
                  </svg>
                  <ExternalLink size={16} className="text-gray-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Deploy Vercel</h3>
                <p className="text-sm text-gray-500 mt-2">Ambiente de produção e CI/CD configurados.</p>
              </a>
            </div>

            <section className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Sobre a Versão</h3>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <p>Version: 1.1.0 (Feature Release)</p>
                <p>Build: Vite + React + TypeScript</p>
                <p>UI: TailwindCSS + Lucide Icons</p>
                <p>Database: Google Firebase (Firestore)</p>
              </div>
            </section>
          </div>
        )}

      </div>
      
      <div className="text-center mt-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Lidera Consultoria. Todos os direitos reservados.
      </div>
    </div>
  );
};