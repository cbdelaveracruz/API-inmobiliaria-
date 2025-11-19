// src/pages/NuevaPropiedad.tsx
import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import styles from './NuevaPropiedad.module.css';

// lo que mandamos al backend
interface NewPropiedadData {
  titulo: string;
  propietarioNombre: string;
  direccion?: string;
  api?: string;
  emails?: string;
  descripcion?: string;
  estado: 'PENDIENTE';
}

// lo que (según tu backend) nos devuelve al crear
interface CreatedPropiedadResponse {
  mensaje: string;
  expediente: {
    id: number;
    titulo: string;
    propietarioNombre: string;
    direccion?: string | null;
    api?: string | null;
    emails?: string | null;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    createdAt: string;
    descripcion?: string | null;
  };
}

const NuevaPropiedad: React.FC = () => {
  const [titulo, setTitulo] = useState('');
  const [propietarioNombre, setPropietarioNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [numeroApi, setNumeroApi] = useState('');
  const [emails, setEmails] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // validaciones básicas
    if (!titulo.trim()) {
      setError('El nombre de la propiedad es obligatorio');
      return;
    }
    if (!propietarioNombre.trim()) {
      setError('El nombre del propietario es obligatorio');
      return;
    }
    if (numeroApi.trim() && numeroApi.trim().length !== 16) {
      setError('El número de API debe tener exactamente 16 dígitos');
      return;
    }

    setLoading(true);

    try {
      // Verificar que hay token
      const token = localStorage.getItem('token');
      console.log('🔑 Token presente:', !!token);
      
      // armar body (temporalmente sin los campos nuevos hasta que backend esté listo)
      const body: any = {
        titulo: titulo.trim(),
        propietarioNombre: propietarioNombre.trim(),
        estado: 'PENDIENTE',
      };

      // TODO: Descomentar cuando el backend acepte estos campos
      // if (direccion.trim()) {
      //   body.direccion = direccion.trim();
      // }
      // if (numeroApi.trim()) {
      //   body.api = numeroApi.trim();
      // }
      // if (emails.trim()) {
      //   body.emails = emails.trim();
      // }
      if (descripcion.trim()) {
        body.descripcion = descripcion.trim();
      }

      console.log('📤 Enviando al backend:', body);

      // POST al backend
      const response = await apiClient.post<CreatedPropiedadResponse>('/expedientes', body);
      
      console.log('✅ Respuesta del backend:', response.data);

      // acá está el cambio importante 👉 tomamos el id desde response.data.expediente.id
      const propiedadId = response.data?.expediente?.id;

      if (!propiedadId) {
        // si por algún motivo no vino, volvemos a la lista
        navigate('/propiedades');
        return;
      }

      // redirigimos al detalle
      navigate(`/propiedades/${propiedadId}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.mensaje ||
          'Error al crear la propiedad. Intentá nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/propiedades');
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h1 className={styles.title}>Cargar nueva propiedad</h1>
          <p className={styles.subtitle}>
            Completá los datos de la propiedad. Después podrás subir los documentos necesarios.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="titulo" className={styles.label}>
                Nombre de la propiedad <span className={styles.required}>*</span>
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={loading}
                className={styles.input}
                placeholder="Ej: Casa en 9 de Julio"
                maxLength={200}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="propietarioNombre" className={styles.label}>
                Nombre del propietario <span className={styles.required}>*</span>
              </label>
              <input
                id="propietarioNombre"
                type="text"
                value={propietarioNombre}
                onChange={(e) => setPropietarioNombre(e.target.value)}
                disabled={loading}
                className={styles.input}
                placeholder="Ej: Juan Pérez"
                maxLength={150}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="direccion" className={styles.label}>
                Dirección <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                id="direccion"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                disabled={loading}
                className={styles.input}
                placeholder="Ej: Av. 9 de Julio 1234"
                maxLength={250}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="api" className={styles.label}>
                Número de API <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                id="api"
                type="text"
                value={numeroApi}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 16) {
                    setNumeroApi(value);
                  }
                }}
                disabled={loading}
                className={styles.input}
                placeholder="16 dígitos: 1234123412341234"
                maxLength={16}
              />
              {numeroApi && (
                <span className={styles.charCount}>{numeroApi.length}/16</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="emails" className={styles.label}>
                Email del propietario <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                id="emails"
                type="email"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                disabled={loading}
                className={styles.input}
                placeholder="Ej: propietario@email.com"
                maxLength={300}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="descripcion" className={styles.label}>
                Descripción <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={loading}
                className={styles.textarea}
                placeholder="Ej: Documentación que envió el cliente"
                rows={4}
                maxLength={500}
              />
              <span className={styles.charCount}>{descripcion.length}/500</span>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Creando...' : '✅ Crear propiedad'}
              </button>
            </div>
          </form>

          <div className={styles.infoBox}>
            <p className={styles.infoText}>
              📘 La propiedad se creará con estado <strong>PENDIENTE</strong>. Un revisor o
              administrador podrá cambiar el estado más adelante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevaPropiedad;
