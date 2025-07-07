// Módulo de Montaje Musical - Exportaciones principales
// Este archivo está diseñado para ser usado dentro del proyecto principal
// que ya tiene Firebase, router, y otras dependencias configuradas

// Exportar el módulo configurado para integración
export { montajeModule } from './integration'

// Exportar el core del sistema de módulos
export { moduleManager, type ModuleDefinition } from './core/ModuleManager'

// Exportar componentes principales
export { default as MontajeApp } from './components/MontajeApp.vue'
export { default as MontajeAppDemo } from './components/MontajeAppDemo.vue'
export { default as MontajeDashboard } from './components/MontajeDashboard.vue'
export { default as MontajeDashboardWidget } from './components/MontajeDashboardWidget.vue'

// Exportar composables útiles
export { useTheme } from './composables/useTheme'
export { useResponsive } from './composables/useResponsive'
export { useMontaje } from './composables/useMontaje'
export { useMontajeAuth } from './composables/useMontajeAuth'
export { useMontajeEvaluations } from './composables/useMontajeEvaluations'

// Exportar servicios
export { firebaseService } from './services/FirebaseService'
export { evaluationService } from './services/EvaluationService'
export { notificationService } from './services/NotificationService'

// Exportar tipos importantes
export type { 
  MontajeProject, 
  MontajeWork, 
  MontajeEvaluation,
  MontajeUser,
  AuthSession
} from './types'

// Función de configuración rápida para el proyecto principal
export const setupMontajeModule = (moduleManager: any, userConfig?: any) => {
  // Registrar el módulo
  moduleManager.registerModule(montajeModule)
  
  // Aplicar configuración personalizada si se proporciona
  if (userConfig) {
    moduleManager.setGlobalConfig({
      ...moduleManager.getGlobalConfig(),
      ...userConfig
    })
  }
  
  console.log('🎼 Módulo de Montaje configurado correctamente')
  
  return {
    module: montajeModule,
    manager: moduleManager
  }
}

// Información del módulo
export const MONTAJE_MODULE_INFO = {
  name: 'Montaje Musical',
  version: '1.0.0',
  description: 'Sistema completo de gestión musical para orquestas y conjuntos',
  author: 'Montaje Team',
  dependencies: {
    vue: '^3.4.0',
    'vue-router': '^4.2.0',
    firebase: '^10.7.0',
    tailwindcss: '^3.4.0'
  },
  collections: {
    users: 'montaje_users',
    projects: 'montaje_projects',
    works: 'montaje_works', 
    evaluations: 'montaje_evaluations',
    sessions: 'montaje_sessions'
  }
}

export default {
  setupMontajeModule,
  montajeModule,
  moduleManager,
  MONTAJE_MODULE_INFO
}
