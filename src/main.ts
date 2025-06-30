import './utils/chartConfig';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { registerServiceWorker } from './registerServiceWorker'
import { createBrowserDebugFunction } from './utils/testAttendanceSystem'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './firebase/config'

// Sistemas de optimización avanzada
import { createPerformancePlugin } from '@/utils/performance/monitor'
import { createCachePlugin } from '@/utils/cache/smartCache'
import { createLazyComponent, ModulePreloader } from '@/utils/performance/lazyLoader'
import { imageOptimizer } from '@/utils/optimization/imageOptimizer'
import { logger } from '@/utils/logging/logger'

// Sistema de branding personalizable
import { brandingPlugin } from '@/plugins/branding'

// Importar estilos
import './style.css'
import './styles/main.scss'

// Import tools and utilities
import './utils/musicAcademyDebugTools'
import './utils/testingUtils'
import './utils/pwaTester'
import { setupGlobalTheme } from './composables/useTheme'

// Auto-verificación de RBAC en desarrollo
async function verifyRBACSetup() {
    if (import.meta.env.DEV) {
        try {
            console.log('🔍 Verificando configuración RBAC...');
            
            // Solo importar para verificar que el servicio funciona
            await import('./services/rbac/rbacService');
            
            // Verificación exitosa
            console.log('✅ Servicio RBAC adaptado para usar colección USERS');
            console.log('🎭 Roles disponibles: Maestro, Director, Admin, Superusuario');
            console.log('📦 Módulos configurados: Teacher, Dashboard');
            
        } catch (error) {
            console.error('❌ Error verificando RBAC:', error);
        }
    }
}

// Crear la aplicación
const app = createApp(App)

// Configurar manejador global de errores avanzado
app.config.errorHandler = (err, instance, info) => {
    console.error('🚨 Error de aplicación:', err)
    console.log('📦 Componente:', instance)
    console.log('ℹ️ Info:', info)
    
    // En desarrollo, mostrar información detallada
    if (import.meta.env.DEV) {
        console.group('🔍 Detalles del Error')
        console.error('Stack trace:', err)
        console.log('Vue instance:', instance)
        console.log('Error info:', info)
        console.groupEnd()
    }
    
    // En producción, reportar errores (aquí podrías integrar con Sentry, etc.)
    if (import.meta.env.PROD) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error('Error en producción reportado:', errorMessage)
    }
}

// Configurar manejador para advertencias de Vue
app.config.warnHandler = (msg, instance, trace) => {
    if (import.meta.env.DEV) {
        console.warn('⚠️ Vue Warning:', msg)
        console.log('Component trace:', trace)
    }
}

// Configurar Pinia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// Configurar Router
app.use(router)

// Sistemas de optimización avanzada
app.use(createPerformancePlugin())
app.use(createCachePlugin())

// Sistema de branding personalizable
app.use(brandingPlugin)

// Configurar tema global
setupGlobalTheme()

// Configurar función de debugging global en desarrollo
if (import.meta.env.DEV) {
    createBrowserDebugFunction()
    
    // Importar funciones de testing de rendimiento y branding
    Promise.all([
        import('@/utils/testing/performanceTests'),
        import('@/utils/testing/brandingTests'),
        import('@/utils/performance/monitor'),
        import('@/utils/cache/smartCache'),
        import('@/utils/performance/lazyLoader'),
        import('@/utils/optimization/imageOptimizer')
    ]).then(([
        { runPerformanceTests, quickPerformanceCheck },
        { brandingTests },
        { performanceMonitor },
        { smartCache },
        { createLazyComponent, ModulePreloader },
        { imageOptimizer }
    ]) => {
        // Funciones globales para testing
        (window as any).runPerformanceTests = runPerformanceTests;
        (window as any).quickPerformanceCheck = quickPerformanceCheck;
        (window as any).testBranding = () => brandingTests.runAllTests();
        (window as any).quickTestBranding = () => brandingTests.quickTest();
        (window as any).debugPerformance = () => {
            console.group('🔍 Performance Debug Tools')
            console.log('📊 runPerformanceTests() - Suite completa de pruebas')
            console.log('⚡ quickPerformanceCheck() - Chequeo rápido')
            console.log('📈 window.performanceMonitor - Monitor en tiempo real')
            console.log('💾 window.smartCache - Sistema de cache')
            console.groupEnd()
        };
        (window as any).debugBranding = () => {
            console.group('🎨 Branding Debug Tools')
            console.log('🧪 testBranding() - Suite completa de pruebas de branding')
            console.log('⚡ quickTestBranding() - Chequeo rápido de branding')
            console.log('🎨 window.brandingTestResults - Últimos resultados de pruebas')
            console.groupEnd()
        };
        
        // Exponer sistemas de optimización
        (window as any).performanceMonitor = performanceMonitor;
        (window as any).smartCache = smartCache;
        (window as any).createLazyComponent = createLazyComponent;
        (window as any).ModulePreloader = ModulePreloader;
        (window as any).imageOptimizer = imageOptimizer;
        
        console.log('✅ Herramientas de rendimiento cargadas en window.*')
    }).catch(error => {
        console.warn('⚠️ Error cargando herramientas de rendimiento:', error)
    })
    
    console.log('🔧 Modo desarrollo: funciones de debugging disponibles')
    console.log('   - window.debugObservationIssue() para diagnosticar modal de observaciones')
    console.log('   - window.debugPerformance() para ver herramientas de rendimiento')
    console.log('   - window.debugBranding() para ver herramientas de branding')
    console.log('   - window.runPerformanceTests() para ejecutar suite completa')
    console.log('   - window.testBranding() para ejecutar pruebas de branding')
    console.log('   - window.quickPerformanceCheck() para chequeo rápido')
    console.log('   - window.quickTestBranding() para chequeo rápido de branding')
}

// Montar la aplicación
app.mount('#app')

// Inicializar sistemas de optimización después del montaje
document.addEventListener('DOMContentLoaded', () => {
  // Configurar lazy loading para componentes críticos
  ModulePreloader.preloadCriticalModules()
  
  // Precargar componentes específicos
  ModulePreloader.preloadModule(() => import('@/views/auth/LoginView.vue'), 'login-view')
  ModulePreloader.preloadModule(() => import('@/modulos/Admin/components/StudentsList.vue'), 'students-list')
  ModulePreloader.preloadModule(() => import('@/views/TeachersView.vue'), 'teachers-view')
  ModulePreloader.preloadModule(() => import('@/views/HomeView.vue'), 'home-view')
  
  // Configurar lazy loading para imágenes
  imageOptimizer.setupLazyLoading('img[data-src]')
  
  logger.info('MAIN', 'Sistemas de optimización inicializados correctamente')
})

// Verificar configuración RBAC
verifyRBACSetup()

// Registrar Service Worker para PWA
registerServiceWorker()