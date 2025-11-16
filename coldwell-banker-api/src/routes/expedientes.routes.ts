import { Router } from 'express';
import { 
  listarExpedientes, 
  obtenerExpediente, 
  crearExpediente, 
  cambiarEstadoExpediente 
} from '../controllers/expedientes.controller';
import { autenticar, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /expedientes
 * Lista expedientes con filtros y paginación
 * Requiere autenticación
 * Query params:
 * - estado: PENDIENTE | APROBADO | RECHAZADO
 * - asesorId: number
 * - desde/hasta: fechas ISO
 * - q: búsqueda en título o propietario
 * - page: número de página (default: 1)
 * - limit: registros por página (default: 10, max: 100)
 */
router.get('/', autenticar, listarExpedientes);

/**
 * GET /expedientes/:id
 * Obtiene un expediente por ID
 * Requiere autenticación
 */
router.get('/:id', autenticar, obtenerExpediente);

/**
 * POST /expedientes
 * Crea un nuevo expediente
 * Requiere autenticación
 * El usuarioId se toma del token (req.usuario.id)
 */
router.post('/', autenticar, crearExpediente);

/**
 * PUT /expedientes/:id/estado
 * PATCH /expedientes/:id/estado (alias para mobile)
 * Cambia el estado de un expediente
 * Requiere autenticación y rol ADMIN
 * Body: { estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" }
 */
router.put('/:id/estado', autenticar, esAdmin, cambiarEstadoExpediente);
router.patch('/:id/estado', autenticar, esAdmin, cambiarEstadoExpediente);

export default router;
