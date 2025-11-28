// src/pages/NuevaPropiedad.tsx
import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import styles from './NuevaPropiedad.module.css';

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

// Interfaz de Propietario basada en el Word
interface Propietario {
  nombreCompleto: string;
  dni: string;
  fechaNacimiento: string;
  domicilioReal: string;
  celular: string;
  cuil: string;
  estadoCivil: string;
  email: string;
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

  // Estado para propietarios dinámicos
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

  const [propietarios, setPropietarios] = useState<Propietario[]>([emptyOwner()]);

  // Manejar cambios en cantidad de propietarios
  const handleCantidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCantidad = parseInt(e.target.value);

    setPropietarios((prev) => {
      const copy = [...prev];
      while (copy.length < newCantidad) {
        copy.push(emptyOwner());
      }
      if (copy.length > newCantidad) {
        return copy.slice(0, newCantidad);
      }
      return copy;
    });
  };

  // Actualizar un campo específico de un propietario
  const updatePropietario = (index: number, field: keyof Propietario, value: string) => {
    setPropietarios((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

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
      const token = localStorage.getItem('token');
      console.log('🔑 Token presente:', !!token);

      const body: any = {
        titulo: titulo.trim(),
        propietarioNombre: propietarioNombre.trim(),
        estado: 'PENDIENTE',
      };

      if (descripcion.trim()) {
        body.descripcion = descripcion.trim();
      }

      body.propietarios = propietarios;

      console.log('📤 Enviando al backend:', body);

      const response = await apiClient.post<CreatedPropiedadResponse>('/expedientes', body);

      console.log('✅ Respuesta del backend:', response.data);

      const propiedadId = response.data?.expediente?.id;

      if (!propiedadId) {
        navigate('/propiedades');
        return;
      }

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
            {/* ========== DATOS DE LA PROPIEDAD ========== */}
            <h2 className={styles.sectionTitle}>Datos de la propiedad</h2>

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

            {/* ========== DIVISOR ========== */}
            <div className={styles.sectionDivider} />

            {/* ========== PROPIETARIOS ========== */}
            <div className={styles.ownersHeaderRow}>
              <div>
                <h2 className={styles.sectionTitle}>Propietarios</h2>
                <p className={styles.sectionSubtitle}>
                  Completá los datos de los propietarios de la propiedad.
                </p>
              </div>

              <div className={styles.ownersCount}>
                <label htmlFor="cantidadPropietarios">Cantidad</label>
                <select
                  id="cantidadPropietarios"
                  value={propietarios.length}
                  onChange={handleCantidadChange}
                  disabled={loading}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            </div>

            {/* Lista de propietarios */}
            <div className={styles.ownersList}>
              {propietarios.map((propietario, index) => (
                <div key={index} className={styles.ownerCard}>
                  {/* Header de la card */}
                  <div className={styles.ownerCardHeader}>
                    <span className={styles.ownerChip}>Propietario {index + 1}</span>
                    {propietario.nombreCompleto && (
                      <span className={styles.ownerNamePreview}>
                        {propietario.nombreCompleto}
                      </span>
                    )}
                  </div>

                  {/* Grid de 2 columnas */}
                  <div className={styles.ownerGrid}>
                    {/* Nombre y Apellido - full width */}
                    <div className={styles.ownerGridFull}>
                      <label htmlFor={`nombreCompleto-${index}`} className={styles.label}>
                        Nombre y Apellido
                      </label>
                      <input
                        id={`nombreCompleto-${index}`}
                        type="text"
                        value={propietario.nombreCompleto}
                        onChange={(e) =>
                          updatePropietario(index, 'nombreCompleto', e.target.value)
                        }
                        disabled={loading}
                        className={styles.input}
                        placeholder="Ej: Juan Carlos Pérez"
                      />
                    </div>

                    {/* DNI */}
                    <div>
                      <label htmlFor={`dni-${index}`} className={styles.label}>
                        DNI
                      </label>
                      <input
                        id={`dni-${index}`}
                        type="text"
                        value={propietario.dni}
                        onChange={(e) => updatePropietario(index, 'dni', e.target.value)}
                        disabled={loading}
                        className={styles.input}
                        placeholder="Ej: 12345678"
                      />
                    </div>

                    {/* Fecha y lugar de nacimiento */}
                    <div>
                      <label htmlFor={`fechaNacimiento-${index}`} className={styles.label}>
                        Fecha y lugar de nacimiento
                      </label>
                      <input
                        id={`fechaNacimiento-${index}`}
                        type="text"
                        value={propietario.fechaNacimiento}
                        onChange={(e) =>
                          updatePropietario(index, 'fechaNacimiento', e.target.value)
                        }
                        disabled={loading}
                        className={styles.input}
                        placeholder="Ej: 12/05/1985, Buenos Aires"
                      />
                    </div>

                    {/* Domicilio real - full width */}
                    <div className={styles.ownerGridFull}>
                      <label htmlFor={`domicilioReal-${index}`} className={styles.label}>
                        Domicilio real
                      </label>
                      <input
                        id={`domicilioReal-${index}`}
                        type="text"
                        value={propietario.domicilioReal}
                        onChange={(e) =>
                          updatePropietario(index, 'domicilioReal', e.target.value)
                        }
                        disabled={loading}
                        className={styles.input}
                        placeholder="Ej: Calle 123, Piso 4, Depto B"
                      />
                    </div>

                    {/* Celular */}
                    <div>
                      <label htmlFor={`celular-${index}`} className={styles.label}>
                        Celular
                      </label>
                      <input
                        id={`celular-${index}`}
                        type="text"
                        value={propietario.celular}
                        onChange={(e) => updatePropietario(index, 'celular', e.target.value)}
                        disabled={loading}
                        className={styles.input}
                        placeholder="Ej: +54 9 11 1234-5678"
                      />
                    </div>

                    {/* C.U.I.L / C.U.I.T / C.D.I */}
                    <div>
                      <label htmlFor={`cuil-${index}`} className={styles.label}>
                        C.U.I.L / C.U.I.T / C.D.I
                      </label>
                      <input
                        id={`cuil-${index}`}
                        type="text"
                        value={propietario.cuil}
                        onChange={(e) => updatePropietario(index, 'cuil', e.target.value)}
                        disabled={loading}
                        className={styles.input}
                        placeholder="Ej: 20-12345678-9"
                      />
                    </div>

                    {/* Estado civil */}
                    <div>
                      <label htmlFor={`estadoCivil-${index}`} className={styles.label}>
                        Estado civil
                      </label>
                      <input
                        id={`estadoCivil-${index}`}
                        type="text"
                        value={propietario.estadoCivil}
                        onChange={(e) =>
                          updatePropietario(index, 'estadoCivil', e.target.value)
                        }
                        disabled={loading}
                        className={styles.input}
                        placeholder="Ej: Soltero, Casado, Divorciado"
                      />
                    </div>

                    {/* Correo electrónico */}
                    <div>
                      <label htmlFor={`email-${index}`} className={styles.label}>
                        Correo electrónico
                      </label>
                      <input
                        id={`email-${index}`}
                        type="email"
                        value={propietario.email}
                        onChange={(e) => updatePropietario(index, 'email', e.target.value)}
                        disabled={loading}
                        className={styles.input}
                        placeholder="Ej: propietario@email.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
