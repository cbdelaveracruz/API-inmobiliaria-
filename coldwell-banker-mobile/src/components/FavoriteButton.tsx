/**
 * Botón de favoritos reutilizable
 * Permite marcar/desmarcar propiedades como favoritas
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@favorites';

interface FavoriteButtonProps {
  propertyId: string;
  size?: 'small' | 'medium' | 'large';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  propertyId, 
  size = 'medium' 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [propertyId]);

  const checkFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      setIsFavorite(ids.includes(propertyId));
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      let ids: string[] = stored ? JSON.parse(stored) : [];

      if (isFavorite) {
        // Quitar de favoritos
        ids = ids.filter((id) => id !== propertyId);
      } else {
        // Agregar a favoritos
        ids.push(propertyId);
      }

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const sizeValue = size === 'small' ? 20 : size === 'large' ? 32 : 24;

  return (
    <TouchableOpacity onPress={toggleFavorite} style={styles.button}>
      <Text style={[styles.icon, { fontSize: sizeValue }]}>
        {isFavorite ? '⭐' : '☆'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
  icon: {
    color: '#F59E0B',
  },
});
