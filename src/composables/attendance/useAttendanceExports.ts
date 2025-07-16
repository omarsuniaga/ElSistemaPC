/**
 * Composable para gestionar exportaciones e informes
 * Extrae la lógica de PDF, email y reportes del AttendanceView.vue
 */
import { ref } from 'vue';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance';
import { useStudentsStore } from '@/modulos/Students/store/students';
import { generateAttendancePDF } from '@/utils/pdf/pdf-export';
import { sendToMake } from '@/utils/webhook';
import type { AttendanceFiltersType } from '@/modulos/Attendance/types/attendance';
import type { useAttendanceState } from './useAttendanceState';

export function useAttendanceExports(state: ReturnType<typeof useAttendanceState>) {
  const authStore = useAuthStore();
  const configStore = useConfigStore();
  const attendanceStore = useAttendanceStore();
  const studentsStore = useStudentsStore();

  // ============= LOCAL STATE =============
  const isExporting = ref(false);
  const exportMessage = ref('');

  // ============= COMPUTED PROPERTIES =============
  const selectedClassName = ref('');

  // ============= PDF EXPORT =============
  const exportCurrentClassAttendanceToPDF = async () => {
    try {
      if (!state.selectedClass.value || !state.selectedDate.value) {
        state.showToast('Seleccione una clase y fecha primero', 'error');
        return;
      }

      isExporting.value = true;
      exportMessage.value = 'Generando PDF...';

      const students = studentsStore.getStudentsByClass(state.selectedClass.value);
      const teacherName = authStore.user?.email || 'Profesor';
      const justifications = attendanceStore.getJustificationsByStudent || {};

      await generateAttendancePDF(
        students,
        attendanceStore.attendanceRecords,
        attendanceStore.getObservations,
        selectedClassName.value,
        teacherName,
        state.selectedDate.value,
        justifications,
      );

      state.showToast('PDF generado correctamente', 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      state.showToast('Error al generar PDF', 'error');
    } finally {
      isExporting.value = false;
      exportMessage.value = '';
    }
  };

  // ============= HTML GENERATION =============
  const generateAttendanceHTML = (
    students: any[],
    records: any,
    observations: string,
    className: string,
    date: string,
  ) => {
    const presentCount = Object.values(records).filter((status) => status === 'Presente').length;
    const lateCount = Object.values(records).filter((status) => status === 'Tardanza').length;
    const justifiedCount = Object.values(records).filter(
      (status) => status === 'Justificado',
    ).length;
    const absentCount = Object.values(records).filter((status) => status === 'Ausente').length;

    const studentRows = students
      .map((student, index) => {
        const status = records[student.id] || 'No registrado';
        const statusClass = status.toLowerCase().replace(' ', '-');
        return `
        <tr>
          <td>${index + 1}</td>
          <td>${student.nombre} ${student.apellido}</td>
          <td class="${statusClass}">${status}</td>
          <td>${status === 'Justificado' ? 'Sí' : 'No'}</td>
        </tr>
      `;
      })
      .join('');

    const formattedDate = format(parseISO(date), 'd \'de\' MMMM yyyy', { locale: es });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Asistencia - ${className}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin-bottom: 10px; }
          .header h2 { color: #64748b; margin: 5px 0; }
          .summary-container { display: flex; justify-content: space-around; margin: 20px 0; }
          .summary-box { text-align: center; padding: 15px; border-radius: 8px; background-color: #f8fafc; }
          .summary-box h3 { margin: 0 0 10px 0; color: #374151; }
          .presente { color: #16a34a; font-size: 24px; font-weight: bold; }
          .tarde { color: #d97706; font-size: 24px; font-weight: bold; }
          .justificado { color: #2563eb; font-size: 24px; font-weight: bold; }
          .ausente { color: #dc2626; font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .observations { background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .footer { text-align: center; font-size: 14px; color: #6b7280; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Asistencia</h1>
          <h2>Clase: ${className}</h2>
          <h2>Fecha: ${formattedDate}</h2>
          <h2>Maestro: ${authStore.user?.email || 'Profesor'}</h2>
        </div>
        
        <div class="summary-container">
          <div class="summary-box">
            <h3>Presentes</h3>
            <p class="presente">${presentCount}</p>
          </div>
          <div class="summary-box">
            <h3>Tardes</h3>
            <p class="tarde">${lateCount}</p>
          </div>
          <div class="summary-box">
            <h3>Justificados</h3>
            <p class="justificado">${justifiedCount}</p>
          </div>
          <div class="summary-box">
            <h3>Ausentes</h3>
            <p class="ausente">${absentCount}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Alumno</th>
              <th>Estado</th>
              <th>Justificación</th>
            </tr>
          </thead>
          <tbody>
            ${studentRows}
          </tbody>
        </table>

        <div class="observations">
          <h3>Observaciones del Maestro:</h3>
          <p>${observations}</p>
        </div>
        
        <div class="footer">
          Este reporte fue generado automáticamente desde El Sistema PC - ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;
  };

  // ============= EMAIL EXPORT =============
  const sendAttendanceEmail = async () => {
    if (!state.selectedClass.value || !state.selectedDate.value) {
      state.showToast('Seleccione una clase y fecha para enviar el correo.', 'error');
      return;
    }

    if (!authStore.user || !authStore.user.email) {
      state.showToast('No se pudo obtener el correo del usuario para enviar el reporte.', 'error');
      return;
    }

    if (!state.recipientEmail.value) {
      state.showToast('Por favor ingrese un correo electrónico de destinatario', 'error');
      return;
    }

    isExporting.value = true;
    exportMessage.value = 'Enviando correo...';

    try {
      const students = studentsStore.getStudentsByClass(state.selectedClass.value);
      const records = attendanceStore.attendanceRecords;
      const rawObservations =
        attendanceStore.currentAttendanceDoc?.data.observación || 'Sin observaciones.';
      const observations = Array.isArray(rawObservations)
        ? rawObservations.join('\n')
        : rawObservations;
      const className = selectedClassName.value;
      const date = state.selectedDate.value;

      // Generate HTML content for email
      const htmlContent = generateAttendanceHTML(students, records, observations, className, date);

      // Use webhook URL from Firestore configuration
      const makeWebhookUrl =
        configStore.attendanceWebhookUrl ||
        'https://hook.us2.make.com/t2ockuc1vne58yqc68rjqp94njv1i3uo';

      // Prepare formatted students array for Google Sheets
      const formattedStudents = students.map((student, index) => {
        const attendanceStatus = records[student.id] || 'No registrado';
        let justificationReason = '';

        if (
          attendanceStatus === 'Justificado' &&
          attendanceStore.currentAttendanceDoc?.data?.justificacion
        ) {
          const justification = attendanceStore.currentAttendanceDoc.data.justificacion.find(
            (j) => j.id === student.id,
          );
          if (justification && justification.reason) {
            justificationReason = `Justificación: ${justification.reason}`;
          }
        }

        return {
          Num: index + 1,
          Nombre: student.nombre || '',
          Apellido: student.apellido || '',
          Estado: attendanceStatus,
          Observaciones: attendanceStatus === 'Justificado' ? justificationReason : observations,
          Maestro: authStore.user?.email || 'Profesor Desconocido',
          Fecha: format(parseISO(date), 'yyyy-MM-dd'),
          Clase: className,
        };
      });

      // Prepare payload for Make.com
      const makePayload = {
        subject: `Reporte de Asistencia - ${className} - ${format(parseISO(date), 'yyyy-MM-dd')}`,
        format: 'email',
        type: 'attendance_report',
        action: 'send_attendance_email',
        htmlBody: htmlContent,
        date: state.selectedDate.value,
        class: state.selectedClass.value,
        className: selectedClassName.value,
        students: studentsStore.getStudentsByClass(state.selectedClass.value),
        formattedStudents,
        attendanceRecords: attendanceStore.attendanceRecords,
        observations: attendanceStore.currentAttendanceDoc?.data.observación,
        teacherId: authStore.user?.uid,
        teacherName: authStore.user?.email || 'Profesor Desconocido',
        teacherEmail: authStore.user?.email,
        recipient: state.recipientEmail.value,
        summary: {
          total: students.length,
          presentes: Object.values(records).filter((status) => status === 'Presente').length,
          ausentes: Object.values(records).filter((status) => status === 'Ausente').length,
          tardanza: Object.values(records).filter((status) => status === 'Tardanza').length,
          justificados: Object.values(records).filter((status) => status === 'Justificado').length,
        },
      };

      // Send data to Make.com
      await sendToMake(makeWebhookUrl, makePayload);

      state.showToast(
        'Datos enviados a Make.com correctamente. Se procesará el envío del correo.',
        'success',
      );
    } catch (err: any) {
      console.error('Error enviando datos a Make.com:', err);
      state.showToast(
        `Error al enviar datos a Make.com: ${err.message || 'Error desconocido'}`,
        'error',
      );
    } finally {
      isExporting.value = false;
      exportMessage.value = '';
    }
  };

  // ============= REPORT GENERATION =============
  const handleGenerateReport = (filters: AttendanceFiltersType) => {
    state.reportFilters.value = filters;
    console.log('Generating report with filters:', filters);

    // Here you would implement the actual report generation logic
    // This is a placeholder for the report generation functionality
    state.showToast('Generando reporte con filtros aplicados...', 'success');
  };

  // ============= MODAL HANDLERS =============
  const toggleAnalytics = () => {
    state.showAnalytics.value = !state.showAnalytics.value;
  };

  const toggleTrends = () => {
    state.showTrends.value = !state.showTrends.value;
  };

  const openReportModal = () => {
    state.showReportModal.value = true;
  };

  const openExportModal = () => {
    state.showExportModal.value = true;
  };

  const handleOpenExport = (value: boolean) => {
    state.showExportModal.value = value;
  };

  // ============= UTILITY FUNCTIONS =============
  const setSelectedClassName = (className: string) => {
    selectedClassName.value = className;
  };

  return {
    // Local state
    isExporting,
    exportMessage,
    selectedClassName,

    // PDF export
    exportCurrentClassAttendanceToPDF,

    // Email export
    sendAttendanceEmail,
    generateAttendanceHTML,

    // Report generation
    handleGenerateReport,

    // Modal handlers
    toggleAnalytics,
    toggleTrends,
    openReportModal,
    openExportModal,
    handleOpenExport,

    // Utilities
    setSelectedClassName,
  };
}
