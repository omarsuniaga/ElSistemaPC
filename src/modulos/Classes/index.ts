// src/modulos/Classes/index.ts
// Archivo principal para gestionar todas las opciones del módulo de Clases

import type { App } from 'vue';
import classesRoutes from './router';
import type { Router } from 'vue-router';

/**
 * Inicializa el módulo de Clases
 * @param app Instancia de la aplicación Vue
 * @param router Router principal de la aplicación
 */
export function initializeClassesModule(app: App, router: Router): void {
  // Registrar rutas del módulo
  classesRoutes.forEach(route => router.addRoute(route));
  
  console.log('✅ Módulo de Clases inicializado correctamente');
}

// Exportar componentes principales
export { default as ClassDetailView } from './view/ClassDetailView.vue';
export { default as AdminClassesView } from './view/AdminClassesView.vue';

// Exportar tipos y constantes
export * from './types';
