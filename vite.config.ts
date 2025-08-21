import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  // Solo verificar configuración en desarrollo
  if (!isProduction) {
    const requiredVars = [
      'VITE_APP_API_KEY',
      'VITE_APP_AUTH_DOMAIN',
      'VITE_APP_PROJECT_ID',
      'VITE_APP_STORAGE_BUCKET',
      'VITE_APP_MESSAGING_SENDER_ID',
      'VITE_APP_APP_ID',
    ];

    for (const key of requiredVars) {
      if (!env[key]) {
        console.warn(`⚠️ Variable de entorno faltante: ${key}`);
      }
    }
  }

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => ['md-linedivider'].includes(tag),
          },
        },
      }),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: isProduction,
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        manifest: {
          name: 'Academia Musical PC',
          short_name: 'AcademiaPC',
          description: 'Sistema de gestión integral para academia musical',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'firebase-firestore',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
            {
              urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-auth',
                networkTimeoutSeconds: 5,
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 5,
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        vue: 'vue/dist/vue.esm-bundler.js',
      },
    },
    define: {
      // 🏭 PRODUCTION MODE - Definir variables de entorno
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    server: {
      port: 3002,
      host: true,
      strictPort: true,
      cors: true,
    },
    build: {
      // 🏭 OPTIMIZACIONES PARA PRODUCCIÓN
      minify: isProduction ? 'terser' : false,
      sourcemap: !isProduction,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core Vue ecosystem
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vendor-vue';
            }

            // Firebase
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }

            // UI Libraries
            if (id.includes('@headlessui') || id.includes('@heroicons')) {
              return 'vendor-ui';
            }

            // PDF and Utils
            if (id.includes('jspdf') || id.includes('date-fns') || id.includes('chart.js')) {
              return 'vendor-utils';
            }

            // Admin modules
            if (id.includes('/modulos/Admin/') || id.includes('/modulos/Superusuario/')) {
              return 'module-admin';
            }

            // Teachers module
            if (id.includes('/modulos/Teachers/')) {
              return 'module-teachers';
            }

            // Students module
            if (id.includes('/modulos/Students/')) {
              return 'module-students';
            }

            // Classes module
            if (id.includes('/modulos/Classes/')) {
              return 'module-classes';
            }

            // Attendance module
            if (id.includes('/modulos/Attendance/')) {
              return 'module-attendance';
            }

            // Montaje module
            if (id.includes('/modulos/Montaje/')) {
              return 'module-montaje';
            }

            // Analytics module
            if (id.includes('/modulos/Analytics/')) {
              return 'module-analytics';
            }

            // Other node_modules
            if (id.includes('node_modules')) {
              return 'vendor-others';
            }
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          if (warning.code === 'DYNAMIC_IMPORT_WILL_NOT_MOVE_MODULE') return;
          warn(warning);
        },
      },
      chunkSizeWarningLimit: 600,
      // 🏭 OPTIMIZACIONES ADICIONALES PARA PRODUCCIÓN
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,
    },
  };
});
