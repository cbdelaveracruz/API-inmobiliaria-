/**
 * Stack de Propiedades
 * Contiene todas las pantallas relacionadas con propiedades
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from './types';
import { colors, typography } from '../theme';
import {
  PropertiesListScreen,
  PropertyDetailScreen,
  PropertyFormScreen,
  MandateFormScreen,
} from '../screens';

const Stack = createNativeStackNavigator<PropertiesStackParamList>();

export const PropertiesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.backgroundCard,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="PropertiesList" 
        component={PropertiesListScreen}
        options={{
          title: 'Propiedades',
        }}
      />
      <Stack.Screen 
        name="PropertyDetail" 
        component={PropertyDetailScreen}
        options={{
          title: 'Detalle de Propiedad',
        }}
      />
      <Stack.Screen 
        name="PropertyForm" 
        component={PropertyFormScreen}
        options={({ route }) => ({
          title: route.params?.propertyId ? 'Editar Propiedad' : 'Nueva Propiedad',
        })}
      />
      <Stack.Screen 
        name="MandateForm" 
        component={MandateFormScreen}
        options={{
          title: 'Generar Mandato',
        }}
      />
    </Stack.Navigator>
  );
};
