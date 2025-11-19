// src/pages/PropiedadesList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchExpedientes } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../layout/PageContainer';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
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
  const [filtroAsesor, setFiltroAsesor] = useState('');
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

      // Si es ASESOR, filtrar por su ID
      const params: { page: number; limit: number; asesorId?: number } = {
        page: pageToLoad,
        limit: limit,
      };

      if (user.rol === 'ASESOR') {
        params.asesorId = user.id;
      }

      const response = await fetchExpedientes(params);

      let lista: Propiedad[] = response.data || [];

      // Filtro client-side adicional para ASESOR (red de contención)
      if (user.rol === 'ASESOR') {
        lista = lista.filter(exp => exp.asesor?.id === user.id);
      }

      setPropiedades(lista);

      // Leer paginación del backend
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
      } else {
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar propiedades');
      setPropiedades([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para aplicar filtros
  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propiedades, filtroNombre, filtroPropietario, filtroAsesor, filtroFecha]);

  const aplicarFiltros = () => {
    let resultado = [...propiedades];

    // Filtro por nombre de propiedad
    if (filtroNombre.trim()) {
      resultado = resultado.filter(prop =>
        prop.titulo.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    // Filtro por propietario
    if (filtroPropietario.trim()) {
      resultado = resultado.filter(prop =>
        prop.propietarioNombre.toLowerCase().includes(filtroPropietario.toLowerCase())
      );
    }

    // Filtro por asesor (solo para admin/revisor)
    if (filtroAsesor.trim()) {
      resultado = resultado.filter(prop =>
        prop.asesor?.nombre.toLowerCase().includes(filtroAsesor.toLowerCase())
      );
    }

    // Filtro por fecha de creación
    if (filtroFecha) {
      const fechaFiltro = new Date(filtroFecha);
      resultado = resultado.filter(prop => {
        const fechaProp = new Date(prop.createdAt);
        return fechaProp.toDateString() === fechaFiltro.toDateString();
      });
    }

    setPropiedadesFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroNombre('');
    setFiltroPropietario('');
    setFiltroAsesor('');
    setFiltroFecha('');
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const getEstadoBadgeVariant = (estado: string): 'success' | 'danger' | 'warning' => {
    switch (estado) {
      case 'APROBADO':
        return 'success';
      case 'RECHAZADO':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const formatMonto = (monto: number, moneda?: 'ARS' | 'USD') => {
    const currency = moneda || 'ARS';
    return monto.toLocaleString('es-AR', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    });
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  if (loading) {
    return (
      <PageContainer>
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>Cargando propiedades...</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>❌ {error}</p>
          <Button onClick={() => loadPropiedades(page)} variant="secondary">
            Reintentar
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Propiedades"
      actions={
        <Button onClick={() => navigate('/propiedades/nueva')} variant="primary" size="lg">
          <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>➕</span>
          <span style={{ fontWeight: 'bold' }}>CREAR NUEVA PROPIEDAD</span>
        </Button>
      }
    >
      {/* Filtros */}
      <div className={styles.filterContainer}>
        <h3 className={styles.filterTitle}>Buscar Propiedades</h3>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              <span style={{ fontSize: '1.3rem' }}>🏠</span>
              <span>Nombre de Propiedad</span>
            </label>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Ej: Casa Francia, Departamento..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              <span style={{ fontSize: '1.3rem' }}>👤</span>
              <span>Propietario</span>
            </label>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Ej: Juan Pérez, María García..."
              value={filtroPropietario}
              onChange={(e) => setFiltroPropietario(e.target.value)}
            />
          </div>

          {/* Filtro de asesor solo visible para ADMIN y REVISOR */}
          {(user?.rol === 'ADMIN' || user?.rol === 'REVISOR') && (
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>
                <span style={{ fontSize: '1.3rem' }}>👔</span>
                <span>Asesor</span>
              </label>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Ej: Agostina, Matías..."
                value={filtroAsesor}
                onChange={(e) => setFiltroAsesor(e.target.value)}
              />
            </div>
          )}

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              <span style={{ fontSize: '1.3rem' }}>📅</span>
              <span>Fecha de Creación</span>
            </label>
            <input
              type="date"
              className={styles.filterInput}
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </div>
        </div>

        {(filtroNombre || filtroPropietario || filtroAsesor || filtroFecha) && (
          <div className={styles.filterActions}>
            <Button onClick={limpiarFiltros} variant="secondary" size="md">
              <span style={{ fontSize: '1.1rem', marginRight: '6px' }}>🗑️</span>
              Limpiar Filtros
            </Button>
            <span className={styles.filterCount}>
              <span style={{ fontSize: '1.1rem', marginRight: '6px' }}>📊</span>
              {propiedadesFiltradas.length} {propiedadesFiltradas.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>
        )}
      </div>

      {propiedadesFiltradas.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            {propiedades.length === 0 
              ? 'No hay propiedades para mostrar'
              : 'No se encontraron propiedades con los filtros aplicados'}
          </p>
          {propiedades.length === 0 ? (
            <Button onClick={() => navigate('/propiedades/nueva')} variant="primary">
              ➕ Crear la primera propiedad
            </Button>
          ) : (
            <Button onClick={limpiarFiltros} variant="secondary">
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {propiedadesFiltradas.map((prop) => (
              <Card
                key={prop.id}
                hover
                onClick={() => navigate(`/propiedades/${prop.id}`)}
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{prop.titulo}</h3>
                  <Badge variant={getEstadoBadgeVariant(prop.estado)}>
                    {prop.estado}
                  </Badge>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Propietario:</span>
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

                  {prop.mandato && (
                    <div className={styles.mandatoChip}>
                      <span className={styles.mandatoIcon}>📄</span>
                      <span className={styles.mandatoText}>
                        Mandato: {formatMonto(prop.mandato.monto, prop.mandato.moneda)} • {prop.mandato.plazo}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          <div className={styles.pagination}>
            <Button
              onClick={handlePrev}
              disabled={page === 1}
              variant="secondary"
              size="sm"
            >
              ← Anterior
            </Button>
            <span className={styles.pageInfo}>
              Página {page} de {totalPages}
            </span>
            <Button
              onClick={handleNext}
              disabled={page === totalPages}
              variant="secondary"
              size="sm"
            >
              Siguiente →
            </Button>
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default PropiedadesList;
