'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  authKey: number; // Key to force re-renders
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setAuthKey(prev => prev + 1); // Increment key on any auth change
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, authKey }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
