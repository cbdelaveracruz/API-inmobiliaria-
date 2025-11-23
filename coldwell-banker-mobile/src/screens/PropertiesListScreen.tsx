/**
 * Pantalla de listado de propiedades
 * Muestra todas las propiedades según el rol del usuario
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi } from '../api';
import { Property, UserRole } from '../types';
import { PropertyCard } from '../components';
import { colors, typography, spacing } from '../theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertiesList'>;

const PropertiesListScreen = ({ navigation }: Props) => {
  const { role } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProperties = useCallback(async () => {
    try {
      let data: Property[];
      
      // ASESOR: solo sus propiedades
      // ADMIN: todas las propiedades
      if (role === UserRole.ADMIN) {
        data = await propertiesApi.getAllProperties();
      } else {
        data = await propertiesApi.getMyProperties();
      }

      setProperties(data);
    } catch (error: any) {
      Alert.alert(
        'Error',
        'No se pudieron cargar las propiedades. ' + (error.message || ''),
        [{ text: 'Aceptar' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Recargar cuando vuelve a esta pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProperties();
    });

    return unsubscribe;
  }, [navigation, loadProperties]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProperties();
  };

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const handleNewProperty = () => {
    navigation.navigate('PropertyForm', {});
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>
        {role === UserRole.ASESOR 
          ? 'No tienes propiedades registradas' 
          : 'No hay propiedades en el sistema'}
      </Text>
      <Text style={styles.emptySubtext}>
        Presiona el botón "NUEVA PROPIEDAD" para comenzar
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando propiedades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => handlePropertyPress(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          properties.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Botón para nueva propiedad */}
      <TouchableOpacity
        style={styles.newPropertyButton}
        onPress={handleNewProperty}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>NUEVA PROPIEDAD</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  newPropertyButton: {
    margin: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
});

export default PropertiesListScreen;
