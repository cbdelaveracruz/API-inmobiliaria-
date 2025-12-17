import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

/**
 * POST /auth/login
 * Valida credenciales y devuelve un JWT
 */
export const login = async (req: Request, res: Response) => {
try {
    const { email, password } = req.body;

    // Validar que vengan los datos
    if (!email || !password) {
    res.status(400).json({ 
        error: 'Email y password son requeridos' 
    });
    return;
    }

    // Buscar el usuario por email
    const usuario = await prisma.usuario.findUnique({
    where: { email }
    });

    if (!usuario) {
    res.status(401).json({ 
        error: 'Credenciales inválidas' 
    });
    return;
    }

    // Verificar el password con bcrypt
    const passwordValido = await bcrypt.compare(password, usuario.hash);

    if (!passwordValido) {
    res.status(401).json({ 
        error: 'Credenciales inválidas' 
    });
    return;
    }

    // Generar JWT
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

    if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado en .env');
    }

    const token = jwt.sign(
    {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // Determinar entorno para configurar cookie
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Establecer cookie con el token (HttpOnly para seguridad)
    res.cookie('token', token, {
      httpOnly: true,  // No accesible desde JavaScript (protección XSS)
      secure: isProduction,  // true en producción (Railway HTTPS), false en local
      sameSite: isProduction ? 'none' : 'lax',  // 'none' para Railway+Vercel, 'lax' para localhost
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 días
      path: '/'  // Cookie disponible en toda la app
    });

    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
} catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
    error: 'Error interno del servidor' 
    });
}
};

/**
 * POST /auth/logout
 * Elimina la cookie del token para cerrar sesión
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Limpiar la cookie estableciendo maxAge a 0
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });

    res.json({
      mensaje: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

/**
 * GET /auth/me
 * Devuelve los datos del usuario actual si tiene una sesión válida
 * Requiere middleware autenticar
 */
export const me = async (req: Request, res: Response) => {
  try {
    // El middleware autenticar ya validó el token y adjuntó req.usuario
    if (!req.usuario) {
      res.status(401).json({ 
        error: 'No autenticado' 
      });
      return;
    }

    // Buscar usuario completo en BD (por si necesitamos datos frescos)
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true
      }
    });

    if (!usuario) {
      res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
      return;
    }

    res.json({
      usuario
    });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};
