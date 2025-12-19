import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, addDoc, doc, getDoc, setDoc } from "firebase/firestore";

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDjyKAT2aZ4A3OrqaM8a6E6c0ht12BT278",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lidera-skills.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lidera-skills",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lidera-skills.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "187326943178",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:187326943178:web:9f895ab33f246d83ca8933"
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

// --- SISTEMA DE ROLES ---

export interface UserRole {
  id: string;
  userId: string;
  email: string;
  role: 'master' | 'admin' | 'gestor' | 'lider' | 'colaborador';
  companyIds?: string[]; // Empresas que o usuário tem acesso (se aplicável)
  createdAt: string;
  updatedAt: string;
}

/**
 * Busca o role do usuário no Firestore
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const roleDoc = await getDoc(doc(db, 'user_roles', userId));
    if (roleDoc.exists()) {
      return { id: roleDoc.id, ...roleDoc.data() } as UserRole;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar role do usuário:', error);
    return null;
  }
};

/**
 * Cria ou atualiza o role de um usuário
 * Apenas usuários master podem executar esta função
 */
export const setUserRole = async (userId: string, roleData: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const roleRef = doc(db, 'user_roles', userId);
    const existing = await getDoc(roleRef);
    
    const now = new Date().toISOString();
    
    if (existing.exists()) {
      // Atualiza role existente
      await setDoc(roleRef, {
        ...roleData,
        updatedAt: now
      }, { merge: true });
    } else {
      // Cria novo role
      await setDoc(roleRef, {
        ...roleData,
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (error) {
    console.error('Erro ao definir role do usuário:', error);
    throw error;
  }
};