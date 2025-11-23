/**
 * Bottom Tab Navigator
 * Navegación principal con 3 tabs: Home, Propiedades, Favoritos
 */

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from './types';
import { FavoritesScreen } from '../screens';
import { PropertiesStack } from './PropertiesStack';
import { HomeStack } from './HomeStack';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack}
        options={{
          headerShown: false,
          title: 'Inicio',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="PropertiesTab" 
        component={PropertiesStack}
        options={{
          title: 'Propiedades',
          tabBarLabel: 'Propiedades',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🏢</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="FavoritesTab" 
        component={FavoritesScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.backgroundCard,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.semibold,
          },
          title: 'Favoritos',
          tabBarLabel: 'Favoritos',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>⭐</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
