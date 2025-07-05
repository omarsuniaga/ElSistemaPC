// Sistema de Gestión de Plantillas Dinámicas
// Permite crear, editar y gestionar plantillas de mensajes personalizables

import {db} from "../../firebase"
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore"

// Interfaces
interface MessageVariable {
  key: string
  label: string
  description: string
  type: "text" | "date" | "time" | "number" | "student" | "class" | "custom"
  required: boolean
  defaultValue?: string
  options?: string[] // Para tipo select
  validator?: string // Regex para validación
}

interface MessageTemplate {
  id?: string
  name: string
  description: string
  category: "tardanza" | "ausencia_justificada" | "inasistencia" | "general" | "custom"
  escalationLevel?: number
  subject?: string
  content: string
  variables: MessageVariable[]
  isActive: boolean
  isSystem: boolean // No se puede eliminar
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
  usage: {
    totalSent: number
    lastUsed?: Date
    successRate: number
  }
  preview?: {
    sampleData: Record<string, string>
    renderedContent: string
  }
}

interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  templates: MessageTemplate[]
}

// Colección Firebase
const TEMPLATES_COLLECTION = "message_templates"

/**
 * Variables disponibles globalmente
 */
export const GLOBAL_VARIABLES: MessageVariable[] = [
  {
    key: "studentName",
    label: "Nombre del Estudiante",
    description: "Nombre completo del estudiante",
    type: "student",
    required: true,
  },
  {
    key: "studentFirstName",
    label: "Primer Nombre",
    description: "Solo el primer nombre del estudiante",
    type: "student",
    required: false,
  },
  {
    key: "className",
    label: "Nombre de la Clase",
    description: "Nombre de la clase o materia",
    type: "class",
    required: false,
  },
  {
    key: "teacherName",
    label: "Nombre del Maestro",
    description: "Nombre del profesor de la clase",
    type: "class",
    required: false,
  },
  {
    key: "date",
    label: "Fecha",
    description: "Fecha actual en formato dd/mm/yyyy",
    type: "date",
    required: false,
    defaultValue: new Date().toLocaleDateString("es-ES"),
  },
  {
    key: "time",
    label: "Hora",
    description: "Hora actual en formato HH:mm",
    type: "time",
    required: false,
    defaultValue: new Date().toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"}),
  },
  {
    key: "dayOfWeek",
    label: "Día de la Semana",
    description: "Día actual de la semana",
    type: "date",
    required: false,
    defaultValue: new Date().toLocaleDateString("es-ES", {weekday: "long"}),
  },
  {
    key: "academyName",
    label: "Nombre de la Academia",
    description: "Nombre oficial de la institución",
    type: "text",
    required: false,
    defaultValue: "Academia Musical El Sistema",
  },
  {
    key: "contactPhone",
    label: "Teléfono de Contacto",
    description: "Número de teléfono de la academia",
    type: "text",
    required: false,
    defaultValue: "+58 (XXX) XXX-XXXX",
  },
  {
    key: "nextClassDate",
    label: "Próxima Clase",
    description: "Fecha de la próxima clase",
    type: "date",
    required: false,
  },
  {
    key: "absenceCount",
    label: "Número de Ausencias",
    description: "Cantidad de ausencias en el período",
    type: "number",
    required: false,
  },
  {
    key: "escalationLevel",
    label: "Nivel de Escalación",
    description: "Nivel de severidad del mensaje (1-4)",
    type: "number",
    required: false,
  },
]

/**
 * Plantillas predeterminadas del sistema
 */
const DEFAULT_TEMPLATES: Omit<MessageTemplate, "id">[] = [
  {
    name: "Tardanza - Recordatorio Amable",
    description: "Mensaje suave para tardanzas ocasionales",
    category: "tardanza",
    subject: "Tardanza - {studentName}",
    content: `Estimado representante,

Le informamos que el estudiante {studentName} llegó tarde a su clase de {className} el día {date} a las {time}.

Agradecemos su colaboración para asegurar la puntualidad en futuras clases, ya que esto ayuda al mejor aprovechamiento de las actividades musicales.

Saludos cordiales,
{academyName}`,
    variables: ["studentName", "className", "date", "time", "academyName"].map(
      (key) => GLOBAL_VARIABLES.find((v) => v.key === key)!
    ),
    isActive: true,
    isSystem: true,
    usage: {totalSent: 0, successRate: 0},
  },
  {
    name: "Ausencia Justificada - Recordatorio",
    description: "Mensaje para ausencias con justificación",
    category: "ausencia_justificada",
    subject: "Ausencia Justificada - {studentName}",
    content: `Estimado representante,

Hemos registrado la ausencia justificada del estudiante {studentName} para la clase de {className} del {date}.

Lamentamos que no pudiera acompañarnos en esta ocasión. Le recordamos que su próxima actividad será el {nextClassDate}.

¡Esperamos contar con su valiosa presencia en la próxima clase! 🎵

Atentamente,
{academyName}`,
    variables: ["studentName", "className", "date", "nextClassDate", "academyName"].map(
      (key) => GLOBAL_VARIABLES.find((v) => v.key === key)!
    ),
    isActive: true,
    isSystem: true,
    usage: {totalSent: 0, successRate: 0},
  },
  {
    name: "Inasistencia Nivel 1 - Primera Ausencia",
    description: "Mensaje suave para primera ausencia semanal",
    category: "inasistencia",
    escalationLevel: 1,
    subject: "Ausencia - {studentName}",
    content: `Estimado representante,

Notamos la ausencia del estudiante {studentName} a su clase de {className} el día {date}.

Sabemos que pueden surgir eventualidades, pero si hay alguna situación particular, por favor comuníquela a la administración.

La participación regular es importante para el desarrollo musical de {studentFirstName}. ¡Le esperamos en su próxima clase! 🎵

Cordialmente,
{academyName}
📞 {contactPhone}`,
    variables: [
      "studentName",
      "studentFirstName",
      "className",
      "date",
      "academyName",
      "contactPhone",
    ].map((key) => GLOBAL_VARIABLES.find((v) => v.key === key)!),
    isActive: true,
    isSystem: true,
    usage: {totalSent: 0, successRate: 0},
  },
  {
    name: "Inasistencia Nivel 2 - Segunda Ausencia",
    description: "Mensaje más firme para segunda ausencia",
    category: "inasistencia",
    escalationLevel: 2,
    subject: "IMPORTANTE: Segunda Ausencia - {studentName}",
    content: `Estimado representante,

Hemos registrado la SEGUNDA ausencia injustificada del estudiante {studentName} esta semana ({absenceCount} ausencias totales).

Le recordamos que la asistencia regular y la disciplina son fundamentales para el progreso musical y el aprovechamiento de las clases en {academyName}.

Es importante que se comunique con la administración para informar sobre cualquier situación que esté afectando la asistencia.

La constancia es clave en el aprendizaje musical. 📚🎵

Esperamos su pronta comunicación,
{academyName}
📞 {contactPhone}`,
    variables: ["studentName", "absenceCount", "academyName", "contactPhone"].map(
      (key) => GLOBAL_VARIABLES.find((v) => v.key === key)!
    ),
    isActive: true,
    isSystem: true,
    usage: {totalSent: 0, successRate: 0},
  },
  {
    name: "Inasistencia Nivel 3 - Solicitud de Explicación",
    description: "Mensaje serio solicitando explicación",
    category: "inasistencia",
    escalationLevel: 3,
    subject: "URGENTE: Tercera Ausencia - {studentName}",
    content: `IMPORTANTE - TERCERA AUSENCIA INJUSTIFICADA

Estimado representante,

El estudiante {studentName} ha registrado su TERCERA ausencia injustificada esta semana ({absenceCount} ausencias totales).

Esta situación es preocupante y está afectando significativamente el progreso académico musical del estudiante.

SOLICITAMOS que el representante se comunique con la dirección de la academia EN LAS PRÓXIMAS 24 HORAS para proporcionar una explicación sobre las razones de estas inasistencias.

Es necesario evaluar la continuidad en el programa.

⚠️ ACCIÓN REQUERIDA: Contactar inmediatamente
📞 {contactPhone}
🕐 Horario: Lunes a Viernes 8:00 AM - 5:00 PM

{academyName} - Dirección Académica`,
    variables: ["studentName", "absenceCount", "contactPhone", "academyName"].map(
      (key) => GLOBAL_VARIABLES.find((v) => v.key === key)!
    ),
    isActive: true,
    isSystem: true,
    usage: {totalSent: 0, successRate: 0},
  },
  {
    name: "Inasistencia Nivel 4 - Citación Obligatoria",
    description: "Mensaje crítico para casos extremos",
    category: "inasistencia",
    escalationLevel: 4,
    subject: "🚨 CITACIÓN OBLIGATORIA - {studentName}",
    content: `🚨 CASO EXTREMO - CITACIÓN OBLIGATORIA 🚨

El estudiante {studentName} ha registrado CUATRO O MÁS ausencias injustificadas esta semana ({absenceCount} ausencias totales).

Esta es una situación CRÍTICA que requiere atención INMEDIATA.

SE REQUIERE la presencia OBLIGATORIA del representante en las oficinas de la sede para una reunión con la dirección académica.

📋 TEMAS A TRATAR:
• Explicación detallada de las ausencias
• Evaluación de continuidad en el programa  
• Posibles medidas disciplinarias
• Plan de recuperación académica

🚨 URGENTE: Contactar INMEDIATAMENTE para agendar cita
La situación académica del estudiante está en RIESGO.

📍 {academyName} - Dirección Académica
📞 {contactPhone}
⏰ Horario: Lunes a Viernes 8:00 AM - 5:00 PM

Esta comunicación requiere respuesta inmediata.`,
    variables: ["studentName", "absenceCount", "academyName", "contactPhone"].map(
      (key) => GLOBAL_VARIABLES.find((v) => v.key === key)!
    ),
    isActive: true,
    isSystem: true,
    usage: {totalSent: 0, successRate: 0},
  },
]

/**
 * Clase principal para gestión de plantillas
 */
export class TemplateManager {
  private cache: Map<string, MessageTemplate> = new Map()
  private cacheExpiry = 5 * 60 * 1000 // 5 minutos

  /**
   * Obtiene todas las plantillas desde Firebase
   */
  async getAllTemplates(): Promise<MessageTemplate[]> {
    try {
      const templatesQuery = query(
        collection(db, TEMPLATES_COLLECTION),
        orderBy("category"),
        orderBy("escalationLevel"),
        orderBy("name")
      )

      const snapshot = await getDocs(templatesQuery)
      const templates: MessageTemplate[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        templates.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          usage: {
            totalSent: data.usage?.totalSent || 0,
            lastUsed: data.usage?.lastUsed?.toDate(),
            successRate: data.usage?.successRate || 0,
          },
        } as MessageTemplate)
      })

      // Actualizar cache
      templates.forEach((template) => {
        if (template.id) {
          this.cache.set(template.id, template)
        }
      })

      console.log(`📄 Template Manager - Cargadas ${templates.length} plantillas`)
      return templates
    } catch (error) {
      console.error("Error obteniendo plantillas:", error)
      return []
    }
  }

  /**
   * Obtiene plantillas por categoría
   */
  async getTemplatesByCategory(category: string): Promise<MessageTemplate[]> {
    try {
      const templatesQuery = query(
        collection(db, TEMPLATES_COLLECTION),
        where("category", "==", category),
        where("isActive", "==", true),
        orderBy("escalationLevel"),
        orderBy("name")
      )

      const snapshot = await getDocs(templatesQuery)
      const templates: MessageTemplate[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        templates.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as MessageTemplate)
      })

      return templates
    } catch (error) {
      console.error(`Error obteniendo plantillas de categoría ${category}:`, error)
      return []
    }
  }

  /**
   * Obtiene una plantilla específica
   */
  async getTemplate(templateId: string): Promise<MessageTemplate | null> {
    try {
      // Verificar cache primero
      if (this.cache.has(templateId)) {
        return this.cache.get(templateId)!
      }

      const docRef = doc(db, TEMPLATES_COLLECTION, templateId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        const template: MessageTemplate = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as MessageTemplate

        // Actualizar cache
        this.cache.set(templateId, template)
        return template
      }

      return null
    } catch (error) {
      console.error(`Error obteniendo plantilla ${templateId}:`, error)
      return null
    }
  }

  /**
   * Crea una nueva plantilla
   */
  async createTemplate(
    template: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        usage: {
          totalSent: 0,
          successRate: 0,
        },
      })

      console.log(`✅ Template Manager - Plantilla creada: ${docRef.id}`)
      return docRef.id
    } catch (error) {
      console.error("Error creando plantilla:", error)
      return null
    }
  }

  /**
   * Actualiza una plantilla existente
   */
  async updateTemplate(templateId: string, updates: Partial<MessageTemplate>): Promise<boolean> {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, templateId)

      // No permitir actualizar plantillas del sistema
      const existing = await this.getTemplate(templateId)
      if (existing?.isSystem) {
        console.warn("No se pueden modificar plantillas del sistema")
        return false
      }

      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })

      // Limpiar cache
      this.cache.delete(templateId)

      console.log(`✅ Template Manager - Plantilla actualizada: ${templateId}`)
      return true
    } catch (error) {
      console.error(`Error actualizando plantilla ${templateId}:`, error)
      return false
    }
  }

  /**
   * Elimina una plantilla (solo plantillas personalizadas)
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const template = await this.getTemplate(templateId)
      if (template?.isSystem) {
        console.warn("No se pueden eliminar plantillas del sistema")
        return false
      }

      const docRef = doc(db, TEMPLATES_COLLECTION, templateId)
      await deleteDoc(docRef)

      // Limpiar cache
      this.cache.delete(templateId)

      console.log(`✅ Template Manager - Plantilla eliminada: ${templateId}`)
      return true
    } catch (error) {
      console.error(`Error eliminando plantilla ${templateId}:`, error)
      return false
    }
  }

  /**
   * Duplica una plantilla existente
   */
  async duplicateTemplate(templateId: string, newName?: string): Promise<string | null> {
    try {
      const original = await this.getTemplate(templateId)
      if (!original) {
        throw new Error("Plantilla original no encontrada")
      }

      const duplicate: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt"> = {
        ...original,
        name: newName || `${original.name} (Copia)`,
        isSystem: false, // Las copias nunca son del sistema
        usage: {
          totalSent: 0,
          successRate: 0,
        },
      }

      return await this.createTemplate(duplicate)
    } catch (error) {
      console.error(`Error duplicando plantilla ${templateId}:`, error)
      return null
    }
  }

  /**
   * Inicializa plantillas por defecto si no existen
   */
  async initializeDefaultTemplates(): Promise<void> {
    try {
      const existing = await this.getAllTemplates()

      if (existing.length === 0) {
        console.log("📥 Template Manager - Inicializando plantillas por defecto...")

        for (const template of DEFAULT_TEMPLATES) {
          await this.createTemplate(template)
        }

        console.log(
          `✅ Template Manager - ${DEFAULT_TEMPLATES.length} plantillas por defecto creadas`
        )
      } else {
        console.log(`📄 Template Manager - ${existing.length} plantillas existentes encontradas`)
      }
    } catch (error) {
      console.error("Error inicializando plantillas por defecto:", error)
    }
  }

  /**
   * Actualiza estadísticas de uso de una plantilla
   */
  async updateUsageStats(templateId: string, sent: boolean): Promise<void> {
    try {
      const template = await this.getTemplate(templateId)
      if (!template) return

      const newStats = {
        totalSent: template.usage.totalSent + 1,
        lastUsed: new Date(),
        successRate: sent
          ? (template.usage.successRate * template.usage.totalSent + 1) /
            (template.usage.totalSent + 1)
          : (template.usage.successRate * template.usage.totalSent) /
            (template.usage.totalSent + 1),
      }

      await this.updateTemplate(templateId, {usage: newStats})
    } catch (error) {
      console.error(`Error actualizando estadísticas de plantilla ${templateId}:`, error)
    }
  }
}

// Instancia global
export const templateManager = new TemplateManager()

export default {
  templateManager,
  GLOBAL_VARIABLES,
  DEFAULT_TEMPLATES,
}
