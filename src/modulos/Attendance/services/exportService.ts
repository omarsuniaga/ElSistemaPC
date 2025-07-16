import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
interface IExportAttendanceData {
  date: string;
  className: string;
  students: Array<{
    id: string;
    name: string;
    status: string;
    justification?: string;
  }>;
  observation?: string;
}

// Servicio de exportación
export const AttendanceExportService = {
  /**
   * Exporta la asistencia en formato PDF
   */
  exportToPDF: async (data: IExportAttendanceData): Promise<void> => {
    try {
      console.log('[exportService] Iniciando exportación a PDF...');
      
      // Importar jsPDF y jspdf-autotable correctamente
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      console.log('[exportService] Módulos importados correctamente');
      
      // Crear un nuevo documento PDF
      const doc = new jsPDF();
      
      // Verificar que autoTable está disponible
      if (!doc.autoTable) {
        console.log('[exportService] Aplicando plugin autoTable al documento');
        autoTable(doc);
      }
      
      try {
        // Formatear la fecha
        const dateObj = new Date(data.date);
        const dateFormatted = format(dateObj, "dd/MM/yyyy", { locale: es });
        
        // Añadir encabezado
        doc.setFontSize(16);
        doc.text(`Registro de Asistencia - ${data.className}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Fecha: ${dateFormatted}`, 14, 30);
        
        // Preparar datos para la tabla
        const tableData = data.students.map(student => [
          student.name,
          mapStatusToText(student.status),
          student.justification || ''
        ]);
        
        // Añadir estadísticas
        const present = data.students.filter(s => s.status === 'present').length;
        const late = data.students.filter(s => s.status === 'late').length;
        const absent = data.students.filter(s => s.status === 'absent').length;
        const justified = data.students.filter(s => s.status === 'justified').length;
        const total = data.students.length;
        
        // Añadir tabla usando jspdf-autotable
        (doc as any).autoTable({
          head: [['Estudiante', 'Estado', 'Justificación']],
          body: tableData,
          startY: 40,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });
        
        // Obtener posición final de la tabla
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        
        // Añadir resumen de estadísticas
        doc.setFontSize(12);
        doc.text('Resumen:', 14, finalY);
        finalY += 7;
        doc.setFontSize(10);
        doc.text(`Total estudiantes: ${total}`, 14, finalY);
        finalY += 5;
        doc.text(`Presentes: ${present} (${total > 0 ? Math.round((present/total)*100) : 0}%)`, 14, finalY);
        finalY += 5;
        doc.text(`Tardanzas: ${late} (${total > 0 ? Math.round((late/total)*100) : 0}%)`, 14, finalY);
        finalY += 5;
        doc.text(`Ausentes: ${absent} (${total > 0 ? Math.round((absent/total)*100) : 0}%)`, 14, finalY);
        finalY += 5;
        doc.text(`Justificados: ${justified} (${total > 0 ? Math.round((justified/total)*100) : 0}%)`, 14, finalY);
        finalY += 10;
        
        // Añadir observaciones si existen
        if (data.observation && data.observation.trim()) {
          doc.setFontSize(12);
          doc.text('Observaciones:', 14, finalY);
          finalY += 7;
          doc.setFontSize(10);
          
          // Dividir texto largo en líneas para mejor formato
          const splitObservation = doc.splitTextToSize(data.observation, 180);
          doc.text(splitObservation, 14, finalY);
        }
        
        // Guardar PDF con nombre descriptivo
        const fileName = `asistencia_${data.className.replace(/\s+/g, '_')}_${dateFormatted.replace(/\/|\./g, '-')}.pdf`;
        doc.save(fileName);
        
        console.log('PDF generado con éxito:', fileName);
      } catch (innerError) {
        console.error('Error durante la creación del PDF:', innerError);
        throw new Error(`Error al crear el contenido del PDF: ${innerError.message}`);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw new Error(`Error al generar PDF: ${error.message}`);
    }
  },
  
  /**
   * Exporta la asistencia en formato Excel (XLSX)
   */
  exportToExcel: async (data: IExportAttendanceData): Promise<void> => {
    try {
      console.log('[exportService] Iniciando exportación a Excel...');
      
      // Importamos xlsx dinámicamente
      const XLSX = await import('xlsx');
      
      // Preparar datos para el excel
      const excelData = data.students.map(student => ({
        'Estudiante': student.name,
        'Estado': mapStatusToText(student.status),
        'Justificación': student.justification || ''
      }));
      
      // Crear libro y hoja
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Sanitizar nombre de clase para la hoja (eliminar caracteres inválidos)
      // Excel no permite estos caracteres en nombres de hojas: : \ / ? * [ ]
      const safeSheetName = data.className
        .replace(/[:\\\/?*\[\]]/g, '') // Eliminar caracteres inválidos
        .trim()
        .substring(0, 30); // Limitar longitud
      
      console.log('[exportService] Nombre de hoja sanitizado:', safeSheetName);
      
      // Añadir hoja al libro con nombre seguro
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName || 'Asistencia');
      
      // Generar archivo y descargar
      const dateFormatted = format(new Date(data.date), "dd-MM-yyyy", { locale: es });
      const fileName = `asistencia_${data.className.replace(/\s+/g, '_').replace(/[:\\\/?*\[\]]/g, '_')}_${dateFormatted}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      
      console.log('[exportService] Excel generado con éxito:', fileName);
    } catch (error) {
      console.error('[exportService] Error al generar Excel:', error);
      throw new Error(`Error al generar Excel: ${error.message || error}`);
    }
  },
  
  /**
   * Exporta la asistencia en formato HTML
   */
  exportToHTML: (data: IExportAttendanceData): void => {
    try {
      const dateFormatted = format(new Date(data.date), "dd/MM/yyyy", { locale: es });
      
      // Crear HTML con estilos incluidos
      let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Asistencia ${data.className} - ${dateFormatted}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px 15px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #2980b9; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .present { color: green; }
            .late { color: orange; }
            .absent { color: red; }
            .justified { color: blue; }
            .observations { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Registro de Asistencia - ${data.className}</h1>
          <p><strong>Fecha:</strong> ${dateFormatted}</p>
          
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Estado</th>
                <th>Justificación</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Añadir filas de estudiantes
      data.students.forEach(student => {
        const statusClass = getStatusClass(student.status);
        html += `
          <tr>
            <td>${student.name}</td>
            <td class="${statusClass}">${mapStatusToText(student.status)}</td>
            <td>${student.justification || ''}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
      `;
      
      // Añadir observaciones si existen
      if (data.observation && data.observation.trim()) {
        html += `
          <div class="observations">
            <h2>Observaciones</h2>
            <p>${data.observation}</p>
          </div>
        `;
      }
      
      html += `
        </body>
        </html>
      `;
      
      // Crear blob y descargar
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      saveAs(blob, `asistencia_${data.className}_${dateFormatted.replace(/\//g, '-')}.html`);
    } catch (error) {
      console.error('Error al generar HTML:', error);
      throw new Error('Error al generar HTML');
    }
  },
  
  /**
   * Crea un mensaje formateado para WhatsApp
   */
  shareToWhatsApp: (data: IExportAttendanceData): void => {
    try {
      const dateFormatted = format(new Date(data.date), "dd/MM/yyyy", { locale: es });
      
      // Crear mensaje para WhatsApp
      let message = `*REGISTRO DE ASISTENCIA*\n`;
      message += `*Clase:* ${data.className}\n`;
      message += `*Fecha:* ${dateFormatted}\n\n`;
      
      // Resumen de asistencia
      const present = data.students.filter(s => s.status === 'present').length;
      const late = data.students.filter(s => s.status === 'late').length;
      const absent = data.students.filter(s => s.status === 'absent').length;
      const justified = data.students.filter(s => s.status === 'justified').length;
      const total = data.students.length;
      
      message += `*RESUMEN DE ASISTENCIA*\n`;
      message += `- Total estudiantes: ${total}\n`;
      message += `- Presentes: ${present} (${Math.round((present/total)*100)}%)\n`;
      message += `- Tardanzas: ${late} (${Math.round((late/total)*100)}%)\n`;
      message += `- Ausentes: ${absent} (${Math.round((absent/total)*100)}%)\n`;
      message += `- Justificados: ${justified} (${Math.round((justified/total)*100)}%)\n\n`;
      
      // Lista detallada con categorías separadas
      message += `*LISTADO DETALLADO*\n\n`;
      
      // Presentes
      if (present > 0) {
        message += `*PRESENTES:*\n`;
        data.students.filter(s => s.status === 'present')
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(student => {
            message += `• ${student.name}\n`;
          });
        message += `\n`;
      }
      
      // Tardanzas
      if (late > 0) {
        message += `*TARDANZAS:*\n`;
        data.students.filter(s => s.status === 'late')
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(student => {
            message += `• ${student.name}\n`;
          });
        message += `\n`;
      }
      
      // Ausentes
      if (absent > 0) {
        message += `*AUSENTES:*\n`;
        data.students.filter(s => s.status === 'absent')
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(student => {
            message += `• ${student.name}\n`;
          });
        message += `\n`;
      }
      
      // Justificados
      if (justified > 0) {
        message += `*JUSTIFICADOS:*\n`;
        data.students.filter(s => s.status === 'justified')
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(student => {
            const justification = student.justification ? `: ${student.justification}` : '';
            message += `• ${student.name}${justification}\n`;
          });
        message += `\n`;
      }
      
      // Añadir observaciones si existen
      if (data.observation && data.observation.trim()) {
        message += `*OBSERVACIONES DE CLASE:*\n${data.observation}\n`;
      }
      
      // Añadir pie de mensaje
      const currentDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
      message += `\n_Registro generado el ${currentDate} - Sistema de Gestión Académica._`;
      
      // Codificar URL para WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
      
      // Abrir en una nueva pestaña
      window.open(whatsappURL, '_blank');
    } catch (error) {
      console.error('Error al generar mensaje de WhatsApp:', error);
      throw new Error('Error al generar mensaje de WhatsApp');
    }
  }
};

// Funciones auxiliares
function mapStatusToText(status: string): string {
  const statusMap: Record<string, string> = {
    'present': 'Presente',
    'absent': 'Ausente',
    'late': 'Tardanza',
    'justified': 'Justificado',
    'pending': 'Pendiente'
  };
  
  return statusMap[status] || status;
}

function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    'present': 'present',
    'absent': 'absent',
    'late': 'late',
    'justified': 'justified',
    'pending': ''
  };
  
  return classMap[status] || '';
}

function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    'present': '✅',
    'absent': '❌',
    'late': '⏰',
    'justified': '📝',
    'pending': '⚪'
  };
  
  return emojiMap[status] || '⚪';
}

export default AttendanceExportService;
