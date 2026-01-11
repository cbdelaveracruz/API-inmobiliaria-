// src/pages/Home.tsx
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Home.module.css';
import orbeLogo from '../assets/images/orbe_sin_fondo_blanco.png';
import logoutIcon from '../assets/icons/cerrar-sesion.png';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
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

        <div className={styles.buttonsContainer}>
          <button onClick={() => navigate('/propiedades')} className={styles.propiedadesBtn}>
            <HomeIcon size={28} />
            <span>Propiedades</span>
          </button>

          <button onClick={() => navigate('/actividades')} className={styles.actividadesBtn}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Actividades</span>
          </button>

          {user?.rol === 'ADMIN' && (
            <>
              <button onClick={() => navigate('/admin/actividades')} className={styles.adminBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="16 11 18 13 22 9"></polyline>
                </svg>
                <span>Planif. Asesores</span>
              </button>
              
              <button onClick={() => navigate('/admin/objetivos-anuales')} className={styles.objetivosBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Config. Objetivos</span>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
