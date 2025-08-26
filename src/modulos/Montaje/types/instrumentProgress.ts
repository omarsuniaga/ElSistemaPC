// src/modulos/Montaje/types/instrumentProgress.ts

import { EstadoCompass, TipoInstrumento } from './montaje';

/**
 * @deprecated Utilizar ProgresoCompasEstado en su lugar.
 */
export { EstadoCompass };

/**
 * Define los 5 estados de progreso para un compás, específico para un instrumento.
 */
export enum ProgresoCompasEstado {
  SIN_TRABAJAR = 1,
  LEIDO = 2,
  CON_DIFICULTAD = 3,
  LOGRADO = 4,
  DOMINADO = 5,
}

/**
 * Mapeo de los nuevos estados de progreso a colores y etiquetas para la UI.
 */
export const PROGRESO_COMPAS_INFO: Record<ProgresoCompasEstado, { hex: string; class: string; label: string }> = {
  [ProgresoCompasEstado.SIN_TRABAJAR]: { hex: '#E0E0E0', class: 'bg-gray-300', label: 'Sin Trabajar' },
  [ProgresoCompasEstado.LEIDO]: { hex: '#90CAF9', class: 'bg-blue-200', label: 'Leído' },
  [ProgresoCompasEstado.CON_DIFICULTAD]: { hex: '#FFB74D', class: 'bg-orange-300', label: 'Con Dificultad' },
  [ProgresoCompasEstado.LOGRADO]: { hex: '#A5D6A7', class: 'bg-green-200', label: 'Logrado' },
  [ProgresoCompasEstado.DOMINADO]: { hex: '#4CAF50', class: 'bg-green-600', label: 'Dominado' },
};

/**
 * Interfaz para el estado de un compás específico de un instrumento
 */
export interface EstadoCompassInstrumento {
  id?: string;               // ID único del registro
  obraId: string;            // ID de la obra
  instrumentoId: string;     // ID del instrumento
  numeroCompas: number;      // Número de compás
  estado: ProgresoCompasEstado; // Utiliza el nuevo enum de 5 estados
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
  conDificultad: number;
  logrado: number;
  dominado: number;
  porcentajeCompletado: number; // Calculado en base a los estados
}

/**
 * Interfaz para actualización masiva de estado de compases
 */
export interface ActualizacionMasiva {
  obraId: string;
  instrumentoId: string;
  compasesIds: number[];
  nuevoEstado: ProgresoCompasEstado; // Utiliza el nuevo enum
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
  estado: ProgresoCompasEstado; // Utiliza el nuevo enum
  colorHex: string;
  colorClass: string;
}


