import { Router } from 'express';
import {
  crearMandatoDesdeExpediente,
  obtenerMandatoPorExpediente,
  actualizarEstadoMandato,
  descargarWordMandato
} from '../controllers/mandatos.controller';
import { autenticar, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /expedientes/:id/mandato
 * POST /propiedades/:id/mandato (alias para mobile)
 * Crea un mandato para un expediente APROBADO
 * Requiere autenticación
 * Body: { plazoDias, monto, observaciones? }
 */
router.post('/expedientes/:id/mandato', autenticar, crearMandatoDesdeExpediente);
router.post('/propiedades/:id/mandato', autenticar, crearMandatoDesdeExpediente);

/**
 * GET /expedientes/:id/mandato/word
 * GET /propiedades/:id/mandato/word (alias para mobile)
 * Genera y descarga el documento Word del mandato dinámicamente
 * Requiere autenticación
 * ⚠️ IMPORTANTE: Esta ruta DEBE ir ANTES de GET /expedientes/:id/mandato
 */
router.get('/expedientes/:id/mandato/word', autenticar, descargarWordMandato);
router.get('/propiedades/:id/mandato/word', autenticar, descargarWordMandato);

/**
 * GET /expedientes/:id/mandato
 * GET /propiedades/:id/mandato (alias para mobile)
 * Obtiene el mandato de un expediente
 * Requiere autenticación
 * ⚠️ IMPORTANTE: Esta ruta debe ir DESPUÉS de las rutas más específicas (/pdf)
 */
router.get('/expedientes/:id/mandato', autenticar, obtenerMandatoPorExpediente);
router.get('/propiedades/:id/mandato', autenticar, obtenerMandatoPorExpediente);

/**
 * PUT /mandatos/:id/estado
 * Actualiza el estado de un mandato
 * Requiere autenticación y rol ADMIN
 * Body: { estado, firmadoPor?, documentoUrl? }
 */
router.put('/mandatos/:id/estado', autenticar, esAdmin, actualizarEstadoMandato);

export default router;
