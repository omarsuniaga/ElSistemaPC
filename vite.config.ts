import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'url'


export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo (development, production)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Función para mostrar advertencia si hay variables faltantes
  const checkFirebaseConfig = () => {
    const requiredVars = [
      'VITE_APP_API_KEY',
      'VITE_APP_AUTH_DOMAIN',
      'VITE_APP_PROJECT_ID',
      'VITE_APP_STORAGE_BUCKET',
      'VITE_APP_MESSAGING_SENDER_ID',
      'VITE_APP_APP_ID'
    ];
    
    for (const key of requiredVars) {
      if (!env[key]) {
        console.warn(`⚠️ Variable de entorno faltante: ${key}`);
      }
    }
  };
  
  // Ejecutar comprobación
  checkFirebaseConfig();
  
  // Configuración de Vite
  return {
    plugins: [vue(), 
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          //configuracion de workbox 
          globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,woff2,woff}'],
        },
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      host: true, // Needed for proper network access
      strictPort: true,
      // Enhanced CORS configuration
      cors: true, // Enable CORS for all requests
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization'
      },
      proxy: {
        // Proxy Sentry requests to avoid CORS issues
        '/sentry-api': {
          target: 'https://lucid.thereadme.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sentry-api/, '/api/39/envelope')
        }
      }
    },
    build: {
      // Agregar variables de entorno definidas a los reemplazos
      rollupOptions: {
        // Asegurar que los errores de compilación se muestren claramente
        onwarn(warning, warn) {
          // Mostrar todas las advertencias excepto las falsas alarmas comunes
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          warn(warning);
        }
      }
    }
  }
})