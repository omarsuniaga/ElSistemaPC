// src/modulos/Montaje/types/index.ts

/**
 * MÓDULO MONTAJE - Sistema de Gestión Musical Profesional
 * Tipos principales para el sistema de montaje de obras musicales
 */

import {Timestamp} from "firebase/firestore"

// ================== ENUMS Y CONSTANTES ==================

export enum EstadoCompass {
  SIN_TRABAJAR = "sin_trabajar",
  LEIDO = "leido",
  CON_DIFICULTAD = "con_dificultad",
  LOGRADO = "logrado",
}

export enum DificultadFrase {
  FACIL = "facil",
  MEDIO = "medio",
  DIFICIL = "dificil",
  MUY_DIFICIL = "muy_dificil",
}

export enum TipoObservacion {
  DINAMICA = "dinamica",
  ARTICULACION = "articulacion",
  TEMPO = "tempo",
  AFINACION = "afinacion",
  RITMO = "ritmo",
  ENSEMBLE = "ensemble",
  TECNICA = "tecnica",
  EXPRESION = "expresion",
  GENERAL = "general",
}

export enum TipoEvaluacion {
  CONTINUA = "continua",
  PARCIAL = "parcial",
  FINAL = "final",
  DIAGNOSTICA = "diagnostica",
}

export enum CriterioEvaluacion {
  RITMO = "ritmo",
  METRICA = "metrica",
  AFINACION = "afinacion",
  DINAMICA = "dinamica",
  MEMORIZACION = "memorizacion",
  POSTURA = "postura",
  ENSAMBLE = "ensamble",
  DISCIPLINA = "disciplina",
  PUNTUALIDAD = "puntualidad",
  LECTURA = "lectura",
  EXPRESION = "expresion",
  INTERPRETACION = "interpretacion",
  TECNICA_INSTRUMENTAL = "tecnica_instrumental",
}

export enum EstadoRepertorio {
  PLANIFICANDO = "planificando",
  EN_MONTAJE = "en_montaje",
  EN_REVISION = "en_revision",
  LISTO_PRESENTACION = "listo_presentacion",
  FINALIZADO = "finalizado",
  ARCHIVADO = "archivado",
}

export enum EstadoObra {
  PENDIENTE = "pendiente",
  EN_ESTUDIO = "en_estudio",
  EN_MONTAJE = "en_montaje",
  EN_PULIMIENTO = "en_pulimiento",
  LISTA = "lista",
  PRESENTADA = "presentada",
  ARCHIVADA = "archivada",
}

export enum TipoInstrumento {
  // Cuerdas
  VIOLIN1 = "violin_1",
  VIOLIN2 = "violin_2",
  VIOLA = "viola",
  CELLO = "cello",
  CONTRABAJO = "contrabajo",

  // Vientos Madera
  FLUTE = "flute",
  PICCOLO = "piccolo",
  OBOE = "oboe",
  CLARINET = "clarinet",
  BASS_CLARINET = "bass_clarinet",
  BASSOON = "bassoon",
  CONTRABASSOON = "contrabassoon",
  SAXOPHONE = "saxophone",

  // Vientos Metal
  HORN = "horn",
  TRUMPET = "trumpet",
  TROMBONE = "trombone",
  BASS_TROMBONE = "bass_trombone",
  TUBA = "tuba",

  // Percusión
  TIMPANI = "timpani",
  PERCUSSION = "percussion",
  MARIMBA = "marimba",
  XYLOPHONE = "xylophone",

  // Otros
  PIANO = "piano",
  HARP = "harp",
  ORGAN = "organ",
}

export enum RolMontaje {
  DIRECTOR = "director",
  MAESTRO_PRINCIPAL = "maestro_principal",
  MAESTRO_ASISTENTE = "maestro_asistente",
  PIANISTA_ACOMPAÑANTE = "pianista_acompanante",
  OBSERVADOR = "observador",
  ESTUDIANTE = "estudiante",
}

export enum TipoEnsayo {
  INDIVIDUAL = "individual",
  SECCION = "seccion",
  GENERAL = "general",
  DRESS_REHEARSAL = "dress_rehearsal",
}

export enum PrioridadNotificacion {
  BAJA = "baja",
  MEDIA = "media",
  ALTA = "alta",
  URGENTE = "urgente",
}

// ================== INTERFACES CORE ==================

export interface Auditoria {
  creadoPor: string
  fechaCreacion: Timestamp
  modificadoPor?: string
  fechaModificacion?: Timestamp
  version: number
  activo: boolean
}

export interface MetadatosGenerales {
  tags?: string[]
  notas?: string
  prioridad?: number
  fechaLimite?: Timestamp
}

// ================== INTERFACES PRINCIPALES ==================

/**
 * Estructura principal de un Repertorio
 */
export interface Repertorio {
  id: string
  nombre: string
  descripcion?: string
  fechaCreacion: Timestamp
  fechaInicio?: Timestamp
  fechaFinalizacion?: Timestamp
  temporada: string
  estado: EstadoRepertorio
  directorId: string
  participantes: ParticipanteRepertorio[]
  metadatos: {
    totalObras: number
    obrasCompletadas: number
    progresoPorcentaje: number
    ensayosRealizados: number
    horasEnsayo: number
  }
  auditoria: Auditoria
}

/**
 * Participante en un repertorio
 */
export interface ParticipanteRepertorio {
  estudianteId: string
  nombreCompleto: string
  instrumentos: TipoInstrumento[]
  rol: RolMontaje
  fechaIngreso: Timestamp
  activo: boolean
  metadatos: {
    asistenciaPromedio: number
    evaluacionPromedio: number
    obrasAsignadas: string[]
    observaciones: string
  }
}

/**
 * Estructura principal de una Obra musical
 */
export interface Obra {
  id: string
  repertorioId: string
  titulo: string
  compositor: string
  arreglista?: string
  genero?: string
  epoca?: string
  tonalidad?: string
  compas?: string
  tempo?: string
  duracionEstimada: number // en minutos
  descripcion?: string
  estado: EstadoObra
  fechaCreacion: Timestamp
  fechaInicioMontaje?: Timestamp
  fechaFinalizacionEstimada?: Timestamp

  // Archivos multimedia
  archivoPartitura?: string
  audioReferencia?: string
  videoReferencia?: string
  imagenPortada?: string

  // Instrumentación requerida
  instrumentosRequeridos: InstrumentacionObra[]

  // Metadatos y seguimiento
  metadatos: {
    complejidadGeneral: DificultadFrase
    totalCompases: number
    frasesDefinidas: number
    frasesCompletadas: number
    progresoPorcentaje: number
    horasEnsayoEstimadas: number
    horasEnsayoReales: number
  }

  auditoria: Auditoria
}

/**
 * Instrumentación requerida para una obra
 */
export interface InstrumentacionObra {
  instrumentoId: TipoInstrumento
  cantidad: number
  obligatorio: boolean
  dificultad: DificultadFrase
  observaciones?: string
}

/**
 * Plan de Acción para el montaje de una obra
 */
export interface PlanAccion {
  id: string
  obraId: string
  nombre: string
  descripcion?: string
  fechaInicio: Timestamp
  fechaFinalizacion: Timestamp
  objetivos: ObjetivoPlan[]
  fases: FasePlan[]
  responsableId: string
  estado: "activo" | "pausado" | "completado" | "cancelado"
  metadatos: {
    progresoPorcentaje: number
    fasesCompletadas: number
    totalFases: number
    horasEstimadas: number
    horasReales: number
  }
  auditoria: Auditoria
}

/**
 * Objetivo específico del plan
 */
export interface ObjetivoPlan {
  id: string
  descripcion: string
  criteriosExito: string[]
  fechaLimite?: Timestamp
  completado: boolean
  progreso: number
}

/**
 * Fase del plan de acción
 */
export interface FasePlan {
  id: string
  nombre: string
  descripcion?: string
  orden: number
  fechaInicio: Timestamp
  fechaFinalizacion: Timestamp
  tareas: TareaFase[]
  dependencias: string[] // IDs de fases que deben completarse antes
  completada: boolean
  progreso: number
}

/**
 * Tarea específica dentro de una fase
 */
export interface TareaFase {
  id: string
  titulo: string
  descripcion?: string
  responsableId?: string
  fechaLimite?: Timestamp
  completada: boolean
  prioridad: 1 | 2 | 3 | 4 | 5
}

/**
 * Frase musical dentro de una obra
 */
export interface FraseMontaje {
  id: string
  obraId: string
  planAccionId: string
  nombre: string
  descripcion?: string
  compasInicio: number
  compasFinalizacion: number
  dificultad: DificultadFrase
  objetivosTecnicos: string[]
  objetivosMusicales: string[]

  // Estado de los compases
  metadatos: {
    totalCompases: number
    estadosCompases: Record<number, EstadoCompass>
    progresoPorcentaje: number
    horasEnsayoAcumuladas: number
    dificultadesIdentificadas: string[]
    logrosAlcanzados: string[]
  }

  auditoria: Auditoria
}

/**
 * Estado detallado de un compás específico
 */
export interface EstadoCompassDetalle {
  compas: number
  estado: EstadoCompass
  instrumentos: Record<TipoInstrumento, EstadoCompass>
  observaciones: string[]
  fechaUltimaModificacion: Timestamp
  modificadoPor: string
  sesionesEnsayo: number
  dificultadesEspecificas: TipoObservacion[]
}

/**
 * Observación pedagógica detallada
 */
export interface ObservacionPedagogica {
  id: string
  estudianteId: string
  obraId: string
  fraseId?: string
  maestroId: string
  fecha: Timestamp
  tipo: TipoObservacion

  // Contenido de la observación
  titulo: string
  descripcion: string
  compases?: number[]
  instrumentos: TipoInstrumento[]

  // Evaluación
  nivelActual: number // 1-10
  nivelEsperado: number // 1-10
  progreso: "mejorando" | "estancado" | "retrocediendo"

  // Recomendaciones
  accionesRecomendadas: string[]
  recursosAdicionales?: string[]
  fechaSeguimiento?: Timestamp

  // Estado
  atendida: boolean
  fechaAtencion?: Timestamp
  resultadoAtencion?: string

  metadatos: MetadatosGenerales
  auditoria: Auditoria
}

/**
 * Evaluación continua de progreso
 */
export interface EvaluacionContinua {
  id: string
  estudianteId: string
  obraId: string
  maestroEvaluadorId: string
  fecha: Timestamp
  tipo: TipoEvaluacion

  // Criterios evaluados
  criterios: Record<CriterioEvaluacion, PuntuacionCriterio>

  // Resultados generales
  puntuacionGeneral: number // 0-100
  comentarios: string
  fortalezas: string[]
  areasAMejorar: string[]
  recomendaciones: string[]

  // Seguimiento
  objetivosProximaSesion: string[]
  materialAdicional?: string[]

  metadatos: {
    duracionEvaluacion: number // minutos
    tiempoPreparacion: number // minutos
    condicionesEvaluacion: string
    porcentajeCumplimiento: number
  }

  auditoria: Auditoria
}

/**
 * Puntuación de un criterio específico
 */
export interface PuntuacionCriterio {
  puntuacion: number // 0-100
  peso: number // 0-1
  observaciones?: string
  evidencias?: string[]
}

/**
 * Evaluación final de obra
 */
export interface EvaluacionFinal {
  id: string
  estudianteId: string
  obraId: string
  maestroEvaluadorId: string
  fecha: Timestamp

  // Evaluación integral
  puntuacionFinal: number // 0-100

  // Análisis detallado
  dominioTecnico: number // 0-100
  expresionMusical: number // 0-100
  interpretacion: number // 0-100
  memorizacion: number // 0-100
  presenciaEscenica: number // 0-100

  // Retroalimentación
  logrosDestacados: string[]
  areasDeDesarrollo: string[]
  recomendacionesFuturas: string[]

  // Documentación
  grabacionAudio?: string
  grabacionVideo?: string
  partituraAnotada?: string

  metadatos: {
    duracionPresentacion: number
    condicionesPresentacion: string
    audienciaPresente: boolean
    instrumentoAcompañamiento?: TipoInstrumento
  }

  auditoria: Auditoria
}

/**
 * Notificación del sistema de montaje
 */
export interface NotificacionMontaje {
  id: string
  destinatarioId: string
  remitenteId?: string
  tipo: "ensayo" | "evaluacion" | "tarea" | "observacion" | "sistema"
  prioridad: PrioridadNotificacion

  // Contenido
  titulo: string
  mensaje: string
  enlaceAccion?: string

  // Referencias
  obraId?: string
  fraseId?: string
  ensayoId?: string
  evaluacionId?: string

  // Estado
  fechaCreacion: Timestamp
  fechaVencimiento?: Timestamp

  metadatos: {
    canal: "web" | "email" | "push"
    requeridaConfirmacion: boolean
    confirmada?: boolean
    fechaConfirmacion?: Timestamp
    leida: boolean
  }
}

/**
 * Registro de cambio de estado de compás
 */
export interface CambioEstadoCompass {
  id: string
  obraId: string
  fraseId: string
  compas: number
  instrumento?: TipoInstrumento
  estadoAnterior: EstadoCompass
  estadoNuevo: EstadoCompass
  razon: string
  maestroId: string
  fecha: Timestamp
  sesionEnsayoId?: string
}

/**
 * Filtros para consultas de montaje
 */
export interface FiltrosMontaje {
  repertorioId?: string
  obraId?: string
  estudianteId?: string
  maestroId?: string
  estado?: EstadoObra | EstadoRepertorio
  dificultad?: DificultadFrase
  instrumento?: TipoInstrumento
  fechaDesde?: Timestamp
  fechaHasta?: Timestamp
  tags?: string[]
}

// ================== TIPOS DE INPUT ==================

export interface CreateRepertoireInput {
  nombre: string
  descripcion?: string
  temporada: string
  fechaInicio?: Timestamp
  fechaFinalizacion?: Timestamp
  directorId: string
}

export interface CreateWorkInput {
  repertorioId?: string
  titulo?: string
  title: string // Alias principal
  composer: string
  genre?: string
  difficulty: DificultadFrase
  estimatedDuration: number
  description?: string
  instruments: TipoInstrumento[]
  sheetMusicUrl?: string
  audioUrl?: string
  videoUrl?: string
  imagenPortada?: string
  tags?: string[]
  status?: EstadoObra
  totalCompases?: number
}

export interface CreatePlanInput {
  obraId: string
  nombre: string
  descripcion?: string
  fechaInicio: Timestamp
  fechaFinalizacion: Timestamp
  objetivos: Omit<ObjetivoPlan, "id" | "completado" | "progreso">[]
  responsableId: string
}

export interface CreateEvaluationInput {
  estudianteId?: string
  obraId?: string
  maestroEvaluadorId?: string
  tipo?: TipoEvaluacion
  criterios?: Record<CriterioEvaluacion, Omit<PuntuacionCriterio, "peso">>
  comentarios?: string
  recomendaciones?: string[]
  workId?: string
  score?: number
  comments?: string
  metadatos?: any
  fecha?: Date
  tiempoSesion?: number
}

export interface UpdateParticipantInput {
  instrumentos?: TipoInstrumento[]
  rol?: RolMontaje
  activo?: boolean
  observaciones?: string
}

// ================== TIPOS DE UTILIDAD ==================

export type WorkStatus = EstadoObra
export type RepertoireStatus = EstadoRepertorio
export type DifficultyLevel = DificultadFrase
export type InstrumentType = TipoInstrumento
export type MontajeRole = RolMontaje
export type EvaluationType = TipoEvaluacion
export type ObservationType = TipoObservacion
export type MeasureStatus = EstadoCompass
export type NotificationPriority = PrioridadNotificacion

// Compatibilidad con interfaces existentes
export type Work = Obra
export type Participant = ParticipanteRepertorio

// ================== CONSTANTES ÚTILES ==================

export const INSTRUMENT_FAMILIES = {
  STRINGS: [
    TipoInstrumento.VIOLIN1,
    TipoInstrumento.VIOLIN2,
    TipoInstrumento.VIOLA,
    TipoInstrumento.CELLO,
    TipoInstrumento.CONTRABAJO,
  ],
  WOODWINDS: [
    TipoInstrumento.FLUTE,
    TipoInstrumento.OBOE,
    TipoInstrumento.CLARINET,
    TipoInstrumento.BASSOON,
  ],
  BRASS: [
    TipoInstrumento.HORN,
    TipoInstrumento.TRUMPET,
    TipoInstrumento.TROMBONE,
    TipoInstrumento.TUBA,
  ],
  PERCUSSION: [
    TipoInstrumento.TIMPANI,
    TipoInstrumento.PERCUSSION,
    TipoInstrumento.MARIMBA,
    TipoInstrumento.XYLOPHONE,
  ],
  KEYBOARD: [TipoInstrumento.PIANO, TipoInstrumento.ORGAN],
  OTHER: [TipoInstrumento.HARP],
} as const

export const DIFFICULTY_WEIGHTS = {
  [DificultadFrase.FACIL]: 1,
  [DificultadFrase.MEDIO]: 2,
  [DificultadFrase.DIFICIL]: 3,
  [DificultadFrase.MUY_DIFICIL]: 4,
} as const

export const EVALUATION_WEIGHTS = {
  [CriterioEvaluacion.RITMO]: 0.15,
  [CriterioEvaluacion.AFINACION]: 0.15,
  [CriterioEvaluacion.DINAMICA]: 0.1,
  [CriterioEvaluacion.EXPRESION]: 0.15,
  [CriterioEvaluacion.TECNICA_INSTRUMENTAL]: 0.2,
  [CriterioEvaluacion.INTERPRETACION]: 0.25,
} as const

export const INSTRUMENT_DISPLAY_NAMES = {
  [TipoInstrumento.VIOLIN1]: "Violín I",
  [TipoInstrumento.VIOLIN2]: "Violín II",
  [TipoInstrumento.VIOLA]: "Viola",
  [TipoInstrumento.CELLO]: "Violonchelo",
  [TipoInstrumento.CONTRABAJO]: "Contrabajo",
  [TipoInstrumento.FLUTE]: "Flauta",
  [TipoInstrumento.OBOE]: "Oboe",
  [TipoInstrumento.CLARINET]: "Clarinete",
  [TipoInstrumento.BASSOON]: "Fagot",
  [TipoInstrumento.HORN]: "Corno",
  [TipoInstrumento.TRUMPET]: "Trompeta",
  [TipoInstrumento.TROMBONE]: "Trombón",
  [TipoInstrumento.TUBA]: "Tuba",
  [TipoInstrumento.TIMPANI]: "Timbales",
  [TipoInstrumento.PERCUSSION]: "Percusión",
  [TipoInstrumento.PIANO]: "Piano",
  [TipoInstrumento.HARP]: "Arpa",
} as const

export const DIFFICULTY_DISPLAY_NAMES = {
  [DificultadFrase.FACIL]: "Fácil",
  [DificultadFrase.MEDIO]: "Medio",
  [DificultadFrase.DIFICIL]: "Difícil",
  [DificultadFrase.MUY_DIFICIL]: "Muy Difícil",
} as const

export const STATUS_DISPLAY_NAMES = {
  [EstadoObra.PENDIENTE]: "Pendiente",
  [EstadoObra.EN_ESTUDIO]: "En Estudio",
  [EstadoObra.EN_MONTAJE]: "En Montaje",
  [EstadoObra.EN_PULIMIENTO]: "En Pulimiento",
  [EstadoObra.LISTA]: "Lista",
  [EstadoObra.PRESENTADA]: "Presentada",
  [EstadoObra.ARCHIVADA]: "Archivada",
} as const
