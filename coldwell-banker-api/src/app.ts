import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import usuariosRoutes from './routes/usuarios.routes';
import authRoutes from './routes/auth.routes';
import expedientesRoutes from './routes/expedientes.routes';
import documentosRoutes from './routes/documentos.routes';
import mandatosRoutes from './routes/mandatos.routes';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la carpeta uploads
// Esto permite acceder a: http://localhost:3000/uploads/propiedades/{id}/archivo.pdf
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Ruta de health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Rutas de la API
app.use('/usuarios', usuariosRoutes);
app.use('/auth', authRoutes);
app.use('/expedientes', expedientesRoutes);
app.use('/propiedades', expedientesRoutes); // Alias para compatibilidad con frontend mobile
app.use('/documentos', documentosRoutes);
app.use('/', mandatosRoutes); // Incluye rutas /expedientes/:id/mandato y /mandatos/:id/estado

export default app;
