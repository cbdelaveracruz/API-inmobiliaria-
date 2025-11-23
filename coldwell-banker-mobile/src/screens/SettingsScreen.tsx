/**
 * Pantalla de Ajustes
 * Configuración de la aplicación
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/types';
import { colors, typography, spacing } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation }: Props) => {
  const settingsOptions = [
    {
      title: 'Notificaciones',
      subtitle: 'Configurar alertas y notificaciones',
      icon: '🔔',
      onPress: () => {},
    },
    {
      title: 'Privacidad',
      subtitle: 'Gestionar privacidad y seguridad',
      icon: '🔒',
      onPress: () => {},
    },
    {
      title: 'Tema',
      subtitle: 'Personalizar apariencia',
      icon: '🎨',
      onPress: () => {},
    },
    {
      title: 'Idioma',
      subtitle: 'Cambiar idioma de la aplicación',
      icon: '🌐',
      onPress: () => {},
    },
    {
      title: 'Acerca de',
      subtitle: 'Información de la aplicación',
      icon: 'ℹ️',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Configuración</Text>

        {settingsOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={option.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Versión 1.0.0</Text>
        <Text style={styles.versionSubtext}>Coldwell Banker Mobile</Text>
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
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  optionArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  versionText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  versionSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.textDisabled,
  },
});

export default SettingsScreen;
