/**
 * Home Stack Navigator
 * Stack que contiene Home, Perfil y Ajustes
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeScreen, ProfileScreen, SettingsScreen } from '../screens';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack = () => {
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
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Ajustes' }}
      />
    </Stack.Navigator>
  );
};
