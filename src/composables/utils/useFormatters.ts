/**
 * 📝 UTILIDADES DE FORMATEO
 * Funciones para formatear fechas, números y texto
 */

import {computed} from "vue"

export function useFormatters() {
  // ==================== FORMATEO DE FECHAS ====================

  function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = new Date(date)

    if (isNaN(dateObj.getTime())) {
      return "Fecha inválida"
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }

    return dateObj.toLocaleDateString("es-ES", {...defaultOptions, ...options})
  }

  function formatTime(date: Date | string | number): string {
    const dateObj = new Date(date)

    if (isNaN(dateObj.getTime())) {
      return "Hora inválida"
    }

    return dateObj.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatDateTime(date: Date | string | number): string {
    const dateObj = new Date(date)

    if (isNaN(dateObj.getTime())) {
      return "Fecha/hora inválida"
    }

    return dateObj.toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatRelativeTime(date: Date | string | number): string {
    const dateObj = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()

    if (isNaN(dateObj.getTime())) {
      return "Fecha inválida"
    }

    // Menos de 1 minuto
    if (diffMs < 60000) {
      return "Hace un momento"
    }

    // Menos de 1 hora
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000)
      return `Hace ${minutes} minuto${minutes !== 1 ? "s" : ""}`
    }

    // Menos de 1 día
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000)
      return `Hace ${hours} hora${hours !== 1 ? "s" : ""}`
    }

    // Menos de 1 semana
    if (diffMs < 604800000) {
      const days = Math.floor(diffMs / 86400000)
      return `Hace ${days} día${days !== 1 ? "s" : ""}`
    }

    // Más de 1 semana, mostrar fecha
    return formatDate(dateObj)
  }

  // ==================== FORMATEO DE NÚMEROS ====================

  function formatNumber(number: number, decimals = 0): string {
    return number.toLocaleString("es-ES", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  function formatCurrency(amount: number, currency = "EUR"): string {
    return amount.toLocaleString("es-ES", {
      style: "currency",
      currency,
    })
  }

  function formatPercentage(value: number, decimals = 1): string {
    return (
      (value * 100).toLocaleString("es-ES", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + "%"
    )
  }

  // ==================== FORMATEO DE TEXTO ====================

  function capitalizeFirst(text: string): string {
    if (!text) return ""
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  function capitalizeWords(text: string): string {
    if (!text) return ""
    return text
      .split(" ")
      .map((word) => capitalizeFirst(word))
      .join(" ")
  }

  function truncateText(text: string, maxLength: number, suffix = "..."): string {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength - suffix.length) + suffix
  }

  function formatPhone(phone: string): string {
    if (!phone) return ""

    // Remover caracteres no numéricos
    const cleaned = phone.replace(/\D/g, "")

    // Formato español: +34 XXX XXX XXX
    if (cleaned.length === 9) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`
    }

    // Con código de país
    if (cleaned.length === 11 && cleaned.startsWith("34")) {
      return `+34 ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`
    }

    return phone // Devolver original si no coincide con formato esperado
  }

  function formatEmail(email: string): string {
    if (!email) return ""
    return email.toLowerCase().trim()
  }

  // ==================== FORMATEO DE DATOS ESPECÍFICOS ====================

  function formatStudentName(firstName: string, lastName: string): string {
    const first = capitalizeWords(firstName || "")
    const last = capitalizeWords(lastName || "")
    return `${first} ${last}`.trim()
  }

  function formatAttendanceStatus(status: "present" | "absent" | "late"): string {
    const statusMap = {
      present: "Presente",
      absent: "Ausente",
      late: "Tardanza",
    }
    return statusMap[status] || status
  }

  function formatClassType(type: string): string {
    const typeMap: Record<string, string> = {
      individual: "Individual",
      group: "Grupal",
      masterclass: "Clase Magistral",
      ensemble: "Ensemble",
      theory: "Teoría Musical",
    }
    return typeMap[type] || capitalizeWords(type)
  }

  function formatInstrument(instrument: string): string {
    const instrumentMap: Record<string, string> = {
      piano: "Piano",
      violin: "Violín",
      guitar: "Guitarra",
      drums: "Batería",
      voice: "Canto",
      flute: "Flauta",
      saxophone: "Saxofón",
      trumpet: "Trompeta",
      clarinet: "Clarinete",
      cello: "Violonchelo",
    }
    return instrumentMap[instrument.toLowerCase()] || capitalizeWords(instrument)
  }

  // ==================== FORMATEO DE ARCHIVOS ====================

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // ==================== VALIDACIONES DE FORMATO ====================

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  function isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+34|0034|34)?[6-9]\d{8}$/
    const cleaned = phone.replace(/\s+/g, "")
    return phoneRegex.test(cleaned)
  }

  function isValidDate(date: string): boolean {
    const dateObj = new Date(date)
    return !isNaN(dateObj.getTime())
  }

  // ==================== COMPUTED HELPERS ====================

  const currentDate = computed(() => formatDate(new Date()))
  const currentTime = computed(() => formatTime(new Date()))
  const currentDateTime = computed(() => formatDateTime(new Date()))

  // ==================== RETURN ====================

  return {
    // Fechas
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,

    // Números
    formatNumber,
    formatCurrency,
    formatPercentage,

    // Texto
    capitalizeFirst,
    capitalizeWords,
    truncateText,
    formatPhone,
    formatEmail,

    // Datos específicos
    formatStudentName,
    formatAttendanceStatus,
    formatClassType,
    formatInstrument,

    // Archivos
    formatFileSize,
    formatDuration,

    // Validaciones
    isValidEmail,
    isValidPhone,
    isValidDate,

    // Computed
    currentDate,
    currentTime,
    currentDateTime,
  }
}
