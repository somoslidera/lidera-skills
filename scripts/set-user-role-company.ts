/**
 * Atribui role 'company' a um usuário existente (acesso apenas à empresa vinculada).
 * O usuário já deve existir no Firebase Authentication.
 *
 * Uso: npx tsx scripts/set-user-role-company.ts [UID] [companyId] [email]
 * Exemplo (Supermercado Gomes):
 *   npx tsx scripts/set-user-role-company.ts I9ExAlAO2eSZ4evy8x978JnprsW2 leoQVfLJcKs2wD3uviyk supermercadogomes@somoslidera.com.br
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDjyKAT2aZ4A3OrqaM8a6E6c0ht12BT278",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "lidera-skills.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "lidera-skills",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "lidera-skills.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "187326943178",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:187326943178:web:9f895ab33f246d83ca8933"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setUserRoleCompany() {
  const uid = process.argv[2] || "I9ExAlAO2eSZ4evy8x978JnprsW2";
  const companyId = process.argv[3] || "leoQVfLJcKs2wD3uviyk";
  const email = process.argv[4] || "supermercadogomes@somoslidera.com.br";

  try {
    console.log("🔐 Atribuindo role 'company' ao usuário...");
    console.log(`   UID: ${uid}`);
    console.log(`   Empresa (companyId): ${companyId}`);
    console.log(`   Email: ${email}`);

    const now = new Date().toISOString();
    await setDoc(doc(db, "user_roles", uid), {
      userId: uid,
      email,
      role: "company",
      companyId,
      createdAt: now,
      updatedAt: now
    });

    console.log("✅ Role 'company' atribuída com sucesso!");
    console.log("   O usuário terá acesso apenas às avaliações e dados da empresa vinculada.");
    process.exit(0);
  } catch (error: unknown) {
    console.error("❌ Erro:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

setUserRoleCompany();
