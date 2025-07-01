import {defineConfig, loadEnv} from "vite"
import vue from "@vitejs/plugin-vue"
import {VitePWA} from "vite-plugin-pwa"
import {fileURLToPath, URL} from "url"
import vuetify from "vite-plugin-vuetify"

// https://vitejs.dev/config/
// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  // Cargar variables de entorno según el modo (development, production)
  const env = loadEnv(mode, process.cwd(), "")

  // Función para mostrar advertencia si hay variables faltantes
  const checkFirebaseConfig = () => {
    const requiredVars = [
      "VITE_APP_API_KEY",
      "VITE_APP_AUTH_DOMAIN",
      "VITE_APP_PROJECT_ID",
      "VITE_APP_STORAGE_BUCKET",
      "VITE_APP_MESSAGING_SENDER_ID",
      "VITE_APP_APP_ID",
    ]

    for (const key of requiredVars) {
      if (!env[key]) {
        console.warn(`⚠️ Variable de entorno faltante: ${key}`)
      }
    }
  }

  // Ejecutar comprobación
  checkFirebaseConfig()

  // Configuración de Vite
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => ["md-linedivider"].includes(tag),
          },
        },
      }),
      vuetify({
        autoImport: true,
        styles: {
          configFile: "src/styles/vuetify/settings.scss",
        },
      }),
      VitePWA({
        registerType: "prompt",
        injectRegister: false, // Usaremos nuestro registro personalizado
        strategies: "injectManifest",
        srcDir: "public",
        filename: "sw.js",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "offline.html", "manifest.json"],
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use 'sass:math';
            @use 'sass:color';
            @import './src/styles/vuetify/settings.scss';
          `,
        },
      },
    },
    define: {
      // Definir explícitamente las variables de entorno de Firebase
      "process.env.VITE_APP_API_KEY": JSON.stringify(env.VITE_APP_API_KEY),
      "process.env.VITE_APP_AUTH_DOMAIN": JSON.stringify(env.VITE_APP_AUTH_DOMAIN),
      "process.env.VITE_APP_PROJECT_ID": JSON.stringify(env.VITE_APP_PROJECT_ID),
      "process.env.VITE_APP_STORAGE_BUCKET": JSON.stringify(env.VITE_APP_STORAGE_BUCKET),
      "process.env.VITE_APP_MESSAGING_SENDER_ID": JSON.stringify(env.VITE_APP_MESSAGING_SENDER_ID),
      "process.env.VITE_APP_APP_ID": JSON.stringify(env.VITE_APP_APP_ID),
      "process.env.VITE_APP_MEASUREMENT_ID": JSON.stringify(env.VITE_APP_MEASUREMENT_ID),
      "process.env.VITE_APP_DATABASE_URL": JSON.stringify(env.VITE_APP_DATABASE_URL),
      "process.env.VITE_USE_EMULATORS": JSON.stringify(env.VITE_USE_EMULATORS),
    },
    server: {
      port: 3000,
      host: true,
      strictPort: false,
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Authorization",
      },
      watch: {
        usePolling: false,
        interval: 1000,
      },
      hmr: {
        overlay: true,
        clientPort: undefined,
        timeout: 30000,
      },
      proxy: {
        "/sentry-api": {
          target: "https://lucid.thereadme.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sentry-api/, "/api/39/envelope"),
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core Vue ecosystem
            if (id.includes("vue") || id.includes("pinia") || id.includes("vue-router")) {
              return "vendor-vue"
            }

            // Firebase
            if (id.includes("firebase")) {
              return "vendor-firebase"
            }

            // UI Libraries
            if (id.includes("@headlessui") || id.includes("@heroicons") || id.includes("vuetify")) {
              return "vendor-ui"
            }

            // PDF and Utils
            if (id.includes("jspdf") || id.includes("date-fns") || id.includes("chart.js")) {
              return "vendor-utils"
            }

            // Admin modules
            if (id.includes("/modulos/Admin/") || id.includes("/modulos/Superusuario/")) {
              return "module-admin"
            }

            // Teachers module
            if (id.includes("/modulos/Teachers/")) {
              return "module-teachers"
            }

            // Students module
            if (id.includes("/modulos/Students/")) {
              return "module-students"
            }

            // Classes module
            if (id.includes("/modulos/Classes/")) {
              return "module-classes"
            }

            // Attendance module
            if (id.includes("/modulos/Attendance/")) {
              return "module-attendance"
            }

            // Montaje module
            if (id.includes("/modulos/Montaje/")) {
              return "module-montaje"
            }

            // Analytics module
            if (id.includes("/modulos/Analytics/")) {
              return "module-analytics"
            }

            // Other node_modules
            if (id.includes("node_modules")) {
              return "vendor-others"
            }
          },
        },
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") return
          if (warning.code === "DYNAMIC_IMPORT_WILL_NOT_MOVE_MODULE") return
          warn(warning)
        },
      },
      chunkSizeWarningLimit: 600,
      sourcemap: mode === "development",
    },
  }
})
