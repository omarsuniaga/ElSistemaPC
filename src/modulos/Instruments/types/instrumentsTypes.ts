// Instruments/types/instrument.ts
export interface Instrument {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  familia?: string
  tamaño?: string
  marca?: string
  modelo?: string
  serial?: string
  fechaIngreso?: Date | string
  historial?: {
    alumnoId: string
    nombreAlumno: string
    fechaInicio: Date | string
    fechaFin?: Date | string
  }[]
  estado?: 'excelente' | 'bueno' | 'regular' | 'funcional' | 'necesitaReparacion'
  detallesEstado?: string
  accesorios?: {
    nombre: string
    estado: 'excelente' | 'bueno' | 'regular' | 'malo' | 'faltante'
    observacion?: string
  }[]
  estuche?: {
    tiene: boolean
    estado?: 'excelente' | 'bueno' | 'regular' | 'malo'
    observacion?: string
  }
  observaciones?: string
  ubicacion?: string
  createdAt?: any
  updatedAt?: any
}
