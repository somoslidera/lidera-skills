# Configuração de Variáveis de Ambiente

Para maior segurança, as credenciais do Firebase devem ser configuradas através de variáveis de ambiente.

## Configuração Local

1. Crie um arquivo `.env` na raiz do projeto (não commite este arquivo!)

2. Adicione as seguintes variáveis:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain_aqui
VITE_FIREBASE_PROJECT_ID=seu_project_id_aqui
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui
```

3. Reinicie o servidor de desenvolvimento após criar o arquivo `.env`

## Configuração em Produção (Vercel/Netlify)

### Vercel
1. Acesse o dashboard do projeto no Vercel
2. Vá em Settings > Environment Variables
3. Adicione cada variável com o prefixo `VITE_`
4. Faça o redeploy

### Netlify
1. Acesse o dashboard do projeto no Netlify
2. Vá em Site settings > Environment variables
3. Adicione cada variável com o prefixo `VITE_`
4. Faça o redeploy

## Nota de Segurança

⚠️ **IMPORTANTE**: O arquivo `.env` está no `.gitignore` e NÃO deve ser commitado no repositório.

As credenciais hardcoded em `src/services/firebase.ts` são apenas fallback para desenvolvimento local. Em produção, sempre use variáveis de ambiente.

