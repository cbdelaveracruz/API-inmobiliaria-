import { Router } from 'express';
import {
  crearMandatoDesdeExpediente,
  obtenerMandatoPorExpediente,
  actualizarEstadoMandato,
  descargarPlantillaMandatoPersonaFisica
} from '../controllers/mandatos.controller';
import { autenticar, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /mandatos/plantilla/persona-fisica
 * Descarga la plantilla estática de mandato de venta para persona física
 * Requiere autenticación
 */
router.get('/mandatos/plantilla/persona-fisica', autenticar, descargarPlantillaMandatoPersonaFisica);

/**
 * Rutas de compatibilidad para el frontend existente
 * Redirigen la petición de "generar word" a la descarga de la plantilla estática
 */
router.get('/expedientes/:id/mandato/word', autenticar, descargarPlantillaMandatoPersonaFisica);
router.get('/propiedades/:id/mandato/word', autenticar, descargarPlantillaMandatoPersonaFisica);

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
 * GET /expedientes/:id/mandato
 * GET /propiedades/:id/mandato (alias para mobile)
 * Obtiene el mandato de un expediente
 * Requiere autenticación
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
