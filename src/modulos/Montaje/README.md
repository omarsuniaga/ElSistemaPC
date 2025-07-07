# 🎼 Módulo de Montaje Musical

Módulo completo de gestión musical para orquestas, coros y conjuntos musicales. Diseñado para ser integrado en proyectos Vue.js más grandes como un módulo autónomo.

## 🚀 Características

- **Gestión de Obras Musicales** - Crear, editar y organizar repertorio musical
- **Sistema de Evaluaciones** - Evaluar progreso individual y grupal
- **Analytics y Reportes** - Visualizar datos y generar informes
- **Herramientas Musicales** - Metrónomo, afinador y herramientas de práctica
- **Gestión de Usuarios** - Sistema completo de roles y permisos
- **PWA Support** - Funciona offline y es instalable
- **Modo Oscuro/Claro** - Interfaz adaptable
- **Diseño Responsive** - Optimizado para todos los dispositivos

## 📦 Instalación

```bash
npm install @montaje/musical-module
```

## 🛠️ Uso Básico

### Como Plugin de Vue

```typescript
import { createApp } from 'vue'
import { MontajeModule } from '@montaje/musical-module'
import '@montaje/musical-module/style.css'

const app = createApp(App)

// Instalar el módulo con configuración
app.use(MontajeModule, {
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project',
    // ... otras configuraciones de Firebase
  },
  theme: {
    defaultTheme: 'dark'
  },
  pwa: {
    enabled: true
  }
})

app.mount('#app')
```

### Integrando Rutas

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { addMontajeRoutes } from '@montaje/musical-module'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Tus rutas existentes
    { path: '/', component: HomePage }
  ]
})

// Añadir rutas del módulo de montaje
addMontajeRoutes(router, '/montaje')

export default router
```

### Uso de Componentes

```vue
<template>
  <div>
    <!-- Widget en dashboard principal -->
    <MontajeDashboardWidget />
    
    <!-- Aplicación completa de montaje -->
    <MontajeApp v-if="showMontaje" />
  </div>
</template>

<script setup>
import { MontajeDashboardWidget, MontajeApp } from '@montaje/musical-module'
</script>
```

## 🔧 Configuración

### MontajeModuleConfig

```typescript
interface MontajeModuleConfig {
  // Configuración de Firebase
  firebase?: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
  
  // Configuración de rutas
  routing?: {
    basePath?: string
    mode?: 'hash' | 'history'
  }
  
  // Configuración de tema
  theme?: {
    defaultTheme?: 'light' | 'dark' | 'auto'
    customColors?: Record<string, string>
  }
  
  // Configuración de PWA
  pwa?: {
    enabled?: boolean
    offlineSupport?: boolean
  }
  
  // Permisos personalizados
  permissions?: string[]
  
  // Configuración de servicios
  services?: {
    enableAnalytics?: boolean
    enableNotifications?: boolean
    enableReports?: boolean
  }
}
```

## 🎨 Composables Disponibles

### useTheme
```typescript
import { useTheme } from '@montaje/musical-module'

const { theme, setTheme, themeClasses } = useTheme()
```

### useResponsive
```typescript
import { useResponsive } from '@montaje/musical-module'

const { isMobile, isTablet, isDesktop, containerClasses } = useResponsive()
```

### useMontaje
```typescript
import { useMontaje } from '@montaje/musical-module'

const { 
  projects, 
  activeProject, 
  createProject, 
  updateProject 
} = useMontaje()
```

### useAnalytics
```typescript
import { useAnalytics } from '@montaje/musical-module'

const { 
  analytics, 
  generateReport, 
  exportData 
} = useAnalytics()
```

## 🛡️ Servicios

### EvaluationService
```typescript
import { EvaluationService } from '@montaje/musical-module'

// Crear evaluación
const evaluation = await EvaluationService.createEvaluation({
  workId: 'work-123',
  instrumentId: 'violin-1',
  score: 85,
  notes: 'Excelente progreso'
})
```

### FirebaseService
```typescript
import { FirebaseService } from '@montaje/musical-module'

// Configurar Firebase
FirebaseService.configure(firebaseConfig)

// Operaciones de datos
const data = await FirebaseService.getData('evaluations')
```

## 🎯 Standalone

Para usar el módulo como aplicación independiente:

```typescript
import { createMontajeApp } from '@montaje/musical-module'

const montajeApp = createMontajeApp({
  firebase: firebaseConfig,
  theme: { defaultTheme: 'dark' }
})

// Acceder al router interno
const router = montajeApp.router

// Acceder a servicios
const { evaluation, firebase } = montajeApp.services
```

## 🔒 Sistema de Permisos

El módulo incluye un sistema completo de permisos:

```typescript
import { Constants } from '@montaje/musical-module'

// Permisos disponibles
const permissions = Constants.PERMISSIONS

// Verificar permisos
if (moduleManager.hasPermissions(['works:read', 'evaluations:create'])) {
  // Usuario tiene permisos necesarios
}
```

## 📊 Rutas Disponibles

- `/` - Dashboard principal
- `/works` - Gestión de obras
- `/evaluations` - Sistema de evaluaciones
- `/analytics` - Analytics y reportes
- `/tools` - Herramientas musicales
- `/calendar` - Calendario y sesiones
- `/users` - Gestión de usuarios
- `/settings` - Configuraciones

## 🤝 Integración con Proyectos Existentes

### En un proyecto Nuxt.js

```typescript
// plugins/montaje.client.ts
import { MontajeModule } from '@montaje/musical-module'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(MontajeModule, {
    // configuración
  })
})
```

### En un proyecto con Pinia

```typescript
import { moduleManager } from '@montaje/musical-module'

// El módulo es compatible con Pinia y otros state managers
const store = useMainStore()

// Sincronizar datos
moduleManager.listenToEvent('data-change', (data) => {
  store.updateMontajeData(data)
})
```

## 📄 Licencia

MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor lee nuestra [guía de contribución](CONTRIBUTING.md).

## 📞 Soporte

- 📧 Email: support@montaje.com
- 🐛 Issues: [GitHub Issues](https://github.com/montaje/musical-module/issues)
- 📖 Documentación: [Docs](https://docs.montaje.com)
