/**
 * Pantalla de formulario de propiedad
 * Permite crear o editar una propiedad
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

const PropertyFormScreen = ({ route, navigation }: Props) => {
  const { propertyId } = route.params || {};
  const isEdit = !!propertyId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [api, setApi] = useState('');
  const [propietario, setPropietario] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  
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
      const property = await propertiesApi.getPropertyById(propertyId!);
      
      setNombre(property.titulo);
      setDireccion(property.direccion);
      setApi(property.api || '');
      setPropietario(property.propietarioNombre);
      setEmailContacto(property.emails || '');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar la propiedad');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }
    if (!propietario.trim()) {
      newErrors.propietario = 'El propietario es requerido';
    }
    if (emailContacto && !/\S+@\S+\.\S+/.test(emailContacto)) {
      newErrors.emailContacto = 'Email inválido';
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
      const data: CreatePropertyDto = {
        titulo: nombre.trim(),
        direccion: direccion.trim(),
        api: api.trim() || undefined,
        propietarioNombre: propietario.trim(),
        emails: emailContacto.trim() || undefined,
      };

      console.log('📝 Datos a enviar:', data);

      let savedProperty: Property;
      
      if (isEdit && propertyId) {
        savedProperty = await propertiesApi.updateProperty(propertyId, data);
        Alert.alert('Éxito', 'Propiedad actualizada correctamente');
      } else {
        savedProperty = await propertiesApi.createProperty(data);
        Alert.alert('Éxito', 'Propiedad creada correctamente. Estado: Pendiente');
      }

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
      for (const doc of selectedDocuments) {
        const formData = new FormData();
        formData.append('file', {
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType || 'application/octet-stream',
        } as any);

        await propertiesApi.uploadDocument(propertyId, formData);
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      // No bloqueamos el guardado si falla la subida de documentos
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
          label="Dirección"
          value={direccion}
          onChangeText={(text) => {
            setDireccion(text);
            setErrors({ ...errors, direccion: '' });
          }}
          placeholder="Ej: Av. Santa Fe 1234, CABA"
          error={errors.direccion}
          required
        />

        <InputField
          label="API / Identificador"
          value={api}
          onChangeText={setApi}
          placeholder="Opcional"
        />

        <InputField
          label="Propietario"
          value={propietario}
          onChangeText={(text) => {
            setPropietario(text);
            setErrors({ ...errors, propietario: '' });
          }}
          placeholder="Nombre del propietario"
          error={errors.propietario}
          required
        />

        <InputField
          label="Email de contacto"
          value={emailContacto}
          onChangeText={(text) => {
            setEmailContacto(text);
            setErrors({ ...errors, emailContacto: '' });
          }}
          placeholder="contacto@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.emailContacto}
        />

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
  documentsSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
