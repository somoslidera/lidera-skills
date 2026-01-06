# Pre-Commit Validation

Este projeto inclui validações automáticas antes de commits e pushes para garantir que o código está pronto para deploy no Vercel.

## O que é validado

### Pre-Commit (lint-staged)
- **ESLint**: Verifica erros de lint nos arquivos TypeScript/TSX modificados
- **Prettier**: Formata arquivos JSON e Markdown

### Pre-Push (validação completa)
- **TypeScript**: Verifica erros de compilação TypeScript
- **ESLint**: Verifica erros de lint em todo o projeto
- **Build**: Executa o build completo para garantir que não há erros de compilação

### Pre-Commit Check (opcional)
Execute manualmente com `npm run pre-commit` para validar:
- ✅ Arquivos obrigatórios (package.json, tsconfig.json, vite.config.ts, vercel.json, firestore.rules)
- ✅ Scripts do package.json
- ✅ Compilação TypeScript
- ✅ ESLint
- ✅ Build completo
- ✅ Configuração do vercel.json (rewrites para SPA)
- ✅ Arquivos grandes (> 1MB)
- ✅ Secrets hardcoded no código
- ✅ Configuração do Firebase
- ✅ Console statements

## Como usar

### Commit normal
```bash
git add .
git commit -m "feat: nova funcionalidade"
```
O lint-staged executará automaticamente nos arquivos modificados.

### Push para deploy
```bash
git push
```
A validação completa será executada automaticamente antes do push.

### Executar validação manual
```bash
# Validação rápida (TypeScript + ESLint + Build)
npm run validate

# Validação completa (inclui todas as verificações)
npm run pre-commit
```

## Erros comuns do Vercel

### 1. Erros de TypeScript
- **Sintoma**: Build falha com erros de tipo
- **Solução**: Execute `npm run type-check` e corrija os erros

### 2. Erros de Build
- **Sintoma**: Build falha durante o deploy
- **Solução**: Execute `npm run build` localmente e corrija os erros

### 3. Rotas não funcionam após refresh
- **Sintoma**: 404 ao acessar rotas diretamente
- **Solução**: Verifique se `vercel.json` tem as rewrites configuradas

### 4. Variáveis de ambiente não encontradas
- **Sintoma**: Erro de variáveis de ambiente no deploy
- **Solução**: Configure as variáveis no painel do Vercel (Settings > Environment Variables)

### 5. Arquivos muito grandes
- **Sintoma**: Deploy lento ou falha
- **Solução**: Otimize imagens e assets, remova arquivos desnecessários

## Pular validações (não recomendado)

Se precisar pular as validações (não recomendado para produção):

```bash
# Pular pre-commit
git commit --no-verify -m "mensagem"

# Pular pre-push
git push --no-verify
```

## Configuração

### Ajustar lint-staged
Edite `package.json` > `lint-staged` para modificar quais arquivos são validados.

### Ajustar pre-commit check
Edite `scripts/pre-commit-check.js` para adicionar ou remover verificações.

## Troubleshooting

### Husky não está executando
```bash
# Reinstalar husky
npm run prepare
```

### Erro de permissão no script
```bash
# Dar permissão de execução
chmod +x scripts/pre-commit-check.js
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Validação muito lenta
- Use `lint-staged` (pre-commit) para validação rápida
- Validação completa (pre-push) só roda antes do push
- Para desenvolvimento, pode desabilitar temporariamente comentando o conteúdo dos hooks
