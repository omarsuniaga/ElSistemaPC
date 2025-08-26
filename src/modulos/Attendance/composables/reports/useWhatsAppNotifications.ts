/**
 * 📱 COMPOSABLE PARA NOTIFICACIONES WHATSAPP
 * Gestión profesional de notificaciones automatizadas a padres
 */

import { ref, reactive } from 'vue';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Types
import type { 
  StudentAbsenceInfo, 
  WhatsAppNotificationTemplate, 
  NotificationRecord 
} from '../../types/reports';

export function useWhatsAppNotifications() {
  // Estado reactivo
  const isSending = ref(false);
  const error = ref<string | null>(null);
  const sentNotifications = ref<NotificationRecord[]>([]);

  // Plantillas de mensajes predefinidas
  const messageTemplates: Record<string, WhatsAppNotificationTemplate> = {
    weekly_absence: {
      type: 'weekly_absence',
      template: `🏫 *Academia Musical*

Estimado(a) {parentName},

Le informamos que su representado *{studentName}* ha registrado *{absenceCount}* ausencia(s) durante la semana del {weekStart} al {weekEnd}.

📊 *Resumen de ausencias:*
• Esta semana: {weeklyAbsences}
• Total del período: {totalAbsences}
• Clases afectadas: {affectedClasses}

{justificationStatus}

Es importante mantener la regularidad en las clases para el óptimo desarrollo musical de {studentName}.

Si tiene alguna consulta, no dude en contactarnos.

Saludos cordiales,
*Equipo Académico*`,
      variables: ['parentName', 'studentName', 'absenceCount', 'weekStart', 'weekEnd', 'weeklyAbsences', 'totalAbsences', 'affectedClasses', 'justificationStatus']
    },

    urgent_absence: {
      type: 'urgent_absence',
      template: `🚨 *ATENCIÓN REQUERIDA - Academia Musical*

Estimado(a) {parentName},

Nos dirigimos a usted con carácter *URGENTE* respecto a las ausencias de *{studentName}*.

⚠️ *Situación actual:*
• {consecutiveAbsences} ausencias consecutivas
• {totalAbsences} ausencias en total este período
• Última asistencia: {lastAttendanceDate}

Es fundamental que {studentName} retome las clases lo antes posible para no afectar su progreso musical.

Por favor, contáctenos para coordinar su reincorporación o justificar las ausencias.

*Equipo Académico*
📞 [Número de contacto]`,
      variables: ['parentName', 'studentName', 'consecutiveAbsences', 'totalAbsences', 'lastAttendanceDate']
    },

    consecutive_absence: {
      type: 'consecutive_absence',
      template: `📋 *Academia Musical - Seguimiento*

Hola {parentName},

Hemos notado que *{studentName}* ha faltado {consecutiveAbsences} clases consecutivas.

📅 *Última asistencia:* {lastAttendanceDate}
🎵 *Clases afectadas:* {affectedClasses}

¿Necesita apoyo para que {studentName} retome las clases?

Estamos aquí para ayudar 💪

*Equipo Académico*`,
      variables: ['parentName', 'studentName', 'consecutiveAbsences', 'lastAttendanceDate', 'affectedClasses']
    },

    monthly_summary: {
      type: 'monthly_summary',
      template: `📊 *Resumen Mensual - Academia Musical*

Estimado(a) {parentName},

Compartimos el resumen de asistencia de *{studentName}* del mes de {monthName}:

✅ *Asistencias:* {attendances}
❌ *Ausencias:* {totalAbsences}
📝 *Justificadas:* {justifiedAbsences}
📈 *Porcentaje de asistencia:* {attendancePercentage}%

{monthlyFeedback}

¡Sigamos trabajando juntos por el crecimiento musical de {studentName}!

*Equipo Académico*`,
      variables: ['parentName', 'studentName', 'monthName', 'attendances', 'totalAbsences', 'justifiedAbsences', 'attendancePercentage', 'monthlyFeedback']
    }
  };

  /**
   * 📤 Enviar notificación individual
   */
  const sendIndividualNotification = async (
    student: StudentAbsenceInfo, 
    templateType: keyof typeof messageTemplates,
    additionalData?: Record<string, any>
  ): Promise<NotificationRecord> => {
    isLoading.value = true;
    error.value = null;

    try {
      const template = messageTemplates[templateType];
      if (!template) {
        throw new Error(`Plantilla de mensaje '${templateType}' no encontrada`);
      }

      // Generar mensaje personalizado
      const message = generatePersonalizedMessage(template, student, additionalData);

      // Simular envío de WhatsApp (aquí iría la integración real)
      const notificationRecord: NotificationRecord = {
        id: `notification_${Date.now()}_${student.studentId}`,
        type: 'whatsapp',
        sentAt: new Date(),
        content: message,
        status: 'sent',
        weekReference: additionalData?.weekReference || format(new Date(), 'yyyy-\'W\'II'),
        absenceCount: student.weeklyAbsences
      };

      // Registrar en historial
      sentNotifications.value.push(notificationRecord);
      
      // Actualizar el estudiante con la notificación enviada
      student.notificationsSent.push(notificationRecord);

      console.log('📱 Notificación enviada:', {
        student: student.studentName,
        phone: student.parentPhone,
        template: templateType,
        message: message.substring(0, 100) + '...'
      });

      return notificationRecord;

    } catch (err: any) {
      error.value = `Error enviando notificación: ${err.message}`;
      console.error('❌ Error en sendIndividualNotification:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 📤 Enviar notificaciones masivas
   */
  const sendBulkNotifications = async (
    students: StudentAbsenceInfo[],
    templateType: keyof typeof messageTemplates,
    additionalData?: Record<string, any>
  ): Promise<NotificationRecord[]> => {
    isLoading.value = true;
    error.value = null;

    try {
      const results: NotificationRecord[] = [];
      const batchSize = 5; // Enviar en lotes para evitar spam

      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        
        const batchPromises = batch.map(student => 
          sendIndividualNotification(student, templateType, additionalData)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Error enviando notificación a ${batch[index].studentName}:`, result.reason);
          }
        });

        // Pausa entre lotes para evitar saturar el servicio
        if (i + batchSize < students.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`📱 Notificaciones masivas enviadas: ${results.length}/${students.length}`);
      return results;

    } catch (err: any) {
      error.value = `Error en envío masivo: ${err.message}`;
      console.error('❌ Error en sendBulkNotifications:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 💬 Generar mensaje personalizado
   */
  const generatePersonalizedMessage = (
    template: WhatsAppNotificationTemplate,
    student: StudentAbsenceInfo,
    additionalData?: Record<string, any>
  ): string => {
    let message = template.template;

    // Datos del estudiante
    const replacements: Record<string, string> = {
      parentName: student.parentName || 'Estimado Representante',
      studentName: student.studentName,
      absenceCount: student.weeklyAbsences.toString(),
      weeklyAbsences: student.weeklyAbsences.toString(),
      totalAbsences: student.totalAbsences.toString(),
      consecutiveAbsences: student.consecutiveAbsences.toString(),
      lastAttendanceDate: format(parseISO(student.lastAttendanceDate), 'dd/MM/yyyy', { locale: es }),
      affectedClasses: student.absencesByClass.map(c => c.className).join(', ') || 'Múltiples clases',
      justifiedAbsences: student.justifiedAbsences.toString(),
      unjustifiedAbsences: student.unjustifiedAbsences.toString(),
      ...additionalData
    };

    // Estado de justificaciones
    if (student.unjustifiedAbsences > 0) {
      replacements.justificationStatus = `⚠️ ${student.unjustifiedAbsences} ausencia(s) sin justificar. Por favor, proporcione justificación.`;
    } else {
      replacements.justificationStatus = '✅ Todas las ausencias están justificadas.';
    }

    // Fechas de semana (si están disponibles)
    if (additionalData?.weekStart && additionalData?.weekEnd) {
      replacements.weekStart = format(parseISO(additionalData.weekStart), 'dd/MM', { locale: es });
      replacements.weekEnd = format(parseISO(additionalData.weekEnd), 'dd/MM', { locale: es });
    }

    // Feedback mensual
    if (template.type === 'monthly_summary') {
      const attendancePercentage = additionalData?.attendancePercentage || 0;
      if (attendancePercentage >= 90) {
        replacements.monthlyFeedback = '🌟 ¡Excelente asistencia! Sigan así.';
      } else if (attendancePercentage >= 75) {
        replacements.monthlyFeedback = '👍 Buena asistencia, pero podemos mejorar.';
      } else {
        replacements.monthlyFeedback = '⚠️ Es importante mejorar la asistencia para un mejor aprendizaje.';
      }
    }

    // Reemplazar variables en el mensaje
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      message = message.replace(regex, value);
    });

    return message;
  };

  /**
   * 📋 Obtener historial de notificaciones
   */
  const getNotificationHistory = (studentId?: string, weekReference?: string) => {
    let filtered = sentNotifications.value;

    if (studentId) {
      // Filtrar por estudiante (necesitaríamos agregar studentId al NotificationRecord)
    }

    if (weekReference) {
      filtered = filtered.filter(n => n.weekReference === weekReference);
    }

    return filtered.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  };

  /**
   * 📊 Estadísticas de notificaciones
   */
  const getNotificationStats = () => {
    const total = sentNotifications.value.length;
    const sent = sentNotifications.value.filter(n => n.status === 'sent').length;
    const delivered = sentNotifications.value.filter(n => n.status === 'delivered').length;
    const failed = sentNotifications.value.filter(n => n.status === 'failed').length;

    return {
      total,
      sent,
      delivered,
      failed,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0
    };
  };

  /**
   * 🔄 Reenviar notificación fallida
   */
  const resendFailedNotification = async (notificationId: string) => {
    const notification = sentNotifications.value.find(n => n.id === notificationId);
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    // Lógica para reenviar
    notification.status = 'sent';
    notification.sentAt = new Date();
    
    console.log('📱 Notificación reenviada:', notificationId);
  };

  return {
    // Estado
    isLoading,
    error,
    sentNotifications,
    messageTemplates,

    // Funciones principales
    sendIndividualNotification,
    sendBulkNotifications,
    generatePersonalizedMessage,

    // Utilidades
    getNotificationHistory,
    getNotificationStats,
    resendFailedNotification
  };
}