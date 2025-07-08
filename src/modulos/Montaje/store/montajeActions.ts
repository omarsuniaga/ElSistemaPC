// src/modulos/Montaje/store/montajeActions.ts
// Este archivo contiene las acciones del módulo Montaje relacionadas con el control de acceso basado en roles
// y la gestión del progreso por instrumento

import { useMontajeStore } from './montaje'
import { teacherService } from '../service/teacherService'
import { compassStateService } from '../service/compassStateService'
import { permissionsService } from '../service/permissionsService'
import { MontajePermission } from '../types/permissions'
import { EstadoCompass, TipoInstrumento } from '../types'
import { 
  EstadoCompassInstrumento,
  ActualizacionMasiva
} from '../types/instrumentProgress'

/**
 * Carga los instrumentos asignados al profesor actual
 * Utiliza el teacherService para obtener tanto especialidades como instrumentos de clases
 */
export async function cargarInstrumentosMaestro() {
  const store = useMontajeStore()
  store.isLoadingInstruments = true
  store.error = null
  
  try {
    // Obtener instrumentos del maestro (especialidades + instrumentos de clases)
    const instrumentos = await teacherService.getTeacherInstruments()
    store.teacherInstruments = instrumentos
    
    // Verificar permisos para actualizar estados de compases por instrumento
    const tienePermiso = await permissionsService.hasPermission(
      MontajePermission.UPDATE_INSTRUMENT_COMPASS_STATES
    )
    store.hasInstrumentStatePermission = tienePermiso
    
    return instrumentos
  } catch (error) {
    console.error('Error al cargar instrumentos del maestro:', error)
    store.error = 'No se pudieron cargar los instrumentos asignados'
    return []
  } finally {
    store.isLoadingInstruments = false
  }
}

/**
 * Carga las obras filtradas por los instrumentos asignados al maestro
 */
export async function cargarObrasParaMaestro() {
  const store = useMontajeStore()
  store.isLoading = true
  store.error = null
  
  try {
    // Primero cargar todos los instrumentos del maestro si no están cargados
    if (store.teacherInstruments.length === 0) {
      await cargarInstrumentosMaestro()
    }
    
    // Luego cargar todas las obras
    await store.cargarObras()
    
    // La filtración se hace automáticamente a través del getter obrasFiltradasPorMaestro
    return store.obrasFiltradasPorMaestro
  } catch (error) {
    console.error('Error al cargar obras para el maestro:', error)
    store.error = 'No se pudieron cargar las obras para el maestro'
    return []
  } finally {
    store.isLoading = false
  }
}

/**
 * Selecciona un instrumento y carga sus estados de compases para la obra actual
 * @param instrumento El instrumento a seleccionar
 */
export async function seleccionarInstrumento(instrumento: TipoInstrumento) {
  const store = useMontajeStore()
  store.isLoadingInstrumentStates = true
  store.error = null
  
  try {
    // Verificar que tengamos una obra seleccionada
    if (!store.obraActual) {
      throw new Error('No hay obra seleccionada')
    }
    
    // Asignar el instrumento seleccionado
    store.selectedInstrument = instrumento
    
    // Cargar estados de compases para este instrumento
    const estados = await compassStateService.obtenerEstadosCompasesPorInstrumento(
      store.obraActual.id,
      instrumento
    )
    store.instrumentCompassStates = estados
    
    // Cargar estadísticas de progreso para este instrumento
    const estadisticas = await compassStateService.obtenerEstadisticas(
      store.obraActual.id,
      instrumento
    )
    store.instrumentStatistics = estadisticas
    
    return estados
  } catch (error) {
    console.error('Error al seleccionar instrumento:', error)
    store.error = 'No se pudieron cargar los estados para el instrumento seleccionado'
    return []
  } finally {
    store.isLoadingInstrumentStates = false
  }
}

/**
 * Actualiza el estado de un compás específico para el instrumento seleccionado
 * Verifica permisos RBAC antes de realizar la operación
 * @param numeroCompas Número del compás a actualizar
 * @param nuevoEstado Nuevo estado del compás
 * @param notas Notas adicionales (opcional)
 */
export async function actualizarEstadoCompassInstrumento(
  numeroCompas: number,
  nuevoEstado: EstadoCompass,
  notas?: string
) {
  const store = useMontajeStore()
  store.isLoading = true
  store.error = null
  
  try {
    // Verificar que tengamos obra e instrumento seleccionados
    if (!store.obraActual || !store.selectedInstrument) {
      throw new Error('No hay obra o instrumento seleccionado')
    }
    
    // Verificar permisos RBAC
    if (!store.hasInstrumentStatePermission) {
      throw new Error('No tienes permisos para actualizar estados de compases por instrumento')
    }
    
    // Crear objeto de estado
    const estado: EstadoCompassInstrumento = {
      obraId: store.obraActual.id,
      instrumentoId: store.selectedInstrument,
      numeroCompas,
      estado: nuevoEstado,
      notas,
      ultimaActualizacion: new Date(),
      actualizadoPor: '', // Se completa en el servicio
    }
    
    // Actualizar en Firestore usando el servicio con RBAC
    const id = await compassStateService.actualizarEstadoCompass(estado)
    
    // Recargar estados después de la actualización
    await seleccionarInstrumento(store.selectedInstrument)
    
    return id
  } catch (error: any) {
    console.error('Error al actualizar estado de compás por instrumento:', error)
    store.error = error.message || 'Error al actualizar el estado del compás'
    throw error
  } finally {
    store.isLoading = false
  }
}

/**
 * Actualiza masivamente varios compases para el instrumento seleccionado
 * Verifica permisos RBAC antes de realizar la operación
 * @param compasesIds Array con los números de compases a actualizar
 * @param nuevoEstado Nuevo estado para todos los compases seleccionados
 * @param notas Notas adicionales (opcional)
 */
export async function actualizarCompassesMasivamente(
  compasesIds: number[],
  nuevoEstado: EstadoCompass,
  notas?: string
) {
  const store = useMontajeStore()
  store.isLoading = true
  store.error = null
  
  try {
    // Verificar que tengamos obra e instrumento seleccionados
    if (!store.obraActual || !store.selectedInstrument) {
      throw new Error('No hay obra o instrumento seleccionado')
    }
    
    // Verificar permisos RBAC
    if (!store.hasInstrumentStatePermission) {
      throw new Error('No tienes permisos para actualizar estados de compases por instrumento')
    }
    
    // Crear objeto para actualización masiva
    const actualizacion: ActualizacionMasiva = {
      obraId: store.obraActual.id,
      instrumentoId: store.selectedInstrument,
      compasesIds,
      nuevoEstado,
      notas
    }
    
    // Actualizar en Firestore usando el servicio con RBAC
    const ids = await compassStateService.actualizarMasivamente(actualizacion)
    
    // Recargar estados después de la actualización
    await seleccionarInstrumento(store.selectedInstrument)
    
    return ids
  } catch (error: any) {
    console.error('Error en actualización masiva:', error)
    store.error = error.message || 'Error al actualizar los compases'
    throw error
  } finally {
    store.isLoading = false
  }
}

/**
 * Verifica si el usuario tiene permisos para ver reportes agregados
 * (permisos de director o administrador)
 */
export async function verificarPermisosReportesAgregados() {
  const store = useMontajeStore()
  
  try {
    const tienePermiso = await permissionsService.hasPermission(
      MontajePermission.VIEW_AGGREGATED_REPORTS
    )
    return tienePermiso
  } catch (error) {
    console.error('Error al verificar permisos de reportes:', error)
    return false
  }
}
