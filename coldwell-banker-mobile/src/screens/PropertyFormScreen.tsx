/**
 * Pantalla de formulario de propiedad
 * Permite crear o editar una propiedad con múltiples propietarios
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '../navigation/types';
import { propertiesApi } from '../api';
import { CreatePropertyDto, Property } from '../types';
import { PrimaryButton, InputField } from '../components';
import { colors, typography, spacing } from '../theme';
import * as DocumentPicker from 'expo-document-picker';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyForm'>;

// Tipo de propietario (igual que en la versión web)
type Propietario = {
  nombreCompleto: string;
  dni: string;
  fechaNacimiento: string;
  domicilioReal: string;
  celular: string;
  cuil: string;
  estadoCivil: string;
  email: string;
};

const PropertyFormScreen = ({ route, navigation }: Props) => {
  const { propertyId } = route.params || {};
  const isEdit = !!propertyId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Campos del formulario de la propiedad (igual que versión web)
  const [nombre, setNombre] = useState('');
  const [tipoPropiedad, setTipoPropiedad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [api, setApi] = useState('');
  const [partidaInmobiliaria, setPartidaInmobiliaria] = useState('');
  const [localidad, setLocalidad] = useState('');
  
  // Helper para crear un propietario vacío
  const emptyOwner = (): Propietario => ({
    nombreCompleto: '',
    dni: '',
    fechaNacimiento: '',
    domicilioReal: '',
    celular: '',
    cuil: '',
    estadoCivil: '',
    email: '',
  });

  // Estado para propietarios (comienza con 1)
  const [propietarios, setPropietarios] = useState<Propietario[]>([emptyOwner()]);
  
  // Documentos seleccionados
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    setIsLoading(true);
    try {
      const property: any = await propertiesApi.getPropertyById(propertyId!);
      
      setNombre(property.titulo || '');
      setTipoPropiedad(property.tipoPropiedad || '');
      setDireccion(property.direccion || '');
      setApi(property.api || '');
      setPartidaInmobiliaria(property.partidaInmobiliaria || '');
      setLocalidad(property.localidad || '');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar la propiedad');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio en un campo específico de un propietario
  const handleChangeOwnerField = (
    index: number,
    field: keyof Propietario,
    value: string
  ) => {
    setPropietarios(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Agregar propietario (máximo 3)
  const handleAddOwner = () => {
    if (propietarios.length < 3) {
      setPropietarios(prev => [...prev, emptyOwner()]);
    }
  };

  // Eliminar propietario (mínimo 1)
  const handleRemoveOwner = (index: number) => {
    if (propietarios.length > 1) {
      setPropietarios(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!tipoPropiedad.trim()) {
      newErrors.tipoPropiedad = 'El tipo de propiedad es requerido';
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
      const data: any = {
        titulo: nombre.trim(),
        tipoPropiedad: tipoPropiedad.trim(),
        estado: 'PENDIENTE',
      };

      if (direccion.trim()) {
        data.direccion = direccion.trim();
      }
      if (api.trim()) {
        data.api = api.trim();
      }
      if (partidaInmobiliaria.trim()) {
        data.partidaInmobiliaria = partidaInmobiliaria.trim();
      }
      if (localidad.trim()) {
        data.localidad = localidad.trim();
      }

      // Agregar el array de propietarios
      data.propietarios = propietarios;

      console.log('📝 Datos a enviar:', data);

      let savedProperty: Property;
      
      if (isEdit && propertyId) {
        savedProperty = await propertiesApi.updateProperty(propertyId, data);
        Alert.alert('Éxito', 'Propiedad actualizada correctamente');
      } else {
        savedProperty = await propertiesApi.createProperty(data);
        Alert.alert('Éxito', 'Propiedad creada correctamente. Estado: Pendiente');
      }

      console.log('✅ Propiedad guardada:', savedProperty);
      console.log('🆔 ID de la propiedad:', savedProperty.id);

      // Subir documentos si hay
      if (selectedDocuments.length > 0) {
        await uploadDocuments(savedProperty.id);
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Error',
        'No se pudo guardar la propiedad. ' + (error.message || '')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const uploadDocuments = async (propertyId: string) => {
    try {
      console.log(`📤 Uploading ${selectedDocuments.length} document(s) for property ${propertyId}`);
      
      for (const doc of selectedDocuments) {
        console.log('📄 Uploading:', doc.name);
        await propertiesApi.uploadDocument(propertyId, doc);
      }
      
      console.log('✅ All documents uploaded successfully');
    } catch (error: any) {
      console.error('❌ Error uploading documents:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Re-throw to show error to user
      throw new Error('Error al subir documentos: ' + (error.message || 'Error desconocido'));
    }
  };

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setSelectedDocuments([...selectedDocuments, ...result.assets]);
      }
    } catch (error) {
      console.error('Error picking documents:', error);
    }
  };

  const removeDocument = (index: number) => {
    setSelectedDocuments(selectedDocuments.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        {/* ===== DATOS DE LA PROPIEDAD ===== */}
        <Text style={styles.mainSectionTitle}>Datos de la propiedad</Text>

        <InputField
          label="Nombre de la propiedad"
          value={nombre}
          onChangeText={(text) => {
            setNombre(text);
            setErrors({ ...errors, nombre: '' });
          }}
          placeholder="Ej: Depto 2 ambientes - Palermo"
          error={errors.nombre}
          required
        />

        <InputField
          label="Tipo de propiedad"
          value={tipoPropiedad}
          onChangeText={(text) => {
            setTipoPropiedad(text);
            setErrors({ ...errors, tipoPropiedad: '' });
          }}
          placeholder="Ej: Casa, Departamento, Terreno"
          error={errors.tipoPropiedad}
          required
        />

        <InputField
          label="Calle (o lotes, número, entre calles)"
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Ej: Av. 9 de Julio 1234"
        />

        <InputField
          label="Número de API"
          value={api}
          onChangeText={setApi}
          placeholder="16 dígitos (opcional)"
          keyboardType="numeric"
          maxLength={16}
        />

        <InputField
          label="Partida Inmobiliaria"
          value={partidaInmobiliaria}
          onChangeText={setPartidaInmobiliaria}
          placeholder="Opcional"
        />

        <InputField
          label="Localidad / Provincia / CP"
          value={localidad}
          onChangeText={setLocalidad}
          placeholder="Ej: Buenos Aires, CABA, CP 1425"
        />

        {/* ===== SECCIÓN DE PROPIETARIOS ===== */}
        <View style={styles.ownersSection}>
          <View style={styles.ownersSectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Propietarios</Text>
              <Text style={styles.sectionSubtitle}>
                Completá los datos de los propietarios de la propiedad.
              </Text>
            </View>
            <Text style={styles.ownersCount}>{propietarios.length}/3</Text>
          </View>

          {/* Lista de propietarios */}
          {propietarios.map((propietario, index) => (
            <View key={index} style={styles.ownerCard}>
              {/* Header de la card */}
              <View style={styles.ownerCardHeader}>
                <Text style={styles.ownerChip}>Propietario {index + 1}</Text>
                {propietario.nombreCompleto && (
                  <Text style={styles.ownerNamePreview} numberOfLines={1}>
                    {propietario.nombreCompleto}
                  </Text>
                )}
              </View>

              {/* Campos del propietario */}
              <InputField
                label="Nombre y Apellido"
                value={propietario.nombreCompleto}
                onChangeText={(text) => 
                  handleChangeOwnerField(index, 'nombreCompleto', text)
                }
                placeholder="Ej: Juan Carlos Pérez"
              />

              <InputField
                label="DNI"
                value={propietario.dni}
                onChangeText={(text) => 
                  handleChangeOwnerField(index, 'dni', text)
                }
                placeholder="Ej: 12345678"
                keyboardType="numeric"
              />

              <InputField
                label="Fecha y lugar de nacimiento"
                value={propietario.fechaNacimiento}
                onChangeText={(text) => 
                  handleChangeOwnerField(index, 'fechaNacimiento', text)
                }
                placeholder="Ej: 12/05/1985, Buenos Aires"
              />

              <InputField
                label="Domicilio real"
                value={propietario.domicilioReal}
                onChangeText={(text) => 
                  handleChangeOwnerField(index, 'domicilioReal', text)
                }
                placeholder="Ej: Calle 123, Piso 4, Depto B"
              />

              <InputField
                label="Celular"
                value={propietario.celular}
                onChangeText={(text) => 
                  handleChangeOwnerField(index, 'celular', text)
                }
                placeholder="Ej: +54 9 11 1234-5678"
                keyboardType="phone-pad"
              />

              <InputField
                label="C.U.I.L / C.U.I.T / C.D.I"
                value={propietario.cuil}
                onChangeText={(text) => 
                  handleChangeOwnerField(index, 'cuil', text)
                }
                placeholder="Ej: 20-12345678-9"
              />

              <InputField
                label="Estado civil"
                value={propietario.estadoCivil}
                onChangeText={(text) => 
                  handleChangeOwnerField(index, 'estadoCivil', text)
                }
                placeholder="Ej: Soltero, Casado, Divorciado"
              />

              <InputField
                label="Correo electrónico"
                value={propietario.email}
                onChangeText={(text) => 
                  handleChangeOwnerField(index, 'email', text)
                }
                placeholder="Ej: propietario@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Botón eliminar (solo si hay más de 1 propietario) */}
              {propietarios.length > 1 && (
                <TouchableOpacity
                  style={styles.removeOwnerButton}
                  onPress={() => handleRemoveOwner(index)}
                >
                  <Text style={styles.removeOwnerText}>✕ Eliminar propietario</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Botón agregar propietario */}
          {propietarios.length < 3 && (
            <TouchableOpacity
              style={styles.addOwnerButton}
              onPress={handleAddOwner}
            >
              <Text style={styles.addOwnerText}>+ Agregar propietario</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sección de documentos */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documentación</Text>
          
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickDocuments}
          >
            <Text style={styles.uploadButtonText}>
              📎 Adjuntar documentos
            </Text>
          </TouchableOpacity>

          {selectedDocuments.length > 0 && (
            <View style={styles.documentsList}>
              {selectedDocuments.map((doc, index) => (
                <View key={index} style={styles.documentItem}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeDocument(index)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <PrimaryButton
            title={isEdit ? 'Actualizar' : 'Crear Propiedad'}
            onPress={handleSave}
            loading={isSaving}
            style={styles.saveButton}
          />

          <PrimaryButton
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="secondary"
            disabled={isSaving}
          />
        </View>

        {!isEdit && (
          <Text style={styles.infoText}>
            💡 Al crear la propiedad, quedará en estado "Pendiente" hasta que un administrador la apruebe.
          </Text>
        )}
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
  form: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainSectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Estilos de la sección de propietarios
  ownersSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ownersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 0,
  },
  ownersCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Estilos de las cards de propietarios
  ownerCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ownerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  ownerChip: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#bfdbfe',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.45)',
    overflow: 'hidden',
  },
  ownerNamePreview: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  removeOwnerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  removeOwnerText: {
    color: '#ef4444',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  addOwnerButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addOwnerText: {
    color: colors.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  // Resto de estilos existentes
  documentsSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  uploadButton: {
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
  },
  documentsList: {
    marginTop: spacing.sm,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  documentName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
  },
  removeButton: {
    color: colors.error,
    fontSize: typography.sizes.lg,
    paddingHorizontal: spacing.sm,
  },
  buttonsContainer: {
    gap: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});

export default PropertyFormScreen;
