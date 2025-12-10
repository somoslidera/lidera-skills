# 🗺️ Roadmap e Análise Técnica - Lidera Skills

Este documento detalha a análise técnica atual do projeto, pontos de atenção para escalabilidade e o roteiro sugerido para melhorias futuras.

---

## 1. Segurança e Controle de Acesso (Crítico) 🔒

Atualmente, a segurança depende da validação no cliente (Front-end). Para um produto SaaS comercial, isso precisa ser migrado para o Back-end.

- **Problema Atual:** A verificação de "Master User" é feita comparando o e-mail logado com uma lista fixa no código (`MASTER_EMAILS`).
- **Riscos:** Manipulação de estado no navegador pode permitir acesso visual indevido.
- **Solução Proposta:**
  - Implementar **Custom Claims** no Firebase Authentication ou criar uma coleção protegida `admins` no Firestore.
  - Configurar **Firestore Security Rules** para garantir que requisições de leitura/escrita só sejam permitidas se o `companyId` do documento corresponder ao `companyId` do usuário autenticado.

## 2. Performance e Escalabilidade 🚀

O sistema atual carrega coleções inteiras, o que pode impactar a performance com o crescimento da base de dados.

- **Otimização de Consultas:**
  - Substituir `getDocs` de coleções inteiras por **paginação** (usando `limit()` e `startAfter()`).
  - Implementar "Scroll Infinito" nas tabelas de histórico e cadastros.
- **Processamento de Dados:**
  - Mover cálculos pesados (como médias de empresas com milhares de avaliações) do front-end para **Cloud Functions** ou usar **Firestore Aggregation Queries**.

## 3. Experiência do Usuário (UX) e Interface (UI) 🎨

Melhorias para tornar a aplicação mais fluida e profissional.

- **Feedback Visual:**
  - Substituir `alert()` e `confirm()` nativos por bibliotecas de notificação modernas como **Sonner** ou **React Hot Toast**.
- **Formulários:**
  - Adotar **React Hook Form** + **Zod** para validação robusta de dados em tempo real (ex: notas entre 0-10, campos obrigatórios).
- **Estado de Carregamento:**
  - Implementar **Skeleton Screens** (telas de carregamento estruturais) em vez de spinners simples para melhorar a percepção de velocidade.

## 4. Qualidade de Código e Manutenibilidade 🛠

- **Tipagem Estrita:** Eliminar o uso de `any` no TypeScript, especialmente nos importadores de dados, para evitar erros em tempo de execução.
- **Arquitetura:** Extrair o Layout principal (Sidebar + Header) do `App.tsx` para um componente dedicado `MainLayout.tsx`, facilitando a gestão de rotas e contextos.

## 5. Novas Funcionalidades Sugeridas (Backlog) 💡

Funcionalidades de alto valor agregado para futuras versões:

1.  **Comparativo de Evolução Individual:**
    - Gráfico de linha comparando a evolução de um colaborador específico vs. a média do seu cargo nos últimos 6-12 meses.
2.  **Módulo de PDI (Plano de Desenvolvimento Individual):**
    - Criação de planos de ação vinculados a notas baixas em competências específicas (ex: "Nota baixa em Comunicação" -> Sugerir curso ou mentoria).
3.  **Audit Logs (Trilha de Auditoria):**
    - Registro histórico de quem criou, editou ou excluiu registros, essencial para compliance em grandes empresas.