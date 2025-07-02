// Servicio de Validación para Asistencias
// Garantiza integridad de datos antes del envío de notificaciones

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface StudentValidation {
  id: string
  name: string
  phoneNumbers: string[]
  isValid: boolean
  errors: string[]
}

/**
 * Valida formato de número telefónico venezolano
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false
  
  // Limpiar número (remover espacios, guiones, paréntesis)
  const cleanPhone = phone.replace(/[\s\-()]/g, "")
  
  // Formatos válidos para Venezuela:
  // +58xxxxxxxxxx (internacional)
  // 0xxxxxxxxxx (nacional)
  // xxxxxxxxxx (sin prefijo)
  const patterns = [
    /^\+58[24]\d{9}$/, // +58424xxxxxxx, +58414xxxxxxx, etc.
    /^0[24]\d{9}$/, // 0424xxxxxxx
    /^[24]\d{9}$/, // 424xxxxxxx
  ]
  
  return patterns.some((pattern) => pattern.test(cleanPhone))
}

/**
 * Normaliza número telefónico a formato estándar
 */
export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return ""
  
  const cleanPhone = phone.replace(/[\s\-()]/g, "")
  
  // Si ya tiene +58, mantenerlo
  if (cleanPhone.startsWith("+58")) {
    return cleanPhone
  }
  
  // Si empieza con 0, reemplazar por +58
  if (cleanPhone.startsWith("0")) {
    return "+58" + cleanPhone.substring(1)
  }
  
  // Si es solo el número, agregar +58
  if (/^[24]\d{9}$/.test(cleanPhone)) {
    return "+58" + cleanPhone
  }
  
  return cleanPhone
}

/**
 * Valida datos de un estudiante para notificaciones
 */
export const validateStudentForNotification = (studentData: {
  id: string
  nombre: string
  apellido: string
  tlf_madre?: string
  tlf_padre?: string
}): StudentValidation => {
  const errors: string[] = []
  const phoneNumbers: string[] = []
  
  // Validar ID
  if (!studentData.id || studentData.id.trim() === "") {
    errors.push("ID de estudiante requerido")
  }
  
  // Validar nombre
  if (!studentData.nombre || studentData.nombre.trim() === "") {
    errors.push("Nombre del estudiante requerido")
  }
  
  if (!studentData.apellido || studentData.apellido.trim() === "") {
    errors.push("Apellido del estudiante requerido")
  }
  
  // Validar números telefónicos
  if (studentData.tlf_madre) {
    if (validatePhoneNumber(studentData.tlf_madre)) {
      phoneNumbers.push(normalizePhoneNumber(studentData.tlf_madre))
    } else {
      errors.push(`Número de madre inválido: ${studentData.tlf_madre}`)
    }
  }
  
  if (studentData.tlf_padre) {
    if (validatePhoneNumber(studentData.tlf_padre)) {
      phoneNumbers.push(normalizePhoneNumber(studentData.tlf_padre))
    } else {
      errors.push(`Número de padre inválido: ${studentData.tlf_padre}`)
    }
  }
  
  // Debe tener al menos un número válido
  if (phoneNumbers.length === 0) {
    errors.push('Al menos un número telefónico válido es requerido')
  }
  
  return {
    id: studentData.id,
    name: `${studentData.nombre} ${studentData.apellido}`.trim(),
    phoneNumbers,
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valida lista de estudiantes antes del envío masivo
 */
export const validateStudentsForBulkNotification = async (
  studentIds: string[],
  getStudentData: (id: string) => Promise<any>
): Promise<{
  valid: StudentValidation[]
  invalid: StudentValidation[]
  summary: {
    total: number
    valid: number
    invalid: number
    totalPhoneNumbers: number
  }
}> => {
  const valid: StudentValidation[] = []
  const invalid: StudentValidation[] = []
  
  console.log(`🔍 Validando ${studentIds.length} estudiantes...`)
  
  for (const studentId of studentIds) {
    try {
      const studentData = await getStudentData(studentId)
      
      if (!studentData) {
        invalid.push({
          id: studentId,
          name: `Estudiante ${studentId}`,
          phoneNumbers: [],
          isValid: false,
          errors: ['Estudiante no encontrado en la base de datos']
        })
        continue
      }
      
      const validation = validateStudentForNotification(studentData)
      
      if (validation.isValid) {
        valid.push(validation)
      } else {
        invalid.push(validation)
      }
      
    } catch (error) {
      invalid.push({
        id: studentId,
        name: `Estudiante ${studentId}`,
        phoneNumbers: [],
        isValid: false,
        errors: [`Error consultando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`]
      })
    }
  }
  
  const totalPhoneNumbers = valid.reduce((sum, student) => sum + student.phoneNumbers.length, 0)
  
  console.log(`✅ Validación completada: ${valid.length} válidos, ${invalid.length} inválidos`)
  
  return {
    valid,
    invalid,
    summary: {
      total: studentIds.length,
      valid: valid.length,
      invalid: invalid.length,
      totalPhoneNumbers
    }
  }
}

/**
 * Valida contenido del mensaje
 */
export const validateMessageContent = (message: string): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!message || message.trim() === '') {
    errors.push('Contenido del mensaje requerido')
    return { isValid: false, errors, warnings }
  }
  
  // Límite de caracteres para WhatsApp
  const maxLength = 4096
  if (message.length > maxLength) {
    errors.push(`Mensaje excede límite de ${maxLength} caracteres (actual: ${message.length})`)
  }
  
  // Advertencias
  if (message.length > 1000) {
    warnings.push('Mensaje muy largo, considere reducir contenido')
  }
  
  // Verificar placeholders no reemplazados
  const unreplacedPlaceholders = message.match(/\{[^}]+\}/g)
  if (unreplacedPlaceholders) {
    warnings.push(`Placeholders sin reemplazar: ${unreplacedPlaceholders.join(', ')}`)
  }
  
  // Verificar contenido potencialmente problemático
  const spamKeywords = ['urgente', 'inmediato', 'crisis', '!!!']
  const foundSpamKeywords = spamKeywords.filter(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (foundSpamKeywords.length > 2) {
    warnings.push('Mensaje puede parecer spam por uso excesivo de palabras urgentes')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valida horario para envío de notificaciones
 */
export const validateSendingTime = (currentTime: Date = new Date()): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  
  const hour = currentTime.getHours()
  const dayOfWeek = currentTime.getDay() // 0 = domingo, 6 = sábado
  
  // Horarios no permitidos (11 PM a 6 AM)
  if (hour >= 23 || hour < 6) {
    errors.push('No se pueden enviar notificaciones entre 11:00 PM y 6:00 AM')
  }
  
  // Advertencias para horarios subóptimos
  if (hour < 8) {
    warnings.push('Envío muy temprano, algunos padres pueden estar durmiendo')
  }
  
  if (hour > 21) {
    warnings.push('Envío tardío, considere enviar más temprano')
  }
  
  // Fines de semana
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    warnings.push('Envío en fin de semana, considere esperar al día laboral')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validación completa antes del envío
 */
export const validateNotificationRequest = async (request: {
  studentIds: string[]
  messageType: string
  customMessage?: string
  getStudentData: (id: string) => Promise<any>
}): Promise<{
  canProceed: boolean
  studentValidation: Awaited<ReturnType<typeof validateStudentsForBulkNotification>>
  timeValidation: ValidationResult
  messageValidation?: ValidationResult
  recommendations: string[]
}> => {
  const recommendations: string[] = []
  
  // Validar estudiantes
  const studentValidation = await validateStudentsForBulkNotification(
    request.studentIds,
    request.getStudentData
  )
  
  // Validar horario
  const timeValidation = validateSendingTime()
  
  // Validar mensaje personalizado si existe
  let messageValidation: ValidationResult | undefined
  if (request.customMessage) {
    messageValidation = validateMessageContent(request.customMessage)
  }
  
  // Generar recomendaciones
  if (studentValidation.invalid.length > 0) {
    recommendations.push(`${studentValidation.invalid.length} estudiantes tienen datos inválidos`)
  }
  
  if (timeValidation.warnings.length > 0) {
    recommendations.push('Considere enviar en horario óptimo (8 AM - 9 PM)')
  }
  
  if (studentValidation.summary.totalPhoneNumbers > 50) {
    recommendations.push('Envío masivo detectado, considere enviar en lotes')
  }
  
  const canProceed = 
    studentValidation.valid.length > 0 && 
    timeValidation.isValid && 
    (!messageValidation || messageValidation.isValid)
  
  return {
    canProceed,
    studentValidation,
    timeValidation,
    messageValidation,
    recommendations
  }
}

export default {
  validatePhoneNumber,
  normalizePhoneNumber,
  validateStudentForNotification,
  validateStudentsForBulkNotification,
  validateMessageContent,
  validateSendingTime,
  validateNotificationRequest
}
