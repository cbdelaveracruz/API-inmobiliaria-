/**
 * Tarjeta de propiedad para el listado
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Property } from '../types';
import { colors, typography, spacing } from '../theme';
import { StatusBadge } from './StatusBadge';
import { FavoriteButton } from './FavoriteButton';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onPress 
}) => {
  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {property.titulo}
          </Text>
          <StatusBadge status={property.estado} size="small" />
        </View>
        <FavoriteButton propertyId={property.id} size="medium" />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Dirección:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {property.direccion}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Propietario:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {property.propietarioNombre}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Asesor:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {property.asesorNombre || 'N/A'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>
            {formatDate(property.createdAt)}
          </Text>
        </View>
      </View>

      {property.observaciones && (
        <View style={styles.observations}>
          <Text style={styles.observationsText} numberOfLines={2}>
            {property.observaciones}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  content: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    width: 90,
  },
  value: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  observations: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  observationsText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

