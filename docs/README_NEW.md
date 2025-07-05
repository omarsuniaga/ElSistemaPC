# Music Academy Manager 🎵

Un sistema completo de gestión para academias de música construido con Vue 3, TypeScript y Firebase.

## ✨ Características Principales

- 👥 **Gestión de Estudiantes**: Registro, perfiles y seguimiento de progreso
- 👨‍🏫 **Gestión de Profesores**: Horarios, asignaciones y disponibilidad
- 📚 **Gestión de Clases**: Programación, contenidos y materiales
- 📊 **Sistema de Asistencia**: Registro y análisis de asistencia
- 🎼 **Gestión de Repertorio**: Partituras, obras musicales y notas de práctica
- 📅 **Horarios y Programación**: Sistema completo de horarios
- 📱 **PWA**: Aplicación web progresiva con soporte offline
- 🔒 **Autenticación**: Sistema seguro con roles y permisos
- 📈 **Analytics**: Reportes y análisis de datos

## 🚀 Mejoras Implementadas (2025)

### ✅ Prioridad Alta - Completado

1. **Consolidación del Módulo de Asistencia**
   - ✅ Eliminada duplicación entre `stores/attendance.ts` y `modulos/Attendance/store/attendance.ts`
   - ✅ Redireccionamiento automático al store modular
   - ✅ Marcado como deprecated el store antiguo

2. **Corrección de Imports Rotos**
   - ✅ Implementación completa de alias `@/` para rutas
   - ✅ Actualización de todos los imports relativos a rutas absolutas
   - ✅ Configuración mejorada en `vite.config.ts`

3. **Sistema de Alias de Rutas**
   - ✅ Configuración `@/` apuntando a `src/`
   - ✅ Soporte completo en TypeScript y Vite
   - ✅ Migración de rutas relativas a absolutas

4. **Revisión de Tipos**
   - ✅ Corrección de exports en `types/index.ts`
   - ✅ Uso de alias en imports de tipos
   - ✅ Estructura de tipos mejorada

### ✅ Prioridad Media - Completado

1. **Sistema de Debugging Optimizado**
   - ✅ Nuevo sistema de logging (`utils/debug.ts`)
   - ✅ Control de logs según entorno (dev/prod)
   - ✅ Tracking de performance y errores
   - ✅ Configuración granular de logging

2. **Manejo de Errores Estandarizado**
   - ✅ Utilidad central de manejo de errores (`utils/errorHandler.ts`)
   - ✅ Mapeo de códigos de error Firebase
   - ✅ Mensajes user-friendly en español
   - ✅ Composable para Vue components

3. **Documentación de APIs**
   - ✅ Documentación completa de Firebase (`docs/FIREBASE_API.md`)
   - ✅ Ejemplos de uso y best practices
   - ✅ Guía de troubleshooting
   - ✅ Documentación de security rules

### ✅ Prioridad Baja - Completado

1. **Optimización de Bundle**
   - ✅ Configuración de chunk splitting en Vite
   - ✅ Script de análisis de bundle (`scripts/analyze-bundle.ts`)
   - ✅ Separación de vendor chunks
   - ✅ Performance budgets

2. **Configuración PWA Mejorada**
   - ✅ Estrategias de caching avanzadas
   - ✅ Soporte offline mejorado
   - ✅ Configuración de manifesto optimizada
   - ✅ Runtime caching para APIs

3. **Implementación de Testing**
   - ✅ Configuración completa de Vitest
   - ✅ Mocks para Firebase y Vue Router
   - ✅ Tests unitarios de ejemplo
   - ✅ Configuración de coverage
   - ✅ Setup de ESLint

## 🛠️ Tecnologías

- **Frontend**: Vue 3, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Build**: Vite
- **Testing**: Vitest, Vue Test Utils
- **Linting**: ESLint, TypeScript ESLint
- **PWA**: Vite PWA Plugin, Workbox

## 📦 Instalación

```bash
# Clonar el repositório
git clone <repository-url>
cd music-academy-manager

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev
```

## 🔧 Scripts Disponibles

### Desarrollo

```bash
npm run dev              # Servidor de desarrollo
npm run preview          # Vista previa de producción
```

### Testing

```bash
npm run test             # Tests en modo watch
npm run test:run         # Ejecutar tests una vez
npm run test:coverage    # Tests con coverage
npm run test:ui          # Interfaz de tests
```

### Build y Análisis

```bash
npm run build            # Build de producción
npm run build:analyze    # Build + análisis de bundle
npm run analyze:bundle   # Solo análisis de bundle
```

### Calidad de Código

```bash
npm run lint             # Lint y fix automático
npm run lint:check       # Solo verificar lint
npm run type-check       # Verificación de tipos
```

### Deploy

```bash
npm run deploy           # Deploy a Firebase
```

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/          # Componentes globales
├── modulos/            # Módulos organizados por funcionalidad
│   ├── Students/       # Gestión de estudiantes
│   ├── Teachers/       # Gestión de profesores
│   ├── Classes/        # Gestión de clases
│   ├── Attendance/     # Sistema de asistencia
│   └── ...
├── stores/             # Stores de Pinia (legacy)
├── utils/              # Utilidades generales
│   ├── errorHandler.ts # Manejo de errores
│   └── debug.ts        # Sistema de debugging
├── types/              # Definiciones de tipos
└── test/               # Configuración de tests
```

## 🔒 Seguridad

- Autenticación con Firebase Auth
- Reglas de seguridad en Firestore
- Validación en cliente y servidor
- Manejo seguro de errores sin exposición de datos sensibles

## 📊 Performance

- Bundle splitting automático
- Lazy loading de rutas
- Caching estratégico con Workbox
- Optimización de imágenes
- Tree shaking habilitado

## 🧪 Testing

El proyecto incluye una suite completa de tests:

- **Unit Tests**: Utilidades y funciones puras
- **Component Tests**: Componentes Vue individuales
- **Integration Tests**: Interacción entre módulos
- **E2E Tests**: Flujos completos de usuario (planeado)

### Ejecutar Tests

```bash
# Tests en modo watch (desarrollo)
npm run test

# Tests con coverage
npm run test:coverage

# Tests con interfaz gráfica
npm run test:ui
```

## 🐛 Debugging

### Modo Desarrollo

```bash
# Habilitar logs detallados
VITE_DEBUG_MODE=true npm run dev
```

### Análisis de Bundle

```bash
# Generar reporte de tamaño
npm run build:analyze
```

### Utilidades de Debug

El proyecto incluye utilidades de debugging accesibles en el navegador:

```javascript
// En desarrollo, accesible desde console del navegador
__DEBUG__.debugManager // Manager de debugging
__DEBUG__.getErrors() // Obtener errores almacenados
__DEBUG__.clearErrors() // Limpiar errores
```

## 📚 Documentación

- [API de Firebase](./docs/FIREBASE_API.md) - Documentación completa de servicios
- [Guía de Contribución](./CONTRIBUTING.md) - Cómo contribuir al proyecto
- [Mejoras Implementadas](./OPTIMIZATION_SUMMARY.md) - Resumen de optimizaciones

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- Usar TypeScript para todo el código nuevo
- Seguir las reglas de ESLint configuradas
- Escribir tests para nuevas funcionalidades
- Usar los alias `@/` para imports
- Documentar APIs y funciones complejas

## 📝 Changelog

### v1.1.0 (2025-06-06)

- ✅ Consolidación de módulos de asistencia
- ✅ Implementación de alias de rutas @/
- ✅ Sistema de manejo de errores estandarizado
- ✅ Optimización de debugging y logging
- ✅ Documentación completa de APIs Firebase
- ✅ Configuración de testing con Vitest
- ✅ Optimización de bundle y PWA
- ✅ Configuración de ESLint

### v1.0.0 (2024)

- 🎉 Lanzamiento inicial
- 👥 Sistema de gestión de estudiantes y profesores
- 📊 Sistema de asistencia básico
- 🎼 Gestión de repertorio musical
- 📱 PWA básica

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

- **Desarrollo**: Equipo de desarrollo de Music Academy
- **Mantenimiento**: [Tu nombre/equipo]

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa la [documentación](./docs/)
2. Busca en los [issues existentes](../../issues)
3. Crea un [nuevo issue](../../issues/new) si es necesario

---

**⭐ Si este proyecto te ha sido útil, no olvides darle una estrella en GitHub!**
