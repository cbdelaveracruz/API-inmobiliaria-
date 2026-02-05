import { Request, Response } from 'express';
import prisma from '../prisma';

// Estados permitidos del expediente
const ESTADOS_PERMITIDOS = ['PENDIENTE', 'APROBADO', 'RECHAZADO'] as const;
type EstadoExpediente = typeof ESTADOS_PERMITIDOS[number];

/**
 * GET /expedientes
 * Lista expedientes con filtros y paginación
 * Query params:
 * - estado: PENDIENTE | APROBADO | RECHAZADO
 * - asesorId: number
 * - desde: fecha ISO (createdAt >=)
 * - hasta: fecha ISO (createdAt <=)
 * - q: texto para buscar en titulo o propietarioNombre
 * - page: número de página (default: 1)
 * - limit: registros por página (default: 10)
 */
export const listarExpedientes = async (req: Request, res: Response) => {
    try {
        // Obtener query params
        const {
            estado,
            asesorId,
            desde,
            hasta,
            q,
            page = '1',
            limit = '10'
        } = req.query;

        // Validar y parsear paginación
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        if (isNaN(pageNum) || pageNum < 1) {
            res.status(400).json({
                error: 'El parámetro "page" debe ser un número mayor a 0'
            });
            return;
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            res.status(400).json({
                error: 'El parámetro "limit" debe ser un número entre 1 y 100'
            });
            return;
        }

        // Validar estado si viene
        if (estado && !ESTADOS_PERMITIDOS.includes(estado as EstadoExpediente)) {
            res.status(400).json({
                error: `Estado inválido. Estados permitidos: ${ESTADOS_PERMITIDOS.join(', ')}`
            });
            return;
        }

        // Validar asesorId si viene
        let asesorIdNum: number | undefined;
        if (asesorId) {
            asesorIdNum = parseInt(asesorId as string);
            if (isNaN(asesorIdNum)) {
                res.status(400).json({
                    error: 'El parámetro "asesorId" debe ser un número válido'
                });
                return;
            }
        }
        // Validar fechas si vienen
        let desdeDate: Date | undefined;
        let hastaDate: Date | undefined;
        if (desde) {
            desdeDate = new Date(desde as string);
            if (isNaN(desdeDate.getTime())) {
                res.status(400).json({
                    error: 'El parámetro "desde" debe ser una fecha válida en formato ISO'
                });
                return;
            }
        }
        if (hasta) {
            hastaDate = new Date(hasta as string);
            if (isNaN(hastaDate.getTime())) {
                res.status(400).json({
                    error: 'El parámetro "hasta" debe ser una fecha válida en formato ISO'
                });
                return;
            }
        }
        // SEGURIDAD: Obtener usuario autenticado y validar autorización
        const usuario = req.usuario;
        if (!usuario) {
            res.status(401).json({
                error: 'Usuario no autenticado'
            });
            return;
        }
        // Construir filtros para Prisma
        const where: any = {};
        // SEGURIDAD: Si es ASESOR, FORZAR filtro por su propio ID
        if (usuario.rol === 'ASESOR') {
            where.asesorId = usuario.id;

            // Si intentó filtrar por otro asesor, rechazar la petición
            if (asesorIdNum && asesorIdNum !== usuario.id) {
                res.status(403).json({
                    error: 'No tienes permisos para filtrar por otros asesores'
                });
                return;
            }
        } else {
            // ADMIN y REVISOR pueden filtrar por cualquier asesorId
            if (asesorIdNum) {
                where.asesorId = asesorIdNum;
            }
        }
        // Filtro por estado
        if (estado) {
            where.estado = estado;
        }

        // Filtro por rango de fechas
        if (desdeDate || hastaDate) {
            where.createdAt = {};
            if (desdeDate) {
                where.createdAt.gte = desdeDate;
            }
            if (hastaDate) {
                where.createdAt.lte = hastaDate;
            }
        }

        // Filtro por búsqueda de texto (titulo o propietarioNombre)
        if (q) {
            where.OR = [
                {
                    titulo: {
                        contains: q as string,
                        mode: 'insensitive' // Búsqueda case-insensitive
                    }
                },
                {
                    propietarioNombre: {
                        contains: q as string,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        // Calcular skip para paginación
        const skip = (pageNum - 1) * limitNum;

        // Obtener total de registros que coinciden con el filtro
        const total = await prisma.expediente.count({ where });

        // Obtener expedientes con filtros y paginación
        const expedientes = await prisma.expediente.findMany({
            where,
            include: {
                asesor: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        rol: true
                        // NO incluimos el hash
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limitNum
        });

        // Calcular total de páginas
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            data: expedientes,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages
            },
            filters: {
                estado: estado || null,
                asesorId: asesorIdNum || null,
                desde: desde || null,
                hasta: hasta || null,
                q: q || null
            }
        });
    } catch (error) {
        console.error('Error al listar expedientes:', error);
        res.status(500).json({
            error: 'Error interno del servidor al listar expedientes'
        });
    }
};

/**
 * GET /expedientes/:id
 * Obtiene un expediente por ID
 * 
 * Permisos:
 * - ASESOR: Solo puede ver sus propios expedientes (filtrado por asesorId)
 * - REVISOR/ADMIN: Pueden ver todos los expedientes
 */
export const obtenerExpediente = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const expedienteId = parseInt(id);

        // Validar que el ID sea un número válido
        if (isNaN(expedienteId)) {
            res.status(400).json({
                error: 'ID de expediente inválido'
            });
            return;
        }

        // Obtener el usuario autenticado
        const usuario = req.usuario;

        if (!usuario) {
            res.status(401).json({
                error: 'Usuario no autenticado'
            });
            return;
        }

        // Construir el where según el rol
        const where: any = { id: expedienteId };

        // Si es ASESOR, solo puede ver sus propios expedientes
        if (usuario.rol === 'ASESOR') {
            where.asesorId = usuario.id;
        }
        // ADMIN y REVISOR pueden ver todos los expedientes (no se agrega filtro adicional)

        // Buscar el expediente con todas las relaciones
        const expediente = await prisma.expediente.findUnique({
            where,
            include: {
                asesor: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        rol: true
                    }
                },
                documentos: {
                    select: {
                        id: true,
                        tipo: true,
                        nombre: true,
                        rutaArchivo: true,
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                mandato: true  // Incluir el mandato completo (null si no existe)
            }
        });

        if (!expediente) {
            // Si no se encuentra, puede ser que:
            // 1. El expediente no existe
            // 2. El ASESOR está intentando ver un expediente que no es suyo
            res.status(404).json({
                error: 'Expediente no encontrado o no tienes permisos para verlo'
            });
            return;
        }

        res.json(expediente);
    } catch (error) {
        console.error('Error al obtener expediente:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener el expediente'
        });
    }
};

/**
 * POST /expedientes (y /propiedades como alias)
 * Crea un nuevo expediente/propiedad
 * El usuarioId se toma del token (req.usuario.id)
 * 
 * Campos requeridos:
 * - titulo: string (nombre de la propiedad)
 * - propietarioNombre: string (nombre del dueño)
 * 
 * Campos opcionales:
 * - descripcion: string
 * - direccion: string
 * - api: string (número de API)
 * - emails: string (emails separados por coma)
 */
export const crearExpediente = async (req: Request, res: Response) => {
    try {
        const { 
            titulo, 
            tipoPropiedad,
            descripcion, 
            propietarioNombre, 
            direccion, 
            api, 
            partidaInmobiliaria,
            localidad,
            emails,
            propietarios 
        } = req.body;

        // Validación: el título es obligatorio
        if (!titulo || titulo.trim() === '') {
            res.status(400).json({
                error: 'El campo "titulo" es obligatorio'
            });
            return;
        }

        // Validación: tipoPropiedad es obligatorio (nuevo campo)
        if (!tipoPropiedad || tipoPropiedad.trim() === '') {
            res.status(400).json({
                error: 'El campo "tipoPropiedad" es obligatorio'
            });
            return;
        }

        // Obtener el usuarioId del token (lo pone el middleware autenticar)
        const usuarioId = req.usuario?.id;

        if (!usuarioId) {
            res.status(401).json({
                error: 'Usuario no autenticado'
            });
            return;
        }

        // Auto-poblar propietarioNombre desde el array de propietarios
        let propietarioNombreAuto = propietarioNombre?.trim() || null;
        
        if (propietarios && Array.isArray(propietarios) && propietarios.length > 0) {
            // Extraer nombres de todos los propietarios
            const nombres = propietarios
                .map((p: any) => p.nombreCompleto)
                .filter((nombre: string) => nombre && nombre.trim())
                .join(', ');
            
            if (nombres) {
                propietarioNombreAuto = nombres;
            }
        }

        // Crear el expediente con los nuevos campos
        // @ts-ignore - Los tipos de Prisma se actualizan al reiniciar VS Code
        const nuevoExpediente = await prisma.expediente.create({
            data: {
                titulo: titulo.trim(),
                tipoPropiedad: tipoPropiedad?.trim() || null,
                descripcion: descripcion?.trim() || null,
                propietarioNombre: propietarioNombreAuto, // Auto-populado desde array
                direccion: direccion && direccion.trim() ? direccion.trim() : null,
                api: api && api.trim() ? api.trim() : null,
                partidaInmobiliaria: partidaInmobiliaria && partidaInmobiliaria.trim() ? partidaInmobiliaria.trim() : null,
                localidad: localidad && localidad.trim() ? localidad.trim() : null,
                emails: emails && emails.trim() ? emails.trim() : null,
                propietarios: propietarios ? JSON.stringify(propietarios) : null, // Serializar como JSON string
                asesorId: usuarioId
                // estado por defecto es PENDIENTE (definido en el schema)
            },
            include: {
                asesor: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        rol: true
                    }
                }
            }
        });

        res.status(201).json({
            mensaje: 'Expediente creado exitosamente',
            expediente: nuevoExpediente
        });
    } catch (error) {
        console.error('Error al crear expediente:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear el expediente'
        });
    }
};

/**
 * PUT /expedientes/:id/estado
 * Cambia el estado de un expediente (solo ADMIN)
 * Body: { 
 *   estado: "PENDIENTE" | "APROBADO" | "RECHAZADO",
 *   observaciones?: string
 * }
 * - Si el nuevo estado es RECHAZADO, las observaciones son obligatorias
 * - Si el nuevo estado es APROBADO, se limpian las observaciones anteriores
 */
export const cambiarEstadoExpediente = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { estado, observaciones } = req.body;
        const expedienteId = parseInt(id);

        // Validar ID
        if (isNaN(expedienteId)) {
            res.status(400).json({
                error: 'ID de expediente inválido'
            });
            return;
        }

        // Validar que venga el estado
        if (!estado) {
            res.status(400).json({
                error: 'El campo "estado" es obligatorio'
            });
            return;
        }

        // Validar que el estado sea uno de los permitidos
        if (!ESTADOS_PERMITIDOS.includes(estado as EstadoExpediente)) {
            res.status(400).json({
                error: `Estado inválido. Estados permitidos: ${ESTADOS_PERMITIDOS.join(', ')}`
            });
            return;
        }

        // Validar observaciones según el estado
        if (estado === 'RECHAZADO') {
            // Si se rechaza, las observaciones son OBLIGATORIAS
            if (!observaciones || observaciones.trim() === '') {
                res.status(400).json({
                    error: 'Las observaciones son obligatorias cuando el estado es RECHAZADO'
                });
                return;
            }
        }

        // Verificar que el expediente existe
        const expedienteExistente = await prisma.expediente.findUnique({
            where: { id: expedienteId }
        });

        if (!expedienteExistente) {
            res.status(404).json({
                error: 'Expediente no encontrado'
            });
            return;
        }

        // Preparar los datos para actualizar
        const datosActualizacion: any = {
            estado
        };

        // Si el estado es RECHAZADO, guardar las observaciones
        if (estado === 'RECHAZADO') {
            datosActualizacion.observaciones = observaciones.trim();
        }
        // Si el estado es APROBADO, limpiar las observaciones
        else if (estado === 'APROBADO') {
            datosActualizacion.observaciones = null;
        }
        // Si el estado es PENDIENTE, mantener las observaciones si vienen
        else if (estado === 'PENDIENTE' && observaciones) {
            datosActualizacion.observaciones = observaciones.trim();
        }

        // Actualizar el estado y las observaciones
        const expedienteActualizado = await prisma.expediente.update({
            where: { id: expedienteId },
            data: datosActualizacion,
            include: {
                asesor: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        rol: true
                    }
                }
            }
        });

        res.json({
            mensaje: 'Estado del expediente actualizado exitosamente',
            expediente: expedienteActualizado
        });
    } catch (error) {
        console.error('Error al cambiar estado del expediente:', error);
        res.status(500).json({
            error: 'Error interno del servidor al cambiar el estado del expediente'
        });
    }
};

/**
 * PUT /expedientes/:id
 * Actualiza un expediente existente
 * 
 * Permisos:
 * - ASESOR: Solo puede editar sus propios expedientes EN ESTADO PENDIENTE
 * - REVISOR/ADMIN: Pueden editar cualquier expediente EN ESTADO PENDIENTE
 *
 * Restricción: Solo se pueden editar expedientes con estado PENDIENTE
 */
export const actualizarExpediente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expedienteId = parseInt(id);
    const userId = req.usuario?.id;
    const userRol = req.usuario?.rol;

    // Validar ID
    if (isNaN(expedienteId)) {
      res.status(400).json({ error: 'ID de expediente inválido' });
      return;
    }

    // Buscar expediente existente
    const expedienteExistente = await prisma.expediente.findUnique({
      where: { id: expedienteId },
      select: {
        id: true,
        estado: true,
        asesorId: true
      }
    });

    if (!expedienteExistente) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }

    // Verificar que el expediente esté en estado PENDIENTE
    if (expedienteExistente.estado !== 'PENDIENTE') {
      res.status(403).json({ 
        error: `No se puede editar un expediente en estado ${expedienteExistente.estado}. Solo se pueden editar expedientes PENDIENTES.` 
      });
      return;
    }

    // Verificar permisos: ASESOR solo puede editar sus propios expedientes
    if (userRol === 'ASESOR' && expedienteExistente.asesorId !== userId) {
      res.status(403).json({ 
        error: 'No tienes permiso para editar este expediente' 
      });
      return;
    }

    // Extraer campos del body
    const {
      titulo,
      descripcion,
      propietarioNombre,
      direccion,
      localidad,
      api,
      partidaInmobiliaria,
      tipoPropiedad,
      propietarios,
      emails
    } = req.body;

    // Validar campos requeridos
    if (!titulo) {
      res.status(400).json({ error: 'El título es requerido' });
      return;
    }

    // Auto-poblar propietarioNombre desde el array de propietarios
    let propietarioNombreAuto = propietarioNombre?.trim() || null;
    
    if (propietarios && Array.isArray(propietarios) && propietarios.length > 0) {
      const nombres = propietarios
        .map((p: any) => p.nombreCompleto)
        .filter((nombre: string) => nombre && nombre.trim())
        .join(', ');
      
      if (nombres) {
        propietarioNombreAuto = nombres;
      }
    }

    // Actualizar el expediente
    // @ts-ignore - Los tipos de Prisma se actualizan al reiniciar VS Code
    const expedienteActualizado = await prisma.expediente.update({
      where: { id: expedienteId },
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || null,
        propietarioNombre: propietarioNombreAuto,
        direccion: direccion?.trim() || null,
        localidad: localidad?.trim() || null,
        api: api?.trim() || null,
        partidaInmobiliaria: partidaInmobiliaria?.trim() || null,
        tipoPropiedad: tipoPropiedad?.trim() || null,
        propietarios: propietarios ? JSON.stringify(propietarios) : null,
        emails: emails?.trim() || null
      },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        },
        documentos: true,
        mandato: true
      }
    });

    res.json({
      mensaje: 'Expediente actualizado exitosamente',
      expediente: expedienteActualizado
    });

  } catch (error) {
    console.error('Error al actualizar expediente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
