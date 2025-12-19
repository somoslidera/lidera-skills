# 📊 Lidera Skills - Visão Geral do Aplicativo

## 🎯 Sobre o Sistema

O **Lidera Skills** é uma plataforma SaaS multi-tenant desenvolvida para gestão e análise de avaliações de desempenho de colaboradores e líderes. O sistema permite que empresas gerenciem de forma completa o ciclo de avaliações, desde o cadastro de critérios até análises avançadas de desempenho.

### Características Principais

- ✅ **Multi-tenant**: Suporte a múltiplas empresas com isolamento completo de dados
- ✅ **Sistema de Roles**: Controle de acesso baseado em permissões (Master, Admin, Gestor, Líder, Colaborador)
- ✅ **Interface Moderna**: Design responsivo com suporte a modo escuro/claro
- ✅ **Performance Otimizada**: Paginação e scroll infinito para grandes volumes de dados
- ✅ **Importação em Massa**: Importação de dados via CSV com mapeamento de colunas
- ✅ **Análises Avançadas**: Dashboards interativos com gráficos e métricas em tempo real

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

- **Frontend**: React 18 + TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Firebase (Firestore + Authentication)
- **Gráficos**: Recharts
- **Notificações**: Sonner (Toast)
- **Validação**: Zod + React Hook Form
- **Build**: Vite

### Estrutura de Dados

O sistema utiliza Firebase Firestore com as seguintes coleções principais:

- `companies` - Empresas clientes
- `employees` - Funcionários
- `evaluation_criteria` - Critérios de avaliação (universais)
- `evaluations` - Avaliações realizadas
- `sectors` - Setores organizacionais
- `roles` - Cargos/Funções
- `user_roles` - Permissões e roles dos usuários

---

## 📱 Módulos e Funcionalidades

### 1. 🏠 Dashboard Principal

O dashboard é o centro de análise do sistema, oferecendo três visões distintas:

#### 1.1 Saúde da Empresa
Visão geral consolidada com métricas principais:

- **Score de Saúde Geral**: Indicador numérico da saúde organizacional
- **Distribuição por Setores**: Gráfico de rosca mostrando distribuição de avaliações por setor
- **Distribuição por Cargos**: Visualização da distribuição por nível hierárquico
- **Top 10 Colaboradores**: Ranking dos melhores desempenhos
- **Funcionário do Mês**: Destaque do colaborador com melhor performance

#### 1.2 Análise de Desempenho
Análise detalhada por competências e evolução temporal:

- **Matriz de Competências**: Visualização por setor mostrando desempenho em cada competência
- **Evolução Temporal**: Gráfico de linha comparando:
  - Líderes vs Colaboradores
  - Desempenho Geral
  - Meta de desempenho (configurável)
- **Interatividade**: Possibilidade de mostrar/ocultar linhas clicando na legenda
- **Filtros**: Por período, setor e colaborador

#### 1.3 Comparativo Individual
Análise comparativa de desempenho individual:

- **Comparação Individual vs Setor**: Gráfico de barras mostrando desempenho do colaborador vs média do setor
- **Comparação Individual vs Empresa**: Comparação com a média geral da empresa
- **Tabela Detalhada**: Lista de todos os colaboradores com suas métricas
- **Ordenação**: Por nome, setor ou desempenho

#### Filtros do Dashboard

- **Busca por Nome**: Busca em tempo real por nome do colaborador
- **Filtro por Setor**: Dropdown com todos os setores
- **Filtros de Período**:
  - Últimos 30 dias
  - Últimos 3 meses
  - Este ano
  - Todo o período
  - Intervalo personalizado (data inicial e final)

---

### 2. ✍️ Avaliações

Módulo para criação e gestão de avaliações de desempenho.

#### 2.1 Criação de Avaliações

- **Seleção de Empresa**: Escolha da empresa (para usuários master)
- **Seleção de Funcionário**: Dropdown com funcionários ativos
- **Tipo de Avaliação**: 
  - Líderes (Estratégico/Tático)
  - Colaboradores (Operacional)
- **Mês de Referência**: Seletor de mês/ano com visualização formatada (mmm/yyyy)
- **Critérios Dinâmicos**: 
  - Critérios filtrados automaticamente por tipo e empresa
  - Notas de 0 a 10 para cada critério
  - Cálculo automático da média
  - Validação de campos obrigatórios
- **Salvamento**: Persistência no Firestore com feedback visual

#### 2.2 Tabela de Avaliações

- **Visualização Tabular**: Lista de todas as avaliações
- **Filtros**:
  - Por nome do funcionário
  - Por setor
- **Edição em Massa**: 
  - Seleção múltipla de avaliações
  - Atualização em lote do nível hierárquico
- **Ações Individuais**: Edição e exclusão de avaliações
- **Ordenação**: Por data, nome ou setor

---

### 3. 📜 Histórico

Visualização hierárquica e detalhada do histórico de avaliações.

#### 3.1 Visualização em 3 Níveis

- **Nível 1 - Períodos**: Agrupamento por mês/ano
  - Contagem de avaliações
  - Média geral do período
- **Nível 2 - Funcionários**: Lista de funcionários avaliados no período
  - Nome e cargo
  - Nota média
- **Nível 3 - Detalhes**: Detalhamento completo da avaliação
  - Data da avaliação
  - Todas as notas por critério
  - Média calculada
  - Tipo de avaliação

#### 3.2 Importação de Histórico Legado

- **Importação CSV**: Upload de arquivos CSV com histórico antigo
- **Mapeamento de Colunas**: Interface para mapear colunas do CSV para campos do sistema
- **Processamento Automático**:
  - Criação automática de setores e cargos se não existirem
  - Vinculação de funcionários
  - Criação de avaliações agrupadas por funcionário e mês

---

### 4. ⚙️ Configurações

Módulo completo de cadastros e configurações do sistema.

#### 4.1 Critérios de Avaliação

- **Cadastro Universal**: Critérios podem ser compartilhados entre empresas
- **Campos**:
  - Nome da competência/pergunta
  - Nível alvo (Estratégico, Tático, Operacional, Colaborador, Líder)
  - Seção/Categoria (ex: Liderança, Comportamental)
  - Descrição
  - Empresas vinculadas (para usuários master)
- **Importação CSV**: Template disponível para importação em massa
- **Paginação**: Scroll infinito para grandes volumes

#### 4.2 Setores

- **Cadastro**: Nome do setor e gerente responsável
- **Importação CSV**: Suporte a importação em massa
- **Vínculo com Empresa**: Setores são específicos por empresa

#### 4.3 Cargos

- **Cadastro**: Nome do cargo e nível hierárquico
- **Níveis Suportados**: Estratégico, Tático, Operacional
- **Importação CSV**: Template disponível
- **Vínculo com Empresa**: Cargos são específicos por empresa

#### 4.4 Funcionários

Cadastro completo de funcionários com os seguintes campos:

**Dados Básicos:**
- ID/Matrícula
- Nome completo
- Email
- Telefone

**Dados Organizacionais:**
- Setor
- Área de Atuação
- Cargo
- Função
- Senioridade
- Nível de Cargo
- Gestor Imediato
- Unidade/Filial
- Centro de Custo

**Dados de Vínculo:**
- Tipo de Vínculo (CLT, PJ, etc.)
- Status (Ativo, Inativo, Afastado, Férias)
- Data de Admissão
- Data de Desligamento

**Dados Comportamentais:**
- Perfil DISC

**Importação CSV:**
- Template completo disponível
- Mapeamento de colunas personalizado
- Criação automática de setores e cargos se não existirem
- Vinculação automática à empresa atual

#### 4.5 Usuários

- **Gestão de Usuários**: Cadastro e edição de usuários do sistema
- **Permissões**: Vinculação a empresas e definição de roles

#### 4.6 Empresas (Apenas Master)

- **Cadastro de Empresas Clientes**: Criação e gestão de empresas
- **Isolamento de Dados**: Cada empresa tem seus próprios dados

#### 4.7 Importar Histórico

- **Importação de Dados Legados**: Interface dedicada para importação de histórico
- **Suporte a Múltiplos Formatos**: CSV com diferentes estruturas

---

## 🔐 Sistema de Segurança e Permissões

### Roles Disponíveis

1. **Master**: Acesso total ao sistema
   - Pode gerenciar empresas
   - Pode criar critérios universais
   - Acesso a todas as empresas

2. **Admin**: Administrador de empresa
   - Gestão completa dos dados da empresa
   - Acesso a todas as funcionalidades da empresa

3. **Gestor**: Gestor de setor
   - Acesso limitado ao seu setor
   - Pode criar avaliações

4. **Líder**: Líder de equipe
   - Acesso a avaliações da sua equipe
   - Pode criar avaliações

5. **Colaborador**: Acesso básico
   - Visualização de próprias avaliações

### Firestore Security Rules

O sistema implementa regras de segurança robustas:

- Verificação de autenticação obrigatória
- Isolamento de dados por empresa
- Controle de acesso baseado em roles
- Validação de permissões no backend

---

## 📊 Funcionalidades de Análise

### Métricas Calculadas

- **Score Normalizado**: Cálculo automático de scores normalizados (0-10)
- **Médias por Setor**: Agregação de médias por setor organizacional
- **Médias por Cargo**: Agregação por nível hierárquico
- **Evolução Temporal**: Cálculo de tendências ao longo do tempo
- **Comparativos**: Comparação individual vs setor e vs empresa

### Visualizações

- **Gráficos de Rosca**: Distribuição de dados categóricos
- **Gráficos de Linha**: Evolução temporal com múltiplas séries
- **Gráficos de Barras**: Comparativos e rankings
- **Tabelas Interativas**: Ordenação, filtros e busca

---

## 🚀 Performance e Otimizações

### Paginação e Scroll Infinito

- **Carregamento Paginado**: 20 registros por vez
- **Scroll Infinito**: Carregamento automático ao fazer scroll
- **Otimização de Consultas**: Uso de `limit()` e `startAfter()` do Firestore
- **Indicadores Visuais**: Loading states e mensagens de fim de lista

### Cache e Estado

- **Persistência Local**: LocalStorage para preferências do usuário
- **Estado Global**: Context API para gerenciamento de estado
- **Memoização**: Uso de `useMemo` e `useCallback` para otimização

---

## 🎨 Interface e Experiência do Usuário

### Design System

- **Modo Escuro/Claro**: Alternância automática ou manual
- **Responsividade**: Layout adaptável para mobile, tablet e desktop
- **Feedback Visual**: Toast notifications para todas as ações
- **Loading States**: Indicadores de carregamento em todas as operações
- **Animações**: Transições suaves entre estados

### Componentes Reutilizáveis

- **Modal**: Componente de modal genérico
- **GenericDatabaseView**: Tabela genérica para CRUD
- **DataImporter**: Importador CSV genérico
- **Toaster**: Sistema de notificações
- **ThemeToggle**: Alternador de tema

---

## 📥 Importação de Dados

### Tipos de Importação Suportados

1. **Critérios de Avaliação**
2. **Setores**
3. **Cargos**
4. **Funcionários** (com mapeamento de colunas)
5. **Avaliações** (histórico legado)

### Características da Importação

- **Templates CSV**: Download de templates para cada tipo
- **Mapeamento de Colunas**: Interface para mapear colunas do CSV
- **Validação**: Validação de dados antes da importação
- **Processamento em Lote**: Importação de múltiplos registros
- **Criação Automática**: Criação de dependências (setores, cargos) se não existirem
- **Feedback**: Mensagens de sucesso/erro detalhadas

---

## 🔄 Fluxo de Trabalho Típico

### 1. Configuração Inicial

1. Usuário master cria empresa cliente
2. Cadastra setores e cargos (ou importa via CSV)
3. Cadastra critérios de avaliação
4. Vincula critérios às empresas desejadas
5. Importa funcionários (ou cadastra manualmente)

### 2. Operação Diária

1. Acessa o dashboard para visualizar métricas
2. Cria novas avaliações na aba "Avaliações"
3. Visualiza histórico detalhado na aba "Histórico"
4. Gerencia cadastros na aba "Configurações"

### 3. Análise e Relatórios

1. Utiliza filtros do dashboard para análises específicas
2. Compara desempenho entre setores e períodos
3. Identifica colaboradores com melhor/menor desempenho
4. Acompanha evolução temporal das métricas

---

## 🛠️ Manutenção e Suporte

### Logs e Monitoramento

- **Tratamento Centralizado de Erros**: Classe `ErrorHandler` para gestão de erros
- **Logging**: Logs estruturados para debugging
- **Toast Notifications**: Feedback visual de todas as operações

### Backup e Recuperação

- **Firebase Firestore**: Backup automático pelo Firebase
- **Exportação**: Possibilidade de exportar dados via CSV

---

## 📈 Roadmap e Melhorias Futuras

### Em Desenvolvimento (Fase 2)

- ✅ Paginação e scroll infinito
- ✅ Sistema de roles e segurança
- ✅ Toast notifications
- ✅ Tratamento centralizado de erros

### Planejado

- **PDI (Plano de Desenvolvimento Individual)**: Criação de planos de ação baseados em notas baixas
- **Comparativo de Evolução Individual**: Gráfico de linha mostrando evolução do colaborador
- **Audit Logs**: Rastreamento de quem criou/editou/excluiu registros
- **Exportação de Relatórios**: PDF/Excel dos dashboards
- **Notificações**: Alertas para avaliações pendentes
- **Metas Personalizadas**: Configuração de metas por setor/cargo
- **Dashboard Executivo**: Visão resumida para C-level

---

## 📞 Suporte e Documentação

### Documentação Disponível

- `README.md`: Guia de instalação e configuração
- `ROADMAP.md`: Roadmap técnico e melhorias
- `FASE1_IMPLEMENTACAO.md`: Detalhes da Fase 1 de implementação
- `README_ENV.md`: Configuração de variáveis de ambiente
- `firestore.rules`: Regras de segurança do Firestore

### Contato

Para suporte e dúvidas, entre em contato através dos canais oficiais da Lidera.

---

**Versão do Documento**: 1.0  
**Última Atualização**: 2024  
**Status**: Sistema em Produção

