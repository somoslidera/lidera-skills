import { GenericDatabaseView } from './GenericDatabaseView';
import { DataImporter } from './DataImporter';

// --- 1. Critérios de Avaliação ---
export const CriteriaView = () => (
  <div className="space-y-6 animate-fadeIn">
    {/* ... header ... */}
    <DataImporter target="criteria" />
    <GenericDatabaseView 
      collectionName="evaluation_criteria" 
      title="Critérios de Avaliação"
      columns={[
        { key: 'name', label: 'Competência / Pergunta' },
        { 
          key: 'type', 
          label: 'Nível Alvo', 
          type: 'select', 
          // MUDANÇA AQUI: Novos níveis
          options: ['Estratégico', 'Tático', 'Operacional'] 
        },
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

// --- 3. Cargos ---
export const RolesView = () => (
  <div className="space-y-6 animate-fadeIn">
    {/* ... header ... */}
    <DataImporter target="roles" />
    <GenericDatabaseView 
      collectionName="roles" 
      title="Gerenciar Cargos"
      columns={[
        { key: 'name', label: 'Título do Cargo' },
        { 
          key: 'level', 
          label: 'Nível Hierárquico', 
          type: 'select', 
          // MUDANÇA AQUI: Novos níveis para vincular o cargo ao formulário correto
          options: ['Estratégico', 'Tático', 'Operacional'] 
        },
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