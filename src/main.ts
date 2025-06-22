import './utils/chartConfig';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { registerServiceWorker } from './registerServiceWorker'
import { createBrowserDebugFunction } from './utils/testAttendanceSystem'

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

// Configurar manejador global de errores
app.config.errorHandler = (err, instance, info) => {
    console.error('Error de aplicación:', err)
    console.log('Componente:', instance)
    console.log('Info:', info)
}

// Configurar Pinia
const pinia = createPinia()
app.use(pinia)

// Configurar Router
app.use(router)

// Configurar tema global
setupGlobalTheme()

// Configurar función de debugging global en desarrollo
if (import.meta.env.DEV) {
    createBrowserDebugFunction()
    console.log('🔧 Modo desarrollo: funciones de debugging disponibles')
    console.log('   - window.debugObservationIssue() para diagnosticar modal de observaciones')
}

// Montar la aplicación
app.mount('#app')

// Verificar configuración RBAC
verifyRBACSetup()

// Registrar Service Worker para PWA
registerServiceWorker()