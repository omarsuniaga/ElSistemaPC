// Exportar la implementación avanzada de WhatsApp con mensajería
export {whatsappApi} from "./whatsappMessaging"

// Exportar funciones de keep-alive para mantener el servicio activo 24/7
export {keepWhatsAppAlive, keepAliveStatus} from "./keepAlive"

// Exportar funciones de resumen de asistencia
export {getStudentAttendanceSummary} from "./attendanceSummary"

// Exportar webhook para respuestas de WhatsApp
export {whatsAppReplyWebhook} from "./whatsappWebhook"

// Exportar función de verificación de salud de notificaciones
export {checkNotificationFunctionsHealth} from "./notificationHealthCheck"
