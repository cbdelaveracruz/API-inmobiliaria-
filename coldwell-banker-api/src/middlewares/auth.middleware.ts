import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interfaz para el payload del JWT
interface JwtPayload {
id: number;
email: string;
rol: string;
}

// Extender el tipo Request de Express para incluir usuario
declare global {
namespace Express {
    interface Request {
    usuario?: JwtPayload;
    }
}
}

/**
 * Middleware que valida el JWT del header Authorization o query parameter
 * Acepta el token de dos formas:
 * 1. Header: Authorization: Bearer xxx
 * 2. Query parameter: ?token=xxx (útil para descargar PDFs en navegador)
 * 
 * Uso: router.get('/ruta-protegida', autenticar, controller)
 */
export const autenticar = (req: Request, res: Response, next: NextFunction) => {
try {
    let token: string | undefined;

    // PRIORIDAD 1: Leer token de cookie (método seguro)
    if (req.cookies?.token) {
      token = req.cookies.token;
    }
    // PRIORIDAD 2: Header Authorization (retrocompatibilidad)
    else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;
    } 
    // PRIORIDAD 3: Query parameter (para descargas de archivos)
    else if (req.query.token) {
      token = req.query.token as string;
    }

    // Validar que se encontró un token
    if (!token) {
      res.status(401).json({ 
        error: 'Token no proporcionado' 
      });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET no configurado en .env');
    }

    // Verificar y decodificar el token
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Agregar el usuario al request para usarlo en los controllers
    req.usuario = payload;

    // Continuar con el siguiente middleware/controller
    next();
} catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Token inválido' 
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'Token expirado' 
      });
      return;
    }

    console.error('Error en autenticación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
}
};

/**
 * Middleware opcional que verifica si el usuario tiene un rol específico
 * Uso: router.post('/ruta-admin', autenticar, esAdmin, controller)
 */
export const esAdmin = (req: Request, res: Response, next: NextFunction) => {
if (req.usuario?.rol !== 'ADMIN') {
    res.status(403).json({ 
    error: 'Acceso denegado: se requiere rol ADMIN' 
    });
    return;
}
next();
};

/**
 * Middleware que verifica si el usuario es ADMIN o REVISOR
 * Uso: router.put('/expedientes/:id/estado', autenticar, esAdminORevisor, controller)
 */
export const esAdminORevisor = (req: Request, res: Response, next: NextFunction) => {
  const rol = req.usuario?.rol;
  
  if (rol !== 'ADMIN' && rol !== 'REVISOR') {
    res.status(403).json({ 
      error: 'Acceso denegado: se requiere rol ADMIN o REVISOR' 
    });
    return;
  }
  
  next();
};
