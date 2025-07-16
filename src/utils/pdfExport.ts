// src/utils/pdfExport.ts
import type { Student } from '@/modulos/Students/types/student';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTeachersStore } from '@/modulos/Teachers/store/teachers';
import { useAuthStore } from '@/stores/auth';
import { generarPdfTabla } from './pdfService'; // Importar la función del servicio

/**
 * Genera un PDF con la lista de asistencia de una clase específica utilizando pdfService.
 * @param students - Lista de estudiantes de la clase
 * @param records - Registros de asistencia (por ID de estudiante)
 * @param observations - Observaciones del maestro (opcional)
 * @param className - Nombre de la clase
 * @param teacherName - Nombre del maestro
 * @param date - Fecha de la asistencia (formato ISO)
 * @param justifications - Justificaciones de ausencias (opcional)
 * @returns Promesa que se resuelve cuando el PDF se ha generado y guardado
 */
export const generateAttendancePDF = async (
  students: Student[],
  records: Record<string, string>,
  observations: string = 'Sin observaciones.',
  className: string,
  teacherName: string,
  date: string,
  justifications: Record<string, string> = {},
): Promise<void> => {
  try {
    // Obtener y formatear nombre del profesor y fecha
    if (!teacherName || teacherName.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const teachersStore = useTeachersStore();
        const authStore = useAuthStore();
        if (authStore.user?.uid) {
          const teacher = await teachersStore.fetchTeacherByAuthUid(authStore.user.uid);
          if (teacher) teacherName = teacher.name;
        }
      } catch (error) {
        console.warn('Error obtaining teacher name from store:', error);
      }
    }

    let formattedDate = 'Fecha no disponible';
    let dateForFileName = date;
    try {
      if (date && !isNaN(new Date(date).getTime())) {
        const dateObj = new Date(date);
        formattedDate = format(dateObj, 'd \'de\' MMMM yyyy', { locale: es });
        dateForFileName = format(dateObj, 'yyyy-MM-dd');
      } else {
        console.warn('Fecha inválida proporcionada:', date);
        const now = new Date();
        formattedDate = format(now, 'd \'de\' MMMM yyyy', { locale: es });
        dateForFileName = format(now, 'yyyy-MM-dd');
      }
    } catch (dateError) {
      console.warn('Error al formatear fecha:', dateError);
      const now = new Date();
      formattedDate = format(now, 'd \'de\' MMMM yyyy', { locale: es });
      dateForFileName = format(now, 'yyyy-MM-dd');
    }

    const displayClassName = className || 'Clase sin nombre';
    const displayTeacherName = teacherName || 'Profesor no especificado';

    // Preparar datos para la tabla con columna de observaciones
    const getFullName = (student: Student): string =>
      `${student.nombre || ''} ${student.apellido || ''}`.trim();
    const getStatusPriority = (status: string): number => {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus.includes('presente')) return 1;
      if (lowerStatus.includes('tarde')) return 2;
      if (lowerStatus.includes('justificad')) return 3;
      if (lowerStatus.includes('ausente')) return 4;
      return 5;
    };

    const studentsWithStatus = students
      .map((student: Student) => ({ student, status: records[student.id] || 'No registrado' }))
      .sort((a: any, b: any) => {
        const statusCompare = getStatusPriority(a.status) - getStatusPriority(b.status);
        return statusCompare === 0
          ? getFullName(a.student).localeCompare(getFullName(b.student))
          : statusCompare;
      });

    // Convertir datos para la tabla según el formato del Google Sheet
    const tableData = studentsWithStatus.map((item: any, index: number) => {
      return [index + 1, getFullName(item.student), item.status];
    });

    const columns = [
      { header: 'No.', dataKey: 'numero' },
      { header: 'Nombre completo del alumno', dataKey: 'nombreCompleto' },
      { header: 'Asis', dataKey: 'estado' },
    ];

    // Calcular estadísticas de asistencia
    const stats = {
      presentes: 0,
      ausentes: 0,
      tardanzas: 0,
      justificados: 0,
    };

    Object.values(records).forEach((status: string) => {
      if (status.toLowerCase().includes('presente')) stats.presentes++;
      else if (status.toLowerCase().includes('ausente')) stats.ausentes++;
      else if (status.toLowerCase().includes('tarde')) stats.tardanzas++;
      else if (status.toLowerCase().includes('justificad')) stats.justificados++;
    });

    // Construir información en el formato del Google Sheet
    let headerInfo = `SALÓN: ${displayClassName}\n\n`;
    headerInfo += `Total de tardanza: ${stats.tardanzas}     T- Tardanza\n`;
    headerInfo += `Total no justificado: ${stats.ausentes}     N- No justificada\n`;
    headerInfo += `Total justificado: ${stats.justificados}     J-Justificada\n`;
    headerInfo += `Total presentes: ${stats.presentes}     P- Presente\n\n`;
    headerInfo += `MAESTRO: ${displayTeacherName}\n`;
    headerInfo += `SECCIÓN: ${displayClassName}\n`;
    headerInfo += 'HORA DE CLASE: _______________';

    // Contenido de observaciones para el pie de página
    let observationsContent = '\n\nContenido/Observaciones:\n';
    observationsContent +=
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    if (observations && observations.trim() && observations !== 'Sin observaciones.') {
      observationsContent += observations;
    } else {
      observationsContent += 'No se registraron observaciones especiales para esta clase.';
    }

    // Agregar justificaciones detalladas si existen
    if (Object.keys(justifications).length > 0) {
      observationsContent += '\n\nJustificaciones Detalladas:\n';
      observationsContent +=
        '────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────\n';
      for (const studentId in justifications) {
        if (Object.prototype.hasOwnProperty.call(justifications, studentId)) {
          const student = students.find((s: Student) => s.id === studentId);
          const studentName = student ? getFullName(student) : 'Estudiante no encontrado';
          observationsContent += `• ${studentName}: ${justifications[studentId]}\n`;
        }
      }
    }

    observationsContent += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    observationsContent += `Firma del Profesor: _____________________________                    Fecha: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}\n\n`;
    observationsContent += `Documento generado automáticamente el ${format(new Date(), 'dd/MM/yyyy \'a las\' HH:mm:ss', { locale: es })}`;

    // Opciones para generarPdfTabla con el nuevo diseño del Google Sheet
    const pdfOptions = {
      title: 'REGISTRO DE ASISTENCIA',
      fileName: `Asistencia_${displayClassName.replace(/\s+/g, '_')}_${dateForFileName}.pdf`,
      columns,
      data: tableData,
      institutionName: 'FUNDACIÓN PARA LA EXPANSIÓN CULTURAL Y ARTÍSTICA DE PUNTA CANA',
      logoUrl: new URL('../assets/Logo.jpg', import.meta.url).href,
      headerText: headerInfo,
      footerText: observationsContent,
      startY: 140, // Más espacio para el nuevo encabezado
      headStyles: {
        fillColor: [41, 98, 255], // Azul como en el Google Sheet
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 11,
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // No.
        1: { cellWidth: 130, halign: 'left' }, // Nombre completo del alumno
        2: { cellWidth: 45, halign: 'center' }, // Asis
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.5,
        valign: 'middle',
      },
      didDrawCell: (data: any, doc: any) => {
        // Colorear la columna del estado (columna índice 2)
        if (data.column.index === 2 && data.section === 'body') {
          const status = String(data.cell.raw).toLowerCase();
          let fillColor = null;
          const textColor = [0, 0, 0]; // Texto negro por defecto

          if (status.includes('presente')) {
            fillColor = [144, 238, 144]; // Verde claro como en el Google Sheet
          } else if (status.includes('ausente')) {
            fillColor = [255, 182, 193]; // Rosa claro para ausente
          } else if (status.includes('tarde')) {
            fillColor = [255, 218, 185]; // Naranja claro para tardanza
          } else if (status.includes('justificad')) {
            fillColor = [173, 216, 230]; // Azul claro para justificado
          } else {
            fillColor = [245, 245, 245]; // Gris muy claro
          }

          if (fillColor && doc) {
            doc.setFillColor(...fillColor);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(...textColor);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Centrar el texto manualmente
            const text = String(data.cell.raw);
            const textWidth = doc.getTextWidth(text);
            const centerX = data.cell.x + data.cell.width / 2 - textWidth / 2;
            const centerY = data.cell.y + data.cell.height / 2 + 2;

            doc.text(text, centerX, centerY);
            return false; // Prevenir que autoTable dibuje el texto por defecto
          }
        }
      },
      pageSettings: {
        orientation: 'portrait',
        format: 'letter',
        unit: 'mm',
      },
    };

    await generarPdfTabla(pdfOptions);
  } catch (error) {
    console.error('Error al generar el PDF de asistencia:', error);
    alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
  }
};

/**
 * Generates a PDF with the class details and student list using pdfService
 */
export const generateClassDetailsPDF = async (
  className: string,
  teacherName: string,
  weeklyHours: number,
  students: Student[],
  reportDate: string = new Date().toISOString().split('T')[0], // Default to today
): Promise<void> => {
  try {
    let formattedDate: string;
    let dateForFileName = reportDate;

    try {
      if (reportDate && !isNaN(new Date(reportDate).getTime())) {
        const dateObj = new Date(reportDate);
        formattedDate = format(dateObj, 'd \'de\' MMMM yyyy', { locale: es });
        dateForFileName = format(dateObj, 'yyyy-MM-dd');
      } else {
        const now = new Date();
        formattedDate = format(now, 'd \'de\' MMMM yyyy', { locale: es });
        dateForFileName = format(now, 'yyyy-MM-dd');
      }
    } catch (error) {
      const now = new Date();
      formattedDate = format(now, 'd \'de\' MMMM yyyy', { locale: es });
      dateForFileName = format(now, 'yyyy-MM-dd');
    }

    const columns = [
      { header: '#', dataKey: 'numero' },
      { header: 'Nombre del Estudiante', dataKey: 'nombreCompleto' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Teléfono', dataKey: 'telefono' },
      { header: 'Instrumento', dataKey: 'instrumento' },
    ];

    const tableData = students.map((student: Student, index: number) => [
      index + 1,
      `${student.nombre} ${student.apellido}`,
      student.email || 'No registrado',
      student.phone || student.tlf || 'No registrado',
      student.instrumento || 'No especificado',
    ]);

    const headerInfo = `Clase: ${className}\nProfesor: ${teacherName}\nHoras semanales: ${weeklyHours}\nFecha del reporte: ${formattedDate}`;

    let footerText = '';
    if (students.length > 0) {
      const instrumentCounts: Record<string, number> = {};
      students.forEach((student: Student) => {
        const instrument = student.instrumento || 'No especificado';
        instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
      });
      footerText += '\n\nDistribución de Instrumentos:\n';
      Object.entries(instrumentCounts).forEach(([instrument, count]) => {
        footerText += `- ${instrument}: ${count}\n`;
      });
    }
    footerText += `\n\nGenerado el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}`;

    const pdfOptions = {
      title: 'Detalles de la Clase',
      fileName: `DetallesClase_${className.replace(/\s+/g, '_')}_${dateForFileName}.pdf`,
      columns,
      data: tableData,
      institutionName: 'El Sistema Punta Cana',
      logoUrl: new URL('../assets/ElSistemaPCLogo.jpeg', import.meta.url).href,
      headerText: headerInfo,
      footerText,
      startY: 65, // Ajustar según necesidad
      headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' }, // #
        1: { cellWidth: 50 }, // Nombre
        2: { cellWidth: 45 }, // Email
        3: { cellWidth: 35 }, // Teléfono
        4: { cellWidth: 40 }, // Instrumento
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      bodyStyles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
      pageSettings: {
        orientation: 'portrait',
        format: 'letter',
        unit: 'mm',
      },
    };

    await generarPdfTabla(pdfOptions);
  } catch (error) {
    console.error('Error generando PDF de detalles de clase:', error);
    alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
  }
};
