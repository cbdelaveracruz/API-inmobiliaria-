# 🌐 Coldwell Banker Web - Frontend

Aplicación web para gestión inmobiliaria con React y TypeScript.

## 🚀 Tecnologías

- **React** v18
- **TypeScript** v5.9
- **Vite** v6
- **React Router** v6
- **Axios** para peticiones HTTP
- **CSS Modules** para estilos

## 📦 Funcionalidades

### 🔐 Autenticación
- Página de login con validación
- Context API para estado global
- Protección de rutas privadas
- Almacenamiento de token JWT
- Logout con limpieza de sesión

### 📊 Dashboard
- Vista general con estadísticas
- Resumen de propiedades por estado
- Navegación rápida

### 🏠 Gestión de Propiedades

#### Listado
- Tabla con todas las propiedades
- Filtros por estado, asesor, fechas
- Paginación
- Búsqueda
- Indicadores visuales de estado

#### Detalle
- Información completa de la propiedad
- Lista de documentos adjuntos
- Visualización de PDFs
- Sección de mandato
- Descarga de mandato Word
- Observaciones del revisor

#### Crear/Editar
- Formulario completo
- Validación de campos
- Mensajes de éxito/error

#### Cambio de Estado (ADMIN/REVISOR)
- Modal para aprobar/rechazar
- Campo de observaciones
- Confirmación de acción

### 📄 Gestión de Documentos
- Formulario de subida de PDF
- Selección de tipo de documento
- Validación de archivo (solo PDF, max 10MB)
- Preview del nombre
- Barra de progreso
- Visualización segura de PDFs
- Descarga de documentos

### 📝 Gestión de Mandatos
- Formulario de creación
- Campos: plazo, monto, moneda, observaciones
- Solo para expedientes APROBADOS
- Descarga de mandato Word generado

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Navbar.tsx              # Barra de navegación
│   ├── PrivateRoute.tsx        # Protección de rutas
│   └── ChangeStatusModal.tsx   # Modal cambio de estado
├── context/
│   └── AuthContext.tsx         # Estado global de autenticación
├── pages/
│   ├── Login.tsx               # Página de login
│   ├── Dashboard.tsx           # Dashboard principal
│   ├── PropiedadesList.tsx     # Listado de propiedades
│   ├── PropiedadDetail.tsx     # Detalle de propiedad
│   ├── PropiedadForm.tsx       # Crear/editar propiedad
│   ├── UploadDocumento.tsx     # Subir documentos
│   └── MandatoForm.tsx         # Crear mandato
├── services/
│   └── api.ts                  # Cliente Axios y helpers
├── types/
│   └── index.ts                # TypeScript types
├── App.tsx                     # Configuración de rutas
└── main.tsx                    # Punto de entrada
```

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu API

# Iniciar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Preview de producción
npm run preview
```

## 🌐 Variables de Entorno

```env
# URL del backend API
VITE_API_URL=http://localhost:3000
```

## 🎨 Estilos

- **CSS Modules** para componentes aislados
- **Diseño responsivo** (mobile, tablet, desktop)
- **Paleta de colores** profesional
- **Animaciones** y transiciones suaves
- **Estados de carga** y feedback visual

## 🔑 Roles y Vistas

### ADMIN
- Dashboard completo
- Ver todas las propiedades
- Aprobar/rechazar propiedades
- Gestionar usuarios
- Ver todos los mandatos

### REVISOR
- Ver todas las propiedades
- Aprobar/rechazar propiedades
- No puede crear usuarios

### ASESOR
- Ver solo sus propias propiedades
- Crear propiedades
- Subir documentos
- Crear mandatos (solo para propiedades APROBADAS)

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 **Mobile**: 320px - 767px
- 📱 **Tablet**: 768px - 1023px
- 💻 **Desktop**: 1024px+

## 🔒 Seguridad

- ✅ Rutas protegidas con autenticación
- ✅ Validación de formularios
- ✅ Sanitización de inputs
- ✅ Descarga segura de archivos
- ✅ Manejo de errores centralizado
- ✅ Tokens JWT en localStorage (migrar a httpOnly cookies)

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint

# Type check
npm run type-check
```

## 📝 Notas de Desarrollo

### Correcciones de Seguridad Aplicadas
- **Secure File Download**: Helper `descargarDocumento()` para descarga segura de PDFs
- **Error Handling**: Manejo de errores en UI con mensajes específicos
- **Input Validation**: Validación de formularios en cliente

### Próximas Mejoras
- [ ] Tests con Vitest y React Testing Library
- [ ] Migrar JWT a cookies httpOnly
- [ ] Implementar React Query para cache
- [ ] Agregar Storybook para componentes
- [ ] Mejorar accesibilidad (a11y)
- [ ] Agregar modo oscuro
- [ ] Implementar PWA

## 🎯 Características Destacadas

- ✅ **TypeScript**: Tipado fuerte en toda la aplicación
- ✅ **Context API**: Gestión de estado global sin librerías externas
- ✅ **CSS Modules**: Estilos encapsulados por componente
- ✅ **Vite**: Build rápido y HMR instantáneo
- ✅ **React Router**: Navegación declarativa
- ✅ **Axios Interceptors**: Manejo automático de tokens

## 👨‍💻 Desarrollador

Matías - Desarrollador Full Stack

## 📄 Licencia

Proyecto privado - Coldwell Banker Argentina
