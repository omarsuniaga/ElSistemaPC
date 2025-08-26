// src/modulos/Attendance/index.ts
// Archivo principal para gestionar todas las opciones del módulo de Asistencias

import type { App } from 'vue';
import { routes as attendanceRoutes } from './router';
import type { Router } from 'vue-router';
import { useAttendanceStore } from './store';

/**
 * Inicializa el módulo de Asistencias
 * @param app Instancia de la aplicación Vue
 * @param router Router principal de la aplicación
 */
export function initializeAttendanceModule(app: App, router: Router): void {
  // Registrar rutas del módulo
  attendanceRoutes.forEach(route => router.addRoute(route));
  
  // Inicializar store si es necesario
  const attendanceStore = useAttendanceStore();
  
  console.log('✅ Módulo de Asistencias inicializado correctamente');
}

// Exportar componentes principales
export { default as ReporteAsistenciaDiaria } from './views/ReporteAsistenciaDiaria.vue';

// Exportar tipos y servicios
export * from './types';
export * from './services';
export * from './store';
