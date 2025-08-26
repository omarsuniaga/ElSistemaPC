// src/modulos/Students/index.ts
// Archivo principal para gestionar todas las opciones del módulo de Estudiantes

import type { App } from 'vue';
import { studentRoutes } from './router';
import type { Router } from 'vue-router';

/**
 * Inicializa el módulo de Estudiantes
 * @param app Instancia de la aplicación Vue
 * @param router Router principal de la aplicación
 */
export function initializeStudentsModule(app: App, router: Router): void {
  // Registrar rutas del módulo
  studentRoutes.forEach(route => router.addRoute(route));
  
  console.log('✅ Módulo de Estudiantes inicializado correctamente');
}

// Exportar componentes principales
export { default as StudentsView } from './view/StudentsView.vue';
export { default as NewStudentView } from './view/NewStudentView.vue';

// Exportar servicios y tipos
export * from './services';
