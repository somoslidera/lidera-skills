# Usuários e Permissões – Lidera Skills

Este documento descreve como adicionar novos usuários e atribuir permissões específicas (roles) no sistema.

## Visão geral dos roles

| Role        | Descrição | Acesso |
|------------|-----------|--------|
| **master** | Administrador total | Todas as empresas, cadastros, usuários e configurações. Único que cria empresas e gerencia `user_roles`. |
| **company** | Usuário por empresa | Acesso **somente** à empresa vinculada: ver e criar/editar avaliações, ver painel, histórico, funcionários e critérios dessa empresa. Não vê outras empresas nem opções "Todas as Empresas" ou "Nova Empresa". |
| *(sem role)* | Legado | Comportamento igual ao master (dono inicial do projeto). |

As regras do Firestore garantem que usuários com role `company` só leiam/escrevam dados da empresa indicada no documento `user_roles`.

---

## Como adicionar um usuário com acesso só à empresa dele (role `company`)

### 1. Criar o usuário no Firebase Authentication

1. Acesse o [Firebase Console](https://console.firebase.google.com) → seu projeto → **Authentication** → **Users**.
2. Clique em **Add user**.
3. Informe **Email** e **Senha**.
4. Anote o **UID** do usuário criado (aparece na lista de usuários).

### 2. Descobrir o ID da empresa no Firestore

1. No Firebase Console → **Firestore Database** → coleção **companies**.
2. Abra o documento da empresa desejada (ex.: "Supermercado Gomes").
3. O **ID do documento** é o `companyId` que será usado no próximo passo (ex.: `leoQVfLJcKs2wD3uviyk`).

### 3. Atribuir a role `company` no Firestore

Há duas formas: pelo script (recomendado) ou manualmente no Firestore.

#### Opção A: Script (requer Admin SDK / service account)

O script `scripts/set-user-role-company.ts` grava no Firestore; as regras de segurança só permitem escrita em `user_roles` para usuários **master**. Por isso, o script só funciona em ambiente com **Firebase Admin SDK** (credenciais de serviço). No seu computador, use a **Opção B (manual)** abaixo.

Se no futuro você configurar o Admin SDK (ex.: em um Cloud Function ou script com service account), use:

```bash
npx tsx scripts/set-user-role-company.ts [UID] [companyId] [email]
```

**Exemplo – Supermercado Gomes:**

```bash
npx tsx scripts/set-user-role-company.ts I9ExAlAO2eSZ4evy8x978JnprsW2 leoQVfLJcKs2wD3uviyk supermercadogomes@somoslidera.com.br
```

Se aparecer **PERMISSION_DENIED**, crie o documento manualmente no Firestore (Opção B).

#### Opção B: Manualmente no Firestore (recomendado)

1. Firestore Database → coleção **user_roles**.
2. Clique em **Add document**.
3. **Document ID**: use o **UID** do usuário (igual ao da Authentication).
4. Campos:

   | Campo       | Tipo   | Valor exemplo                          |
   |------------|--------|----------------------------------------|
   | `userId`   | string | (mesmo UID do documento)               |
   | `email`   | string | email do usuário                      |
   | `role`    | string | `company`                             |
   | `companyId` | string | ID do documento da empresa em `companies` |
   | `createdAt` | string | data em ISO (ex.: `2025-01-30T12:00:00.000Z`) |
   | `updatedAt` | string | mesma data em ISO                      |

5. Salve o documento.

### 4. Publicar as regras do Firestore

As regras em `firestore.rules` já suportam o role `company`. Garanta que a versão atual foi publicada:

```bash
firebase deploy --only firestore:rules
```

(Requer Firebase CLI configurado e projeto selecionado.)

---

## Exemplo completo: Supermercado Gomes

- **Email:** supermercadogomes@somoslidera.com.br  
- **Senha:** (a que você definiu no Authentication)  
- **UID:** I9ExAlAO2eSZ4evy8x978JnprsW2  
- **Empresa:** Supermercado Gomes → `companyId`: leoQVfLJcKs2wD3uviyk  

Após criar o usuário no Authentication e rodar o script (ou criar o documento em `user_roles`):

```bash
npx tsx scripts/set-user-role-company.ts I9ExAlAO2eSZ4evy8x978JnprsW2 leoQVfLJcKs2wD3uviyk supermercadogomes@somoslidera.com.br
```

esse usuário passará a:

- Ver apenas a empresa **Supermercado Gomes** no seletor (e não poderá trocar para outras).
- Acessar Painel, Avaliações e Histórico só com dados dessa empresa.
- Poder criar e editar avaliações apenas para essa empresa.
- Continuar vendo Configurações (critérios, setores, cargos, funcionários, metas) filtradas pela mesma empresa.
- **Não** ver "Todas as Empresas", "Nova Empresa" nem a área Admin (Empresas / Usuários).

---

## Como atribuir role Master (admin total)

Use o script de criação de admin (cria usuário + role) ou apenas o documento em `user_roles` se o usuário já existir.

- **Criar novo usuário master:**  
  `npx tsx scripts/create-admin-user.ts`  
  (cria usuário e documento em `user_roles` com `role: 'master'`.)

- **Usuário já existe:** no Firestore, crie/edite o documento na coleção **user_roles** com **Document ID** = UID do usuário e campos: `userId`, `email`, `role: 'master'`, `createdAt`, `updatedAt`.

Apenas usuários **master** (ou sem documento em `user_roles`, legado) podem criar empresas e alterar documentos em `user_roles`.

---

## Onde isso é usado no código

- **Regras:** `firestore.rules` – funções `isCompanyUser()`, `getUserCompanyId()`, `hasCompanyAccess(companyId)`.
- **Tipos e serviço:** `src/services/firebase.ts` – interface `UserRole` com `role: 'company'` e `companyId`.
- **Auth:** `src/contexts/AuthContext.tsx` – `isCompanyUser`, `allowedCompanyId`.
- **Empresas:** `src/contexts/CompanyContext.tsx` – auto-seleção da empresa quando `isCompanyUser` e `allowedCompanyId`.
- **UI:** `src/components/layout/CompanySelector.tsx` – esconde "Todas as Empresas" e "Nova Empresa" para usuário company; mostra só o nome da empresa quando há uma única empresa.

Para mais detalhes sobre o sistema (roles, segurança, Firestore), consulte a documentação geral em **Documentação** no app ou o arquivo de visão do projeto.
