import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import usuariosRoutes from './routes/usuarios.routes';
import authRoutes from './routes/auth.routes';
import expedientesRoutes from './routes/expedientes.routes';
import documentosRoutes from './routes/documentos.routes';
import mandatosRoutes from './routes/mandatos.routes';

const app: Application = express();

// SEGURIDAD: Configurar trust proxy para Railway
// Railway usa reverse proxy, necesitamos confiar en el header X-Forwarded-For
app.set('trust proxy', 1);

// SEGURIDAD: Headers HTTP con Helmet.js
app.use(helmet({
  contentSecurityPolicy: false, // Desactivado para permitir carga de assets
  crossOriginEmbedderPolicy: false, // Compatibilidad con uploads
}));

// SEGURIDAD: Rate limiting global (anti-DoS)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas solicitudes, intente más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// SEGURIDAD: Rate limiting estricto para login (anti-brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de login, intente en 15 minutos',
});

// Middlewares
// SEGURIDAD: Configurar CORS
// En producción permitimos cualquier origen para facilitar testing
// IMPORTANTE: En producción real, configurar origins específicos mediante FRONTEND_URL
const corsOptions = {
  origin: true, // Permite todos los orígenes (cambiar en producción)
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Servir archivos estáticos de la carpeta uploads
// Esto permite acceder a: http://localhost:3000/uploads/propiedades/{id}/archivo.pdf
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Ruta raíz - Bienvenida
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🏠 API Inmobiliaria Coldwell Banker',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      auth: '/auth/login, /auth/register',
      expedientes: '/expedientes',
      documentos: '/documentos',
      mandatos: '/expedientes/:id/mandato',
      health: '/health'
    }
  });
});

// Ruta de health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Rutas de la API
app.use('/usuarios', usuariosRoutes);
app.use('/auth/login', loginLimiter); // Rate limit específico para login
app.use('/auth', authRoutes);
app.use('/expedientes', expedientesRoutes);
app.use('/propiedades', expedientesRoutes); // Alias para compatibilidad con frontend mobile
app.use('/documentos', documentosRoutes);
app.use('/', mandatosRoutes); // Incluye rutas /expedientes/:id/mandato y /mandatos/:id/estado

// SEGURIDAD: Importar middlewares de manejo de errores
import { notFoundHandler, errorHandler } from './middlewares/error-handler.middleware';
// Middleware 404 (debe ir ANTES del error handler)
app.use(notFoundHandler);
// Middleware global de errores (DEBE IR AL FINAL)
app.use(errorHandler);

export default app;