import { Request, Response } from 'express';
import prisma from '../prisma';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
// Fix para n2words (manejo de importación CJS/ESM)
import n2wordsLib from 'n2words';
const n2words = (n2wordsLib as any).default || n2wordsLib;

/**
 * GET /propiedades/:id/mandato/word-completo
 * Genera el mandato Word con todos los datos autocompletados
 * 
 * Permisos:
 * - Requiere autenticación
 * - ASESOR: Solo puede generar mandatos de sus propios expedientes
 * - ADMIN: Puede generar mandatos de cualquier expediente
 */
export const generarMandatoCompleto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expedienteId = parseInt(id);

    // Validar ID
    if (isNaN(expedienteId)) {
      res.status(400).json({ error: 'ID de expediente inválido' });
      return;
    }

    // Obtener usuario autenticado
    const usuario = req.usuario;
    if (!usuario) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Construir where según el rol
    const where: any = { id: expedienteId };
    if (usuario.rol === 'ASESOR') {
      where.asesorId = usuario.id;
    }

    // Obtener expediente con todos los datos necesarios
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
        error: 'Expediente no encontrado o no tienes permisos para acceder a él'
      });
      return;
    }

    // Verificar que el expediente esté aprobado
    if (expediente.estado !== 'APROBADO') {
      res.status(400).json({
        error: 'El expediente debe estar APROBADO para generar el mandato',
        estadoActual: expediente.estado
      });
      return;
    }

    // Verificar que tenga mandato
    if (!expediente.mandato) {
      res.status(404).json({
        error: 'Este expediente no tiene un mandato creado'
      });
      return;
    }

    // Leer plantilla
    const templatePath = path.resolve(
      __dirname,
      '..',
      'templates',
      'mandato_venta_persona_fisica.docx'
    );

    console.log('📂 Directorio actual (__dirname):', __dirname);
    console.log('📂 Ruta plantilla calculada:', templatePath);
    console.log('📂 ¿Existe el archivo?:', fs.existsSync(templatePath));

    if (!fs.existsSync(templatePath)) {
      console.error('❌ ERROR CRÍTICO: No se encuentra el archivo de plantilla en:', templatePath);
      // Intentar listar el directorio padre para ver qué hay
      try {
        const parentDir = path.dirname(templatePath);
        console.log(`📂 Contenido de ${parentDir}:`, fs.readdirSync(parentDir));
      } catch (e) {
        console.error('No se pudo listar directorio de plantillas');
      }

      res.status(500).json({
        error: 'Plantilla de mandato no encontrada en el servidor',
        path: templatePath
      });
      return;
    }

    const content = fs.readFileSync(templatePath, 'binary');

    // Preparar datos para rellenar
    const formatDate = (date: Date | string | null) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('es-AR');
    };
    
    // Helper para convertir números a letras (simplificado para días)
    function numeroALetrasHelper(num: number): string {
      try {
        console.log('🔢 Intentando convertir número:', num);
        // Intentar usar n2words de varias formas posibles
        if (typeof n2words === 'function') return n2words(num, { lang: 'es' });
        if (typeof n2wordsLib === 'function') return (n2wordsLib as any)(num, { lang: 'es' });
        // @ts-ignore
        if (n2wordsLib?.default && typeof n2wordsLib.default === 'function') return n2wordsLib.default(num, { lang: 'es' });
        
        console.warn('⚠️ n2words no es una función:', typeof n2words);
        return num.toString();
      } catch (error) {
        console.error('❌ Error en numeroALetrasHelper:', error);
        return num.toString();
      }
    }

    // Helper para formatear monto en letras y números
    function formatearMontoCompleto(monto: number, moneda: string): { montoCompleto: string, montoLetras: string, monedaNombre: string } {
      const esDolares = moneda === 'USD';
      const monedaNombre = esDolares ? 'DÓLARES ESTADOUNIDENSES' : 'PESOS ARGENTINOS';
      const monedaSimbolo = esDolares ? 'USD' : 'ARS';
      
      // Parte entera y decimal
      const parteEntera = Math.floor(monto);
      const parteDecimal = Math.round((monto - parteEntera) * 100);
      
      let letras = '';
      try {
        letras = numeroALetrasHelper(parteEntera);
        
        // Capitalizar primera letra
        if (letras && letras.length > 0) {
            letras = letras.charAt(0).toUpperCase() + letras.slice(1);
        }
        
        // Agregar decimales si existen
        if (parteDecimal > 0) {
            letras += ` con ${parteDecimal}/100`;
        }
      } catch (err) {
        console.error('❌ Error al convertir monto a letras:', err);
        letras = monto.toString();
      }
      
      const numeroFormateado = monto.toLocaleString('es-AR', {
        minimumFractionDigits: parteDecimal > 0 ? 2 : 0,
        maximumFractionDigits: 2
      });

      // Formato final: "DÓLARES ESTADOUNIDENSES DOSCIENTOS MIL (USD 200.000)"
      const montoCompleto = `${monedaNombre} ${letras.toUpperCase()} (${monedaSimbolo} ${numeroFormateado})`;
      
      return {
        montoCompleto,
        montoLetras: letras.toUpperCase(),
        monedaNombre
      };
    }

    // Parsear propietarios desde el JSON string
    let propietariosList: any[] = [];
    if (expediente.propietarios) {
      try {
        propietariosList = JSON.parse(expediente.propietarios);
      } catch (e) {
        console.error('Error al parsear propietarios:', e);
      }
    }

    // Preparar propietarios (máximo 3)
    const propietario1 = propietariosList[0] || null;
    const propietario2 = propietariosList[1] || null;
    const propietario3 = propietariosList[2] || null;

    // Lógica para formatear el plazo
    const dias = expediente.mandato.plazoDias || 0;
    let plazoTexto = '';
    let plazoMesesTexto = '';

    // Formato Días: "noventa (90) días"
    if (dias > 0) {
      plazoTexto = `${numeroALetrasHelper(dias)} (${dias}) días`;
    }

    // Formato Meses (si es exacto): "tres (3) meses"
    if (dias > 0 && dias % 30 === 0) {
      try {
        const meses = dias / 30;
        const mesesLetras = numeroALetrasHelper(meses);
        const palabraMes = meses === 1 ? 'mes' : 'meses';
        const letrasFormat = mesesLetras === 'uno' ? 'un' : mesesLetras; 
        plazoMesesTexto = `${letrasFormat} (${meses}) ${palabraMes}`;
      } catch (err) {
        console.error('Error en conversion meses:', err);
      }
    }

    // Lógica de Monto
    const montoValor = expediente.mandato.monto || 0;
    const monedaTipo = expediente.mandato.moneda || 'ARS';
    const { montoCompleto, montoLetras, monedaNombre } = formatearMontoCompleto(montoValor, monedaTipo);

    const data = {
      // Datos de la propiedad
      tipoPropiedad: expediente.tipoPropiedad || '',
      direccion: expediente.direccion || '',
      partidaInmobiliaria: expediente.partidaInmobiliaria || '',
      localidad: expediente.localidad || '',
      
      // Datos del mandato
      monto: expediente.mandato.monto?.toString() || '',
      moneda: expediente.mandato.moneda || 'ARS',
      plazoDias: expediente.mandato.plazoDias?.toString() || '',
      
      // VARIABLES INTELIGENTES
      plazo: plazoTexto,           
      plazo_meses: plazoMesesTexto, 
      plazo_inteligente: plazoMesesTexto || plazoTexto,
      
      montoCompleto: montoCompleto,
      montoLetras: montoLetras,
      monedaNombre: monedaNombre,
      
      // Propietario 1
      propietario1Nombre: propietario1?.nombreCompleto || propietario1?.nombre || '',
      propietario1Dni: propietario1?.dni || '',
      propietario1FechaNacimiento: propietario1?.fechaNacimiento || '',
      propietario1Domicilio: propietario1?.domicilioReal || '',
      propietario1Celular: propietario1?.celular || '',
      propietario1Cuil: propietario1?.cuil || '',
      propietario1EstadoCivil: propietario1?.estadoCivil || '',
      propietario1Email: propietario1?.email || '',
      
      // Propietario 2
      propietario2Nombre: propietario2?.nombreCompleto || propietario2?.nombre || '',
      propietario2Dni: propietario2?.dni || '',
      propietario2FechaNacimiento: propietario2?.fechaNacimiento || '',
      propietario2Domicilio: propietario2?.domicilioReal || '',
      propietario2Celular: propietario2?.celular || '',
      propietario2Cuil: propietario2?.cuil || '',
      propietario2EstadoCivil: propietario2?.estadoCivil || '',
      propietario2Email: propietario2?.email || '',
      
      // Propietario 3
      propietario3Nombre: propietario3?.nombreCompleto || propietario3?.nombre || '',
      propietario3Dni: propietario3?.dni || '',
      propietario3FechaNacimiento: propietario3?.fechaNacimiento || '',
      propietario3Domicilio: propietario3?.domicilioReal || '',
      propietario3Celular: propietario3?.celular || '',
      propietario3Cuil: propietario3?.cuil || '',
      propietario3EstadoCivil: propietario3?.estadoCivil || '',
      propietario3Email: propietario3?.email || '',
      
      // Array de propietarios para bucles en la plantilla ({#propietarios}...{/propietarios})
      propietarios: propietariosList.map(p => ({
        nombre: p.nombreCompleto || p.nombre || '',
        dni: p.dni || '',
        fechaNacimiento: p.fechaNacimiento || '',
        domicilio: p.domicilioReal || '',
        celular: p.celular || '',
        cuil: p.cuil || '',
        estadoCivil: p.estadoCivil || '',
        email: p.email || ''
      })),

      // Fechas formateadas
      fechaActual: formatDate(new Date()),
    };

    console.log('📄 Generando mandato con datos:', {
      expedienteId,
      propietarios: propietariosList.length,
      tipoPropiedad: data.tipoPropiedad,
      plazo: data.plazo_inteligente,
      monto: data.montoCompleto
    });

    // Generar documento
    try {
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        // Manejo de placeholders no encontrados o fragmentados
        nullGetter: () => {
          return ''; // Devolver string vacío para placeholders faltantes
        },
        // Modo delimitador más permisivo
        delimiters: {
          start: '{{',
          end: '}}'
        },
        // Preservar el formato del documento (no del placeholder)
        parser: (tag: string) => {
          return {
            get: (scope: any) => {
              if (tag === '.') {
                return scope;
              }
              return scope[tag];
            }
          };
        }
      });

      // Rellenar con datos
      console.log('🔄 Renderizando plantilla con datos...');
      doc.render(data);

      // Generar buffer
      console.log('📦 Generando buffer del documento...');
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // Configurar headers para descarga
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="mandato-${expediente.titulo.replace(/\s/g, '-')}-${expedienteId}.docx"`
      );

      console.log('✅ Documento generado exitosamente');
      // Enviar documento
      res.send(buffer);
    } catch (docError: any) {
      console.error('❌ Error en docxtemplater:', docError);
      
      // Si es un multi_error, mostrar los errores individuales
      if (docError.properties && docError.properties.errors) {
        console.error('📋 Errores individuales en la plantilla:');
        docError.properties.errors.forEach((err: any, index: number) => {
          console.error(`\n[Error ${index + 1}]`);
          console.error('  - Tipo:', err.name);
          console.error('  - Mensaje:', err.message);
          console.error('  - Propiedades:', err.properties);
        });
      }
      
      console.error('📋 Detalles completos:', {
        message: docError.message,
        properties: docError.properties
      });
      
      res.status(500).json({
        error: 'Error al procesar la plantilla del mandato',
        detalles: docError.message,
        errores: docError.properties?.errors?.map((e: any) => ({
          tipo: e.name,
          mensaje: e.message,
          detalles: e.properties
        })),
        sugerencia: 'Verifica que los placeholders en la plantilla Word estén bien formados: {{nombreDelPlaceholder}}'
      });
      return;
    }

  } catch (error) {
    console.error('Error al generar mandato completo:', error);
    res.status(500).json({
      error: 'Error interno al generar el mandato',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
