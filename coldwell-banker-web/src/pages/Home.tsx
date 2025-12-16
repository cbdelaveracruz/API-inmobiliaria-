// src/pages/Home.tsx
import { useNavigate, Navigate } from 'react-router-dom';
import Button from '../ui/Button';
import PageContainer from '../layout/PageContainer';
import { useAuth } from '../context/AuthContext';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Si es ADMIN, redirigir directo a propiedades
  if (user?.rol === 'ADMIN') {
    return <Navigate to="/propiedades" replace />;
  }

  return (
    <PageContainer title="">
      <div className={styles.homeContainer}>
        <div className={styles.heroSection}>
          <div className={styles.iconContainer}>
            <img 
              src="/cb-logo.png" 
              alt="Coldwell Banker" 
              className={styles.logo}
            />
          </div>
          
          <h1 className={styles.mainTitle}>
            Bienvenido{user ? ` ${user.nombre}` : ''} al Sistema de Coldwell Banker
          </h1>
          
          <p className={styles.subtitle}>
            Gestiona tus propiedades y mandatos de forma eficiente
          </p>

          <div className={styles.actionContainer}>
            <Button
              onClick={() => navigate('/propiedades')}
              size="lg"
              className={styles.primaryButton}
            >
              <span className={styles.buttonIcon}>📁</span>
              PROPIEDADES
            </Button>
          </div>

          <div className={styles.featureHints}>
            <div className={styles.hint}>
              <span className={styles.hintIcon}>✓</span>
              <span>Administra propiedades</span>
            </div>
            <div className={styles.hint}>
              <span className={styles.hintIcon}>✓</span>
              <span>Genera mandatos</span>
            </div>
            <div className={styles.hint}>
              <span className={styles.hintIcon}>✓</span>
              <span>Gestiona documentación</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Home;
