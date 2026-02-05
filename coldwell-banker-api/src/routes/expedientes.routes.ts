import { Router } from 'express';
import { 
  listarExpedientes, 
  obtenerExpediente, 
  crearExpediente, 
  cambiarEstadoExpediente,
  actualizarExpediente
} from '../controllers/expedientes.controller';
import { generarMandatoCompleto } from '../controllers/mandatos-completo.controller';
import { autenticar, esAdmin, esAdminORevisor } from '../middlewares/auth.middleware';

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
 * PUT /expedientes/:id
 * Actualizar un expediente (solo PENDIENTE)
 * - ASESOR: Solo puede editar sus propias propiedades PENDIENTES
 * - ADMIN/REVISOR: Pueden editar cualquier propiedad PENDIENTE
 */
router.put('/:id', autenticar, actualizarExpediente);

/**
 * PUT /expedientes/:id/estado
 * PATCH /expedientes/:id/estado (alias para mobile)
 * Cambia el estado de un expediente (APROBAR/RECHAZAR)
 * Requiere autenticación y rol ADMIN o REVISOR
 * Body: { estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" }
 */
router.put('/:id/estado', autenticar, esAdminORevisor, cambiarEstadoExpediente);
router.patch('/:id/estado', autenticar, esAdminORevisor, cambiarEstadoExpediente);

/**
 * GET /propiedades/:id/mandato/word-completo
 * Genera mandato Word con datos autocompletados
 * Requiere autenticación
 */
router.get('/:id/mandato/word-completo', autenticar, generarMandatoCompleto);

export default router;
