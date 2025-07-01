export interface Student {
  id: string
  nombre: string
  apellido: string
  email: string
  phone?: string
  activo: boolean
  clase?: string // Campo existente para compatibilidad
  classId?: string // Identificador de la clase para relaciones
  grupo?: string[]
  createdAt: Date
  updatedAt: Date
  photoURL?: string
  status?: string
  instrumento?: string
  fechaNacimiento?: Date
  direccion?: string
  ciudad?: string
  madre?: string
  padre?: string
  tlf_madre?: string
  tlf_padre?: string
  tutor?: string
  tlf_tutor?: string
  colegio_trabajo?: string
  horario_colegio_trabajo?: string
  fecInscripcion?: string // Changed from Date to string for consistency
  tlf?: string
  edad?: string
  nac?: string
  sexo?: string
  observaciones?: string // Added missing field
  avatar?: string // Added missing field
  horario?: string // Added missing field
  duracion?: string // Added missing field
  // Documents storage
  documentos?: Record<string, {url: string; fecha: string}>
  propiedadExtra1?: string
  propiedadExtra2?: string
  propiedadExtra3?: string
}

export interface SelectedStudent {
  id: string
  nombre: string
  apellido: string
}
