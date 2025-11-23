/**
 * Pantalla Home
 * Pantalla de bienvenida con acceso a propiedades
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { PrimaryButton } from '../components';
import { HomeStackParamList } from '../navigation/types';
import { colors, typography, spacing } from '../theme';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

const HomeScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <View style={styles.container}>
      {/* Header con botones de navegación */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.headerIcon}>👤</Text>
          <Text style={styles.headerText}>Perfil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.headerIcon}>⚙️</Text>
          <Text style={styles.headerText}>Ajustes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Ícono */}
        <Text style={styles.icon}>🏢</Text>

        {/* Saludo personalizado */}
        <Text style={styles.greeting}>
          ¡Hola, {user?.nombre}!
        </Text>

        {/* Subtítulo */}
        <Text style={styles.subtitle}>
          {user?.rol === 'ASESOR' ? 'Asesor Inmobiliario' : 'Administrador'}
        </Text>

        {/* Descripción */}
        <Text style={styles.description}>
          Gestiona propiedades, mandatos y toda la información necesaria desde tu dispositivo móvil.
        </Text>

        {/* Botón principal: PROPIEDADES */}
        <PrimaryButton
          title="VER PROPIEDADES"
          onPress={() => (navigation.getParent() as any)?.navigate('PropertiesTab')}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  headerIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  headerText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  icon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing['2xl'],
    maxWidth: 300,
  },
  button: {
    width: '100%',
    maxWidth: 300,
  },
});

export default HomeScreen;
