// types/instrument.ts

/**
 * Define los nombres válidos para las familias de instrumentos.
 * Se incluye uniones conocidas y se permite cualquier otro valor de tipo string.
 */
export type InstrumentFamilyName = 'cuerdas' | 'maderas' | 'metales' | 'percusion' | 'coro' | string

/**
 * Representa un instrumento individual.
 */
export interface Instrument {
  id?: string // Opcional si se usa para selección o creación.
  nombre: string // Nombre del instrumento.
  serial: string // Número de serie.
  marca: string // Marca del instrumento.
  model: string // Modelo del instrumento.
  size: string // Tamaño del instrumento.
  state: string // Estado del instrumento.
  familia: InstrumentFamilyName // Familia a la que pertenece.
}

/**
 * Representa un diccionario de opciones de instrumentos, agrupados por familia.
 * Ejemplo: { cuerdas: ['violín', 'viola'], percusion: ['batería', 'conga'] }
 */
export interface InstrumentOptions {
  [family: string]: string[]
}

/**
 * Define el estado para gestionar instrumentos en un store.
 */
export interface InstrumentState {
  familias: InstrumentOptions
  loading: boolean
  error: string | null
}

/**
 * Representa un accesorio de un instrumento.
 */
export interface InstrumentAccessory {
  nombre: string
  estado: string
  observaciones?: string
}

/**
 * Representa un cambio de accesorio en el historial.
 */
export interface AccessoryChange {
  accesorio: string
  fecha: string // AAAA-MM-DD
  detalle: string
}

/**
 * Representa una asignación actual de instrumento a un alumno.
 */
export interface InstrumentAssignment {
  studentId: string
  nombreAlumno: string
  fechaAsignacion: string // AAAA-MM-DD
  contrato?: string // URL del contrato
  fotosEntrega?: string[] // URLs de fotos
}

/**
 * Representa un registro en el historial de un instrumento.
 */
export interface InstrumentHistory {
  studentId: string
  nombreAlumno: string
  periodo: {
    from: string // AAAA-MM-DD
    to: string // AAAA-MM-DD
  }
  condiciones: {
    entrega: string
    devolucion: string
  }
  fotosEntrega?: string[]
  fotosDevolucion?: string[]
  contrato?: string
  cambiosAccesorios?: AccessoryChange[]
  observaciones?: string
}

/**
 * Modelo extendido de instrumento para Firestore.
 */
export interface InstrumentFirestore extends Instrument {
  accesorios?: InstrumentAccessory[]
  fotos?: string[]
  isAssign?: boolean
  asignacion?: InstrumentAssignment
  historial?: InstrumentHistory[]
  fechaRegistro?: string
  observaciones?: string
}
