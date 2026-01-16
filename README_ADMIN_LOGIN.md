# Login por Email e Senha - Configuração

Este documento explica como configurar e usar o login por email e senha no sistema Lidera Skills.

## ✅ Implementação Realizada

O sistema agora suporta dois métodos de login:
1. **Login com Google** (método original)
2. **Login com Email e Senha** (novo método)

## 🔐 Criar Usuário Admin

Para criar o usuário admin com as credenciais solicitadas (admin/admin123), você tem duas opções:

### Opção 1: Usar o Console do Firebase (Recomendado)

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione o projeto `lidera-skills`
3. Vá em **Authentication** > **Users**
4. Clique em **Add user**
5. Preencha:
   - **Email**: `admin@somoslidera.com.br`
   - **Password**: `admin123`
6. Clique em **Add user**

7. Depois, vá em **Firestore Database** e crie um documento na coleção `user_roles`:
   - **Document ID**: Use o UID do usuário criado (você encontra no Authentication)
   - **Campos**:
     ```json
     {
       "userId": "<UID_DO_USUARIO>",
       "email": "admin@somoslidera.com.br",
       "role": "master",
       "createdAt": "2024-01-01T00:00:00.000Z",
       "updatedAt": "2024-01-01T00:00:00.000Z"
     }
     ```

### Opção 2: Usar Script Node.js (Avançado)

1. Certifique-se de ter as variáveis de ambiente configuradas ou modifique o script com suas credenciais
2. Execute:
   ```bash
   node scripts/create-admin-user.js
   ```

**Nota**: O script requer que o Firebase esteja configurado corretamente e pode precisar de ajustes dependendo do seu ambiente.

## 📝 Credenciais de Acesso

Após criar o usuário, você pode fazer login com:

- **Email**: `admin@somoslidera.com.br`
- **Senha**: `admin123`

## 🎨 Interface de Login

A tela de login agora possui:

- **Formulário de Email e Senha**: Campos principais para login (padrão)
- **Botão do Google**: Localizado abaixo do formulário, separado por um divisor "ou"

O formulário de email/senha é o método principal, com o Google como alternativa abaixo.

## 🔒 Segurança

- As senhas são armazenadas de forma segura pelo Firebase Authentication
- O sistema usa autenticação padrão do Firebase com hash de senhas
- Recomenda-se alterar a senha padrão após o primeiro acesso

## 🐛 Solução de Problemas

### Erro: "Email já está em uso"
- O usuário já existe. Você pode redefinir a senha no console do Firebase ou usar outro email.

### Erro: "Senha muito fraca"
- O Firebase pode exigir senhas mais fortes. Tente usar uma senha com pelo menos 6 caracteres (o Firebase aceita senhas curtas, mas pode ter políticas configuradas).

### Não consigo fazer login
- Verifique se o usuário foi criado corretamente no Firebase Authentication
- Verifique se o role foi criado na coleção `user_roles` do Firestore
- Verifique se as regras do Firestore permitem leitura da coleção `user_roles`

## 📚 Arquivos Modificados

- `src/services/firebase.ts` - Adicionada função `loginEmailPassword`
- `src/contexts/AuthContext.tsx` - Adicionado método `signInWithEmail`
- `src/App.tsx` - Interface de login atualizada com formulário de email/senha
- `scripts/create-admin-user.js` - Script utilitário para criar usuário admin
