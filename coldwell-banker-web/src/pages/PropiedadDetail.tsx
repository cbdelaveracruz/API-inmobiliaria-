// src/pages/PropiedadDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api, { descargarMandatoWord } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChangeStatusModal from '../components/ChangeStatusModal';
import styles from './PropiedadDetail.module.css';

interface Documento {
  id: number;
  tipo: string;
  nombre?: string | null; // Nombre del archivo subido
  rutaArchivo: string;
  createdAt: string;
}

interface Asesor {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface Mandato {
  id: number;
  plazoDias: number;
  monto: number;
  moneda?: 'ARS' | 'USD';
  observaciones?: string | null;
  createdAt: string;
}

interface PropietarioDetalle {
  nombreCompleto: string;
  dni: string;
  cuitCuil?: string;
  cuil?: string;
  email: string;
  celular: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  domicilioReal?: string;
}

interface Propiedad {
  id: number;
  titulo: string;
  descripcion: string | null;
  propietarioNombre: string;
  direccion?: string | null;
  localidad?: string | null;
  api?: string | null;
  partidaInmobiliaria?: string | null;
  propietarios?: string | null;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  observaciones: string | null;
  createdAt: string;
  asesor?: Asesor;
  documentos?: Documento[];
  mandato?: Mandato | null;
}

const PropiedadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingWord, setDownloadingWord] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [propietariosList, setPropietariosList] = useState<PropietarioDetalle[]>([]);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Verificar si el usuario puede cambiar el estado
  const canChangeStatus = user?.rol === 'ADMIN' || user?.rol === 'REVISOR';

  const canDownloadMandato = 
    propiedad?.mandato &&
    (user?.rol === 'ADMIN' || 
    user?.rol === 'REVISOR' || 
    (user?.rol === 'ASESOR' && propiedad?.asesor?.id === user?.id));

  useEffect(() => {
    if (id) {
      fetchPropiedad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (propiedad?.propietarios) {
      try {
        const parsed = JSON.parse(propiedad.propietarios);
        if (Array.isArray(parsed)) {
          setPropietariosList(parsed);
        }
      } catch (e) {
        console.error('Error al parsear propietarios:', e);
        setPropietariosList([]);
      }
    }
  }, [propiedad]);

  useEffect(() => {
    if (location.state?.refetch) {
      if (id) {
        fetchPropiedad();
      }
      
      if (location.state?.message) {
        setSuccessMessage(location.state.message);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const fetchPropiedad = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/expedientes/${id}`);
      setPropiedad(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!id || !propiedad) return;
    
    setDownloadingWord(true);
    setDownloadError('');
    
    try {
      await descargarMandatoWord(Number(id), propiedad.titulo);
    } catch (err: any) {
      const errorMsg = err.response?.status === 403
        ? 'No tenés permisos para descargar este mandato'
        : err.response?.status === 404
        ? 'No se encontró el mandato'
        : 'No se pudo descargar el documento. Intentá nuevamente.';
      
      setDownloadError(errorMsg);
      setTimeout(() => setDownloadError(''), 5000);
    } finally {
      setDownloadingWord(false);
    }
  };

  const handleStatusChange = (nuevoEstado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO', observaciones: string | null) => {
    // Actualizar el estado local de la propiedad sin recargar toda la página
    setPropiedad(prev => prev ? {
      ...prev,
      estado: nuevoEstado,
      observaciones
    } : null);
    
    // Mostrar mensaje de éxito
    setSuccessMessage('✅ Estado actualizado correctamente');
    setShowModal(false);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.loading}>Cargando…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.error}>Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!propiedad) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.notFound}>Propiedad no encontrada</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Success/Error Messages */}
        {successMessage && (
          <div className={styles.successBanner}>
            {successMessage}
          </div>
        )}

        {downloadError && (
          <div className={styles.errorBanner}>
            ❌ {downloadError}
          </div>
        )}

        {/* Back Button */}
        <button onClick={() => navigate('/propiedades')} className={styles.backButton}>
          ← Volver
        </button>

        <div className={styles.card}>
          {/* Header: Título + Estado + Admin Actions */}
          <div className={styles.titleSection}>
            <h1>{propiedad.titulo}</h1>
            <div className={styles.headerRight}>
              <span className={`${styles.statusBadge} ${styles[`status${propiedad.estado}`]}`}>
                {propiedad.estado}
              </span>
            </div>
          </div>
          
          <p className={styles.ownerInfo}>
            Propietario/s: <strong>{propiedad.propietarioNombre}</strong>
          </p>

          {/* Admin Actions - Aprobar/Rechazar (condicional según estado) */}
          {canChangeStatus && propiedad.estado !== 'APROBADO' && (
            <div className={styles.adminActions}>
              {/* Mostrar botón Aprobar si está PENDIENTE o RECHAZADO */}
              {(propiedad.estado === 'PENDIENTE' || propiedad.estado === 'RECHAZADO') && (
                <button 
                  onClick={() => setShowModal(true)} 
                  className={styles.approveButton}
                >
                  ✅ Aprobar Propiedad
                </button>
              )}
              
              {/* Mostrar botón Rechazar SOLO si está PENDIENTE */}
              {propiedad.estado === 'PENDIENTE' && (
                <button 
                  onClick={() => setShowModal(true)} 
                  className={styles.rejectButton}
                >
                  ❌ Rechazar Propiedad
                </button>
              )}
            </div>
          )}

          {/* 🏠 Información de la Propiedad */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🏠</span>
              Información de la propiedad
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Dirección</span>
                <span className={styles.infoValue}>{propiedad.direccion || '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Localidad</span>
                <span className={styles.infoValue}>{propiedad.localidad || '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Partida Inmobiliaria</span>
                <span className={styles.infoValue}>{propiedad.partidaInmobiliaria || '-'}</span>
              </div>
            </div>
          </div>

          {/* 👤 Datos del Propietario */}
          {propietariosList.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>👤</span>
                Datos del propietario
              </h3>
              <table className={styles.ownerTable}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>DNI</th>
                    <th>Celular</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {propietariosList.map((p, index) => (
                    <tr key={index}>
                      <td>{p.nombreCompleto}</td>
                      <td>{p.dni}</td>
                      <td>{p.celular}</td>
                      <td>{p.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Fecha de creación + Asesor - DESTACADO */}
              <div className={styles.metaInfo}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Fecha de creación</span>
                  <span className={styles.metaValue}>
                    {new Date(propiedad.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {propiedad.asesor && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Asesor</span>
                    <span className={styles.metaValue}>
                      {propiedad.asesor.nombre} ({propiedad.asesor.email})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mandato */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📄</span>
              Mandato
            </h3>
            
            {propiedad.mandato ? (
              // Tiene mandato - mostrar detalles
              <div className={styles.mandateBox}>
                <div className={styles.mandateGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Plazo</span>
                    <span className={styles.infoValue}>{propiedad.mandato.plazoDias} días</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Monto</span>
                    <span className={styles.infoValue}>
                      ${propiedad.mandato.monto.toLocaleString('es-AR')} {propiedad.mandato.moneda || 'ARS'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Fecha de creación</span>
                    <span className={styles.infoValue}>
                      {new Date(propiedad.mandato.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                {canDownloadMandato && (
                  <button 
                    onClick={handleDownloadWord}
                    disabled={downloadingWord}
                    className={styles.downloadButton}
                  >
                    {downloadingWord ? 'Descargando...' : 'Descargar Mandato'}
                  </button>
                )}
              </div>
            ) : propiedad.estado === 'APROBADO' ? (
              // Aprobada pero sin mandato - mostrar botón generar
              <div className={styles.mandateApproved}>
                <div className={styles.approvedMessage}>
                  <span className={styles.checkIcon}>✅</span>
                  <p>Propiedad aprobada. Ya puedes generar el mandato.</p>
                </div>
                <button 
                  onClick={() => navigate(`/propiedades/${id}/mandato`)}
                  className={styles.generateButton}
                >
                  Generar mandato
                </button>
              </div>
            ) : (
              // Pendiente - mostrar candado
              <div className={styles.mandateLocked}>
                <span className={styles.lockIcon}>🔒</span>
                <p className={styles.lockMessage}>
                  Para generar el mandato, la propiedad debe estar <strong>APROBADA</strong> por un administrador.
                </p>
                <p className={styles.lockSubtext}>Estado actual: Pendiente de revisión</p>
              </div>
            )}
          </div>


          {/* Documentos */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📁</span>
              Documentos
            </h3>
            
            {propiedad.documentos && propiedad.documentos.length > 0 ? (
              <>
                <div className={styles.documentsCallout}>
                  <span className={styles.calloutText}>¿Necesitas agregar más documentación?</span>
                  <button 
                    onClick={() => navigate(`/propiedades/${id}/upload`)}
                    className={styles.uploadButton}
                  >
                    Subir Documentación
                  </button>
                </div>
                
                <div className={styles.documentsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre del Archivo</th>
                        <th>Fecha de Carga</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propiedad.documentos.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.nombre || doc.tipo}</td>
                          <td>
                            {new Date(doc.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td>
                            <a 
                              href={`${import.meta.env.VITE_API_URL}/${doc.rutaArchivo}`}
                              target="_blank" 
                              rel="noreferrer"
                              className={styles.viewDocButton}
                            >
                              ver documento
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className={styles.noDocumentsBox}>
                <span className={styles.emptyIcon}>📂</span>
                <p className={styles.emptyTitle}>No hay documentos cargados aún</p>
                <p className={styles.emptySubtitle}>Sube tu primera documentación para esta propiedad</p>
                <button 
                  onClick={() => navigate(`/propiedades/${id}/upload`)}
                  className={styles.uploadButton}
                >
                  Subir Documentación
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal para cambiar estado */}
        {showModal && (
          <ChangeStatusModal
            expedienteId={propiedad.id}
            estadoActual={propiedad.estado}
            onClose={() => setShowModal(false)}
            onSuccess={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
};

export default PropiedadDetail;
