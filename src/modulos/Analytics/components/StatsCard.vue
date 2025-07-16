<template>
  <div
    class="relative overflow-hidden rounded-lg p-6"
    :class="bgColorClass || 'bg-white dark:bg-gray-800'"
  >
    <dt>
      <div class="absolute rounded-md p-3" :class="iconColorClass || 'text-gray-500'">
        <component :is="icon" class="h-6 w-6" aria-hidden="true" />
      </div>
      <p class="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">{{ title }}</p>
    </dt>
    <dd class="ml-16 flex items-baseline">
      <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ value }}</p>
    </dd>
  </div>
</template>

<script setup lang="ts">
// Funcionalidades principales:
// - Gestión de horarios y programación
// - Manejo de estudiantes y profesores
// - Sistema de pagos y facturación
// - Gestión de contenido musical
// - Sistema de notificaciones
// - Generación de reportes y documentos
//
// Características técnicas:
// - PWA con soporte offline
// - Sistema de autenticación y autorización
// - Manejo de archivos y almacenamiento
// - Generación de PDFs y documentos
// - Visualización de partituras (usando abcjs)
// - Gráficos y visualizaciones (usando Chart.js)
// - Soporte para arrastrar y soltar (drag & drop)
// - Validación de formularios (usando Yup)
// - Manejo de fechas y calendarios
// - Soporte para importación/exportación de datos (CSV, Excel)
// - TypeScript, Vite, Tailwind CSS, Vitest, Workbox
// - Integración con Firebase (Firestore, Storage, Authentication)

import type { FunctionalComponent, SVGAttributes } from 'vue';

defineProps<{
  icon: FunctionalComponent<SVGAttributes>
  title: string
  value: number
  bgColorClass?: string
  iconColorClass?: string
}>();
</script>
