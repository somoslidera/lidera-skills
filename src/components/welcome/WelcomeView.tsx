import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, History, LayoutDashboard, Users, BookOpen, HelpCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { fetchCollection } from '../../services/firebase';
import { WhatsAppFloat } from '../ui/WhatsAppFloat';

export const WelcomeView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [employees, setEmployees] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Extrair primeiro nome do usuário
  const firstName = useMemo(() => {
    if (!user?.displayName) return 'Usuário';
    return user.displayName.split(' ')[0];
  }, [user]);

  // Carregar dados da empresa
  useEffect(() => {
    const loadData = async () => {
      if (!currentCompany || currentCompany.id === 'all') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [employeesData, sectorsData, rolesData] = await Promise.all([
          fetchCollection('employees', currentCompany.id),
          fetchCollection('sectors', currentCompany.id),
          fetchCollection('roles', currentCompany.id)
        ]);

        setEmployees(employeesData || []);
        setSectors(sectorsData || []);
        setRoles(rolesData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentCompany]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalSectors = new Set(employees.map((e: any) => e.sector).filter(Boolean)).size || sectors.length;
    const totalRoles = new Set(employees.map((e: any) => e.role).filter(Boolean)).size || roles.length;
    
    const byStatus = employees.reduce((acc: any, emp: any) => {
      const status = emp.status || 'Ativo';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEmployees,
      totalSectors,
      totalRoles,
      active: byStatus['Ativo'] || 0,
      onVacation: byStatus['Férias'] || 0,
      onLeave: byStatus['Afastado'] || 0,
      inactive: byStatus['Inativo'] || 0
    };
  }, [employees, sectors, roles]);

  const actionCards = [
    {
      icon: FileCheck,
      title: 'Avaliar colaborador',
      description: 'Criar nova avaliação de desempenho',
      onClick: () => navigate('/evaluations?tab=new'),
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: History,
      title: 'Histórico de avaliações',
      description: 'Visualizar avaliações anteriores',
      onClick: () => navigate('/evaluations?tab=list'),
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: LayoutDashboard,
      title: 'Painel de relatórios',
      description: 'Acessar dashboards e análises',
      onClick: () => navigate('/dashboard/overview'),
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Users,
      title: 'Gerenciar colaboradores',
      description: 'Cadastrar e editar funcionários',
      onClick: () => navigate('/settings/employees'),
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#081534] to-[#0a1a3a] flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081534] to-[#0a1a3a] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Olá, {firstName}. Que bom te ver por aqui!
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-8">
            Por onde você quer começar?
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {actionCards.map((card, index) => (
            <button
              key={index}
              onClick={card.onClick}
              className={`bg-gradient-to-br ${card.gradient} p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-left`}
            >
              <card.icon size={32} className="mb-4" />
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-sm opacity-90">{card.description}</p>
            </button>
          ))}
        </div>

        {/* Company Overview */}
        {currentCompany && currentCompany.id !== 'all' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-4">Quadro Geral da Empresa</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.totalEmployees}</div>
                <div className="text-sm opacity-80">Funcionários</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.totalSectors}</div>
                <div className="text-sm opacity-80">Setores</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.totalRoles}</div>
                <div className="text-sm opacity-80">Cargos</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-green-300">{stats.active}</div>
                <div className="text-sm opacity-80">Ativos</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-yellow-300">{stats.onVacation}</div>
                <div className="text-sm opacity-80">Férias</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-orange-300">{stats.onLeave}</div>
                <div className="text-sm opacity-80">Afastados</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-red-300">{stats.inactive}</div>
                <div className="text-sm opacity-80">Inativos</div>
              </div>
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold mb-4">O que é o Lidera Skills?</h2>
          <p className="text-lg leading-relaxed mb-6 opacity-90">
            O Lidera Skills é uma plataforma completa de gestão de performance e avaliações de colaboradores. 
            Com ele, você pode acompanhar o desempenho da sua equipe, identificar pontos de melhoria, 
            reconhecer talentos e tomar decisões estratégicas baseadas em dados reais.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/documentation')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <BookOpen size={20} />
              <span>Documentação</span>
            </button>
            <button
              onClick={() => navigate('/help')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <HelpCircle size={20} />
              <span>Ajuda</span>
            </button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-gold-500 to-gold-600 rounded-xl p-8 text-center text-gray-900">
          <h2 className="text-2xl font-bold mb-4">Precisa de ajuda?</h2>
          <p className="mb-6 text-lg">
            Nossa equipe está pronta para ajudar você a aproveitar ao máximo o Lidera Skills.
          </p>
          <a
            href="https://wa.me/5551998730488"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-colors shadow-lg"
          >
            <MessageCircle size={24} />
            <span>Falar no WhatsApp</span>
          </a>
        </div>
      </div>

      {/* WhatsApp Float */}
      <WhatsAppFloat />
    </div>
  );
};
