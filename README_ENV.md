# Configuração de Variáveis de Ambiente

Para maior segurança, as credenciais do Firebase devem ser configuradas através de variáveis de ambiente.

## Configuração Local

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e preencha com os valores reais:
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key_aqui
   VITE_FIREBASE_AUTH_DOMAIN=lidera-skills.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=lidera-skills
   VITE_FIREBASE_STORAGE_BUCKET=lidera-skills.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=187326943178
   VITE_FIREBASE_APP_ID=1:187326943178:web:9f895ab33f246d83ca8933
   ```

3. Reinicie o servidor de desenvolvimento após criar o arquivo `.env`

## Configuração em Produção (Vercel)

📋 **Guia Completo**: Veja o arquivo [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) para instruções detalhadas.

### Resumo Rápido:

1. Acesse o dashboard do projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

| Variável | Valor |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | `[sua_api_key]` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `lidera-skills.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `lidera-skills` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `lidera-skills.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `187326943178` |
| `VITE_FIREBASE_APP_ID` | `1:187326943178:web:9f895ab33f246d83ca8933` |

4. Selecione os ambientes (Production, Preview, Development)
5. Faça o redeploy

## Onde Encontrar a API Key

1. Firebase Console: https://console.firebase.google.com/
2. Selecione o projeto `lidera-skills`
3. Vá em **Project Settings** (ícone de engrenagem)
4. Role até **Your apps**
5. Na seção **SDK setup and configuration**, copie a `apiKey`

## Nota de Segurança

⚠️ **IMPORTANTE**: 
- O arquivo `.env` está no `.gitignore` e NÃO deve ser commitado no repositório
- As credenciais hardcoded em `src/services/firebase.ts` são apenas fallback para desenvolvimento local
- Em produção, sempre use variáveis de ambiente
- A API Key do Firebase é exposta no cliente, mas as regras do Firestore protegem os dados

