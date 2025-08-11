// src/modulos/Attendance/composables/useAttendanceExportLogic.ts
import { ref } from 'vue';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

import AttendanceExportService from '../services/exportService'; // Assuming this path is correct

import type { AttendanceStatus } from '../types/attendance';

// Definimos los tipos de estado de asistencia que usa el componente hijo
type AttendanceGridStatus = 'pending' | 'absent' | 'present' | 'late' | 'justified';

interface StudentForExport {
  id: string;
  name: string;
  status: AttendanceGridStatus;
  justification?: string;
}

interface ExportData {
  date: string;
  className: string;
  students: StudentForExport[];
  observation: string;
}

export function useAttendanceExportLogic() {
  const toast = useToast();
  const showExportModal = ref(false);

  const closeExportModal = () => {
    showExportModal.value = false;
  };

  // Función para mapear estados de la UI a códigos de exportación
  const mapStatusToExport = (status: string): AttendanceGridStatus => {
    const statusMap: Record<string, AttendanceGridStatus> = {
      'Presente': 'present',
      'Ausente': 'absent',
      'Tardanza': 'late',
      'Justificado': 'justified',
      'Pendiente': 'pending'
    };
    return statusMap[status] || 'pending';
  };

  // Función común para preparar los datos de exportación
  const exportAttendanceData = async (
    formatType: 'pdf' | 'excel' | 'html' | 'whatsapp',
    selectedDate: string,
    classInfo: any,
    students: any[], // Assuming Student[] type from AttendanceFormView
    classObservations: string,
  ) => {
    try {
      // Preparar datos para exportación
      const exportData: ExportData = {
        date: selectedDate, // Usar la fecha original sin formatear para que el servicio la procese correctamente
        className: classInfo?.name || '',
        students: students.map(s => ({
          id: s.id,
          name: s.name || `${s.nombre || ''} ${s.apellido || ''}`.trim(),
          status: mapStatusToExport(s.status),
          justification: s.justification
        })),
        observation: classObservations
      };

      // Calcular estadísticas para incluirlas en la exportación
      const stats = {
        total: students.length,
        presente: students.filter(s => s.status === 'Presente').length,
        ausente: students.filter(s => s.status === 'Ausente').length,
        tardanza: students.filter(s => s.status === 'Tardanza').length,
        justificado: students.filter(s => s.status === 'Justificado').length,
        pendiente: students.filter(s => s.status === 'Pendiente').length,
      };

      // Añadir estadísticas al objeto de observación
      const statsText = `\n\nRESUMEN:\n- Total estudiantes: ${stats.total}\n- Presentes: ${stats.presente} (${Math.round((stats.presente/stats.total || 0)*100)}%)\n- Ausentes: ${stats.ausente} (${Math.round((stats.ausente/stats.total || 0)*100)}%)\n- Tardanzas: ${stats.tardanza} (${Math.round((stats.tardanza/stats.total || 0)*100)}%)\n- Justificados: ${stats.justificado} (${Math.round((stats.justificado/stats.total || 0)*100)}%)\n`;
      
      exportData.observation = (exportData.observation || '') + statsText;

      // Exportar según el formato seleccionado
      switch (formatType) {
        case 'pdf':
          await AttendanceExportService.exportToPDF(exportData);
          toast.success('PDF generado con éxito');
          break;
        case 'excel':
          await AttendanceExportService.exportToExcel(exportData);
          toast.success('Excel generado con éxito');
          break;
        case 'html':
          AttendanceExportService.exportToHTML(exportData);
          toast.success('HTML generado con éxito');
          break;
        case 'whatsapp':
          AttendanceExportService.shareToWhatsApp(exportData);
          toast.success('Mensaje de WhatsApp creado');
          break;
      }
      
      closeExportModal();
      
    } catch (error: any) {
      console.error(`Error al exportar asistencia como ${formatType}:`, error);
      toast.error(`Error al exportar: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleExport = async (
    formatType: 'pdf' | 'excel' | 'html' | 'whatsapp',
    selectedDate: string,
    classInfo: any,
    students: any[],
    classObservations: string,
  ) => {
    try {
      await exportAttendanceData(formatType, selectedDate, classInfo, students, classObservations);
    } catch (err: any) {
      console.error(`Error al exportar asistencia como ${formatType}:`, err);
      toast.error(`Error al exportar asistencia: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleExportPDF = (selectedDate: string, classInfo: any, students: any[], classObservations: string) => {
    exportAttendanceData('pdf', selectedDate, classInfo, students, classObservations);
  };

  const handleExportExcel = (selectedDate: string, classInfo: any, students: any[], classObservations: string) => {
    exportAttendanceData('excel', selectedDate, classInfo, students, classObservations);
  };

  const handleExportHTML = (selectedDate: string, classInfo: any, students: any[], classObservations: string) => {
    exportAttendanceData('html', selectedDate, classInfo, students, classObservations);
  };

  const handleShareWhatsApp = (selectedDate: string, classInfo: any, students: any[], classObservations: string) => {
    exportAttendanceData('whatsapp', selectedDate, classInfo, students, classObservations);
  };

  return {
    showExportModal,
    closeExportModal,
    handleExport,
    handleExportPDF,
    handleExportExcel,
    handleExportHTML,
    handleShareWhatsApp,
  };
}