/**
 * Pantalla de Perfil
 * Muestra información del usuario y opciones de cuenta
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { PrimaryButton } from '../components';
import { colors, typography, spacing } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Profile'>;

const ProfileScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nombre?.charAt(0).toUpperCase()}
            {user?.apellido?.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Información del usuario */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Información Personal</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>
            {user?.nombre} {user?.apellido || ''}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Rol:</Text>
          <Text style={[styles.value, styles.roleBadge]}>
            {user?.rol === 'ASESOR' ? 'Asesor Inmobiliario' : 'Administrador'}
          </Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Cuenta</Text>

        <PrimaryButton
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="danger"
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionsCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  roleBadge: {
    color: colors.primary,
  },
  button: {
    marginTop: spacing.sm,
  },
});

export default ProfileScreen;
