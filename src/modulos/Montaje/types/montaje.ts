export enum DificultadFrase {
  FACIL = 'FACIL',
  MEDIO = 'MEDIO',
  DIFICIL = 'DIFICIL',
  MUY_DIFICIL = 'MUY_DIFICIL'
}

export enum TipoInstrumento {
  // Cuerdas
  VIOLIN_I = 'VIOLIN_I',
  VIOLIN_II = 'VIOLIN_II',
  VIOLA = 'VIOLA',
  CELLO = 'CELLO',
  CONTRABASS = 'CONTRABASS',
  HARP = 'HARP',
  
  // Vientos Madera
  FLUTE = 'FLUTE',
  PICCOLO = 'PICCOLO',
  OBOE = 'OBOE',
  ENGLISH_HORN = 'ENGLISH_HORN',
  CLARINET = 'CLARINET',
  BASS_CLARINET = 'BASS_CLARINET',
  BASSOON = 'BASSOON',
  CONTRABASSOON = 'CONTRABASSOON',
  SAXOPHONE = 'SAXOPHONE',
  
  // Vientos Metal
  TRUMPET = 'TRUMPET',
  FRENCH_HORN = 'FRENCH_HORN',
  TROMBONE = 'TROMBONE',
  BASS_TROMBONE = 'BASS_TROMBONE',
  TUBA = 'TUBA',
  
  // Percusión
  TIMPANI = 'TIMPANI',
  PERCUSSION = 'PERCUSSION',
  PIANO = 'PIANO',
  CELESTA = 'CELESTA',
  
  // Otros
  VOICE = 'VOICE',
  CHOIR = 'CHOIR',
  OTHER = 'OTHER'
}

/**
 * @deprecated Utilizar ProgresoCompasEstado de './instrumentProgress' en su lugar.
 */
export enum EstadoCompass {
  SIN_TRABAJAR = 'SIN_TRABAJAR',
  LEIDO = 'LEIDO',
  EN_PROGRESO = 'EN_PROGRESO',
  CON_DIFICULTAD = 'CON_DIFICULTAD',
  LOGRADO = 'LOGRADO',
  DOMINADO = 'DOMINADO',
  COMPLETADO = 'COMPLETADO',
  NO_TRABAJADO = 'NO_TRABAJADO'
}

export interface MontajeProject {
  id: string
  name: string
  description: string
  director: string
  organization: string
  season: string
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed' | 'archived'
  works: string[] // Array of work IDs
  members: ProjectMember[]
  settings: MontajeSettings
  createdAt: string
  updatedAt: string
  ownerId: string
}

export interface ProjectMember {
  id: string
  name: string
  email: string
  role: 'director' | 'assistant' | 'section_leader' | 'musician'
  instruments: string[]
  joinedAt: string
  permissions: MontajePermission[]
}

export interface MontajePermission {
  resource: 'works' | 'evaluations' | 'reports' | 'members' | 'settings'
  actions: ('create' | 'read' | 'update' | 'delete' | 'export')[]
}

export interface MontajeSettings {
  evaluationFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  autoReminders: boolean
  reportGeneration: 'manual' | 'automatic'
  exportFormats: ('pdf' | 'excel' | 'csv')[]
  integrations: {
    calendar: boolean
    email: boolean
    metronome: boolean
    tuner: boolean
  }
}

export interface MontajeSession {
  id: string
  projectId: string
  workId: string
  type: 'general' | 'sectional' | 'individual'
  date: string
  duration: number // minutes
  attendees: string[] // member IDs
  objectives: string[]
  achievements: string[]
  notes: string
  recordings?: SessionRecording[]
  evaluations: SessionEvaluation[]
  createdBy: string
  createdAt: string
}

export interface SessionRecording {
  id: string
  filename: string
  duration: number
  size: number
  uploadedAt: string
  transcription?: string
}

export interface SessionEvaluation {
  memberId: string
  instrumentId: string
  scores: Record<string, number>
  notes: string
  improvements: string[]
  nextGoals: string[]
}

export interface MontajeCalendar {
  id: string
  projectId: string
  events: CalendarEvent[]
}

export interface CalendarEvent {
  id: string
  title: string
  type: 'rehearsal' | 'sectional' | 'performance' | 'evaluation' | 'meeting'
  startDate: string
  endDate: string
  location?: string
  description?: string
  attendees: string[]
  workIds: string[]
  reminders: EventReminder[]
}

export interface EventReminder {
  type: 'email' | 'push' | 'sms'
  timing: number // minutes before event
  enabled: boolean
}

export interface Obra {
  id: string;
  titulo: string;
  compositor: string;
  repertorioId: string;
  totalCompases: number;
  duracionEstimada: number; // en minutos
  instrumentosRequeridos: {
    instrumentoId: string;
    nombre: string;
    cantidad: number;
    nivel: 'principiante' | 'intermedio' | 'avanzado';
    esObligatorio: boolean;
  }[];
  fechaCreacion: any; // Firebase Timestamp
  metadatos: {
    complejidadGeneral: DificultadFrase;
    frasesDefinidas: number;
    frasesCompletadas: number;
    progresoPorcentaje: number;
    horasEnsayoEstimadas: number;
    horasEnsayoReales: number;
    tags?: string[];
  };
  auditoria: {
    creadoPor: string;
    fechaCreacion: any; // Firebase Timestamp
    modificadoPor?: string;
    fechaModificacion?: any; // Firebase Timestamp
    version: number;
    activo: boolean;
  };
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'archivada';
  // Otros campos relevantes
}

export interface Repertorio {
  id: string;
  nombre: string;
  descripcion: string;
  fechaCreacion: any; // Firebase Timestamp
  auditoria: {
    creadoPor: string;
    fechaCreacion: any;
    modificadoPor?: string;
    fechaModificacion?: any;
    version: number;
    activo: boolean;
  };
}

export interface PlanAccion {
  id: string;
  obraId: string;
  maestroId: string;
  fechaCreacion: any; // Firebase Timestamp
  fechaInicio: any; // Firebase Timestamp
  fechaFin: any; // Firebase Timestamp
  objetivos: string[];
  fases: {
    nombre: string;
    descripcion: string;
    estado: 'pendiente' | 'en_progreso' | 'completada';
    fechaInicio: any;
    fechaFin: any;
  }[];
  metadatos: {
    progresoPorcentaje: number;
    fasesCompletadas: number;
    totalFases: number;
    horasEstimadas: number;
    horasReales: number;
  };
  auditoria: {
    creadoPor: string;
    fechaCreacion: any;
    modificadoPor?: string;
    fechaModificacion?: any;
    version: number;
    activo: boolean;
  };
}

export interface FraseMontaje {
  id: string;
  planAccionId: string;
  obraId: string;
  nombre: string;
  descripcion: string;
  compassInicio: number;
  compassFinalizacion: number;
  prioridad: number; // 1-5
  metadatos: {
    totalCompases: number;
    estadosCompases: Record<number, EstadoCompass>; // Mapa de número de compás a su estado
    progresoPorcentaje: number;
    horasEnsayoAcumuladas: number;
    dificultadesIdentificadas: string[];
    logrosAlcanzados: string[];
  };
  auditoria: {
    creadoPor: string;
    fechaCreacion: any;
    modificadoPor?: string;
    fechaModificacion?: any;
    version: number;
    activo: boolean;
  };
}

export interface EstadoCompassDetalle {
  compas: number;
  estado: EstadoCompass;
  instrumentos: Record<TipoInstrumento, EstadoCompass>; // Estado por instrumento
  observaciones: string[];
  fechaUltimaModificacion: any; // Firebase Timestamp
  modificadoPor: string; // ID del maestro
  sesionesEnsayo: number;
  dificultadesEspecificas: string[];
}

export interface ObservacionPedagogica {
  id: string;
  obraId: string;
  fraseId?: string;
  maestroId: string;
  fecha: any; // Firebase Timestamp
  tipo: 'tecnica' | 'musical' | 'comportamiento' | 'general';
  contenido: string;
  recomendaciones: string[];
  resuelto: boolean;
  fechaResolucion?: any; // Firebase Timestamp
  auditoria: {
    creadoPor: string;
    fechaCreacion: any;
    modificadoPor?: string;
    fechaModificacion?: any;
    version: number;
    activo: boolean;
  };
}

export interface EvaluacionContinua {
  id: string;
  estudianteId: string;
  obraId: string;
  maestroEvaluadorId: string;
  fecha: any; // Firebase Timestamp
  criterios: Record<string, number>; // Ej: { afinacion: 4, ritmo: 3 }
  puntuacionGeneral: number; // 1-5
  comentarios: string;
  metadatos: {
    duracionEvaluacion: number; // en minutos
    tiempoPreparacion: number; // en minutos
    condicionesEvaluacion: string;
    porcentajeCumplimiento: number; // 0-100
  };
  auditoria: {
    creadoPor: string;
    fechaCreacion: any;
    modificadoPor?: string;
    fechaModificacion?: any;
    version: number;
    activo: boolean;
  };
}

export interface EvaluacionFinal {
  id: string;
  estudianteId: string;
  obraId: string;
  maestroEvaluadorId: string;
  fecha: any; // Firebase Timestamp
  puntuacionFinal: number; // 1-100
  comentariosGenerales: string;
  logrosDestacados: string[];
  areasParaMejorar: string[];
  recomendacionesFuturas: string[];
  auditoria: {
    creadoPor: string;
    fechaCreacion: any;
    modificadoPor?: string;
    fechaModificacion?: any;
    version: number;
    activo: boolean;
  };
}

export interface NotificacionMontaje {
  id: string;
  tipo: 'evaluacion' | 'observacion' | 'cambio_estado' | 'recordatorio';
  titulo: string;
  mensaje: string;
  fechaCreacion: any; // Firebase Timestamp
  destinatarioId: string; // ID del usuario o 'todos'
  remitenteId: string; // ID del usuario que la generó
  entidadRelacionada: {
    tipo: 'obra' | 'frase' | 'compas' | 'evaluacion';
    id: string;
  };
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  metadatos: {
    leida: boolean;
    fechaLectura?: any; // Firebase Timestamp
    accionRequerida: boolean;
  };
}

export interface FiltrosMontaje {
  repertorioId?: string;
  estado?: 'pendiente' | 'en_progreso' | 'completada' | 'archivada';
  dificultad?: DificultadFrase;
  instrumento?: TipoInstrumento;
  tags?: string[];
}

export interface CambioEstadoCompass {
  id: string;
  obraId: string;
  fraseId: string;
  compas: number;
  instrumento?: TipoInstrumento;
  estadoAnterior: EstadoCompass;
  estadoNuevo: EstadoCompass;
  razon?: string;
  maestroId: string;
  fechaCambio?: any; // Firebase Timestamp
}

export interface EstadoCompassInstrumento {
  numeroCompas: number;
  estado: EstadoCompass;
  instrumento: TipoInstrumento;
  observaciones: string;
  fechaUltimaActualizacion: any; // Firebase Timestamp
  maestroActualizador: string; // ID del maestro
  sesionesEnsayo: number;
  dificultadesEspecificas: string[];
}

export interface EstadisticasProgreso {
  totalCompases: number;
  compasesSinTrabajar: number;
  compasesLeidos: number;
  compasesEnProgreso: number;
  compasesConDificultad: number;
  compasesLogrados: number;
  compasesDominados: number;
  compasesCompletados: number;
  porcentajeGeneral: number;
  porcentajePorInstrumento: Record<TipoInstrumento, number>;
}

export interface HistorialTrabajoMaestro {
  id?: string;
  maestroId: string;
  obraId: string;
  instrumentoId: TipoInstrumento;
  compas: number;
  estadoAnterior: EstadoCompass;
  estadoNuevo: EstadoCompass;
  fechaCambio: any; // Firebase Timestamp
  observacionClase?: string; // Observación general de la clase
  razonCambio?: string; // Razón específica del cambio de compás
}