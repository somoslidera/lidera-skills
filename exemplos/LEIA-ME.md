# 📁 Arquivos CSV de Exemplo

Este diretório contém arquivos CSV de exemplo para importação de dados no LideraApp.

## 📋 Arquivos Disponíveis

### 1. `criterios_exemplo.csv`
Critérios de avaliação para Líderes e Colaboradores.

**Colunas:**
- `ID_Avaliacao`: Identificador do critério (será convertido para nome legível)
- `Categoria_Avaliacao`: "Líderes" ou "Operadores" (será convertido para "Líder" ou "Colaborador")

**Como usar:**
1. Acesse **Configurações > Critérios**
2. Clique em **Selecionar Arquivo** no card de importação
3. Selecione este arquivo

### 2. `setores_exemplo.csv`
Setores/Departamentos da empresa.

**Colunas:**
- `Nome_Setor`: Nome do setor

**Como usar:**
1. Acesse **Configurações > Setores**
2. Clique em **Selecionar Arquivo** no card de importação
3. Selecione este arquivo

### 3. `cargos_exemplo.csv`
Cargos e funções da empresa.

**Colunas:**
- `Nome_Cargo`: Nome do cargo
- `Nível`: "Líder" ou "Colaborador"

**Como usar:**
1. Acesse **Configurações > Cargos**
2. Clique em **Selecionar Arquivo** no card de importação
3. Selecione este arquivo

### 4. `funcionarios_exemplo.csv`
Cadastro de funcionários.

**Colunas:**
- `Nome`: Nome completo do funcionário
- `Email`: Email do funcionário (opcional)
- `Setor`: Setor do funcionário (deve existir no cadastro de setores)
- `Cargo`: Cargo do funcionário (deve existir no cadastro de cargos)

**Importante:** 
- Os funcionários são criados com status "Ativo" por padrão
- Você pode alterar o status para "Inativo" em **Configurações > Funcionários**
- Funcionários inativos não aparecem no formulário de novas avaliações, mas aparecem no histórico

**Como usar:**
1. Acesse **Configurações > Funcionários**
2. Clique em **Selecionar Arquivo** no card de importação
3. Selecione este arquivo

### 5. `avaliacoes_lideres_exemplo.csv`
Histórico de avaliações de líderes.

**Colunas:**
- `Nome_Lider_Avaliado`: Nome do líder avaliado
- `ID_Funcionario`: ID do funcionário (opcional, pode ser deixado em branco)
- `Mes_Referencia`: Data de referência no formato YYYY-MM-DD
- `Cargo`: Cargo do líder
- `Setor`: Setor do líder
- `Pontuacao_Lider`: Nota média geral
- `Comunicacao_Clara_Coerente`: Nota do critério (0-10)
- `Acompanhamento_Membros_Equipe`: Nota do critério (0-10)
- `Cumprimento_Metas_Setor`: Nota do critério (0-10)
- `Capacidade_Decisao_Resolucao`: Nota do critério (0-10)
- `Assiduidade_Pontualidade_Lider`: Nota do critério (0-10)

**Como usar:**
1. Acesse **Histórico Antigo**
2. Clique em **Importar Histórico (CSV)**
3. No card "Histórico (Líderes)", clique em **Selecionar Arquivo**
4. Selecione este arquivo

### 6. `avaliacoes_colaboradores_exemplo.csv`
Histórico de avaliações de colaboradores.

**Colunas:**
- `Nome_Colaborador`: Nome do colaborador avaliado
- `ID_Funcionario`: ID do funcionário (opcional)
- `Mes_Referencia`: Data de referência no formato YYYY-MM-DD
- `Cargo`: Cargo do colaborador
- `Setor`: Setor do colaborador
- `Pontuacao_Colaborador`: Nota média geral
- `Assiduidade_Pontualidade`: Nota do critério (0-10)
- `Cumprimento_Tarefas`: Nota do critério (0-10)
- `Proatividade`: Nota do critério (0-10)
- `Organizacao_Limpeza`: Nota do critério (0-10)
- `Uso_Uniforme_EPI`: Nota do critério (0-10)

**Como usar:**
1. Acesse **Histórico Antigo**
2. Clique em **Importar Histórico (CSV)**
3. No card "Histórico (Colaboradores)", clique em **Selecionar Arquivo**
4. Selecione este arquivo

## 🔄 Ordem Recomendada de Importação

Para uma melhor experiência, importe os dados na seguinte ordem:

1. **Critérios** - Base para as avaliações
2. **Setores** - Necessário para funcionários
3. **Cargos** - Necessário para funcionários
4. **Funcionários** - Necessário para avaliações
5. **Avaliações** (Líderes e Colaboradores) - Dados históricos

## 📊 Dados de Exemplo

Os arquivos contêm dados de exemplo com:
- **10 setores** diferentes
- **15 cargos** (6 líderes, 9 colaboradores)
- **20 funcionários** distribuídos pelos setores
- **Avaliações de 4 meses** (janeiro a abril de 2024)
  - 6 líderes avaliados mensalmente
  - 14 colaboradores avaliados mensalmente

## ⚠️ Importante

- **Multi-tenancy**: Todos os dados importados são vinculados à empresa selecionada no momento da importação
- **Duplicidade**: O sistema verifica duplicidades antes de importar. Registros duplicados são ignorados
- **Formato de números**: Use vírgula (`,`) ou ponto (`.`) como separador decimal - ambos são aceitos
- **Status de funcionários**: Funcionários inativos não aparecem no formulário de novas avaliações, mas continuam visíveis no histórico

## 🎯 Após a Importação

Após importar os dados de exemplo, você poderá:

1. **Visualizar o Dashboard** com análises completas
2. **Explorar o Histórico** de avaliações por período
3. **Criar novas avaliações** para funcionários ativos
4. **Editar e excluir** qualquer registro nas telas de Configurações
5. **Filtrar e buscar** dados em todas as telas

## 🔧 Personalização

Você pode editar os arquivos CSV antes de importar para:
- Adicionar mais setores, cargos ou funcionários
- Modificar as notas das avaliações
- Adicionar mais meses de histórico
- Ajustar os critérios de avaliação

Basta seguir o formato das colunas indicado acima.

