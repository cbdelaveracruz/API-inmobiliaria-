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

interface Propiedad {
  id: number;
  titulo: string;
  descripcion: string | null;
  propietarioNombre: string;
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
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingWord, setDownloadingWord] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Verificar si el usuario puede cambiar el estado
  const canChangeStatus = user?.rol === 'ADMIN' || user?.rol === 'REVISOR';

  // Verificar si el usuario puede descargar el mandato
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

  // Efecto separado para manejar el refetch después de crear mandato
  useEffect(() => {
    if (location.state?.refetch) {
      // Recargar datos de la propiedad
      if (id) {
        fetchPropiedad();
      }
      
      // Mostrar mensaje de éxito
      if (location.state?.message) {
        setSuccessMessage(location.state.message);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
      // Hacer scroll a la sección de mandato si se indica
      if (location.state?.scrollToMandato) {
        setTimeout(() => {
          const mandatoSection = document.querySelector('[data-section="mandato"]');
          if (mandatoSection) {
            mandatoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
      
      // Limpiar el estado para que no se vuelva a ejecutar
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

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className={styles.successBanner}>
            <div className={styles.successContent}>
              <span className={styles.successIcon}>✅</span>
              <span className={styles.successText}>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Mensaje de error de descarga */}
        {downloadError && (
          <div className={styles.errorBanner}>
            ❌ {downloadError}
          </div>
        )}

        <div className={styles.headerActions}>
          <button onClick={() => navigate('/propiedades')} className={styles.backButton}>
            ← Volver
          </button>
          {canChangeStatus && (
            <div className={styles.adminActions}>
              <button 
                onClick={() => setShowModal(true)} 
                className={styles.approveButton}
              >
                ✅ Aprobar Propiedad
              </button>
              <button 
                onClick={() => setShowModal(true)} 
                className={styles.rejectButton}
              >
                ❌ Rechazar Propiedad
              </button>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.titleSection}>
            <h1>{propiedad.titulo}</h1>
            <span className={`${styles.statusBadge} ${styles[`status${propiedad.estado}`]}`}>
              {propiedad.estado === 'PENDIENTE' && '⏳ PENDIENTE'}
              {propiedad.estado === 'APROBADO' && '✅ APROBADO'}
              {propiedad.estado === 'RECHAZADO' && '❌ RECHAZADO'}
            </span>
          </div>
          
          <p className={styles.ownerInfo}>
            Propietario/s: <strong>{propiedad.propietarioNombre}</strong>
          </p>

          {/* Mensaje informativo según el estado */}
          {propiedad.estado === 'PENDIENTE' && !canChangeStatus && (
            <div className={styles.statusAlert}>
              <span className={styles.alertIcon}>ℹ️</span>
              <p>Esta propiedad está pendiente de revisión por un administrador.</p>
            </div>
          )}
          {propiedad.estado === 'RECHAZADO' && (
            <div className={`${styles.statusAlert} ${styles.alertDanger}`}>
              <span className={styles.alertIcon}>⚠️</span>
              <p>Esta propiedad ha sido rechazada. No se puede generar mandato.</p>
            </div>
          )}
          {propiedad.estado === 'APROBADO' && !propiedad.mandato && user?.rol === 'ASESOR' && (
            <div className={`${styles.statusAlert} ${styles.alertSuccess}`}>
              <span className={styles.alertIcon}>✅</span>
              <p>Propiedad aprobada. Ya puedes generar el mandato.</p>
            </div>
          )}

          {propiedad.observaciones && (
            <div className={styles.section}>
              <h3>Observaciones del revisor</h3>
              <div className={styles.observationsBox}>
                <p>{propiedad.observaciones}</p>
              </div>
            </div>
          )}

          {/* Sección de Mandato - Solo visible para ASESOR o cuando ya existe mandato */}
          {(user?.rol === 'ASESOR' || propiedad.mandato) && (
            <div className={styles.mandatoSection} data-section="mandato">
              <h3>Mandato</h3>
              {propiedad.mandato ? (
              <div className={styles.mandatoExistente}>
                <div className={styles.mandatoDetails}>
                  <div className={styles.mandatoRow}>
                    <span>Plazo:</span>
                    <strong>{propiedad.mandato.plazoDias} días</strong>
                  </div>
                  <div className={styles.mandatoRow}>
                    <span>Monto:</span>
                    <strong>
                      ${propiedad.mandato.monto.toLocaleString('es-AR')} {propiedad.mandato.moneda || 'ARS'}
                    </strong>
                  </div>
                  {propiedad.mandato.observaciones && (
                    <div className={styles.mandatoRow}>
                      <span>Observaciones:</span>
                      <span>{propiedad.mandato.observaciones}</span>
                    </div>
                  )}
                  <div className={styles.mandatoRow}>
                    <span>Fecha de creación:</span>
                    <span>{new Date(propiedad.mandato.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
                {canDownloadMandato && (
                  <div className={styles.mandatoActions}>
                    <button 
                      onClick={handleDownloadWord}
                      disabled={downloadingWord}
                      className={styles.downloadMandatoButton}
                    >
                      <span style={{ fontSize: '1.3rem', marginRight: '8px' }}>📥</span>
                      <span style={{ fontWeight: 'bold' }}>
                        {downloadingWord ? 'DESCARGANDO...' : 'DESCARGAR MANDATO'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.mandatoNoGenerado}>
                {propiedad.estado === 'APROBADO' ? (
                  <>
                    <p className={styles.mandatoMessage}>No hay mandato generado para esta propiedad.</p>
                    <button 
                      onClick={() => navigate(`/propiedades/${id}/mandato`)}
                      className={styles.generateMandatoButton}
                    >
                      📝 Generar mandato
                    </button>
                  </>
                ) : (
                  <div className={styles.mandatoDisabled}>
                    <span className={styles.lockIcon}>🔒</span>
                    <p>Para generar el mandato, la propiedad debe estar <strong>APROBADA</strong> por un administrador.</p>
                    {propiedad.estado === 'PENDIENTE' && (
                      <p className={styles.waitingText}>Estado actual: Pendiente de revisión</p>
                    )}
                    {propiedad.estado === 'RECHAZADO' && (
                      <p className={styles.rejectedText}>Esta propiedad ha sido rechazada</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {propiedad.descripcion && (
            <div className={styles.section}>
              <h3>Descripción</h3>
              <p>{propiedad.descripcion}</p>
            </div>
          )}

          <div className={styles.section}>
            <h3>Fecha de creación</h3>
            <p>{new Date(propiedad.createdAt).toLocaleString()}</p>
          </div>

          {propiedad.asesor && (
            <div className={styles.section}>
              <h3>Asesor</h3>
              <p>
                {propiedad.asesor.nombre} ({propiedad.asesor.email})
              </p>
            </div>
          )}

          {/* Sección de Documentos */}
          <div className={styles.section}>
            <h3>Documentos</h3>
            
            {propiedad.documentos && propiedad.documentos.length > 0 ? (
              <>
                <div className={styles.uploadDocumentCallout}>
                  <div className={styles.calloutContent}>
                    <span className={styles.calloutIcon}>📎</span>
                    <span className={styles.calloutText}>¿Necesitas agregar más documentación?</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/propiedades/${id}/upload`)}
                    className={styles.uploadDocumentButton}
                  >
                    <span style={{ fontSize: '1.3rem', marginRight: '8px' }}>📄</span>
                    <span style={{ fontWeight: 'bold' }}>SUBIR DOCUMENTACIÓN</span>
                  </button>
                </div>
                
                <div className={styles.documentosTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Fecha de carga</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propiedad.documentos.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.tipo}</td>
                          <td>{new Date(doc.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</td>
                          <td>
                            <a 
                              href={`${import.meta.env.VITE_API_URL}/${doc.rutaArchivo}`}
                              target="_blank" 
                              rel="noreferrer"
                              className={styles.viewDocumentButton}
                            >
                              📄 Ver Documento
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
                <div className={styles.emptyStateIcon}>📂</div>
                <p className={styles.emptyStateTitle}>No hay documentos cargados aún</p>
                <p className={styles.emptyStateSubtitle}>Sube tu primera documentación para esta propiedad</p>
                <button 
                  onClick={() => navigate(`/propiedades/${id}/upload`)}
                  className={styles.uploadFirstButton}
                >
                  <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>📄</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>SUBIR DOCUMENTACIÓN</span>
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