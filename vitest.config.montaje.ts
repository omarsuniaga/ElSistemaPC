// vitest.config.montaje.ts
import {defineConfig} from "vitest/config"
import vue from "@vitejs/plugin-vue"
import {resolve} from "path"

export default defineConfig({
  plugins: [vue()],
  test: {
    // Configuración específica para tests del módulo Montaje
    include: [
      "src/modulos/Montaje/**/*.{test,spec}.{js,ts}",
      "src/modulos/Montaje/integration/**/*.{test,spec}.{js,ts}",
    ],
    exclude: ["node_modules", "dist", ".nuxt"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/modulos/Montaje/test-setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/modulos/Montaje/**/*.{js,ts,vue}"],
      exclude: [
        "src/modulos/Montaje/**/*.{test,spec}.{js,ts}",
        "src/modulos/Montaje/test-setup.ts",
        "src/modulos/Montaje/types/**/*",
      ],
      reporter: ["text", "html", "json"],
      reportsDirectory: "./coverage/montaje",
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    reporters: ["verbose", "junit"],
    outputFile: {
      junit: "./test-results/montaje-results.xml",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "~": resolve(__dirname, "./src"),
    },
  },
  define: {
    // Variables de entorno para tests
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },
})
