/**
 * Script para criar o usuário admin no Firebase
 * 
 * Execute este script com: npx tsx scripts/create-admin-user.ts
 * 
 * Ou configure no package.json e execute: npm run create-admin
 */

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Configuração do Firebase (mesma do projeto)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDjyKAT2aZ4A3OrqaM8a6E6c0ht12BT278",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "lidera-skills.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "lidera-skills",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "lidera-skills.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "187326943178",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:187326943178:web:9f895ab33f246d83ca8933"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const email = "admin@somoslidera.com.br";
  const password = "admin123";

  try {
    console.log("🔐 Criando usuário admin...");
    
    // Cria o usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ Usuário criado com sucesso!");
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    
    // Cria o role master no Firestore
    const now = new Date().toISOString();
    await setDoc(doc(db, 'user_roles', user.uid), {
      userId: user.uid,
      email: email,
      role: 'master',
      createdAt: now,
      updatedAt: now
    });
    
    console.log("✅ Role 'master' atribuído ao usuário!");
    console.log("\n📋 Credenciais de acesso:");
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log("\n⚠️  IMPORTANTE: Guarde essas credenciais em local seguro!");
    
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("⚠️  Usuário admin já existe!");
      console.log("   Se você esqueceu a senha, redefina-a no console do Firebase.");
    } else {
      console.error("❌ Erro ao criar usuário:", error.message);
    }
    process.exit(1);
  }
}

createAdminUser();
