// src/components/ChangeStatusModal.tsx
import React, { useState, type FormEvent } from 'react';
import api from '../services/api';
import styles from './ChangeStatusModal.module.css';

interface ChangeStatusModalProps {
  expedienteId: number;
  estadoActual: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  onClose: () => void;
  onSuccess: (nuevoEstado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO', nuevasObservaciones: string | null, nuevosComentariosRevisor?: string | null) => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  expedienteId,
  estadoActual,
  onClose,
  onSuccess,
}) => {
  const [nuevoEstado, setNuevoEstado] = useState<'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>(estadoActual);
  const [observaciones, setObservaciones] = useState('');
  const [comentariosRevisor, setComentariosRevisor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validación: si es RECHAZADO, las observaciones son obligatorias
    if (nuevoEstado === 'RECHAZADO' && observaciones.trim() === '') {
      setError('Las observaciones son obligatorias cuando el estado es RECHAZADO');
      return;
    }

    setLoading(true);

    try {
      const body = {
        estado: nuevoEstado,
        observaciones: nuevoEstado === 'APROBADO' ? null : observaciones.trim() || null,
        comentariosRevisor: nuevoEstado === 'APROBADO' ? comentariosRevisor.trim() || null : null,
      };

      await api.put(`/expedientes/${expedienteId}/estado`, body);

      // Llamar al callback de éxito
      onSuccess(nuevoEstado, body.observaciones, body.comentariosRevisor);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.mensaje ||
        'Error al cambiar el estado del expediente'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Cambiar Estado del Expediente</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className={styles.currentStatus}>
          <span className={styles.label}>Estado actual:</span>
          <span className={`${styles.badge} ${styles[estadoActual.toLowerCase()]}`}>
            {estadoActual}
          </span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="estado" className={styles.inputLabel}>
              Nuevo estado
            </label>
            <select
              id="estado"
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value as 'PENDIENTE' | 'APROBADO' | 'RECHAZADO')}
              className={styles.select}
              disabled={loading}
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="APROBADO">APROBADO</option>
              <option value="RECHAZADO">RECHAZADO</option>
            </select>
          </div>

          {nuevoEstado === 'APROBADO' ? (
            <div className={styles.inputGroup}>
              <label htmlFor="comentariosRevisor" className={styles.inputLabel}>
                Comentario de aprobación
                <span className={styles.optional}> (opcional)</span>
              </label>
              <textarea
                id="comentariosRevisor"
                value={comentariosRevisor}
                onChange={(e) => setComentariosRevisor(e.target.value)}
                className={styles.textarea}
                rows={4}
                placeholder="Podés dejar un comentario sobre la aprobación..."
                disabled={loading}
              />
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <label htmlFor="observaciones" className={styles.inputLabel}>
                Observaciones
                {nuevoEstado === 'RECHAZADO' && (
                  <span className={styles.required}> (obligatorio)</span>
                )}
              </label>
              <textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className={styles.textarea}
                rows={4}
                placeholder={
                  nuevoEstado === 'RECHAZADO'
                    ? 'Indicá el motivo del rechazo...'
                    : 'Observaciones adicionales (opcional)'
                }
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeStatusModal;
