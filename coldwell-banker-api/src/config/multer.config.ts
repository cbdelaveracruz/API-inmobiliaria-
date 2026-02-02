import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

/**
 * Configuración de multer para subida de archivos PDF
 * 
 * Almacenamiento:
 * - Por ahora guarda los archivos localmente en: uploads/propiedades/{expedienteId}/
 * - TODO: Reemplazar por subida a OneDrive cuando esté listo
 * 
 * Validaciones:
 * - Solo acepta archivos PDF (application/pdf o .pdf)
 * - Genera nombres únicos con timestamp para evitar sobrescrituras
 * - Crea carpetas automáticamente si no existen
 * - SEGURIDAD: Previene path traversal validando expedienteId
 */

// Configuración del almacenamiento
const storage = multer.diskStorage({
  // Determinar la carpeta de destino según el expedienteId o propiedadId
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Soportar tanto 'expedienteId' (legacy) como 'propiedadId' (nuevo)
    const expedienteIdRaw = req.body.propiedadId || req.body.expedienteId;

    if (!expedienteIdRaw) {
      cb(new Error('El campo propiedadId o expedienteId es obligatorio'), '');
      return;
    }

    // SEGURIDAD: Validar que sea un número entero positivo para prevenir path traversal
    const expedienteId = parseInt(expedienteIdRaw);
    if (isNaN(expedienteId) || expedienteId <= 0) {
      cb(new Error('El expedienteId debe ser un número positivo válido'), '');
      return;
    }

    // Usar ruta absoluta para mayor seguridad
    const uploadPath = path.join(process.cwd(), 'uploads', 'propiedades', expedienteId.toString());

    // SEGURIDAD: Validar que la ruta final está dentro de uploads/
    const uploadsBase = path.join(process.cwd(), 'uploads');
    if (!uploadPath.startsWith(uploadsBase)) {
      cb(new Error('Ruta de archivo inválida'), '');
      return;
    }

    // Crear la carpeta si no existe (recursive: true crea toda la ruta)
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  // Generar nombre de archivo único
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Soportar tanto 'expedienteId' (legacy) como 'propiedadId' (nuevo)
    const expedienteIdRaw = req.body.propiedadId || req.body.expedienteId;

    // SEGURIDAD: Validar que sea un número entero positivo
    const expedienteId = parseInt(expedienteIdRaw);
    if (isNaN(expedienteId) || expedienteId <= 0) {
      cb(new Error('El expedienteId debe ser un número positivo válido'), '');
      return;
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const extension = path.extname(file.originalname);

    // Formato: propiedad-{id}-{timestamp}.pdf
    const filename = `propiedad-${expedienteId}-${timestamp}${extension}`;

    cb(null, filename);
  }
});

// Filtro para validar que solo se suban archivos PDF o Imágenes
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('🔍 [Multer] Filtering file:', file.originalname, 'Mime:', file.mimetype);

  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/octet-stream'];
  
  // Validar por mimetype
  if (allowedMimeTypes.includes(file.mimetype)) {
    // Si es octet-stream, verificamos doblemente la extensión
    if (file.mimetype === 'application/octet-stream') {
        const ext = path.extname(file.originalname).toLowerCase();
        const validExts = ['.pdf', '.jpg', '.jpeg', '.png'];
        if (validExts.includes(ext)) {
            console.log('✅ [Multer] Accepted octet-stream with valid extension:', ext);
            cb(null, true);
            return;
        }
    } else {
        console.log('✅ [Multer] Accepted by mimetype:', file.mimetype);
        cb(null, true);
        return;
    }
  }

  // Validar por extensión (fallback)
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  
  if (allowedExtensions.includes(extension)) {
    console.log('✅ [Multer] Accepted by extension:', extension);
    cb(null, true);
    return;
  }

  console.error('❌ [Multer] Rejected file:', file.originalname, file.mimetype);
  // Rechazar el archivo
  cb(new Error('Solo se permiten archivos PDF o Imágenes (JPG, PNG)'));
};

// Configuración de multer
export const uploadPDF = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Límite de 50MB por archivo
    // Suficiente para documentos escaneados de alta calidad
    // Para archivos muy grandes (>50MB) considerar streaming o chunks
  }
});

// Middleware para un solo archivo PDF
export const uploadSinglePDF = uploadPDF.single('archivo');
