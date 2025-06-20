# Music Academy Manager

Sistema completo de gestión para academias de música con Vue 3, TypeScript y Firebase.

## 🚀 Características

- ✅ Gestión de asistencia con 4 estados
- ✅ Sistema de observaciones de clase
- ✅ Justificaciones de ausencias
- ✅ Gestión de estudiantes y profesores
- 🔄 Módulo de repertorio musical (en desarrollo)
- 📊 Sistema de métricas y reportes

## 🛠️ Stack Tecnológico

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Firebase (Firestore, Auth)
- **Estado**: Pinia
- **Estilos**: Tailwind CSS
- **Testing**: Vitest + Vue Test Utils

## 📋 Requisitos

- Node.js 18.x o superior
- npm 9.x o superior
- Cuenta de Firebase

## ⚡ Instalación Rápida

```bash
# Clonar repositorio
git clone [repo-url]
cd music-academy-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run test         # Ejecutar tests
npm run lint         # Verificar código
npm run format       # Formatear código
npm run validate     # Lint + format + type-check
```

## 📁 Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables
├── modulos/        # Módulos de la aplicación
│   ├── Attendance/ # Gestión de asistencia
│   └── Montaje/    # Gestión de repertorio
├── stores/         # Estados globales (Pinia)
├── services/       # Servicios de API
└── utils/          # Utilidades
```

## 🧪 Testing

```bash
npm run test         # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Cobertura de tests
```

## 🚀 Despliegue

```bash
npm run build        # Build
npm run deploy       # Deploy a Firebase
```

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
