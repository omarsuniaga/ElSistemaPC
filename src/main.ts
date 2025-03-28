import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { validateEnvVars } from './utils/env-validator'
import ToastProvider from './components/ui/toast/ToastProvider.vue'

const app = createApp(App)
const pinia = createPinia()

// Initialize Pinia first
app.use(pinia)

// Then initialize router
app.use(router)

// Error handler global
app.config.errorHandler = (error, instance, info) => {
  console.error('Error de aplicación:', error)
  console.error('Componente:', instance)
  console.error('Info:', info)
}

// Warning handler
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Advertencia:', msg)
  console.warn('Componente:', instance)
  console.warn('Trace:', trace)
}

app.component('ToastProvider', ToastProvider)

app.mount('#app')

// Handle offline/online status globally
window.addEventListener('online', () => {
  console.log('Aplicación en línea')
})

window.addEventListener('offline', () => {
  console.log('Aplicación fuera de línea')
})
// Validar variables de entorno antes de iniciar la aplicación
const { isValid, errors } = validateEnvVars()

if (!isValid) {
  console.error('❌ Error crítico: Variables de entorno inválidas')
  if (import.meta.env.DEV) {
    // En desarrollo, mostramos los errores pero permitimos que la app continúe
    console.warn('⚠️ La aplicación continuará en modo desarrollo con configuración potencialmente inválida')
  } else {
    // En producción, detenemos la aplicación
    throw new Error('La aplicación no puede iniciar debido a configuración inválida')
  }
}