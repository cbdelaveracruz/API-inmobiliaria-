/**
 * Tipos de datos principales del dominio inmobiliario
 * Deben coincidir con los modelos del backend
 */

/**
 * Roles de usuario en el sistema
 */
export enum UserRole {
  ASESOR = 'ASESOR',
  ADMIN = 'ADMIN',
}

/**
 * Estados posibles de una propiedad
 */
export enum PropertyStatus {
  PENDING = 'PENDIENTE',
  APPROVED = 'APROBADO',
  REJECTED = 'RECHAZADO',
}

/**
 * Usuario del sistema
 */
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  rol: UserRole;
}

/**
 * Respuesta del endpoint de login
 */
export interface LoginResponse {
  token: string;
  usuario: User;
}

/**
 * Propiedad inmobiliaria
 * AJUSTAR campos según tu modelo real del backend
 */
export interface Property {
  id: string;
  titulo: string;
  direccion: string;
  api?: string; // identificador API
  propietarioNombre: string;
  emails?: string;
  asesorId: string;
  asesor?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
  estado: PropertyStatus;
  observaciones?: string;
  documentos?: PropertyDocument[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Documento asociado a una propiedad
 */
export interface PropertyDocument {
  id: string;
  nombre: string;
  url: string;
  tipo?: string;
  uploadedAt: string;
}

/**
 * Mandato de una propiedad
 */
export interface Mandate {
  id: string;
  propiedadId: string;
  monto: number;
  moneda?: string; // ARS, USD, etc.
  plazoDias: number;
  observaciones?: string;
  urlPdf?: string; // Link al PDF del mandato generado
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/actualizar propiedad
 */
export interface CreatePropertyDto {
  titulo: string;
  direccion: string;
  api?: string;
  propietarioNombre: string;
  emails?: string;
  // Agregar más campos según tu modelo
}

/**
 * Datos para actualizar estado de propiedad
 */
export interface UpdatePropertyStatusDto {
  estado: PropertyStatus;
  observaciones?: string;
}

/**
 * Datos para crear mandato
 */
export interface CreateMandateDto {
  plazoDias: number;
  monto: number;
  moneda?: string;
  observaciones?: string;
}
