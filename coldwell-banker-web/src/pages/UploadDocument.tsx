// src/pages/UploadDocument.tsx
import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import styles from './UploadDocument.module.css';

interface DocumentFiles {
  titulo: File | null;
  dni: File | null;
  api: File | null;
  tgi: File | null;
  opcional: File | null;
}

const UploadDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [files, setFiles] = useState<DocumentFiles>({
    titulo: null,
    dni: null,
    api: null,
    tgi: null,
    opcional: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (tipo: keyof DocumentFiles) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setFiles(prev => ({ ...prev, [tipo]: null }));
      return;
    }

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      setError(`El archivo para ${tipo.toUpperCase()} debe ser PDF`);
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`El archivo para ${tipo.toUpperCase()} no puede superar los 10MB`);
      return;
    }

    setError('');
    setFiles(prev => ({ ...prev, [tipo]: file }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    if (!files.titulo || !files.dni || !files.api || !files.tgi) {
      setError('Todos los campos obligatorios deben tener un archivo (Título, DNI, API, TGI)');
      return;
    }

    if (!id) {
      setError('No se pudo identificar la propiedad');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      // Subir cada archivo con su tipo correspondiente
      const uploads = [
        { file: files.titulo, tipo: 'ESCRITURA' },
        { file: files.dni, tipo: 'DNI' },
        { file: files.api, tipo: 'API' },
        { file: files.tgi, tipo: 'TGI' },
      ];

      // Agregar archivo opcional si existe
      if (files.opcional) {
        uploads.push({ file: files.opcional, tipo: 'OTRO' });
      }

      // Subir todos los archivos
      for (const upload of uploads) {
        const formData = new FormData();
        formData.append('expedienteId', id);
        formData.append('tipo', upload.tipo);
        formData.append('archivo', upload.file!);

        await api.post('/documentos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setSuccess('Todos los documentos fueron subidos exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/propiedades/${id}`, {
          state: { refetch: true, message: 'Documentos subidos correctamente' }
        });
      }, 2000);

    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.mensaje ||
        'Error al subir los documentos. Intentá nuevamente.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/propiedades/${id}`);
  };

  const renderFileInput = (
    tipo: keyof DocumentFiles,
    label: string,
    obligatorio: boolean = false
  ) => (
    <div className={styles.fileInputWrapper}>
      <label htmlFor={`file-${tipo}`} className={styles.label}>
        {label} {obligatorio && <span className={styles.required}>*</span>}
      </label>
      
      <input
        id={`file-${tipo}`}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange(tipo)}
        className={styles.fileInput}
        disabled={uploading}
      />

      {files[tipo] && (
        <div className={styles.fileInfo}>
          <svg className={styles.fileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className={styles.fileDetails}>
            <p className={styles.fileName}>{files[tipo]!.name}</p>
            <p className={styles.fileSize}>
              {(files[tipo]!.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button onClick={handleCancel} className={styles.backButton}>
          ← Volver a la propiedad
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>Subir Documentación</h1>
          <p className={styles.subtitle}>
            Propiedad #{id}
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Documentos Obligatorios */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📋 Documentos Obligatorios</h3>
              <div className={styles.fieldsGrid}>
                {renderFileInput('titulo', 'Título de Propiedad', true)}
                {renderFileInput('dni', 'DNI de los Titulares', true)}
                {renderFileInput('api', 'API', true)}
                {renderFileInput('tgi', 'TGI', true)}
              </div>
            </div>

            {/* Documentos Opcionales */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📎 Documentos Opcionales</h3>
              <p className={styles.hint}>
                Plano de Obra, Plano de Mensura, Estado Parcelario, etc.
              </p>
              {renderFileInput('opcional', 'Otros Documentos', false)}
            </div>

            {error && (
              <div className={styles.error}>
                <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.success}>
                <svg className={styles.successIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelButton}
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Subiendo documentos...
                  </>
                ) : (
                  'Subir todos los documentos'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;
