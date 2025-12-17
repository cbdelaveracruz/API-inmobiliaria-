import { Router } from 'express';
import { crearUsuario, obtenerUsuarios, eliminarUsuario } from '../controllers/usuarios.controller';
import { autenticar, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /usuarios
 * Obtener lista de todos los usuarios (solo ADMIN)
 */
router.get('/', autenticar, esAdmin, obtenerUsuarios);

/**
 * POST /usuarios
 * Crear un nuevo usuario (solo ADMIN)
 * Body: { nombre, email, password, rol? }
 */
router.post('/', autenticar, esAdmin, crearUsuario);

/**
 * DELETE /usuarios/:id
 * Eliminar un usuario por ID (solo ADMIN)
 */
router.delete('/:id', autenticar, esAdmin, eliminarUsuario);

export default router;
