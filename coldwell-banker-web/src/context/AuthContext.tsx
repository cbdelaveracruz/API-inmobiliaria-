// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { setAuthClearCallback } from '../services/api';
import api from '../services/api';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'REVISOR' | 'ASESOR';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedAuth = useRef(false); // 🔒 Prevenir múltiples llamadas

  const clearAuth = () => {
    setUser(null);
  };

  // Verificar si hay sesión válida al montar el componente (UNA SOLA VEZ)
  useEffect(() => {
    // 🛑 Si ya checamos, no volver a hacerlo
    if (hasCheckedAuth.current) {
      return;
    }
    
    const checkAuth = async () => {
      hasCheckedAuth.current = true; // Marcar ANTES de la llamada
      
      try {
        const response = await api.get('/auth/me');
        if (response.data?.usuario) {
          setUser(response.data.usuario);
        }
      } catch (error) {
        console.log('No hay sesión activa');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    setAuthClearCallback(clearAuth);
  }, []); // ← DEPENDENCIAS VACÍAS: solo ejecutar UNA VEZ

  const setAuth = (newUser: AuthUser) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
