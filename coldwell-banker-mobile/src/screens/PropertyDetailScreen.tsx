/**
 * Pantalla de detalle de propiedad
 * Muestra información completa y permite cambiar estado (ADMIN) o generar mandato (ASESOR)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi, mandatesApi } from '../api';
import { Property, PropertyStatus, UserRole, UpdatePropertyStatusDto } from '../types';
import { PrimaryButton, StatusBadge, InputField, FavoriteButton } from '../components';
import { colors, typography, spacing } from '../theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyDetail'>;

const PropertyDetailScreen = ({ route, navigation }: Props) => {
  const { propertyId } = route.params;
  const { role } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estado para ADMIN
  const [selectedStatus, setSelectedStatus] = useState<PropertyStatus>(PropertyStatus.PENDING);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const data = await propertiesApi.getPropertyById(propertyId);
      setProperty(data);
      setSelectedStatus(data.estado);
      setObservaciones(data.observaciones || '');
    } catch (error: any) {
      Alert.alert(
        'Error',
        'No se pudo cargar la propiedad. ' + (error.message || ''),
        [
          { text: 'Volver', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!property) return;

    setIsSaving(true);
    try {
      const updateData: UpdatePropertyStatusDto = {
        estado: selectedStatus,
      };

      await propertiesApi.updatePropertyStatus(property.id, updateData);
      
      Alert.alert(
        'Éxito',
        'Estado de la propiedad actualizado correctamente',
        [{ text: 'Aceptar' }]
      );

      // Recargar datos
      loadProperty();
    } catch (error: any) {
      Alert.alert(
        'Error',
        'No se pudo actualizar el estado. ' + (error.message || ''),
        [{ text: 'Aceptar' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMandate = () => {
    if (!property) return;

    // Verificar que la propiedad esté aprobada
    if (property.estado !== PropertyStatus.APPROVED) {
      Alert.alert(
        'Propiedad no aprobada',
        'Para generar el mandato, la propiedad debe estar APROBADA por un administrador.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    navigation.navigate('MandateForm', { propertyId: property.id });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenDocument = async (doc: any) => {
    try {
      // Construir URL completa del documento
      const baseUrl = 'http://192.168.1.9:3000'; // Debe coincidir con tu API
      const documentUrl = doc.rutaArchivo ? `${baseUrl}/${doc.rutaArchivo}` : doc.url;
      
      console.log('📄 Abriendo documento:', documentUrl);
      
      const canOpen = await Linking.canOpenURL(documentUrl);
      
      if (canOpen) {
        await Linking.openURL(documentUrl);
      } else {
        Alert.alert(
          'Error',
          'No se puede abrir este documento. Asegúrate de tener una aplicación para ver PDFs instalada.'
        );
      }
    } catch (error) {
      console.error('Error al abrir documento:', error);
      Alert.alert(
        'Error',
        'No se pudo abrir el documento. Verifica tu conexión.'
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Propiedad no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header con estado y favorito */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{property.titulo}</Text>
          <StatusBadge status={property.estado} size="large" />
        </View>
        <FavoriteButton propertyId={property.id} size="large" />
      </View>

      {/* Información básica */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información básica</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dirección:</Text>
          <Text style={styles.infoValue}>{property.direccion}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Propietario:</Text>
          <Text style={styles.infoValue}>{property.propietarioNombre}</Text>
        </View>

        {property.emails && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{property.emails}</Text>
          </View>
        )}

        {property.api && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API:</Text>
            <Text style={styles.infoValue}>{property.api}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Asesor:</Text>
          <Text style={styles.infoValue}>{property.asesor?.nombre || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Creada:</Text>
          <Text style={styles.infoValue}>{formatDate(property.createdAt)}</Text>
        </View>
      </View>

      {/* Observaciones actuales */}
      {property.observaciones && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observaciones</Text>
          <Text style={styles.observationsText}>{property.observaciones}</Text>
        </View>
      )}

      {/* Documentos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentación</Text>
        
        {property.documentos && property.documentos.length > 0 ? (
          <View>
            {property.documentos.map((doc: any, index: number) => (
              <TouchableOpacity 
                key={doc.id || index} 
                style={styles.documentItem}
                onPress={() => handleOpenDocument(doc)}
                activeOpacity={0.7}
              >
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>📄</Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {doc.nombre || `Documento ${index + 1}`}
                  </Text>
                  <Text style={styles.documentType}>
                    {doc.tipo || 'PDF'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No hay documentos adjuntos</Text>
        )}
      </View>

      {/* Sección ADMIN: Cambiar estado */}
      {role === UserRole.ADMIN && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administración</Text>
          
          <Text style={styles.label}>Estado</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                selectedStatus === PropertyStatus.APPROVED && styles.statusButtonActive,
                { borderColor: colors.statusApproved }
              ]}
              onPress={() => setSelectedStatus(PropertyStatus.APPROVED)}
            >
              <Text style={[
                styles.statusButtonText,
                selectedStatus === PropertyStatus.APPROVED && styles.statusButtonTextActive,
                { color: selectedStatus === PropertyStatus.APPROVED ? colors.white : colors.statusApproved }
              ]}>
                Aprobado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusButton,
                selectedStatus === PropertyStatus.REJECTED && styles.statusButtonActive,
                { borderColor: colors.statusRejected }
              ]}
              onPress={() => setSelectedStatus(PropertyStatus.REJECTED)}
            >
              <Text style={[
                styles.statusButtonText,
                selectedStatus === PropertyStatus.REJECTED && styles.statusButtonTextActive,
                { color: selectedStatus === PropertyStatus.REJECTED ? colors.white : colors.statusRejected }
              ]}>
                Rechazado
              </Text>
            </TouchableOpacity>
          </View>

          <InputField
            label="Observaciones"
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Agregar comentarios u observaciones..."
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <PrimaryButton
            title="Guardar cambios"
            onPress={handleUpdateStatus}
            loading={isSaving}
            style={styles.button}
          />
        </View>
      )}

      {/* Sección ASESOR: Generar mandato */}
      {role === UserRole.ASESOR && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mandato</Text>
          
          {property.estado === PropertyStatus.APPROVED ? (
            <>
              <Text style={styles.infoText}>
                Esta propiedad está aprobada. Puedes generar el mandato.
              </Text>
              <PrimaryButton
                title="Generar Mandato"
                onPress={handleGenerateMandate}
                style={styles.button}
              />
            </>
          ) : (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Para generar el mandato, la propiedad debe estar APROBADA por un administrador.
              </Text>
              <Text style={styles.warningSubtext}>
                Estado actual: {property.estado}
              </Text>
            </View>
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  section: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  observationsText: {
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  statusButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  warningBox: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 8,
    padding: spacing.md,
  },
  warningText: {
    fontSize: typography.sizes.base,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  warningSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  documentIconText: {
    fontSize: typography.sizes.xl,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  documentType: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  chevron: {
    fontSize: typography.sizes['2xl'],
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

export default PropertyDetailScreen;
