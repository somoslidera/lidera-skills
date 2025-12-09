# 🚀 LideraApp - Sistema de Gestão de Avaliações de Desempenho

Sistema web completo para gestão e análise de avaliações de desempenho de colaboradores e líderes, desenvolvido com React, TypeScript e Firebase.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Estrutura de Dados](#estrutura-de-dados)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Arquitetura](#arquitetura)
- [Contribuindo](#contribuindo)

## 🎯 Sobre o Projeto

O **LideraApp** é uma plataforma SaaS multi-tenant desenvolvida para empresas gerenciarem avaliações de desempenho de seus colaboradores e líderes. O sistema permite:

- Importação de dados históricos via CSV
- Análise visual de desempenho com gráficos e métricas
- Gestão completa de cadastros (critérios, setores, cargos, funcionários)
- Comparativos individuais e por setor
- Histórico detalhado de avaliações
- Suporte a múltiplas empresas (multi-tenant)

## ✨ Funcionalidades

### 📊 Dashboard Principal

- **Saúde da Empresa**: Visão geral com métricas consolidadas
  - Score de saúde geral da empresa
  - Distribuição por setores e cargos (gráficos de rosca)
  - Top 10 colaboradores em desempenho
  - Funcionário do mês

- **Análise de Desempenho**: Análise detalhada por competências
  - Matriz de competências por setor
  - Evolução temporal (Líderes vs Colaboradores)
  - Gráficos de linha mostrando tendências
  - Meta de desempenho configurável

- **Comparativo Individual**: Análise comparativa
  - Comparação individual vs média do setor
  - Comparação individual vs média da empresa
  - Visualização em gráficos de barras

### 🔍 Filtros Avançados

- Busca por nome de colaborador
- Filtro por setor
- Filtros de período:
  - Últimos 30 dias
  - Últimos 3 meses
  - Este ano
  - Todo o período
  - Intervalo personalizado (data inicial e final)

### 📜 Histórico de Avaliações

- Visualização hierárquica em 3 níveis:
  1. **Resumo por Período**: Lista de meses com volume e média
  2. **Lista do Período**: Todas as avaliações do mês selecionado
  3. **Detalhes Individuais**: Detalhamento completo da avaliação

- Importação de histórico via CSV (Líderes e Colaboradores separados)

### ⚙️ Configurações e Cadastros

#### Cadastros Gerais
- **Critérios de Avaliação**: Definição de critérios para Líderes e Colaboradores
- **Setores**: Gestão de departamentos/setores da empresa
- **Cargos**: Cadastro de funções e níveis hierárquicos

#### Pessoas
- **Funcionários**: Cadastro completo com nome, email, setor, cargo e status
  - Status "Ativo" ou "Inativo"
  - Funcionários inativos não aparecem no formulário de novas avaliações
  - Funcionários inativos continuam visíveis no histórico (preservação de dados)
- **Usuários do Sistema**: Gestão de usuários e permissões

**Recursos de Edição:**
- Todos os cadastros são **editáveis** e **excluíveis**
- Edição inline com modal
- Validação de campos obrigatórios
- Suporte a campos customizados (campos extras)

### 📥 Importação de Dados

Sistema robusto de importação CSV com suporte para:
- Critérios de avaliação
- Setores
- Cargos
- Funcionários
- Histórico de avaliações (Líderes)
- Histórico de avaliações (Colaboradores)

**Recursos da importação:**
- Validação de duplicidade por empresa
- Processamento em lote
- Feedback visual de sucesso/erro
- Tratamento de dados com vírgula decimal

### 📁 Arquivos de Exemplo

Arquivos CSV de exemplo estão disponíveis na pasta `exemplos/`:
- `criterios_exemplo.csv` - 10 critérios (5 para Líderes, 5 para Colaboradores)
- `setores_exemplo.csv` - 10 setores diferentes
- `cargos_exemplo.csv` - 15 cargos (6 líderes, 9 colaboradores)
- `funcionarios_exemplo.csv` - 20 funcionários distribuídos pelos setores
- `avaliacoes_lideres_exemplo.csv` - Histórico de 4 meses para 6 líderes
- `avaliacoes_colaboradores_exemplo.csv` - Histórico de 4 meses para 14 colaboradores

Consulte `exemplos/LEIA-ME.md` para instruções detalhadas de uso.

### 🏢 Multi-Tenancy

- Suporte a múltiplas empresas clientes
- Isolamento completo de dados por empresa
- Seletor visual de empresa no header
- Criação rápida de novas empresas
- Persistência da empresa selecionada (localStorage)
- Todos os cadastros e avaliações são filtrados automaticamente por empresa
- Dados de uma empresa não são visíveis para outras empresas

### 🎨 Interface Moderna

- Design responsivo (mobile-first)
- Modo escuro/claro
- Animações suaves
- UI/UX intuitiva
- Ícones Lucide React

## 🛠 Tecnologias Utilizadas

### Frontend
- **React 18.2.0** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.2.2** - Superset JavaScript com tipagem estática
- **Vite 5.2.0** - Build tool e dev server ultra-rápido
- **React Router DOM 7.9.6** - Roteamento para aplicações React

### Estilização
- **Tailwind CSS 3.4.17** - Framework CSS utility-first
- **PostCSS 8.4.38** - Processador CSS
- **Autoprefixer 10.4.19** - Adiciona prefixos CSS automaticamente

### Backend & Banco de Dados
- **Firebase 10.8.1** - Plataforma completa
  - **Firestore** - Banco de dados NoSQL
  - **Authentication** - Autenticação com Google

### Bibliotecas de Gráficos
- **Recharts 2.12.0** - Biblioteca de gráficos React

### Utilitários
- **PapaParse 5.5.3** - Parser CSV robusto
- **Lucide React 0.344.0** - Ícones modernos

### Desenvolvimento
- **ESLint 8.57.0** - Linter para JavaScript/TypeScript
- **TypeScript** - Compilador e verificador de tipos

## 📁 Estrutura do Projeto

```
lidera-skills/
├── public/                 # Arquivos estáticos
├── src/
│   ├── assets/            # Imagens e recursos
│   ├── components/         # Componentes React
│   │   ├── dashboard/     # Componentes do dashboard
│   │   │   ├── tabs/      # Abas do dashboard
│   │   │   │   ├── CompanyOverview.tsx
│   │   │   │   ├── PerformanceAnalysis.tsx
│   │   │   │   └── IndividualAnalysis.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── EvaluationHistory.tsx
│   │   ├── layout/        # Componentes de layout
│   │   │   └── CompanySelector.tsx
│   │   ├── settings/      # Componentes de configuração
│   │   │   ├── DataImporter.tsx
│   │   │   ├── GenericDatabaseView.tsx
│   │   │   └── Registers.tsx
│   │   └── ui/            # Componentes UI reutilizáveis
│   │       ├── Card.tsx
│   │       └── Modal.tsx
│   ├── contexts/          # Context API do React
│   │   ├── AuthContext.tsx
│   │   └── CompanyContext.tsx
│   ├── hooks/             # Custom hooks
│   │   └── useDashboardAnalytics.ts
│   ├── services/          # Serviços e integrações
│   │   └── firebase.ts
│   ├── App.tsx            # Componente principal
│   ├── main.tsx           # Ponto de entrada
│   └── index.css          # Estilos globais
├── .gitignore
├── eslint.config.js       # Configuração ESLint
├── index.html
├── package.json
├── postcss.config.js      # Configuração PostCSS
├── tailwind.config.js     # Configuração Tailwind
├── tsconfig.json          # Configuração TypeScript
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts         # Configuração Vite
```

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn** (gerenciador de pacotes)
- Conta no **Firebase** (para configuração do backend)

## 🚀 Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/lidera-skills.git
   cd lidera-skills
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o Firebase** (veja seção [Configuração](#configuração))

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   - Abra seu navegador em `http://localhost:5173` (ou a porta indicada no terminal)

## ⚙️ Configuração

### Configuração do Firebase

1. **Crie um projeto no Firebase Console**
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Crie um novo projeto ou use um existente

2. **Configure o Firestore**
   - Ative o Firestore Database
   - Configure as regras de segurança (veja exemplo abaixo)

3. **Configure a Autenticação**
   - Ative o método de autenticação "Google"
   - Configure os domínios autorizados

4. **Atualize as credenciais**
   - Edite o arquivo `src/services/firebase.ts`
   - Substitua a configuração `firebaseConfig` com suas credenciais:

   ```typescript
   const firebaseConfig = {
     apiKey: "SUA_API_KEY",
     authDomain: "SEU_AUTH_DOMAIN",
     projectId: "SEU_PROJECT_ID",
     storageBucket: "SEU_STORAGE_BUCKET",
     messagingSenderId: "SEU_MESSAGING_SENDER_ID",
     appId: "SEU_APP_ID"
   };
   ```

### Regras de Segurança do Firestore (Exemplo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para companies (acesso público para leitura, autenticado para escrita)
    match /companies/{companyId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Regras para dados específicos de empresa
    match /{collection}/{documentId} {
      allow read, write: if request.auth != null && 
        (resource.data.companyId == request.auth.uid || 
         request.resource.data.companyId == request.auth.uid);
    }
  }
}
```

## 📖 Como Usar

### Primeiro Acesso

1. **Selecione ou Crie uma Empresa**
   - Ao acessar o sistema, você verá a tela de boas-vindas
   - Selecione uma empresa existente ou crie uma nova

2. **Importe Dados Iniciais** (Opcional)
   - Acesse a aba "Configurações"
   - Use os importadores CSV para carregar:
     - Critérios de avaliação
     - Setores
     - Cargos
     - Funcionários
     - Histórico de avaliações

3. **Explore o Dashboard**
   - Acesse a aba "Painel" para ver as análises
   - Use os filtros para refinar os dados
   - Navegue entre as abas: Saúde da Empresa, Análise de Desempenho, Comparativo Individual

### Importação de Dados CSV

#### Formato Esperado para Critérios
```csv
ID_Avaliacao,Categoria_Avaliacao
Comunicacao_Clara_Coerente,Líderes
Assiduidade_Pontualidade,Operadores
```

#### Formato Esperado para Setores
```csv
Nome_Setor
Recursos Humanos
TI
Vendas
```

#### Formato Esperado para Cargos
```csv
Nome_Cargo,Nível
Gerente de RH,Líder
Analista de TI,Colaborador
```

#### Formato Esperado para Funcionários
```csv
Nome,Email,Setor,Cargo
João Silva,joao@empresa.com,TI,Analista de TI
Maria Santos,maria@empresa.com,RH,Gerente de RH
```

#### Formato Esperado para Avaliações (Líderes)
```csv
Nome_Lider_Avaliado,ID_Funcionario,Mes_Referencia,Cargo,Setor,Pontuacao_Lider,Comunicacao_Clara_Coerente,Acompanhamento_Membros_Equipe,Cumprimento_Metas_Setor,Capacidade_Decisao_Resolucao,Assiduidade_Pontualidade_Lider
João Silva,001,2024-01-15,Gerente,TI,8.5,9.0,8.5,8.0,9.0,8.0
```

#### Formato Esperado para Avaliações (Colaboradores)
```csv
Nome_Colaborador,ID_Funcionario,Mes_Referencia,Cargo,Setor,Pontuacao_Colaborador,Assiduidade_Pontualidade,Cumprimento_Tarefas,Proatividade,Organizacao_Limpeza,Uso_Uniforme_EPI
Maria Santos,002,2024-01-15,Analista,RH,9.0,9.5,9.0,8.5,9.0,9.0
```

**Nota:** Os valores numéricos podem usar vírgula (`,`) ou ponto (`.`) como separador decimal.

## 🗄 Estrutura de Dados

### Collections do Firestore

#### `companies`
```typescript
{
  id: string;
  name: string;
  createdAt: string;
}
```

#### `evaluation_criteria`
```typescript
{
  id: string;
  name: string;
  type: 'Líder' | 'Colaborador';
  description?: string;
  companyId: string;
}
```

#### `sectors`
```typescript
{
  id: string;
  name: string;
  manager?: string;
  companyId: string;
}
```

#### `roles`
```typescript
{
  id: string;
  name: string;
  level: string;
  companyId: string;
}
```

#### `employees`
```typescript
{
  id: string;
  name: string;
  email?: string;
  sector: string;
  role: string;
  status: 'Ativo' | 'Inativo';
  companyId: string;
}
```

#### `evaluations`
```typescript
{
  id: string;
  employeeName: string;
  employeeId?: string;
  role?: string;
  sector?: string;
  type: 'Líder' | 'Colaborador';
  date: string; // YYYY-MM-DD
  average: number;
  details: {
    [criteriaName: string]: number;
  };
  companyId: string;
  importedAt?: string;
}
```

#### `users`
```typescript
{
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Gestor' | 'Líder';
}
```

## 📜 Scripts Disponíveis

```bash
# Inicia o servidor de desenvolvimento
npm run dev

# Cria build de produção
npm run build

# Visualiza o build de produção localmente
npm run preview

# Executa o linter
npm run lint
```

## 🏗 Arquitetura

### Contextos (State Management)

- **AuthContext**: Gerencia autenticação do usuário via Firebase Auth
- **CompanyContext**: Gerencia empresa selecionada e lista de empresas

### Hooks Customizados

- **useDashboardAnalytics**: Processa e calcula todas as métricas do dashboard
  - Normalização de dados
  - Aplicação de filtros
  - Cálculo de métricas gerais
  - Análise de competências
  - Comparativos individuais

### Componentes Principais

- **App.tsx**: Componente raiz com roteamento e providers
- **Dashboard**: Componente principal com filtros e abas
- **EvaluationHistory**: Visualização hierárquica do histórico
- **DataImporter**: Componente genérico para importação CSV
- **GenericDatabaseView**: Visualização e edição genérica de collections

### Fluxo de Dados

1. Usuário seleciona empresa → `CompanyContext`
2. Dados são carregados do Firestore filtrados por `companyId`
3. Dados são processados pelo hook `useDashboardAnalytics`
4. Componentes recebem dados processados e renderizam visualizações

## 🎨 Personalização

### Tema e Cores

As cores podem ser personalizadas no arquivo `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      lidera: {
        dark: '#121212',
        gray: '#1E1E1E',
        gold: '#D4AF37',
      },
      skills: {
        light: '#F8FAFC',
        white: '#FFFFFF',
        blue: {
          primary: '#0F52BA',
          secondary: '#4CA1AF',
        }
      }
    }
  }
}
```

### Modo Escuro

O modo escuro é ativado automaticamente via classe CSS `dark`. O sistema detecta a preferência do sistema operacional ou permite alternância manual.

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript para todos os arquivos
- Siga as convenções do ESLint configurado
- Mantenha componentes pequenos e reutilizáveis
- Adicione comentários quando necessário
- Use nomes descritivos para variáveis e funções

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido por Lidera para facilitar a gestão de avaliações de desempenho**
