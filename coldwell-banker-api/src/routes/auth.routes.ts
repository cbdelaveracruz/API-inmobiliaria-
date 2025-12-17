import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller';
import { crearUsuario } from '../controllers/usuarios.controller';
import { autenticar } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /auth/login
 * Autenticar usuario y obtener JWT
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * POST /auth/logout
 * Cerrar sesión (limpiar cookie)
 */
router.post('/logout', logout);

/**
 * GET /auth/me
 * Obtener datos del usuario actual (requiere autenticación)
 */
router.get('/me', autenticar, me);

/**
 * POST /auth/register
 * Registrar nuevo usuario
 * Body: { nombre, email, password, rol? }
 */
router.post('/register', crearUsuario);

export default router;
