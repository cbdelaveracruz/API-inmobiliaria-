// src/pages/PropiedadesList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home as HomeIcon, User, Calendar } from 'lucide-react';
import { fetchExpedientes } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './PropiedadesList.module.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'REVISOR' | 'ASESOR';
}

interface Mandato {
  id: number;
  plazo: string;
  monto: number;
  moneda?: 'ARS' | 'USD';
  observaciones?: string | null;
  createdAt: string;
}

interface Propiedad {
  id: number;
  titulo: string;
  propietarioNombre: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  observaciones?: string | null;
  createdAt: string;
  asesor?: Usuario | null;
  mandato?: Mandato | null;
}

const PropiedadesList: React.FC = () => {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [propiedadesFiltradas, setPropiedadesFiltradas] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados de filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroPropietario, setFiltroPropietario] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  useEffect(() => {
    loadPropiedades(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, user]);

  const loadPropiedades = async (pageToLoad: number) => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const params: { page: number; limit: number; asesorId?: number } = {
        page: pageToLoad,
        limit: limit,
      };

      if (user.rol === 'ASESOR') {
        params.asesorId = user.id;
      }

      const response = await fetchExpedientes(params);

      let lista: Propiedad[] = response.data || [];

      if (user.rol === 'ASESOR') {
        lista = lista.filter(exp => exp.asesor?.id === user.id);
      }

      setPropiedades(lista);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
      } else {
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Error al cargar propiedades:', err);
      console.error('Respuesta del error:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Error al cargar propiedades';
      setError(errorMessage);
      setPropiedades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propiedades, filtroNombre, filtroPropietario, filtroFecha]);

  const aplicarFiltros = () => {
    let resultado = [...propiedades];

    if (filtroNombre.trim()) {
      resultado = resultado.filter(prop =>
        prop.titulo.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    if (filtroPropietario.trim()) {
      resultado = resultado.filter(prop =>
        prop.propietarioNombre.toLowerCase().includes(filtroPropietario.toLowerCase())
      );
    }

    if (filtroFecha) {
      // Permitir formato dd/mm/yyyy o parcial
      const filtroLimpio = filtroFecha.trim();
      resultado = resultado.filter(prop => {
        const fechaProp = new Date(prop.createdAt);
        const dia = String(fechaProp.getDate()).padStart(2, '0');
        const mes = String(fechaProp.getMonth() + 1).padStart(2, '0');
        const anio = String(fechaProp.getFullYear());
        const fechaFormateada = `${dia}/${mes}/${anio}`;
        
        return fechaFormateada.includes(filtroLimpio);
      });
    }

    setPropiedadesFiltradas(resultado);
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>❌ {error}</p>
          <button onClick={() => loadPropiedades(page)} className={styles.retryBtn}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Propiedades</h1>
        <button onClick={() => navigate('/propiedades/nueva')} className={styles.newPropBtn}>
          <span className={styles.plusIcon}>+</span>
          CARGAR NUEVA PROPIEDAD
        </button>
      </div>

      {/* Search Panel */}
      <div className={styles.searchPanel}>
        <div className={styles.searchHeader}>
          <Search size={24} />
          <h2 className={styles.searchTitle}>Buscar propiedades</h2>
        </div>

        <div className={styles.searchGrid}>
          <div className={styles.searchField}>
            <div className={styles.searchLabel}>
              <HomeIcon size={20} className={styles.searchIcon} />
              <span>Nombre de propiedad</span>
            </div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Ej: Casa Sargento Cabral, Depart..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>

          <div className={styles.searchField}>
            <div className={styles.searchLabel}>
              <User size={20} className={styles.searchIcon} />
              <span>Propietario</span>
            </div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Ej: Juan Pérez, Laura Mendoza..."
              value={filtroPropietario}
              onChange={(e) => setFiltroPropietario(e.target.value)}
            />
          </div>

          <div className={styles.searchField}>
            <div className={styles.searchLabel}>
              <Calendar size={20} className={styles.searchIcon} />
              <span>Fecha de creación</span>
            </div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="dd/mm/aaaa"
              value={filtroFecha}
              onChange={handleDateChange}
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {/* Property Cards */}
      {propiedadesFiltradas.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            {propiedades.length === 0 
              ? 'No hay propiedades para mostrar'
              : 'No se encontraron propiedades con los filtros aplicados'}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {propiedadesFiltradas.map((prop) => (
              <div
                key={prop.id}
                className={styles.card}
                onClick={() => navigate(`/propiedades/${prop.id}`)}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{prop.titulo}</h3>
                  <span className={`${styles.badge} ${styles[`badge${prop.estado}`]}`}>
                    {prop.estado === 'APROBADO' ? 'Aprobado' : 
                     prop.estado === 'RECHAZADO' ? 'Rechazado' : 
                     'En espera'}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Propietario/s:</span>
                    <span className={styles.cardValue}>{prop.propietarioNombre}</span>
                  </div>

                  {prop.asesor && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Asesor:</span>
                      <span className={styles.cardValue}>{prop.asesor.nombre}</span>
                    </div>
                  )}

                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Fecha:</span>
                    <span className={styles.cardValue}>{formatFecha(prop.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className={styles.paginationBtn}
            >
              &lt; Anterior
            </button>
            <span className={styles.pageInfo}>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className={styles.paginationBtn}
            >
              Siguiente &gt;
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PropiedadesList;
