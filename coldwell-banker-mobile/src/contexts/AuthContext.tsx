/**
 * Context de autenticación
 * Maneja el estado global de sesión del usuario
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { authApi } from '../api';

interface AuthContextData {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Cargar usuario y token guardados al iniciar la app
   */
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Iniciar sesión
   */
  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login con:', email);
      console.log('📍 URL del backend:', 'http://192.168.1.9:3000');
      
      const response = await authApi.login(email, password);
      
      console.log('✅ Login exitoso:', response);
      console.log('✅ Token recibido:', response.token);
      console.log('✅ Usuario recibido:', response.usuario);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('accessToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.usuario));
      
      // Actualizar estado
      setToken(response.token);
      setUser(response.usuario);
    } catch (error: any) {
      console.error('❌ Error completo de login:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      
      // Propagar el error para que la UI lo maneje
      if (error.response) {
        throw new Error(error.response?.data?.message || `Error ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://192.168.1.9:3000');
      } else {
        throw new Error(error.message || 'Error al iniciar sesión');
      }
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      // Llamar al endpoint de logout si existe
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar datos locales
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
    }
  };

  const value: AuthContextData = {
    user,
    token,
    role: user?.rol || null,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
