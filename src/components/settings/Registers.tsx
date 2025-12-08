import { GenericDatabaseView } from './GenericDatabaseView';
import { DataImporter } from './DataImporter';

// --- 1. Critérios de Avaliação ---
export const CriteriaView = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
      <h3 className="font-bold text-blue-800 dark:text-blue-300">Configuração de Critérios</h3>
      <p className="text-sm text-blue-600 dark:text-blue-400">
        Defina as perguntas que aparecerão no formulário. Separe por "Líder" ou "Colaborador".
      </p>
    </div>
    <DataImporter target="criteria" />
    <GenericDatabaseView 
      collectionName="evaluation_criteria" 
      title="Critérios de Avaliação"
      columns={[
        { key: 'name', label: 'Competência / Pergunta' },
        { key: 'type', label: 'Público Alvo', type: 'select', options: ['Líder', 'Colaborador'] },
        { key: 'description', label: 'Descrição da Competência' }
      ]}
    />
  </div>
);

// --- 2. Setores ---
export const SectorsView = () => (
  <div className="space-y-6 animate-fadeIn">
    <DataImporter target="sectors" />
    <GenericDatabaseView 
      collectionName="sectors" 
      title="Gerenciar Setores"
      columns={[
        { key: 'name', label: 'Nome do Setor' },
        { key: 'manager', label: 'Gestor Responsável' }
      ]}
    />
  </div>
);

// --- 3. Cargos (CRUCIAL: Define o formulário) ---
export const RolesView = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
      <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Atenção aos Níveis</h3>
      <p className="text-sm text-yellow-700 dark:text-yellow-400">
        O campo <strong>"Nível Hierárquico"</strong> define qual formulário de avaliação será aberto para o funcionário.
      </p>
    </div>
    <DataImporter target="roles" />
    <GenericDatabaseView 
      collectionName="roles" 
      title="Gerenciar Cargos"
      columns={[
        { key: 'name', label: 'Título do Cargo' },
        { key: 'level', label: 'Nível Hierárquico', type: 'select', options: ['Líder', 'Colaborador'] },
        { key: 'cbo', label: 'CBO (Opcional)' }
      ]}
    />
  </div>
);

// --- 4. Funcionários ---
export const EmployeesView = () => (
  <div className="space-y-6 animate-fadeIn">
    <DataImporter target="employees" />
    <GenericDatabaseView 
      collectionName="employees" 
      title="Gerenciar Funcionários"
      columns={[
        { key: 'name', label: 'Nome Completo' },
        { key: 'email', label: 'Email Corporativo', type: 'email' },
        { key: 'sector', label: 'Setor', linkedCollection: 'sectors', linkedField: 'name', type: 'select' },
        { key: 'role', label: 'Cargo', linkedCollection: 'roles', linkedField: 'name', type: 'select' },
        { key: 'admissionDate', label: 'Data de Admissão', type: 'date' },
        { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Inativo', 'Férias', 'Afastado'] }
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