import axios from 'axios';

// Crear instancia de axios con la URL base desde variables de entorno
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para guardar la función de clearAuth
let clearAuthCallback: (() => void) | null = null;

// Función para configurar el callback de logout desde el contexto
export const setAuthClearCallback = (callback: () => void) => {
  clearAuthCallback = callback;
};

// Interceptor para agregar el token JWT en cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si recibimos 401, el token expiró o es inválido
    if (error.response?.status === 401) {
      // Limpiar auth usando el callback si está disponible
      if (clearAuthCallback) {
        clearAuthCallback();
      } else {
        // Fallback: limpiar localStorage directamente
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper para obtener expedientes con filtros opcionales
interface FetchExpedientesParams {
  page?: number;
  limit?: number;
  asesorId?: number;
}

export const fetchExpedientes = async (params?: FetchExpedientesParams) => {
  const response = await api.get('/expedientes', { params });
  return response.data;
};

// Helper para crear mandato
export const crearMandato = (
  expedienteId: number,
  data: { plazoDias: number; monto: number; moneda?: string; observaciones?: string }
) => api.post(`/expedientes/${expedienteId}/mandato`, data);

// Helper para descargar documento Word del mandato (con datos autocompletados)
export const descargarMandatoWord = async (
  expedienteId: number,
  tituloExpediente: string
): Promise<void> => {
  const response = await api.get(`/expedientes/${expedienteId}/mandato/word-completo`, {
    responseType: 'blob',
  });

  // Crear slug del título para el nombre del archivo
  const slug = tituloExpediente
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '_') // reemplazar espacios/símbolos por _
    .replace(/^_+|_+$/g, ''); // quitar _ al inicio/final

  const filename = `mandato_${expedienteId}_${slug}.docx`;

  // Crear URL del blob y descargar
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Descarga un documento PDF de forma segura
 * Usa el endpoint protegido que valida permisos
 */
export const descargarDocumento = async (documentoId: number): Promise<void> => {
  try {
    const response = await api.get(`/documentos/${documentoId}/download`, {
      responseType: 'blob',
    });

    // Obtener el nombre del archivo del header Content-Disposition si existe
    const contentDisposition = response.headers['content-disposition'];
    let filename = `documento_${documentoId}.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Crear URL del blob y descargar
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar documento:', error);
    throw error;
  }
};

export default api;