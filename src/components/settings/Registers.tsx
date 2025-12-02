import { GenericDatabaseView } from './GenericDatabaseView';
import { DataImporter } from './DataImporter'; // <--- Importe o novo componente

// --- 1. Critérios de Avaliação ---
export const CriteriaView = () => (
  <div className="space-y-6">
    {/* Área de Importação */}
    <DataImporter />
    
    {/* Tabela de Dados */}
    <GenericDatabaseView 
      collectionName="evaluation_criteria" 
      title="Critérios de Avaliação"
      columns={[
        { key: 'name', label: 'Nome do Critério' },
        { key: 'type', label: 'Nível / Público Alvo', type: 'select', options: ['Líder', 'Colaborador'] },
        { key: 'description', label: 'Descrição (Opcional)' }
      ]}
    />
  </div>
);

// --- 2. Setores ---
export const SectorsView = () => (
  <GenericDatabaseView 
    collectionName="sectors" 
    title="Gerenciar Setores"
    columns={[
      { key: 'name', label: 'Nome do Setor' },
      { key: 'manager', label: 'Responsável/Gestor' }
    ]}
  />
);

// --- 3. Cargos ---
export const RolesView = () => (
  <GenericDatabaseView 
    collectionName="roles" 
    title="Gerenciar Cargos"
    columns={[
      { key: 'name', label: 'Título do Cargo' },
      { key: 'level', label: 'Nível Hierárquico', type: 'select', options: ['Líder', 'Colaborador'] }
    ]}
  />
);

// --- 4. Funcionários ---
export const EmployeesView = () => (
  <GenericDatabaseView 
    collectionName="employees" 
    title="Gerenciar Funcionários"
    columns={[
      { key: 'name', label: 'Nome Completo' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'sector', label: 'Setor', linkedCollection: 'sectors', linkedField: 'name', type: 'select' },
      { key: 'role', label: 'Cargo', linkedCollection: 'roles', linkedField: 'name', type: 'select' },
      { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Inativo'] }
    ]}
  />
);

// --- 5. Usuários do Sistema ---
export const UsersView = () => (
  <GenericDatabaseView 
    collectionName="users" 
    title="Usuários do Sistema"
    columns={[
      { key: 'name', label: 'Nome' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'role', label: 'Permissão', type: 'select', options: ['Admin', 'Gestor', 'Líder'] }
    ]}
  />
);
