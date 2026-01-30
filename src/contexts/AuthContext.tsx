import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, loginGoogle, loginEmailPassword, logout, getUserRole, type UserRole } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isMaster: boolean;
  /** Usuário com role 'company': acesso apenas à empresa vinculada (avaliações e dados da empresa) */
  isCompanyUser: boolean;
  /** ID da empresa permitida quando isCompanyUser é true; null caso contrário */
  allowedCompanyId: string | null;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserRole = async (userId: string) => {
    try {
      const role = await getUserRole(userId);
      setUserRole(role);
    } catch (error) {
      console.error('Erro ao carregar role do usuário:', error);
      setUserRole(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserRole(currentUser.uid);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    await loginGoogle();
  };

  const signInWithEmail = async (email: string, password: string) => {
    await loginEmailPassword(email, password);
  };

  const signOutUser = async () => {
    await logout();
    setUserRole(null);
  };

  const refreshUserRole = async () => {
    if (user) {
      await loadUserRole(user.uid);
    }
  };

  const isMaster = userRole?.role === 'master' || false;
  const isCompanyUser = userRole?.role === 'company' || false;
  const allowedCompanyId = userRole?.role === 'company' && userRole?.companyId ? userRole.companyId : null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      loading, 
      signIn, 
      signInWithEmail,
      signOut: signOutUser,
      isMaster,
      isCompanyUser,
      allowedCompanyId,
      refreshUserRole
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);