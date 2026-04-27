// src/pages/NuevaPropiedad.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../services/api';
import { logger } from '../utils/logger';
import { sanitizeString, validateLength } from '../utils/validation';
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
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [titulo, setTitulo] = useState('');
  const [tipoPropiedad, setTipoPropiedad] = useState('');
  const [tipoOperacion, setTipoOperacion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [partidaInmobiliaria, setPartidaInmobiliaria] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
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

  // Cargar datos en modo edición
  useEffect(() => {
    if (!isEditMode || !id) return;

    const cargarPropiedad = async () => {
      try {
        setLoadingData(true);
        const response = await apiClient.get(`/expedientes/${id}`);
        const data = response.data;

        // Cargar datos básicos
        setTitulo(data.titulo || '');
        setTipoPropiedad(data.tipoPropiedad || '');
        setTipoOperacion(data.tipoOperacion || '');
        setDireccion(data.direccion || '');
        setPartidaInmobiliaria(data.partidaInmobiliaria || '');
        setLocalidad(data.localidad || '');

        // Cargar propietarios si existen
        if (data.propietarios) {
          try {
            const propietariosData = JSON.parse(data.propietarios);
            if (Array.isArray(propietariosData) && propietariosData.length > 0) {
              setPropietarios(propietariosData);
            }
          } catch (e) {
            logger.debug('Error parsing propietarios:', e);
          }
        }

        setLoadingData(false);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Error al cargar la propiedad');
        setLoadingData(false);
      }
    };

    cargarPropiedad();
  }, [id, isEditMode]);

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

    // Sanitizar inputs
    const tituloSanitized = sanitizeString(titulo);
    const tipoSanitized = sanitizeString(tipoPropiedad);
    const operacionSanitized = sanitizeString(tipoOperacion);
    const direccionSanitized = sanitizeString(direccion);
    const partidaSanitized = sanitizeString(partidaInmobiliaria);
    const localidadSanitized = sanitizeString(localidad);

    // Validaciones mejoradas
    if (!tituloSanitized || !validateLength(tituloSanitized, 3, 200)) {
      setError('El nombre de la propiedad debe tener entre 3 y 200 caracteres');
      return;
    }
    if (!tipoSanitized) {
      setError('El tipo de propiedad es obligatorio');
      return;
    }
    if (!operacionSanitized) {
      setError('El tipo de operación es obligatorio');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      logger.debug('🔑 Token presente:', !!token);

      const body: any = {
        titulo: tituloSanitized,
        tipoPropiedad: tipoSanitized,
        tipoOperacion: operacionSanitized,
      };

      // En modo edición no enviamos estado
      if (!isEditMode) {
        body.estado = 'PENDIENTE';
      }

      if (direccionSanitized) {
        body.direccion = direccionSanitized;
      }
      if (partidaSanitized) {
        body.partidaInmobiliaria = partidaSanitized;
      }
      if (localidadSanitized) {
        body.localidad = localidadSanitized;
      }

      body.propietarios = propietarios;

      logger.debug('📤 Enviando al backend:', body);

      const response = isEditMode
        ? await apiClient.put<CreatedPropiedadResponse>(`/expedientes/${id}`, body)
        : await apiClient.post<CreatedPropiedadResponse>('/expedientes', body);

      logger.debug('✅ Respuesta del backend:', response.data);

      const propiedadId = isEditMode ? id : response.data?.expediente?.id;

      if (!propiedadId) {
        navigate('/propiedades');
        return;
      }

      navigate(`/propiedades/${propiedadId}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.mensaje ||
          `Error al ${isEditMode ? 'actualizar' : 'crear'} la propiedad. Intentá nuevamente.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/propiedades');
  };

  if (loadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <p>Cargando propiedad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            {isEditMode ? 'Editar Propiedad' : 'Cargar nueva propiedad'}
          </h1>
          <p className={styles.subtitle}>
            {isEditMode 
              ? 'Modificá los datos que necesites corregir.'
              : 'Completá los datos de la propiedad. Después podrás subir los documentos necesarios.'
            }
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
              <label htmlFor="tipoPropiedad" className={styles.label}>
                Tipo de propiedad <span className={styles.required}>*</span>
              </label>
              <select
                id="tipoPropiedad"
                value={tipoPropiedad}
                onChange={(e) => setTipoPropiedad(e.target.value)}
                disabled={loading}
                className={styles.input}
              >
                <option value="">Seleccione un tipo...</option>
                <option value="Terreno">Terreno</option>
                <option value="Departamento">Departamento</option>
                <option value="Casa">Casa</option>
                <option value="Quinta">Quinta</option>
                <option value="Oficina">Oficina</option>
                <option value="Local">Local</option>
                <option value="Edificio Comercial">Edificio Comercial</option>
                <option value="Campo">Campo</option>
                <option value="Cochera">Cochera</option>
                <option value="PH">PH</option>
                <option value="Depósito">Depósito</option>
                <option value="Fondo de Comercio">Fondo de Comercio</option>
                <option value="Finca">Finca</option>
                <option value="Chacra">Chacra</option>
                <option value="Isla">Isla</option>
                <option value="Galpón">Galpón</option>
                <option value="Terreno Comercial">Terreno Comercial</option>
                <option value="Terreno Industrial">Terreno Industrial</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="tipoOperacion" className={styles.label}>
                Tipo de Operación <span className={styles.required}>*</span>
              </label>
              <select
                id="tipoOperacion"
                value={tipoOperacion}
                onChange={(e) => setTipoOperacion(e.target.value)}
                disabled={loading}
                className={styles.input}
              >
                <option value="">Seleccione una operación...</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
              </select>
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
              <label htmlFor="partidaInmobiliaria" className={styles.label}>
                Partida Inmobiliaria <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                id="partidaInmobiliaria"
                type="text"
                value={partidaInmobiliaria}
                onChange={(e) => setPartidaInmobiliaria(e.target.value)}
                disabled={loading}
                className={styles.input}
                placeholder="Ej: 123456789"
                maxLength={100}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="localidad" className={styles.label}>
                Localidad / Provincia / CP <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                id="localidad"
                type="text"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                disabled={loading}
                className={styles.input}
                placeholder="Ej: Buenos Aires, CABA, CP 1425"
                maxLength={200}
              />
            </div>

            {/* ========== DIVISOR ========== */}
            <div className={styles.sectionDivider} />

            {/* ========== PROPIETARIOS ========== */}
            <div className={styles.propietariosSection}>
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
                {loading 
                  ? (isEditMode ? 'Guardando...' : 'Creando...') 
                  : (isEditMode ? 'GUARDAR CAMBIOS' : 'CREAR PROPIEDAD')
                }
              </button>
            </div>
          </form>

          {!isEditMode && (
            <div className={styles.infoBox}>
              <div className={styles.infoIcon}>ℹ️</div>
              <p className={styles.infoText}>
                La propiedad se creará con estado <strong>PENDIENTE</strong>. Un revisor o administrador podrá cambiar el estado más adelante.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevaPropiedad;
