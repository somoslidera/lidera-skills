# Configuração de Variáveis de Ambiente no Vercel

## Variáveis Necessárias

Configure as seguintes variáveis de ambiente no Vercel:

### Como Configurar no Vercel:

1. Acesse o dashboard do seu projeto no Vercel: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada uma das variáveis abaixo:

---

## Variáveis do Firebase

| Nome da Variável | Valor | Descrição |
|-----------------|-------|-----------|
| `VITE_FIREBASE_API_KEY` | `[SUA_API_KEY_AQUI]` | API Key do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `lidera-skills.firebaseapp.com` | Domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | `lidera-skills` | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | `lidera-skills.firebasestorage.app` | Bucket de armazenamento |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `187326943178` | ID do remetente de mensagens |
| `VITE_FIREBASE_APP_ID` | `1:187326943178:web:9f895ab33f246d83ca8933` | ID da aplicação web |

---

## Passo a Passo no Vercel:

1. **Acesse o Projeto:**
   - Vá para https://vercel.com/dashboard
   - Selecione o projeto `lidera-skills`

2. **Abra as Configurações:**
   - Clique em **Settings** (no topo)
   - Clique em **Environment Variables** (no menu lateral)

3. **Adicione as Variáveis:**
   - Clique em **Add New**
   - Para cada variável:
     - **Key**: Cole o nome da variável (ex: `VITE_FIREBASE_API_KEY`)
     - **Value**: Cole o valor correspondente
     - **Environment**: Selecione **Production**, **Preview** e **Development** (ou apenas Production se preferir)
   - Clique em **Save**

4. **Redeploy:**
   - Após adicionar todas as variáveis, vá em **Deployments**
   - Clique nos três pontos (...) do último deployment
   - Selecione **Redeploy**
   - Ou faça um novo commit/push para trigger automático

---

## Valores para Copiar e Colar:

### 1. VITE_FIREBASE_API_KEY
```
[COLE A API KEY AQUI - você mencionou que está "hidden for security"]
```

### 2. VITE_FIREBASE_AUTH_DOMAIN
```
lidera-skills.firebaseapp.com
```

### 3. VITE_FIREBASE_PROJECT_ID
```
lidera-skills
```

### 4. VITE_FIREBASE_STORAGE_BUCKET
```
lidera-skills.firebasestorage.app
```

### 5. VITE_FIREBASE_MESSAGING_SENDER_ID
```
187326943178
```

### 6. VITE_FIREBASE_APP_ID
```
1:187326943178:web:9f895ab33f246d83ca8933
```

---

## Verificação:

Após configurar, você pode verificar se as variáveis estão sendo carregadas:

1. Faça um redeploy
2. Abra o console do navegador na aplicação
3. Verifique se não há erros relacionados ao Firebase
4. As empresas devem aparecer no seletor

---

## Nota Importante:

⚠️ **A API Key do Firebase não é um segredo completo** - ela é exposta no cliente. No entanto, as regras de segurança do Firestore (`firestore.rules`) são o que realmente protegem seus dados. Certifique-se de que as regras estão deployadas e configuradas corretamente.

---

## Onde Encontrar a API Key:

Se você não tiver a API Key, pode encontrá-la em:
1. Firebase Console: https://console.firebase.google.com/
2. Selecione o projeto `lidera-skills`
3. Vá em **Project Settings** (ícone de engrenagem)
4. Role até **Your apps**
5. Na seção **SDK setup and configuration**, você verá a configuração completa
6. A `apiKey` está no objeto `firebaseConfig`
