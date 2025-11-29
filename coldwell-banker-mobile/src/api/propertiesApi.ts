/**
 * Servicio de propiedades
 * Conecta con los endpoints de propiedades del backend
 */

import { apiClient } from './client';
import { Property, CreatePropertyDto, UpdatePropertyStatusDto } from '../types';

/**
 * API de propiedades
 * ⚠️ Ajustar rutas según tu backend real
 */
export const propertiesApi = {
  /**
   * Obtener propiedades del asesor logueado
   * ⚠️ Ruta ejemplo: GET /propiedades/mis-propiedades
   */
  getMyProperties: async (): Promise<Property[]> => {
    console.log('🏠 Obteniendo propiedades del usuario...');
    try {
      const response = await apiClient.get<{ data: Property[] }>('/propiedades');
      console.log('✅ Propiedades recibidas:', response.data);
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ Error al obtener propiedades:', error);
      console.error('❌ Error response:', error.response);
      throw error;
    }
  },

  /**
   * Obtener todas las propiedades (solo ADMIN)
   * ⚠️ Ruta ejemplo: GET /propiedades
   */
  getAllProperties: async (): Promise<Property[]> => {
    console.log('🏠 Obteniendo todas las propiedades (ADMIN)...');
    try {
      const response = await apiClient.get<{ data: Property[] }>('/propiedades');
      console.log('✅ Propiedades recibidas:', response.data);
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ Error al obtener propiedades:', error);
      console.error('❌ Error response:', error.response);
      throw error;
    }
  },

  /**
   * Obtener una propiedad por ID
   * ⚠️ Ruta ejemplo: GET /propiedades/:id
   */
  getPropertyById: async (id: string): Promise<Property> => {
    const response = await apiClient.get<Property>(`/propiedades/${id}`);
    return response.data;
  },

  /**
   * Crear nueva propiedad
   * ⚠️ Ruta ejemplo: POST /propiedades
   */
  createProperty: async (data: CreatePropertyDto): Promise<Property> => {
    console.log('🏗️ Creando nueva propiedad:', data);
    try {
      const response = await apiClient.post<any>('/propiedades', data);
      console.log('✅ Propiedad creada:', response.data);
      
      // El backend devuelve { mensaje: "...", expediente: {...} }
      // Necesitamos extraer el expediente (propiedad)
      return response.data.expediente || response.data;
    } catch (error: any) {
      console.error('❌ Error al crear propiedad:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      throw error;
    }
  },

  /**
   * Actualizar propiedad existente
   * ⚠️ Ruta ejemplo: PUT /propiedades/:id
   */
  updateProperty: async (id: string, data: Partial<CreatePropertyDto>): Promise<Property> => {
    const response = await apiClient.put<Property>(`/propiedades/${id}`, data);
    return response.data;
  },

  /**
   * Actualizar estado de propiedad (ADMIN)
   * PUT /propiedades/:id/estado
   */
  updatePropertyStatus: async (id: string, data: UpdatePropertyStatusDto): Promise<Property> => {
    console.log('🔄 Actualizando estado de propiedad:', id, data);
    try {
      const response = await apiClient.put<{ data: Property }>(`/propiedades/${id}/estado`, data);
      console.log('✅ Estado actualizado:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error al actualizar estado:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Subir documento a una propiedad
   * ⚠️ Ruta ejemplo: POST /documentos
   */
  uploadDocument: async (propertyId: string, file: any): Promise<any> => {
    console.log('📤 Uploading document for property:', propertyId);
    console.log('📄 File info:', { uri: file.uri, name: file.name, type: file.mimeType });
    
    const formData = new FormData();
    
    // ⚠️ IMPORTANTE: El ID debe ir ANTES del archivo para que Multer lo pueda leer
    // en req.body al procesar el destino del archivo.
    formData.append('expedienteId', propertyId);
    
    // React Native's FormData expects object with uri, name, and type
    formData.append('archivo', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/pdf',
    } as any);

    console.log('📦 FormData prepared, sending request to /documentos...');

    try {
      const response = await apiClient.post(
        '/documentos',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Let Axios handle the FormData transformation automatically for React Native
        }
      );
      console.log('✅ Document uploaded successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Eliminar propiedad
   * ⚠️ Ruta ejemplo: DELETE /propiedades/:id
   */
  deleteProperty: async (id: string): Promise<void> => {
    await apiClient.delete(`/propiedades/${id}`);
  },
};
