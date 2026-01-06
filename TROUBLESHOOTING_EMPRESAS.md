# Troubleshooting - Empresas Não Aparecem

## Problema
As empresas cadastradas no Firebase não aparecem no seletor, mesmo após configurar as variáveis de ambiente.

## Checklist de Verificação

### 1. ✅ Variáveis de Ambiente no Vercel
- [ ] Todas as 6 variáveis estão configuradas no Vercel
- [ ] Os valores estão corretos (especialmente a API_KEY)
- [ ] As variáveis estão marcadas para Production, Preview e Development
- [ ] Foi feito um redeploy após configurar as variáveis

### 2. ✅ Autenticação
- [ ] Você está logado no sistema (botão de login no topo)
- [ ] O email do usuário aparece no header
- [ ] Não há erros de autenticação no console

### 3. ✅ Firestore Rules
- [ ] As regras do Firestore foram deployadas
- [ ] A regra para `companies` permite leitura para usuários autenticados
- [ ] Não há erros de permissão no console

### 4. ✅ Dados no Firebase
- [ ] As empresas existem na coleção `companies` no Firebase Console
- [ ] Os documentos têm os campos `name` e `createdAt`
- [ ] Não há caracteres especiais ou problemas nos nomes

## Como Verificar no Console do Navegador

Abra o console (F12) e procure por estas mensagens:

### ✅ Mensagens de Sucesso:
```
🔍 Tentando carregar empresas...
Usuário autenticado: seu-email@exemplo.com
✅ fetchCollection(companies): X documentos encontrados
✅ Companies loaded: [...]
```

### ❌ Mensagens de Erro:

**Erro de Permissão:**
```
❌ Erro ao buscar companies: ...
   Código do erro: permission-denied
   ⚠️ ERRO DE PERMISSÃO: Verifique se:
      1. Você está autenticado
      2. As regras do Firestore foram deployadas
      3. As regras permitem leitura para usuários autenticados
```

**Solução:** Deploy das regras do Firestore

**Erro de Autenticação:**
```
Aguardando autenticação...
```

**Solução:** Faça login no sistema

**Nenhum documento encontrado:**
```
✅ fetchCollection(companies): 0 documentos encontrados
```

**Solução:** Verifique se as empresas existem no Firebase Console

## Como Deployar as Regras do Firestore

1. **Via Firebase CLI:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Via Firebase Console:**
   - Acesse: https://console.firebase.google.com/
   - Selecione o projeto `lidera-skills`
   - Vá em **Firestore Database** → **Rules**
   - Cole o conteúdo do arquivo `firestore.rules`
   - Clique em **Publish**

## Teste Rápido

Execute no console do navegador:
```javascript
// Teste direto
import { debugCompanies } from './src/utils/debugCompanies';
debugCompanies();
```

Ou abra o console e verifique:
1. Se há erros de rede
2. Se há erros de permissão
3. Quantos documentos foram encontrados

## Solução Temporária (Desenvolvimento)

Se precisar testar rapidamente, você pode temporariamente permitir leitura pública (APENAS PARA TESTE):

```javascript
// firestore.rules - APENAS PARA TESTE LOCAL
match /companies/{companyId} {
  allow read: if true; // ⚠️ PERMISSIVO - REMOVA EM PRODUÇÃO
  allow write: if request.auth != null;
}
```

⚠️ **NUNCA use isso em produção!**

## Contato

Se o problema persistir após verificar todos os itens acima, compartilhe:
1. Screenshot do console do navegador
2. Screenshot das regras do Firestore
3. Screenshot das empresas no Firebase Console
4. Mensagens de erro específicas
