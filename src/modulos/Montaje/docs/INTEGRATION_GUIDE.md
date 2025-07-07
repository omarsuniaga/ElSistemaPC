# 🎼 Guía Técnica de Integración - Módulo de Montaje Musical

Esta guía detalla paso a paso cómo integrar el **Módulo de Montaje Musical** en cualquier proyecto Vue.js + Firebase existente, manteniendo la arquitectura modular y reutilizando la infraestructura existente.

## 📋 Arquitectura Detallada de Integración

### Estructura de Directorios Requerida

```
tu-proyecto-principal/
├── src/
│   ├── firebase.ts                    # ✅ REQUERIDO: Configuración Firebase
│   ├── App.vue                        # ✅ MODIFICAR: Integrar módulos
│   ├── main.ts                        # ✅ VERIFICAR: Dependencias
│   ├── package.json                   # ✅ VERIFICAR: Dependencias
│   ├── config/                        # ✅ CREAR: Configuración de módulos
│   │   └── modules.ts                 # ✅ CREAR: Gestión centralizada
│   └── modulos/                       # ✅ CREAR: Directorio de módulos
│       └── montaje/                   # 🎵 COPIAR: Módulo completo
│           ├── index.ts               # Exportaciones principales
│           ├── integration.ts         # Configuración del módulo
│           ├── core/
│           │   ├── ModuleManager.ts   # Sistema de gestión
│           │   └── types.ts           # Tipos del sistema
│           ├── components/            # Componentes Vue
│           ├── composables/           # Lógica reutilizable
│           ├── services/              # Servicios de datos
│           ├── router/                # Rutas internas
│           ├── types/                 # Definiciones TypeScript
│           └── utils/                 # Utilidades y constantes
```

## 🔧 Requisitos Técnicos Previos

### 1. Dependencias Necesarias

Tu proyecto **DEBE** tener estas dependencias instaladas:

```json
// package.json - Dependencias requeridas
{
  "dependencies": {
    "vue": "^3.4.0",                    // ✅ Framework base
    "vue-router": "^4.2.0",             // ✅ Navegación
    "firebase": "^10.7.0",              // ✅ Base de datos
    "@vueuse/core": "^10.5.0",          // ✅ Utilidades Vue
    "chart.js": "^4.4.0",               // ✅ Gráficos
    "vue-chartjs": "^5.3.0",            // ✅ Integración Chart.js
    "date-fns": "^2.30.0",              // ✅ Manejo de fechas
    "jspdf": "^2.5.1",                  // ✅ Exportar PDF
    "jspdf-autotable": "^3.8.2",        // ✅ Tablas en PDF
    "xlsx": "^0.18.5"                   // ✅ Exportar Excel
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.3",     // ✅ Plugin Vue para Vite
    "typescript": "^5.5.3",             // ✅ TypeScript
    "tailwindcss": "^3.4.0",            // ✅ CSS Framework
    "vite": "^5.4.2",                   // ✅ Build tool
    "vue-tsc": "^2.1.4"                 // ✅ Type checking
  }
}
```

### 2. Configuración Firebase Existente

Tu proyecto **DEBE** tener un archivo `src/firebase.ts` configurado:

```typescript
// src/firebase.ts - ARCHIVO REQUERIDO
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)       // ✅ REQUERIDO por el módulo
export const auth = getAuth(app)          // ✅ REQUERIDO por el módulo  
export const storage = getStorage(app)    // ✅ REQUERIDO por el módulo
export default app
```

### 3. Variables de Entorno

Archivo `.env` con configuración Firebase:

```env
# .env - Variables requeridas
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=tu-app-id
```

## 🚀 Proceso de Integración Paso a Paso

### PASO 1: Copiar el Módulo

1. **Crear directorio de módulos:**
```bash
mkdir src/modulos
```

2. **Copiar carpeta completa:**
```bash
# Copiar toda la carpeta montaje desde el proyecto fuente
cp -r /ruta/proyecto-fuente/src/modulos/montaje ./src/modulos/
```

3. **Verificar estructura copiada:**
```
src/modulos/montaje/
├── index.ts
├── integration.ts
├── core/
├── components/
├── composables/
├── services/
├── router/
├── types/
└── utils/
```

### PASO 2: Crear Configuración de Módulos

Crear archivo `src/config/modules.ts`:

```typescript
// src/config/modules.ts - CREAR ESTE ARCHIVO
import { montajeModule } from '../modulos/montaje/integration'
import type { ModuleDefinition } from '../modulos/montaje/core/ModuleManager'

export interface ProjectModuleConfig {
  modules: ModuleDefinition[]
  globalConfig: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
    firebase: {
      collections: {
        users: string
        projects: string
        evaluations: string
        works: string
        sessions: string
      }
    }
  }
}

export const projectConfig: ProjectModuleConfig = {
  modules: [
    montajeModule  // ✅ Registrar módulo de montaje
  ],
  globalConfig: {
    theme: 'auto',
    language: 'es',
    timezone: 'America/Mexico_City',
    firebase: {
      collections: {
        users: 'montaje_users',          // Personalizable
        projects: 'montaje_projects',    // Personalizable
        evaluations: 'montaje_evaluations',
        works: 'montaje_works',
        sessions: 'montaje_sessions'
      }
    }
  }
}

// Función para inicializar todos los módulos del proyecto
export const initializeProjectModules = (moduleManager: any, user: any) => {
  // Registrar módulos
  projectConfig.modules.forEach(module => {
    moduleManager.registerModule(module)
  })
  
  // Configurar usuario
  moduleManager.setUser(user)
  
  // Aplicar configuración global
  moduleManager.setGlobalConfig(projectConfig.globalConfig)
  
  console.log('🎼 Proyecto musical inicializado con módulos:', 
    projectConfig.modules.map(m => m.name))
}

export default projectConfig
```

### PASO 3: Modificar App.vue Principal

Actualizar tu `src/App.vue` existente para integrar el sistema de módulos:

```vue
<!-- src/App.vue - MODIFICAR ARCHIVO EXISTENTE -->
<template>
  <div :class="[themeClasses.background, 'min-h-screen']">
    <!-- Navegación principal existente -->
    <nav :class="[themeClasses.surface, 'shadow-sm', themeClasses.border, 'border-b']">
      <div :class="containerClasses">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 :class="[themeClasses.text.primary, 'text-xl font-bold']">
              <!-- MANTENER tu título existente -->
              Tu Sistema Existente
            </h1>
          </div>
          
          <div class="flex items-center space-x-2 md:space-x-4">
            <!-- AGREGAR: Navegación dinámica de módulos -->
            <div v-if="!isMobile" class="hidden md:flex items-center space-x-2">
              <button
                v-for="module in availableModules"
                :key="module.id"
                @click="activateModule(module.id)"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  activeModule?.id === module.id
                    ? 'bg-blue-500 text-white'
                    : `${themeClasses.text.primary} ${themeClasses.hover}`
                ]"
              >
                {{ module.icon }} {{ module.name }}
              </button>
            </div>
            
            <!-- AGREGAR: Dashboard siempre disponible -->
            <button
              @click="showDashboard = true; activeModule = null"
              :class="[
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                showDashboard
                  ? 'bg-blue-500 text-white'
                  : `${themeClasses.text.primary} ${themeClasses.hover}`
              ]"
            >
              🏠 <span v-if="!isMobile">Dashboard</span>
            </button>
            
            <!-- MANTENER: Tu sistema de usuario existente -->
            <div class="flex items-center space-x-2">
              <!-- Tu código de usuario existente aquí -->
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- AGREGAR: Contenido modular -->
    <main class="flex-1">
      <!-- Dashboard con widgets -->
      <div v-if="showDashboard" :class="['p-4 md:p-8']">
        <h2 :class="[themeClasses.text.primary, 'text-2xl font-bold mb-6']">
          Dashboard Principal
        </h2>
        
        <!-- MANTENER: Tu contenido de dashboard existente -->
        <div class="mb-6">
          <!-- Tu contenido existente aquí -->
        </div>
        
        <!-- AGREGAR: Grid de widgets de módulos -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <component
            v-for="widget in dashboardWidgets"
            :key="widget.id"
            :is="widget.component"
            :class="getWidgetClasses(widget.size)"
          />
        </div>
      </div>
      
      <!-- AGREGAR: Módulo activo -->
      <component
        v-else-if="activeModule"
        :is="activeModule.component"
        :user="currentUser"
        v-bind="getModuleProps(activeModule)"
      />
      
      <!-- MANTENER: Tu contenido principal existente -->
      <div v-else>
        <!-- Tu aplicación principal aquí -->
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// AGREGAR: Importaciones del sistema de módulos
import { moduleManager } from './modulos/montaje/core/ModuleManager'
import { useTheme } from './modulos/montaje/composables/useTheme'
import { useResponsive } from './modulos/montaje/composables/useResponsive'
import { initializeProjectModules } from './config/modules'

// MANTENER: Tus importaciones existentes
// ... tus imports actuales

// AGREGAR: Estado del sistema de módulos
const showDashboard = ref(true)

// AGREGAR: Composables del sistema de módulos
const { themeClasses } = useTheme()
const { isMobile, containerClasses } = useResponsive()

// MANTENER: Tu usuario existente (modificar según tu implementación)
const currentUser = ref({
  id: 'user_1',
  name: 'Usuario del Sistema',
  email: 'usuario@sistema.com',
  role: 'admin',
  permissions: [
    'montaje:access',    // ✅ AGREGAR: Permiso para acceder al módulo
    'montaje:read',
    'works:*',
    'evaluations:*',
    'reports:*'
  ]
})

// AGREGAR: Estado reactivo del sistema de módulos
const availableModules = moduleManager.getAvailableModules()
const activeModule = moduleManager.getActiveModule()
const dashboardWidgets = moduleManager.getDashboardWidgets()

// AGREGAR: Funciones del sistema de módulos
const activateModule = (moduleId: string) => {
  try {
    moduleManager.activateModule(moduleId)
    showDashboard.value = false
  } catch (error) {
    console.error('Error activating module:', error)
    alert(String(error))
  }
}

const getWidgetClasses = (size: 'small' | 'medium' | 'large') => {
  const sizeClasses: Record<'small' | 'medium' | 'large', string> = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3'
  }
  return sizeClasses[size] || 'col-span-1'
}

const getModuleProps = (module: any) => {
  const baseProps = {}
  
  if (module.id === 'montaje') {
    return {
      ...baseProps,
      initialProject: undefined
    }
  }
  
  return baseProps
}

// AGREGAR: Escuchar eventos de navegación
moduleManager.listenToEvent('navigate', (data) => {
  if (data.module) {
    activateModule(data.module)
  }
})

// MODIFICAR: Tu función onMounted existente
onMounted(() => {
  // MANTENER: Tu lógica de inicialización existente
  // ... tu código actual de onMounted
  
  // AGREGAR: Inicializar sistema de módulos
  initializeProjectModules(moduleManager, currentUser.value)
  
  console.log('🎼 Sistema con módulos inicializado correctamente')
})

// MANTENER: Tus funciones existentes
// ... resto de tu lógica de componente
</script>
```

### PASO 4: Configurar Reglas de Firestore

Agregar reglas de seguridad para las colecciones del módulo:

```javascript
// firestore.rules - AGREGAR ESTAS REGLAS
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // TUS REGLAS EXISTENTES
    // ... mantener tus reglas actuales
    
    // AGREGAR: Reglas para el módulo de montaje
    
    // Usuarios de montaje - solo pueden editar su propio perfil
    match /montaje_users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/montaje_users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/montaje_users/$(request.auth.uid)).data.role in ['admin', 'director'];
    }
    
    // Proyectos musicales - miembros pueden leer, directores pueden escribir
    match /montaje_projects/{projectId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.director || 
         get(/databases/$(database)/documents/montaje_users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Obras musicales - miembros del proyecto pueden leer
    match /montaje_works/{workId} {
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)) &&
        request.auth.uid in get(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)).data.members;
      allow write: if request.auth != null &&
        exists(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)) &&
        (request.auth.uid == get(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)).data.director ||
         get(/databases/$(database)/documents/montaje_users/$(request.auth.uid)).data.role in ['admin', 'director']);
    }
    
    // Evaluaciones - pueden crear las suyas, directores ven todas
    match /montaje_evaluations/{evalId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.evaluatorId;
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)) &&
        request.auth.uid == get(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)).data.director;
    }
    
    // Sesiones de ensayo - miembros del proyecto pueden ver
    match /montaje_sessions/{sessionId} {
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)) &&
        request.auth.uid in get(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)).data.members;
      allow write: if request.auth != null &&
        exists(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)) &&
        (request.auth.uid == get(/databases/$(database)/documents/montaje_projects/$(resource.data.projectId)).data.director ||
         get(/databases/$(database)/documents/montaje_users/$(request.auth.uid)).data.role in ['admin', 'director']);
    }
  }
}
```

### PASO 5: Actualizar main.ts

Verificar que tu `src/main.ts` tiene las importaciones necesarias:

```typescript
// src/main.ts - VERIFICAR Y AGREGAR SI ES NECESARIO
import { createApp } from 'vue'
import App from './App.vue'

// MANTENER: Tus importaciones existentes
// import router from './router'  // Si tienes router
// import store from './store'    // Si tienes Pinia/Vuex

// AGREGAR SI NO TIENES: Estilos de Tailwind
import './style.css'

const app = createApp(App)

// MANTENER: Tus plugins existentes
// app.use(router)
// app.use(store)

app.mount('#app')
```

## 📊 Estructura de Datos del Módulo

### Colecciones Firestore Creadas

El módulo creará automáticamente estas colecciones:

#### 1. `montaje_users` - Perfiles de Usuario Musical
```typescript
{
  id: string,              // UID de Firebase Auth
  email: string,           // Email del usuario
  name: string,            // Nombre completo
  role: 'admin' | 'director' | 'assistant' | 'musician',
  instruments: string[],   // ['Violín', 'Piano']
  experience: 'beginner' | 'intermediate' | 'advanced' | 'professional',
  projects: string[],      // IDs de proyectos asignados
  preferences: {
    language: 'es' | 'en',
    timezone: string,
    notifications: {
      email: boolean,
      push: boolean,
      evaluationReminders: boolean,
      sessionReminders: boolean
    },
    display: {
      theme: 'light' | 'dark' | 'auto',
      compactMode: boolean,
      defaultView: 'grid' | 'list'
    }
  },
  createdAt: timestamp,
  lastLogin: timestamp
}
```

#### 2. `montaje_projects` - Proyectos Musicales
```typescript
{
  id: string,
  name: string,            // "Orquesta Sinfónica Universidad"
  type: 'orchestra' | 'choir' | 'band' | 'chamber' | 'other',
  description: string,
  director: string,        // UID del director
  members: string[],       // UIDs de miembros
  works: string[],         // IDs de obras en repertorio
  status: 'active' | 'archived' | 'planned',
  settings: {
    evaluationCriteria: string[],  // ['rhythm', 'pitch', 'dynamics']
    instruments: string[],         // Instrumentos del proyecto
    voiceTypes: string[],          // Para coros: ['soprano', 'alto', ...]
    practiceSchedule: {
      frequency: 'weekly' | 'biweekly' | 'custom',
      duration: number,            // Minutos
      location: string
    }
  },
  metadata: {
    totalMembers: number,
    totalWorks: number,
    averageScore: number,
    lastActivity: timestamp
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 3. `montaje_works` - Repertorio Musical
```typescript
{
  id: string,
  title: string,           // "Sinfonía No. 9 en Re menor"
  composer: string,        // "Ludwig van Beethoven"
  projectId: string,       // ID del proyecto
  difficulty: 1 | 2 | 3 | 4 | 5,
  duration: number,        // Duración en minutos
  key: string,             // "D minor"
  tempo: string,           // "Allegro ma non troppo"
  genre: string,           // "Classical", "Jazz", "Folk"
  instrumentation: {
    [instrument: string]: {
      count: number,
      difficulty: number,
    required: boolean
    }
  },
  files: {
    score: string,         // URL del archivo principal
    parts: {
      [instrument: string]: string  // URLs de particellas
    },
    audio: string,         // URL de referencia de audio
    video: string          // URL de video referencia
  },
  evaluationCriteria: string[],
  status: 'learning' | 'rehearsing' | 'performance_ready' | 'performed',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 4. `montaje_evaluations` - Evaluaciones de Progreso
```typescript
{
  id: string,
  workId: string,          // ID de la obra evaluada
  projectId: string,       // ID del proyecto
  evaluatorId: string,     // UID del evaluador
  targetType: 'individual' | 'section' | 'ensemble',
  targetId: string,        // UID del usuario o ID de sección
  instrument: string,      // Instrumento evaluado
  scores: {
    [criterion: string]: number  // Puntajes 1-5 por criterio
  },
  overallScore: number,    // Promedio calculado
  comments: string,        // Comentarios detallados
  recommendations: string[],  // Recomendaciones específicas
  attachments: string[],   // URLs de archivos adjuntos
  date: timestamp,
  session: string,         // ID de sesión de ensayo (opcional)
  metadata: {
    duration: number,      // Tiempo de evaluación
    environment: 'practice' | 'rehearsal' | 'performance',
    conditions: string[]   // ['live', 'recorded', 'sight-reading']
  }
}
```

#### 5. `montaje_sessions` - Sesiones de Ensayo
```typescript
{
  id: string,
  projectId: string,
  title: string,           // "Ensayo General Sinfonía 9"
  date: timestamp,
  duration: number,        // Minutos
  location: string,
  director: string,        // UID del director
  attendees: string[],     // UIDs de asistentes
  worksRehersed: string[], // IDs de obras ensayadas
  objectives: string[],    // Objetivos de la sesión
  notes: string,           // Notas generales
  evaluations: string[],   // IDs de evaluaciones realizadas
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
  metadata: {
    attendance: number,
    punctuality: number,   // Promedio de puntualidad
    productivity: number   // Evaluación subjetiva 1-5
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔐 Sistema de Permisos Detallado

### Roles y Permisos por Defecto

```typescript
const ROLE_PERMISSIONS = {
  admin: [
    '*:*'  // Acceso total
  ],
  
  director: [
    'montaje:access',
    'projects:*',          // Crear, editar, eliminar proyectos
    'works:*',             // Gestión completa de repertorio
    'evaluations:*',       // Ver y crear evaluaciones
    'sessions:*',          // Programar y gestionar ensayos
    'reports:*',           // Generar todos los reportes
    'users:read',          // Ver lista de usuarios
    'users:invite',        // Invitar nuevos miembros
    'analytics:read'       // Ver analytics del proyecto
  ],
  
  assistant: [
    'montaje:access',
    'projects:read',       // Ver proyectos asignados
    'works:read',          // Ver repertorio
    'works:update',        // Editar información de obras
    'evaluations:read',    // Ver evaluaciones
    'evaluations:create',  // Crear evaluaciones
    'sessions:read',       // Ver horarios de ensayo
    'reports:read',        // Ver reportes básicos
    'users:read'           // Ver compañeros de proyecto
  ],
  
  musician: [
    'montaje:access',
    'projects:read',       // Ver sus proyectos
    'works:read',          // Ver repertorio asignado
    'evaluations:read',    // Ver sus evaluaciones
    'evaluations:self',    // Autoevaluarse
    'sessions:read',       // Ver horarios
    'reports:personal'     // Ver su progreso personal
  ]
}
```

### Verificación de Permisos en Componentes

```vue
<!-- Ejemplo de uso en componentes -->
<template>
  <div>
    <!-- Solo directores pueden crear obras -->
    <button 
      v-if="hasPermission('works', 'create')"
      @click="createWork"
    >
      Crear Obra
    </button>
    
    <!-- Solo el evaluador o directores pueden editar -->
    <button
      v-if="canEditEvaluation(evaluation)"
      @click="editEvaluation"
    >
      Editar Evaluación
    </button>
  </div>
</template>

<script setup>
import { useMontajeAuth } from '../composables/useMontajeAuth'

const { user, hasPermission } = useMontajeAuth()

const canEditEvaluation = (evaluation) => {
  return user.value.id === evaluation.evaluatorId || 
         hasPermission('evaluations', 'edit')
}
</script>
```

## 🚀 Verificación de Integración

### Lista de Verificación Técnica

```bash
# 1. Verificar estructura de archivos
ls -la src/modulos/montaje/
ls -la src/config/

# 2. Verificar dependencias
npm list vue vue-router firebase @vueuse/core

# 3. Verificar compilación
npm run build

# 4. Verificar tipos TypeScript
npx vue-tsc --noEmit
```

### Pruebas de Funcionalidad

1. **Navegación de Módulos**
   - [ ] Botón "🎼 Montaje" aparece en navegación
   - [ ] Click activa el módulo correctamente
   - [ ] Dashboard muestra widgets del módulo

2. **Autenticación Integrada**
   - [ ] Usuario se autentica una sola vez
   - [ ] Perfil de montaje se crea automáticamente
   - [ ] Permisos se aplican correctamente

3. **Persistencia de Datos**
   - [ ] Datos se guardan en Firestore
   - [ ] Colecciones usan prefijo `montaje_`
   - [ ] Reglas de seguridad funcionan

4. **Responsive y PWA**
   - [ ] Interfaz responsive en móvil
   - [ ] Tema se sincroniza con proyecto principal
   - [ ] Funciona offline básico

### Debugging y Logs

```javascript
// Verificar estado del módulo
console.log('Módulos disponibles:', moduleManager.getAvailableModules())
console.log('Módulo activo:', moduleManager.getActiveModule())
console.log('Usuario actual:', moduleManager.getCurrentUser())

// Verificar Firebase
console.log('Firebase configurado:', !!db)
console.log('Usuario autenticado:', !!auth.currentUser)

// Verificar permisos
console.log('Permisos usuario:', user.value?.permissions)
```

## 🎯 Personalización y Extensión

### Personalizar Nombres de Colecciones

```typescript
// En src/config/modules.ts
firebase: {
  collections: {
    users: 'mi_orquesta_usuarios',      // Personalizado
    projects: 'mis_proyectos_musicales', // Personalizado
    evaluations: 'evaluaciones_2024',   // Con año
    works: 'repertorio_clasico',        // Específico
    sessions: 'ensayos_regulares'       // Descriptivo
  }
}
```

### Agregar Criterios de Evaluación Personalizados

```typescript
// En la configuración del proyecto
settings: {
  evaluationCriteria: [
    'rhythm',      // Ritmo
    'pitch',       // Afinación  
    'dynamics',    // Dinámicas
    'articulation', // Articulación
    'expression',  // Expresión
    'ensemble',    // Conjunto
    'technique',   // Técnica específica
    'memory'       // Memoria musical
  ]
}
```

### Integrar con Sistemas Existentes

```typescript
// En App.vue - integrar con tu sistema de usuarios existente
const currentUser = ref({
  // Mapear desde tu sistema existente
  id: tuUsuario.uid,
  name: tuUsuario.displayName,
  email: tuUsuario.email,
  role: mapearRolDelSistema(tuUsuario.role),
  permissions: [
    ...tuUsuario.permissions,
    'montaje:access'  // Agregar permiso del módulo
  ]
})
```

## 📞 Soporte y Resolución de Problemas

### Problemas Comunes y Soluciones

1. **Error: "Cannot find module montaje/integration"**
   - **Causa**: Ruta incorrecta o módulo no copiado
   - **Solución**: Verificar que existe `src/modulos/montaje/integration.ts`

2. **Error: "Firebase not configured"**
   - **Causa**: El módulo no encuentra `src/firebase.ts`
   - **Solución**: Verificar exportaciones de `db`, `auth`, `storage`

3. **Módulo no aparece en navegación**
   - **Causa**: Usuario sin permisos o módulo no registrado
   - **Solución**: Verificar `initializeProjectModules()` y permisos

4. **Datos no se guardan**
   - **Causa**: Reglas Firestore restrictivas
   - **Solución**: Actualizar `firestore.rules` con reglas del módulo

5. **Error de tipos TypeScript**
   - **Causa**: Dependencias faltantes o versiones incompatibles
   - **Solución**: Verificar versiones en `package.json`

### Logs de Debug

```typescript
// Activar debug del sistema de módulos
localStorage.setItem('montaje_debug', 'true')

// Ver logs detallados
moduleManager.enableDebugMode()
```

¡La integración está ahora completamente documentada y lista para implementar! 🎼