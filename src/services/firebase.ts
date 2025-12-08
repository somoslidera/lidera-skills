import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, addDoc } from "firebase/firestore";

// Configuração fornecida por você
const firebaseConfig = {
  apiKey: "AIzaSyDjyKAT2aZ4A3OrqaM8a6E6c0ht12BT278",
  authDomain: "lidera-skills.firebaseapp.com",
  projectId: "lidera-skills",
  storageBucket: "lidera-skills.firebasestorage.app",
  messagingSenderId: "187326943178",
  appId: "1:187326943178:web:9f895ab33f246d83ca8933"
};

// Inicialização
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// --- FUNÇÕES DE AJUDA ---

// Login
export const loginGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro no login:", error);
    throw error;
  }
};

// Logout
export const logout = () => signOut(auth);

// NOVA: Função para criar uma empresa
export const createCompany = async (name: string) => {
  await addDoc(collection(db, 'companies'), {
    name,
    createdAt: new Date().toISOString()
  });
};

// ATUALIZADA: Busca filtrada por empresa
export const fetchCollection = async (collectionName: string, companyId?: string | null) => {
  try {
    let q;
    
    // Se passar companyId, filtra. Se for 'users' ou 'companies', traz tudo (ou filtra por user)
    if (companyId && collectionName !== 'companies' && collectionName !== 'users') {
      q = query(collection(db, collectionName), where("companyId", "==", companyId));
    } else {
      q = collection(db, collectionName);
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Erro ao buscar ${collectionName}:`, error);
    return [];
  }
};