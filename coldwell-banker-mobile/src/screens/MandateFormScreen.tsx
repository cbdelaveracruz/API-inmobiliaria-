/**
 * Pantalla de formulario de mandato
 * Permite generar un mandato para una propiedad aprobada
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '../navigation/types';
import { propertiesApi, mandatesApi } from '../api';
import { Property, Mandate, CreateMandateDto, PropertyStatus } from '../types';
import { PrimaryButton, InputField, StatusBadge } from '../components';
import { colors, typography, spacing } from '../theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'MandateForm'>;

const MandateFormScreen = ({ route, navigation }: Props) => {
  const { propertyId } = route.params;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [existingMandate, setExistingMandate] = useState<Mandate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [plazoDias, setPlazoDias] = useState<30 | 60 | 90>(30);
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [propertyId]);

  const loadData = async () => {
    try {
      // Cargar propiedad
      const propertyData = await propertiesApi.getPropertyById(propertyId);
      setProperty(propertyData);

      // Verificar si la propiedad está aprobada
      if (propertyData.estado !== PropertyStatus.APPROVED) {
        Alert.alert(
          'Propiedad no aprobada',
          'Esta propiedad no está aprobada. No se puede generar el mandato.',
          [{ text: 'Volver', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Verificar si ya existe un mandato
      const mandate = await mandatesApi.getMandateByPropertyId(propertyId);
      if (mandate) {
        setExistingMandate(mandate);
        setMonto(mandate.monto.toString());
        setMoneda((mandate.moneda as 'ARS' | 'USD') || 'ARS');
        setPlazoDias(mandate.plazoDias as 30 | 60 | 90);
        setObservaciones(mandate.observaciones || '');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!monto.trim()) {
      newErrors.monto = 'El monto es requerido';
    } else if (isNaN(Number(monto)) || Number(monto) <= 0) {
      newErrors.monto = 'El monto debe ser un número válido mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const data: CreateMandateDto = {
        plazoDias: plazoDias,
        monto: Number(monto),
        moneda: moneda,
        observaciones: observaciones.trim() || undefined,
      };

      if (existingMandate) {
        // Actualizar mandato existente
        await mandatesApi.updateMandate(existingMandate.id, data);
        Alert.alert('Éxito', 'Mandato actualizado correctamente');
      } else {
        // Crear nuevo mandato
        const newMandate = await mandatesApi.createMandate(propertyId, data);
        console.log('✅ Mandato recibido en componente:', newMandate);
        
        if (!newMandate) {
          throw new Error('El backend no devolvió el mandato creado');
        }
        
        setExistingMandate(newMandate);
        
        // Construir URL del documento Word manualmente (el backend no la devuelve)
        const wordUrl = `http://192.168.1.5:3000/propiedades/${propertyId}/mandato/word`;
        
        Alert.alert(
          'Éxito',
          'Mandato generado correctamente. ¿Desea descargar el documento?',
          [
            { text: 'Después', style: 'cancel' },
            { 
              text: 'Descargar', 
              onPress: async () => {
                Alert.alert(
                  'Descargando documento',
                  'El documento del mandato se está abriendo. Puede tardar unos segundos.',
                  [{ text: 'Entendido' }]
                );
                // Pequeño delay para que el usuario vea el mensaje
                setTimeout(() => handleDownloadWord(wordUrl), 500);
              }
            }
          ]
        );
      }

      // Recargar datos
      await loadData();
    } catch (error: any) {
      Alert.alert(
        'Error',
        'No se pudo guardar el mandato. ' + (error.message || '')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadWord = async (wordUrl?: string) => {
    setIsDownloading(true);
    try {
      // Obtener el token de AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Error', 'No hay sesión activa. Por favor, inicie sesión nuevamente.');
        return;
      }
      
      let url = wordUrl;
      
      // Si no se pasa URL, construirla manualmente con el propertyId
      if (!url) {
        url = `http://192.168.1.5:3000/propiedades/${propertyId}/mandato/word`;
      }
      
      // Agregar el token como query parameter
      const urlWithToken = `${url}?token=${token}`;
      
      console.log('📄 Descargando documento Word:', urlWithToken);
      
      // Nombre del archivo y ruta en cache
      const fileName = `mandato-${propertyId}-${Date.now()}.docx`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      // Descargar el archivo usando la API legacy
      const downloadResult = await FileSystem.downloadAsync(urlWithToken, fileUri);
      
      console.log('✅ Documento descargado correctamente en:', downloadResult.uri);
      
      // Verificar si se puede compartir
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        // Compartir el documento Word (esto abrirá opciones para ver o enviar)
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: 'Mandato Word',
        });
      } else {
        Alert.alert(
          'Éxito',
          `Documento descargado correctamente en: ${downloadResult.uri}`
        );
      }
    } catch (error: any) {
      console.error('❌ Error al descargar documento:', error);
      Alert.alert(
        'Error',
        'No se pudo descargar el documento del mandato. ' + (error.message || '')
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Información de la propiedad */}
      <View style={styles.propertyCard}>
        <Text style={styles.propertyTitle}>{property.titulo}</Text>
        <Text style={styles.propertyAddress}>{property.direccion}</Text>
        <StatusBadge status={property.estado} size="small" />
      </View>

      {/* Formulario de mandato */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {existingMandate ? 'Editar Mandato' : 'Generar Mandato'}
        </Text>

        <InputField
          label={`Monto (${moneda})`}
          value={monto}
          onChangeText={(text) => {
            setMonto(text);
            setErrors({ ...errors, monto: '' });
          }}
          placeholder="Ej: 150000"
          keyboardType="numeric"
          error={errors.monto}
          required
        />

        {/* Selector de moneda */}
        <Text style={styles.label}>
          Moneda <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.plazoDiasContainer}>
          {(['ARS', 'USD'] as const).map((currency) => (
            <TouchableOpacity
              key={currency}
              style={[
                styles.plazoDiasButton,
                moneda === currency && styles.plazoDiasButtonSelected,
              ]}
              onPress={() => setMoneda(currency)}
            >
              <Text
                style={[
                  styles.plazoDiasButtonText,
                  moneda === currency && styles.plazoDiasButtonTextSelected,
                ]}
              >
                {currency}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selector de plazo en días */}
        <Text style={styles.label}>
          Plazo (días) <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.plazoDiasContainer}>
          {[30, 60, 90].map((dias) => (
            <TouchableOpacity
              key={dias}
              style={[
                styles.plazoDiasButton,
                plazoDias === dias && styles.plazoDiasButtonSelected,
              ]}
              onPress={() => setPlazoDias(dias as 30 | 60 | 90)}
            >
              <Text
                style={[
                  styles.plazoDiasButtonText,
                  plazoDias === dias && styles.plazoDiasButtonTextSelected,
                ]}
              >
                {dias} días
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <InputField
          label="Observaciones"
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Comentarios adicionales..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <PrimaryButton
          title={existingMandate ? 'Actualizar Mandato' : 'Generar Mandato'}
          onPress={handleSave}
          loading={isSaving}
          style={styles.button}
        />

        {existingMandate && existingMandate.urlPdf && (
          <PrimaryButton
            title="📄 Ver / Descargar Mandato"
            onPress={() => handleDownloadWord(existingMandate.urlPdf)}
            variant="secondary"
            loading={isDownloading}
            style={styles.button}
          />
        )}

        <PrimaryButton
          title="Volver"
          onPress={() => navigation.goBack()}
          variant="secondary"
          disabled={isSaving}
        />
      </View>

      {existingMandate && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✓ Este mandato fue creado el{' '}
            {new Date(existingMandate.createdAt).toLocaleDateString('es-AR')}
          </Text>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
  },
  propertyCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  propertyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  propertyAddress: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  form: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  plazoDiasContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  plazoDiasButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
  },
  plazoDiasButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  plazoDiasButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  plazoDiasButtonTextSelected: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  infoBox: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: {
    color: colors.success,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});

export default MandateFormScreen;
