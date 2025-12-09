/**
 * Configuración del cliente Axios
 * 
 * ⚠️ IMPORTANTE: Configurar la URL base de tu backend aquí
 * Ejemplo: http://localhost:3000/api o https://tu-backend.com/api
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ URL del backend en Railway (producción)
const API_BASE_URL = 'https://api-inmobiliaria-production.up.railway.app';

/**
 * Instancia de Axios configurada
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

/**
 * Interceptor para agregar el token de autenticación automáticamente
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Obtener el token guardado
      const token = await AsyncStorage.getItem('accessToken');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor para manejar errores de respuesta
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si el token expiró (401), podrías redirigir al login
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
      // Aquí podrías emitir un evento o usar navigation para ir al login
    }
    
    return Promise.reject(error);
  }
);
