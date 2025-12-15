import { GenericDatabaseView } from './GenericDatabaseView';
import { DataImporter } from './DataImporter';
import { useCompany } from '../../contexts/CompanyContext';

// Lista de perfis DISC
const DISC_OPTIONS = [
  'D', 'I', 'S', 'C',
  'D/I', 'D/S', 'D/C', 'I/D', 'I/S', 'I/C', 'S/D', 'S/I', 'S/C', 'C/D', 'C/I', 'C/S',
  'D/I/S', 'D/I/C', 'D/S/C', 'I/D/S', 'I/D/C', 'I/S/C', 'S/D/I', 'S/D/C', 'S/I/C', 'C/D/I', 'C/D/S', 'C/I/S',
  'D/I/S/C'
];

// --- 1. Critérios de Avaliação (Universais com Seleção de Empresas) ---
export const CriteriaView = () => {
  const { isMaster } = useCompany();

  const columns: any[] = [
    { key: 'name', label: 'Competência / Pergunta' },
    { 
      key: 'type', 
      label: 'Nível Alvo', 
      type: 'select', 
      options: ['Estratégico', 'Tático', 'Operacional'] 
    },
    { key: 'section', label: 'Seção / Categoria (ex: Liderança, Comportamental)' },
    { key: 'description', label: 'Descrição da Competência' }
  ];

  if (isMaster) {
    columns.push({
      key: 'companyIds',
      label: 'Disponível nas Empresas',
      type: 'multi-select-companies'
    });
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="font-bold text-blue-800 dark:text-blue-300">Configuração de Critérios</h3>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Defina as perguntas que aparecerão no formulário, agrupando por nível de cargo e por seções (ex: Técnicos, Comportamentais, Liderança).
        </p>
      </div>
      <DataImporter target="criteria" />
      <GenericDatabaseView 
        collectionName="evaluation_criteria" 
        title="Critérios de Avaliação (Universais)"
        columns={columns}
      />
    </div>
  );
};

// --- 2. Setores (Universal com Seleção de Empresas) ---
export const SectorsView = () => {
  const { isMaster } = useCompany();
  
  const columns: any[] = [
     { key: 'name', label: 'Nome do Setor' }
  ];

  if (isMaster) {
     columns.push({ 
        key: 'companyIds', 
        label: 'Disponível nas Empresas', 
        type: 'multi-select-companies' 
     });
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm text-gray-500">
        Setores são universais e compartilhados entre todas as empresas.
      </div>
      <DataImporter target="sectors" />
      <GenericDatabaseView 
        collectionName="sectors" 
        title="Gerenciar Setores (Universal)"
        columns={columns}
      />
    </div>
  );
};

// --- 3. Cargos (Universal com Seleção de Empresas) ---
export const RolesView = () => {
  const { isMaster } = useCompany();

  const columns: any[] = [
      { key: 'name', label: 'Título do Cargo' },
      { 
        key: 'level', 
        label: 'Nível Hierárquico', 
        type: 'select', 
        options: ['Estratégico', 'Tático', 'Operacional'] 
      }
  ];

  if (isMaster) {
     columns.push({ 
        key: 'companyIds', 
        label: 'Disponível nas Empresas', 
        type: 'multi-select-companies' 
     });
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Atenção aos Níveis</h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          Cargos são universais. O <strong>"Nível Hierárquico"</strong> define qual formulário de avaliação será usado.
        </p>
      </div>
      <DataImporter target="roles" />
      <GenericDatabaseView 
        collectionName="roles" 
        title="Gerenciar Cargos (Universal)"
        columns={columns}
      />
    </div>
  );
};

// --- 4. Funcionários ---
export const EmployeesView = () => (
  <div className="space-y-6 animate-fadeIn">
    <DataImporter target="employees" />
    <GenericDatabaseView 
      collectionName="employees" 
      title="Gerenciar Funcionários"
      columns={[
        { key: 'employeeCode', label: 'ID Funcionário' },
        { key: 'name', label: 'Nome Completo' },
        { key: 'email', label: 'Email Corporativo', type: 'email' },
        { key: 'contractType', label: 'Tipo de Vínculo', type: 'select', options: ['CLT', 'PJ', 'Estagiário', 'Trainee', 'Temporário'] },
        { key: 'managerName', label: 'Gestor Imediato' },
        { key: 'unit', label: 'Unidade/Filial' },
        { key: 'costCenter', label: 'Centro de Custo' },
        { key: 'phone', label: 'Telefone' },
        { key: 'sector', label: 'Setor', linkedCollection: 'sectors', linkedField: 'name', type: 'select' },
        { key: 'area', label: 'Área de Atuação' },
        { key: 'role', label: 'Cargo', linkedCollection: 'roles', linkedField: 'name', type: 'select' },
        { key: 'function', label: 'Função' },
        { key: 'seniority', label: 'Senioridade' },
        { key: 'jobLevel', label: 'Nível de Cargo' },
        { key: 'admissionDate', label: 'Data de Admissão', type: 'date' },
        { key: 'terminationDate', label: 'Data de Desligamento', type: 'date' },
        { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Inativo', 'Férias', 'Afastado'] },
        // Perfil DISC Adicionado
        { key: 'discProfile', label: 'Perfil DISC', type: 'select', options: DISC_OPTIONS }
      ]}
    />
  </div>
);

// --- 5. Usuários ---
export const UsersView = () => (
  <GenericDatabaseView 
    collectionName="users" 
    title="Usuários com Acesso ao Sistema"
    columns={[
      { key: 'name', label: 'Nome' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'role', label: 'Permissão', type: 'select', options: ['Admin', 'Gestor', 'Líder'] }
    ]}
  />
);

// --- 6. Gestão de Empresas ---
export const CompaniesView = () => (
  <GenericDatabaseView 
    collectionName="companies" 
    title="Gerenciar Empresas (Clientes)"
    columns={[
      { key: 'name', label: 'Nome da Empresa' },
      { key: 'cnpj', label: 'CNPJ (Opcional)' },
      { key: 'plan', label: 'Plano', type: 'select', options: ['Básico', 'Pro', 'Enterprise'] }
    ]}
  />
);