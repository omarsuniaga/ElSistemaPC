/**
 * 🔒 ESQUEMAS DE VALIDACIÓN CENTRALIZADOS
 * Implementación de Zod para validación de datos robusta
 * Fase 0 - Iniciativa 3: Validación de Datos
 */

import {z} from "zod"

// ==================== TEACHER SCHEMAS ====================

export const TeacherStatusSchema = z.enum(["activo", "inactivo", "pendiente"])

export const TeacherDataSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  uid: z.string().optional(),
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  photoURL: z.string().url().optional().or(z.literal("")),
  status: TeacherStatusSchema.default("activo"),
  biography: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  experiencia: z.string().optional(),
  address: z.string().optional(),
})

export const TeacherCreateSchema = TeacherDataSchema.omit({id: true, createdAt: true})

export const TeacherUpdateSchema = TeacherDataSchema.partial().omit({id: true, createdAt: true})

// ==================== STUDENT SCHEMAS ====================

export const StudentStatusSchema = z.enum(["activo", "inactivo", "graduado", "retirado"])

export const StudentDataSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "Apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional(),
  telefono: z.string().optional(),
  fechaNacimiento: z.date().optional(),
  direccion: z.string().optional(),
  tutor: z.string().optional(),
  activo: z.boolean().default(true),
  status: StudentStatusSchema.default("activo"),
  nivel: z.string().optional(),
  instrumento: z.string().optional(),
  observaciones: z.string().optional(),
  fechaInscripcion: z.date(),
  ultimaActualizacion: z.date().optional(),
})

export const StudentCreateSchema = StudentDataSchema.omit({id: true, fechaInscripcion: true})

export const StudentUpdateSchema = StudentDataSchema.partial().omit({
  id: true,
  fechaInscripcion: true,
})

// ==================== CLASS SCHEMAS ====================

export const ClassStatusSchema = z.enum(["activa", "inactiva", "pausada", "completada"])

export const ClassDataSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  name: z.string().min(2, "Nombre de clase debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  teacherId: z.string().min(1, "ID del maestro es requerido"),
  studentIds: z.array(z.string()).default([]),
  schedule: z
    .object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      room: z.string().optional(),
    })
    .optional(),
  level: z.string().optional(),
  instrument: z.string().optional(),
  maxStudents: z.number().positive().optional(),
  status: ClassStatusSchema.default("activa"),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
})

export const ClassCreateSchema = ClassDataSchema.omit({id: true, createdAt: true})

export const ClassUpdateSchema = ClassDataSchema.partial().omit({id: true, createdAt: true})

// ==================== ATTENDANCE SCHEMAS ====================

export const AttendanceStatusSchema = z.enum(["presente", "ausente", "tardanza", "justificado"])

export const AttendanceRecordSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  studentId: z.string().min(1, "ID del estudiante es requerido"),
  classId: z.string().min(1, "ID de la clase es requerido"),
  teacherId: z.string().min(1, "ID del maestro es requerido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato YYYY-MM-DD"),
  status: AttendanceStatusSchema,
  notes: z.string().optional(),
  justification: z.string().optional(),
  timestamp: z.date(),
  updatedBy: z.string().optional(),
})

export const AttendanceCreateSchema = AttendanceRecordSchema.omit({id: true, timestamp: true})

export const AttendanceUpdateSchema = AttendanceRecordSchema.partial().omit({
  id: true,
  timestamp: true,
})

// ==================== OBSERVATION SCHEMAS ====================

export const ObservationSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  studentId: z.string().min(1, "ID del estudiante es requerido").optional(),
  classId: z.string().min(1, "ID de la clase es requerido"),
  teacherId: z.string().min(1, "ID del maestro es requerido"),
  content: z.string().min(5, "La observación debe tener al menos 5 caracteres"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato YYYY-MM-DD"),
  type: z.enum(["general", "comportamiento", "progreso", "tarea", "otro"]).default("general"),
  isClassObservation: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
})

export const ObservationCreateSchema = ObservationSchema.omit({id: true, createdAt: true})

export const ObservationUpdateSchema = ObservationSchema.partial().omit({id: true, createdAt: true})

// ==================== UTILITIES ====================

/**
 * Valida y transforma datos usando un esquema de Zod
 */
export function validateAndTransform<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ")
      throw new Error(`Datos inválidos: ${issues}`)
    }
    throw error
  }
}

/**
 * Valida datos opcionalmente (retorna null si es inválido)
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data)
  } catch {
    return null
  }
}

/**
 * Valida datos de Firebase antes de entrar en los stores
 */
export function validateFirebaseData<T>(schema: z.ZodSchema<T>, data: any): T {
  // Transformar timestamps de Firebase a Date
  const transformedData = {...data}

  Object.keys(transformedData).forEach((key) => {
    const value = transformedData[key]
    if (value && typeof value === "object" && value.toDate) {
      transformedData[key] = value.toDate()
    }
  })

  return validateAndTransform(schema, transformedData)
}

// ==================== TYPE EXPORTS ====================

export type TeacherData = z.infer<typeof TeacherDataSchema>
export type TeacherCreate = z.infer<typeof TeacherCreateSchema>
export type TeacherUpdate = z.infer<typeof TeacherUpdateSchema>

export type StudentData = z.infer<typeof StudentDataSchema>
export type StudentCreate = z.infer<typeof StudentCreateSchema>
export type StudentUpdate = z.infer<typeof StudentUpdateSchema>

export type ClassData = z.infer<typeof ClassDataSchema>
export type ClassCreate = z.infer<typeof ClassCreateSchema>
export type ClassUpdate = z.infer<typeof ClassUpdateSchema>

export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>
export type AttendanceCreate = z.infer<typeof AttendanceCreateSchema>
export type AttendanceUpdate = z.infer<typeof AttendanceUpdateSchema>

export type ObservationData = z.infer<typeof ObservationSchema>
export type ObservationCreate = z.infer<typeof ObservationCreateSchema>
export type ObservationUpdate = z.infer<typeof ObservationUpdateSchema>
