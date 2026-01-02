// src/pages/Home.tsx
import { useNavigate, Navigate } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Home.module.css';
import orbeLogo from '../assets/images/orbe_sin_fondo_blanco.png';
import coldwellLogo from '../assets/images/logo_cb.png';
import logoutIcon from '../assets/icons/cerrar-sesion.png';

const Home = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

  // Si es ADMIN, redirigir directo a propiedades
  if (user?.rol === 'ADMIN') {
    return <Navigate to="/propiedades" replace />;
  }

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <img src={orbeLogo} alt="Orbe" className={styles.navLogo} />
          
          <div className={styles.navRight}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user?.nombre?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>{user?.nombre || 'Usuario'}</div>
                <div className={styles.userRole}>{user?.rol || 'ASESOR'}</div>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className={styles.logoutBtn}
              title="Cerrar sesión"
            >
              <img src={logoutIcon} alt="Logout" className={styles.logoutIcon} />
            </button>
          </div>
        </div>
      </nav>

      {/* Sparkles decorativos */}
      <span style={{position: 'absolute', top: '8%', left: '10%', fontSize: '24px', color: 'rgba(255,255,255,0.6)', animation: 'twinkle 3s ease-in-out infinite'}}>✦</span>
      <span style={{position: 'absolute', top: '15%', right: '15%', fontSize: '28px', color: 'rgba(255,255,255,0.7)', animation: 'twinkle 3.5s ease-in-out infinite', animationDelay: '0.8s'}}>✦</span>
      <span style={{position: 'absolute', bottom: '25%', left: '8%', fontSize: '20px', color: 'rgba(255,255,255,0.5)', animation: 'twinkle 2.8s ease-in-out infinite', animationDelay: '1.2s'}}>✦</span>
      <span style={{position: 'absolute', top: '60%', right: '10%', fontSize: '26px', color: 'rgba(255,255,255,0.65)', animation: 'twinkle 3.2s ease-in-out infinite', animationDelay: '1.8s'}}>✦</span>
      <span style={{position: 'absolute', bottom: '15%', right: '25%', fontSize: '18px', color: 'rgba(255,255,255,0.55)', animation: 'twinkle 2.5s ease-in-out infinite', animationDelay: '0.5s'}}>✦</span>

      {/* Contenido principal */}
      <main className={styles.main}>
        <div className={styles.logoContainer}>
          <img src={orbeLogo} alt="Orbe Logo" className={styles.mainLogo} />
        </div>

        <button onClick={() => navigate('/propiedades')} className={styles.propiedadesBtn}>
          <HomeIcon size={28} />
          <span>Propiedades</span>
        </button>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <img src={coldwellLogo} alt="Coldwell Banker" className={styles.footerLogo} />
      </footer>
    </div>
  );
};

export default Home;
