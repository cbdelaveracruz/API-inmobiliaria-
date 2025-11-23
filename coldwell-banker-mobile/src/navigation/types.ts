/**
 * Tipos de navegación
 * Define las rutas y parámetros de cada stack
 */

import { Property } from '../types';

/**
 * Stack de autenticación (sin sesión)
 */
export type AuthStackParamList = {
  Login: undefined;
};

/**
 * Bottom Tab Navigator
 */
export type MainTabsParamList = {
  HomeTab: undefined;
  PropertiesTab: undefined;
  FavoritesTab: undefined;
};

/**
 * Stack de Home (dentro del tab)
 */
export type HomeStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

/**
 * Stack de Propiedades (dentro del tab)
 */
export type PropertiesStackParamList = {
  PropertiesList: undefined;
  PropertyDetail: { propertyId: string };
  PropertyForm: { propertyId?: string };
  MandateForm: { propertyId: string };
};

/**
 * Navegación raíz
 */
export type RootStackParamList = AuthStackParamList & {
  AppStack: undefined;
};
