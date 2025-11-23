/**
 * Pantalla de Favoritos
 * Muestra las propiedades marcadas como favoritas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { propertiesApi } from '../api';
import { Property } from '../types';
import { PropertyCard } from '../components';
import { colors, typography, spacing } from '../theme';

const FAVORITES_KEY = '@favorites';

const FavoritesScreen = () => {
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  // Recargar cuando vuelve a esta pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });

    return unsubscribe;
  }, [navigation]);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      setFavoriteIds(new Set(ids));

      // Cargar datos completos de las propiedades favoritas
      if (ids.length > 0) {
        const properties = await Promise.all(
          ids.map((id) => propertiesApi.getPropertyById(id).catch(() => null))
        );
        setFavorites(properties.filter((p): p is Property => p !== null));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const removeFavorite = async (propertyId: string) => {
    try {
      const newIds = Array.from(favoriteIds).filter((id) => id !== propertyId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newIds));
      loadFavorites();
    } catch (error) {
      Alert.alert('Error', 'No se pudo quitar de favoritos');
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⭐</Text>
      <Text style={styles.emptyText}>No tienes favoritos guardados</Text>
      <Text style={styles.emptySubtext}>
        Marca propiedades como favoritas para verlas aquí
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <PropertyCard
              property={item}
              onPress={() => handlePropertyPress(item)}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFavorite(item.id)}
            >
              <Text style={styles.removeButtonText}>✕ Quitar de favoritos</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  removeButton: {
    backgroundColor: colors.error + '20',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
  },
  removeButtonText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});

export default FavoritesScreen;
