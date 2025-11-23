# 📱 Coldwell Banker Mobile - App Móvil

Aplicación móvil nativa para gestión inmobiliaria con React Native y Expo.

## � Tecnologías

- **React Native**
- **Expo SDK** 52
- **TypeScript** v5.9
- **React Navigation** v6
- **Axios** para peticiones HTTP
- **Expo Router** para navegación

## 📦 Funcionalidades

### 🔐 Autenticación
- Pantalla de login nativa
- Almacenamiento seguro de tokens
- Context API para autenticación
- Navegación protegida

### 🏠 Gestión de Propiedades

#### Listado
- Cards con información resumida
- Scroll infinito
- Pull to refresh
- Filtros por estado
- Indicadores visuales

#### Detalle
- Información completa
- Imágenes de la propiedad
- Estado y observaciones
- Botones de acción según rol

#### Crear/Editar
- Formulario nativo optimizado
- Validación de campos
- Selección de imágenes
- Feedback visual

#### Cambio de Estado (ADMIN/REVISOR)
- Modal nativo
- Campo de observaciones
- Confirmación

### 📊 Dashboard
- Estadísticas visuales
- Resumen de propiedades
- Accesos rápidos

### � Perfil
- Información del usuario
- Configuración
- Logout

## 📁 Estructura del Proyecto

```
src/
├── api/
│   ├── client.ts              # Cliente Axios configurado
│   ├── authApi.ts             # Endpoints de autenticación
│   ├── propertiesApi.ts       # Endpoints de propiedades
│   └── mandatesApi.ts         # Endpoints de mandatos
├── components/
│   ├── PropertyCard.tsx       # Card de propiedad
│   ├── FavoriteButton.tsx     # Botón de favoritos
│   └── index.ts               # Exports
├── context/
│   └── AuthContext.tsx        # Estado global de autenticación
├── navigation/
│   ├── AppNavigator.tsx       # Navegador principal
│   ├── TabNavigator.tsx       # Pestañas inferiores
│   ├── HomeStack.tsx          # Stack de inicio
│   ├── PropertiesStack.tsx    # Stack de propiedades
│   └── types.ts               # Types de navegación
├── screens/
│   ├── LoginScreen.tsx        # Pantalla de login
│   ├── HomeScreen.tsx         # Pantalla de inicio
│   ├── PropertiesListScreen.tsx # Listado de propiedades
│   ├── PropertyDetailScreen.tsx # Detalle de propiedad
│   ├── PropertyFormScreen.tsx   # Crear/editar propiedad
│   ├── MandateFormScreen.tsx    # Crear mandato
│   ├── FavoritesScreen.tsx      # Favoritos
│   ├── ProfileScreen.tsx        # Perfil
│   ├── SettingsScreen.tsx       # Configuración
│   └── index.ts                 # Exports
├── types/
│   └── index.ts               # TypeScript types compartidos
└── App.tsx                    # Punto de entrada
```

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Iniciar Expo
npx expo start

# Ejecutar en Android
npx expo start --android

# Ejecutar en iOS
npx expo start --ios

# Ejecutar en web
npx expo start --web
```

## 🌐 Configuración

### Variables de Entorno

Crear archivo `.env`:

```env
# URL del backend API
EXPO_PUBLIC_API_URL=http://tu-ip:3000
```

**Nota**: En desarrollo, usar la IP local de tu máquina, no `localhost`.

### Configuración de API

El cliente Axios está configurado en `src/api/client.ts` con:
- Base URL desde variables de entorno
- Interceptores para JWT
- Manejo de errores
- Timeout configurado

## 📱 Navegación

### Tab Navigator (Pestañas Inferiores)
- 🏠 **Inicio**: Dashboard y accesos rápidos
- 📋 **Propiedades**: Listado de propiedades
- ⭐ **Favoritos**: Propiedades favoritas
- � **Perfil**: Información y configuración

### Stack Navigators
- **HomeStack**: Navegación desde inicio
- **PropertiesStack**: Navegación de propiedades

## 🎨 Diseño

- **Componentes nativos** optimizados
- **Diseño adaptativo** para diferentes tamaños de pantalla
- **Tema consistente** con colores de marca
- **Animaciones nativas** suaves
- **Gestos nativos** (swipe, pull-to-refresh)

## � Roles y Funcionalidades

### ADMIN
- Ver todas las propiedades
- Aprobar/rechazar propiedades
- Acceso completo

### REVISOR
- Ver todas las propiedades
- Aprobar/rechazar propiedades

### ASESOR
- Ver solo sus propiedades
- Crear propiedades
- Crear mandatos

## 🔒 Seguridad

- ✅ Almacenamiento seguro de tokens
- ✅ Rutas protegidas
- ✅ Validación de inputs
- ✅ Manejo de errores
- ✅ Timeout de sesión

## 🚀 Build y Deployment

### Android

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB para Play Store
eas build --platform android --profile production
```

### iOS

```bash
# Build para TestFlight
eas build --platform ios --profile preview

# Build para App Store
eas build --platform ios --profile production
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web

# Lint
npm run lint

# Type check
npm run type-check
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Watch mode
npm run test:watch
```

## 📦 Dependencias Principales

```json
{
  "expo": "~52.0.0",
  "react": "18.3.1",
  "react-native": "0.76.5",
  "@react-navigation/native": "^6.1.18",
  "@react-navigation/bottom-tabs": "^6.6.1",
  "@react-navigation/native-stack": "^6.11.0",
  "axios": "^1.7.9",
  "typescript": "^5.9.3"
}
```

## � Notas de Desarrollo

### Características Implementadas
- ✅ Autenticación con JWT
- ✅ Navegación con React Navigation
- ✅ Gestión de estado con Context API
- ✅ Cliente API con Axios
- ✅ TypeScript en todo el proyecto
- ✅ Componentes reutilizables

### Próximas Mejoras
- [ ] Tests con Jest y React Native Testing Library
- [ ] Implementar React Query para cache
- [ ] Agregar notificaciones push
- [ ] Implementar modo offline
- [ ] Agregar animaciones con Reanimated
- [ ] Implementar deep linking
- [ ] Agregar analytics
- [ ] Implementar crash reporting

## 🎯 Características Destacadas

- ✅ **Expo**: Desarrollo rápido y fácil deployment
- ✅ **TypeScript**: Tipado fuerte
- ✅ **React Navigation**: Navegación nativa
- ✅ **Context API**: Gestión de estado simple
- ✅ **Axios Interceptors**: Manejo automático de tokens
- ✅ **Componentes nativos**: Rendimiento óptimo

## 🔧 Troubleshooting

### Error de conexión con API
- Verificar que la URL en `.env` use la IP local, no `localhost`
- Verificar que el backend esté corriendo
- Verificar que estén en la misma red

### Error al instalar dependencias
```bash
# Limpiar cache
npm cache clean --force
rm -rf node_modules
npm install
```

### Error al iniciar Expo
```bash
# Limpiar cache de Expo
npx expo start -c
```

## 👨‍💻 Desarrollador

Matías - Desarrollador Full Stack

## 📄 Licencia

Proyecto privado - Coldwell Banker Argentina
