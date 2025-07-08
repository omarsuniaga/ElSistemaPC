// src/modulos/Montaje/types/instrumentProgress.ts

import { EstadoCompass, TipoInstrumento } from './montaje';

/**
 * Interfaz para el estado de un compás específico de un instrumento
 */
export interface EstadoCompassInstrumento {
  id?: string;               // ID único del registro
  obraId: string;            // ID de la obra
  instrumentoId: string;     // ID del instrumento
  numeroCompas: number;      // Número de compás
  estado: EstadoCompass;     // Estado actual del compás para este instrumento
  notas?: string;            // Notas o comentarios específicos
  ultimaActualizacion: Date; // Fecha de última actualización
  actualizadoPor: string;    // ID del usuario que actualizó por última vez
  actualizadoPorNombre?: string; // Nombre del usuario que actualizó
}

/**
 * Interfaz para estadísticas agregadas de progreso por instrumento
 */
export interface EstadisticasProgreso {
  instrumentoId: string;
  nombreInstrumento: string;
  totalCompases: number;
  sinTrabajar: number;
  leido: number;
  enProgreso: number;
  conDificultad: number;
  logrado: number;
  dominado: number;
  completado: number;
  noTrabajado: number;
  porcentajeCompletado: number;
}

/**
 * Interfaz para actualización masiva de estado de compases
 */
export interface ActualizacionMasiva {
  obraId: string;
  instrumentoId: string;
  compasesIds: number[];
  nuevoEstado: EstadoCompass;
  notas?: string;
}

/**
 * Interfaz para notificación de progreso
 */
export interface NotificacionProgreso {
  id?: string;
  tipo: 'actualizacion_progreso';
  titulo: string;
  mensaje: string;
  obraId: string;
  instrumentoId: string;
  maestroId: string;
  maestroNombre: string;
  fechaCreacion: Date;
  leida: boolean;
  destinatariosIds: string[];
}

/**
 * Interfaz para datos de celda en el mapa de calor
 */
export interface CeldaMapaCalor {
  obraId: string;
  instrumentoId: string;
  numeroCompas: number;
  estado: EstadoCompass;
  colorHex: string;
  colorClass: string;
}

/**
 * Mapeo de estados de compás a colores para visualización
 */
export const COLOR_ESTADOS_COMPASS: Record<EstadoCompass, { hex: string, class: string }> = {
  [EstadoCompass.SIN_TRABAJAR]: { hex: '#f5f5f5', class: 'bg-gray-100' },
  [EstadoCompass.LEIDO]: { hex: '#e3f2fd', class: 'bg-blue-100' },
  [EstadoCompass.EN_PROGRESO]: { hex: '#fff9c4', class: 'bg-yellow-100' },
  [EstadoCompass.CON_DIFICULTAD]: { hex: '#ffccbc', class: 'bg-orange-100' },
  [EstadoCompass.LOGRADO]: { hex: '#c8e6c9', class: 'bg-green-100' },
  [EstadoCompass.DOMINADO]: { hex: '#4caf50', class: 'bg-green-500' },
  [EstadoCompass.COMPLETADO]: { hex: '#1b5e20', class: 'bg-green-800' },
  [EstadoCompass.NO_TRABAJADO]: { hex: '#d32f2f', class: 'bg-red-500' }
};
