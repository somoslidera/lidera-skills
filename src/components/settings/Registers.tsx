import { GenericDatabaseView } from './GenericDatabaseView';
import { DataImporter } from './DataImporter';
import { useCompany } from '../../contexts/CompanyContext';

// --- 2. Setores (Universal com Seleção de Empresas) ---
export const SectorsView = () => {
  const { isMaster } = useCompany();
  
  // Apenas Master vê a opção de vincular empresas em massa
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
      <DataImporter target="roles" />
      <GenericDatabaseView 
        collectionName="roles" 
        title="Gerenciar Cargos (Universal)"
        columns={columns}
      />
    </div>
  );
};

// ... (Outros exports como CriteriaView, EmployeesView, UsersView mantidos)

// --- 6. Gestão de Empresas (Req 9) ---
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