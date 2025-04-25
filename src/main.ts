import './utils/chartConfig';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import './style.css'

// Crear la aplicación
const app = createApp(App)

// Primero crear el pinia store y configurarlo
const pinia = createPinia()

// Configurar manejador global de errores
app.config.errorHandler = (err, instance, info) => {
    console.error('Error de aplicación:', err)
    console.log('Componente:', instance)
    console.log('Info:', info)
}

// IMPORTANTE: Inicializar Pinia antes que cualquier otra cosa
app.use(pinia)

// Luego inicializar el router
app.use(router)

// Finalmente montar la app
app.mount('#app')