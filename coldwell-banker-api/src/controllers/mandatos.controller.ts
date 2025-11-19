import { Request, Response } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, UnderlineType } from 'docx';

// Estados permitidos del mandato
const ESTADOS_MANDATO = ['BORRADOR', 'ENVIADO', 'FIRMADO', 'ANULADO'] as const;
type EstadoMandato = typeof ESTADOS_MANDATO[number];

/**
 * POST /expedientes/:id/mandato
 * Crea un mandato para un expediente APROBADO
 * Body: { plazoDias, monto, observaciones? }
 * 
 * Permisos:
 * - ASESOR: Solo puede crear mandatos para sus propios expedientes
 * - REVISOR/ADMIN: Pueden crear mandatos para cualquier expediente
 */
export const crearMandatoDesdeExpediente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plazoDias, monto, observaciones, moneda } = req.body;
    const expedienteId = parseInt(id);

    // Validar ID del expediente
    if (isNaN(expedienteId)) {
      res.status(400).json({
        error: 'ID de expediente inválido'
      });
      return;
    }

    // Validación: plazoDias es obligatorio y debe ser positivo
    if (!plazoDias || typeof plazoDias !== 'number' || plazoDias <= 0) {
      res.status(400).json({
        error: 'El campo "plazoDias" es obligatorio y debe ser un número positivo'
      });
      return;
    }

    // Validación: monto es obligatorio y debe ser positivo
    if (!monto || typeof monto !== 'number' || monto <= 0) {
      res.status(400).json({
        error: 'El campo "monto" es obligatorio y debe ser un número positivo'
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
    
    // Si es ASESOR, solo puede crear mandatos para sus expedientes
    if (usuario.rol === 'ASESOR') {
      where.asesorId = usuario.id;
    }
    // ADMIN y REVISOR pueden crear mandatos para cualquier expediente

    // Verificar que el expediente existe y el usuario tiene permisos
    const expediente = await prisma.expediente.findUnique({
      where,
      include: { mandato: true }
    });

    if (!expediente) {
      res.status(404).json({
        error: 'Expediente no encontrado o no tienes permisos para crear mandatos en él'
      });
      return;
    }

    // Validar que el expediente está APROBADO
    if (expediente.estado !== 'APROBADO') {
      res.status(400).json({
        error: 'Solo se puede crear un mandato para expedientes APROBADOS',
        estadoActual: expediente.estado
      });
      return;
    }

    // Validar que el expediente no tenga ya un mandato
    if (expediente.mandato) {
      res.status(400).json({
        error: 'Este expediente ya tiene un mandato asociado',
        mandatoExistente: {
          id: expediente.mandato.id,
          estado: expediente.mandato.estado
        }
      });
      return;
    }

    // Crear el mandato
    // @ts-ignore - Los tipos de Prisma se actualizan al reiniciar VS Code
    const nuevoMandato = await prisma.mandato.create({
      data: {
        expedienteId,
        plazoDias,
        monto,
        moneda: moneda || 'ARS', // Usar la moneda recibida o ARS por defecto
        observaciones: observaciones?.trim() || null,
        estado: 'BORRADOR'
      },
      include: {
        expediente: {
          select: {
            id: true,
            titulo: true,
            propietarioNombre: true,
            estado: true
          }
        }
      }
    });

    res.status(201).json({
      mensaje: 'Mandato creado exitosamente',
      mandato: nuevoMandato
    });
  } catch (error) {
    console.error('Error al crear mandato:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear el mandato'
    });
  }
};

/**
 * GET /expedientes/:id/mandato
 * Obtiene el mandato de un expediente
 * 
 * Permisos:
 * - ASESOR: Solo puede ver mandatos de sus propios expedientes
 * - REVISOR/ADMIN: Pueden ver mandatos de todos los expedientes
 */
export const obtenerMandatoPorExpediente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expedienteId = parseInt(id);

    // Validar ID del expediente
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
    
    // Si es ASESOR, solo puede ver mandatos de sus expedientes
    if (usuario.rol === 'ASESOR') {
      where.asesorId = usuario.id;
    }
    // ADMIN y REVISOR pueden ver todos los mandatos (sin filtro adicional)

    // Verificar que el expediente existe y el usuario tiene permisos
    const expediente = await prisma.expediente.findUnique({
      where,
      include: {
        mandato: true
      }
    });

    if (!expediente) {
      res.status(404).json({
        error: 'Expediente no encontrado o no tienes permisos para verlo'
      });
      return;
    }

    // Verificar que el expediente tiene mandato
    if (!expediente.mandato) {
      res.status(404).json({
        error: 'Este expediente no tiene mandato asociado'
      });
      return;
    }

    res.json({
      mandato: expediente.mandato
    });
  } catch (error) {
    console.error('Error al obtener mandato:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener el mandato'
    });
  }
};

/**
 * PUT /mandatos/:id/estado
 * Actualiza el estado de un mandato (solo ADMIN)
 * Body: { estado, firmadoPor?, documentoUrl? }
 */
export const actualizarEstadoMandato = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, firmadoPor, documentoUrl } = req.body;
    const mandatoId = parseInt(id);

    // Validar ID del mandato
    if (isNaN(mandatoId)) {
      res.status(400).json({
        error: 'ID de mandato inválido'
      });
      return;
    }

    // Validación: estado es obligatorio
    if (!estado) {
      res.status(400).json({
        error: 'El campo "estado" es obligatorio'
      });
      return;
    }

    // Validar que el estado sea uno de los permitidos
    if (!ESTADOS_MANDATO.includes(estado as EstadoMandato)) {
      res.status(400).json({
        error: `Estado inválido. Estados permitidos: ${ESTADOS_MANDATO.join(', ')}`
      });
      return;
    }

    // Verificar que el mandato existe
    const mandatoExistente = await prisma.mandato.findUnique({
      where: { id: mandatoId }
    });

    if (!mandatoExistente) {
      res.status(404).json({
        error: 'Mandato no encontrado'
      });
      return;
    }

    // Preparar los datos a actualizar
    const dataToUpdate: any = {
      estado
    };

    // Si el estado pasa a FIRMADO, guardar firmadoPor y firmadoFecha
    if (estado === 'FIRMADO') {
      dataToUpdate.firmadoFecha = new Date();
      
      if (firmadoPor) {
        dataToUpdate.firmadoPor = firmadoPor.trim();
      }
    }

    // Si viene documentoUrl, actualizarlo
    if (documentoUrl) {
      dataToUpdate.documentoUrl = documentoUrl.trim();
    }

    // Actualizar el mandato
    const mandatoActualizado = await prisma.mandato.update({
      where: { id: mandatoId },
      data: dataToUpdate,
      include: {
        expediente: {
          select: {
            id: true,
            titulo: true,
            propietarioNombre: true
          }
        }
      }
    });

    res.json({
      mensaje: 'Estado del mandato actualizado exitosamente',
      mandato: mandatoActualizado
    });
  } catch (error) {
    console.error('Error al actualizar estado del mandato:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar el estado del mandato'
    });
  }
};

/**
 * GET /expedientes/:id/mandato/word
 * Genera y descarga el documento Word del mandato dinámicamente
 * 
 * Permisos:
 * - ASESOR: Solo puede descargar documentos de mandatos de sus expedientes
 * - REVISOR/ADMIN: Pueden descargar documentos de cualquier mandato
 */
export const descargarWordMandato = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expedienteId = parseInt(id);

    // Validar ID del expediente
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
    
    // Si es ASESOR, solo puede descargar documentos de sus expedientes
    if (usuario.rol === 'ASESOR') {
      where.asesorId = usuario.id;
    }
    // ADMIN y REVISOR pueden descargar documentos de cualquier mandato

    // Verificar que el expediente existe y el usuario tiene permisos
    const expediente = await prisma.expediente.findUnique({
      where,
      include: {
        mandato: true,
        asesor: {
          select: {
            nombre: true,
            email: true
          }
        }
      }
    });

    if (!expediente) {
      res.status(404).json({
        error: 'Expediente no encontrado o no tienes permisos para verlo'
      });
      return;
    }

    // Verificar que el expediente tiene mandato
    if (!expediente.mandato) {
      res.status(404).json({
        error: 'Este expediente no tiene mandato asociado'
      });
      return;
    }

    const mandato = expediente.mandato;

    // ==========================================
    // CREAR DOCUMENTO WORD
    // ==========================================

    // Crear array de párrafos para el documento
    const documentParagraphs: Paragraph[] = [];

    // Título principal
    documentParagraphs.push(
      new Paragraph({
        text: 'MANDATO DE VENTA',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    // Subtítulo Coldwell Banker
    documentParagraphs.push(
      new Paragraph({
        text: 'Coldwell Banker',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Sección: Datos del Expediente
    documentParagraphs.push(
      new Paragraph({
        text: 'Datos del Expediente',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );

    documentParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Expediente N°: ${expediente.id}`, break: 1 }),
          new TextRun({ text: `Título: ${expediente.titulo}`, break: 1 }),
          new TextRun({ text: `Propietario: ${expediente.propietarioNombre}`, break: 1 }),
          new TextRun({ text: `Estado: ${expediente.estado}`, break: 1 }),
        ],
        spacing: { after: 200 }
      })
    );

    if (expediente.descripcion) {
      documentParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Descripción: ${expediente.descripcion}`, break: 1 }),
          ],
          spacing: { after: 200 }
        })
      );
    }

    // Sección: Datos del Mandato
    documentParagraphs.push(
      new Paragraph({
        text: 'Datos del Mandato',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      })
    );

    // Obtener la moneda del mandato
    const moneda = mandato.moneda || 'ARS';
    const montoFormateado = `$${mandato.monto.toLocaleString('es-AR')} ${moneda}`;

    documentParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Mandato N°: ${mandato.id}`, break: 1 }),
          new TextRun({ text: `Plazo: ${mandato.plazoDias} días`, break: 1 }),
          new TextRun({ text: `Monto: ${montoFormateado}`, break: 1 }),
          new TextRun({ text: `Estado: ${mandato.estado}`, break: 1 }),
        ],
        spacing: { after: 200 }
      })
    );

    if (mandato.observaciones) {
      documentParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Observaciones: ${mandato.observaciones}`, break: 1 }),
          ],
          spacing: { after: 200 }
        })
      );
    }

    // Fecha de creación
    const createdAt = new Date(mandato.createdAt);
    documentParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Fecha de creación: ${createdAt.toLocaleDateString('es-AR')} ${createdAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, 
            break: 1 
          }),
        ],
        spacing: { after: 200 }
      })
    );

    // Si está firmado, mostrar datos de firma
    if (mandato.estado === 'FIRMADO' && mandato.firmadoPor) {
      documentParagraphs.push(
        new Paragraph({
          text: 'Firma',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        })
      );

      const firmaParagraph = [
        new TextRun({ text: `Firmado por: ${mandato.firmadoPor}`, break: 1 }),
      ];

      if (mandato.firmadoFecha) {
        const firmadoFecha = new Date(mandato.firmadoFecha);
        firmaParagraph.push(
          new TextRun({ 
            text: `Fecha de firma: ${firmadoFecha.toLocaleDateString('es-AR')} ${firmadoFecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, 
            break: 1 
          })
        );
      }

      documentParagraphs.push(
        new Paragraph({
          children: firmaParagraph,
          spacing: { after: 200 }
        })
      );
    }

    // Información del asesor
    if (expediente.asesor) {
      documentParagraphs.push(
        new Paragraph({
          text: 'Asesor Responsable',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        })
      );

      documentParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Nombre: ${expediente.asesor.nombre}`, break: 1 }),
            new TextRun({ text: `Email: ${expediente.asesor.email}`, break: 1 }),
          ],
          spacing: { after: 400 }
        })
      );
    }

    // Pie de página
    documentParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Este documento es estilizado automáticamente por el sistema de gestión de expedientes.`,
            italics: true,
            size: 18,
            color: '666666'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 100 }
      })
    );

    documentParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
            italics: true,
            size: 18,
            color: '666666'
          })
        ],
        alignment: AlignmentType.CENTER
      })
    );

    // Crear el documento
    const doc = new Document({
      sections: [{
        properties: {},
        children: documentParagraphs
      }]
    });

    // Generar el buffer del documento
    const buffer = await Packer.toBuffer(doc);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="mandato_${expedienteId}_${expediente.titulo.replace(/\s+/g, '_')}.docx"`);
    res.setHeader('Content-Length', buffer.length.toString());

    // Enviar el archivo
    res.send(buffer);

  } catch (error) {
    console.error('Error al generar documento Word del mandato:', error);
    
    // Solo enviar error si no se envió la respuesta aún
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Error interno del servidor al generar el documento del mandato'
      });
    }
  }
};
