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
  justifications: Record<string, string> = {}
): Promise<void> => {
  try {
    // Obtener y formatear nombre del profesor y fecha (lógica existente)
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

    let formattedDate = "Fecha no disponible";
    let dateForFileName = date;
    try {
      if (date && !isNaN(new Date(date).getTime())) {
        const dateObj = new Date(date);
        formattedDate = format(dateObj, "d 'de' MMMM yyyy", { locale: es });
        dateForFileName = format(dateObj, 'yyyy-MM-dd');
      } else {
        console.warn("Fecha inválida proporcionada:", date);
        const now = new Date();
        formattedDate = format(now, "d 'de' MMMM yyyy", { locale: es });
        dateForFileName = format(now, 'yyyy-MM-dd');
      }
    } catch (dateError) {
      console.warn("Error al formatear fecha:", dateError);
      const now = new Date();
      formattedDate = format(now, "d 'de' MMMM yyyy", { locale: es });
      dateForFileName = format(now, 'yyyy-MM-dd');
    }

    const displayClassName = className || "Clase sin nombre";
    const displayTeacherName = teacherName || "Profesor no especificado";

    // Preparar datos para la tabla
    const getFullName = (student: Student): string => `${student.nombre || ''} ${student.apellido || ''}`.trim();
    const getStatusPriority = (status: string): number => {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus.includes('presente')) return 1;
      if (lowerStatus.includes('tarde')) return 2;
      if (lowerStatus.includes('justificad')) return 3;
      if (lowerStatus.includes('ausente')) return 4;
      return 5;
    };

    const studentsWithStatus = students
      .map(student => ({ student, status: records[student.id] || 'No registrado' }))
      .sort((a, b) => {
        const statusCompare = getStatusPriority(a.status) - getStatusPriority(b.status);
        return statusCompare === 0 ? getFullName(a.student).localeCompare(getFullName(b.student)) : statusCompare;
      });

    const tableData = studentsWithStatus.map((item, index) => ({
      numero: index + 1,
      nombreCompleto: getFullName(item.student),
      estado: item.status,
    }));

    const columns = [
      { header: 'N°', dataKey: 'numero' },
      { header: 'Lista de Asistencia', dataKey: 'nombreCompleto' },
      { header: 'Estado', dataKey: 'estado' },
    ];

    // Calcular estadísticas de asistencia
    const stats = {
      presentes: 0,
      ausentes: 0,
      tardanzas: 0,
      justificados: 0,
    };
    Object.values(records).forEach(status => {
      if (status.toLowerCase().includes('presente')) stats.presentes++;
      else if (status.toLowerCase().includes('ausente')) stats.ausentes++;
      else if (status.toLowerCase().includes('tarde')) stats.tardanzas++;
      else if (status.toLowerCase().includes('justificad')) stats.justificados++;
    });

    let headerText = `Clase: ${displayClassName} | Profesor: ${displayTeacherName}\n`;
    headerText += `Resumen: Presentes: ${stats.presentes} | Ausentes: ${stats.ausentes} | Tardanzas: ${stats.tardanzas} | Justificados: ${stats.justificados}`;

    let footerContent = '';
    if (Object.keys(justifications).length > 0) {
      footerContent += '\n\nJustificaciones:\n';
      for (const studentId in justifications) {
        if (Object.prototype.hasOwnProperty.call(justifications, studentId)) {
          const studentName = getFullName(students.find(s => s.id === studentId) || { nombre: 'Desconocido', apellido: '' });
          footerContent += `${studentName}: ${justifications[studentId]}\n`;
        }
      }
    }
    footerContent += `\nObservaciones:\n${observations}`;
    footerContent += `\n\n\n_________________________\nFirma del Profesor`;
    footerContent += `\n\nGenerado el: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}`;

    // Opciones para generarPdfTabla
    const pdfOptions = {
      title: 'Reporte de Asistencia',
      fileName: `Asistencia_${displayClassName.replace(/\s+/g, '_')}_${dateForFileName}.pdf`,
      columns: columns,
      data: tableData,
      institutionName: 'El Sistema Punta Cana',
      logoUrl: new URL('../assets/ElSistemaPCLogo.jpeg', import.meta.url).href, 
      headerText: headerText,
      footerText: footerContent, 
      startY: 55, // Ajustar para el título y posible logo/headerText
      headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        numero: { cellWidth: 15, halign: 'center' },
        nombreCompleto: { cellWidth: 'auto' },
        estado: { cellWidth: 35, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      bodyStyles: { fontSize: 10, cellPadding: 2 },
      didDrawCell: (data: any, doc: any) => {
        if (data.column.dataKey === 'estado' && data.section === 'body') {
          const status = String(data.cell.raw).toLowerCase();
          let fillColor = null;
          let textColor = [0,0,0]; // Default black

          if (status.includes('presente')) {
            fillColor = [220, 220, 220]; 
            textColor = [40,40,40];
          } else if (status.includes('ausente')) {
            fillColor = [180, 180, 180]; 
            textColor = [20,20,20];
          } else if (status.includes('tarde')) {
            fillColor = [200, 200, 200]; 
            textColor = [30,30,30];
          } else if (status.includes('justificad')) {
            fillColor = [160, 160, 160]; 
            textColor = [10,10,10];
          }

          if (fillColor) {
            doc.setFillColor(...fillColor);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(...textColor);
            // El texto ya está siendo dibujado por autoTable, solo necesitamos aplicar el estilo.
            // Si necesitas centrar o algo más, puedes añadir doc.text aquí y retornar false.
          }
        }
      },
      pageSettings: {
        orientation: 'portrait',
        format: 'letter',
        unit: 'mm'
      }
    };

    await generarPdfTabla(pdfOptions);

  } catch (error) {
    console.error('Error al generar el PDF de asistencia:', error);
    alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
    // Considerar propagar el error si es manejado más arriba
    // return Promise.reject(error); 
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
  reportDate: string = new Date().toISOString().split('T')[0] // Default to today
): Promise<void> => {
  try {
    let formattedDate: string;
    let dateForFileName = reportDate;

    try {
      if (reportDate && !isNaN(new Date(reportDate).getTime())) {
        const dateObj = new Date(reportDate);
        formattedDate = format(dateObj, "d 'de' MMMM yyyy", { locale: es });
        dateForFileName = format(dateObj, 'yyyy-MM-dd');
      } else {
        const now = new Date();
        formattedDate = format(now, "d 'de' MMMM yyyy", { locale: es });
        dateForFileName = format(now, 'yyyy-MM-dd');
      }
    } catch (error) {
      const now = new Date();
      formattedDate = format(now, "d 'de' MMMM yyyy", { locale: es });
      dateForFileName = format(now, 'yyyy-MM-dd');
    }

    const columns = [
      { header: '#', dataKey: 'numero' },
      { header: 'Nombre del Estudiante', dataKey: 'nombreCompleto' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Teléfono', dataKey: 'telefono' },
      { header: 'Instrumento', dataKey: 'instrumento' },
    ];

    const tableData = students.map((student, index) => ({
      numero: index + 1,
      nombreCompleto: `${student.nombre} ${student.apellido}`,
      email: student.email || 'No registrado',
      telefono: student.phone || student.tlf || 'No registrado',
      instrumento: student.instrumento || 'No especificado',
    }));

    let headerInfo = `Clase: ${className}\nProfesor: ${teacherName}\nHoras semanales: ${weeklyHours}\nFecha del reporte: ${formattedDate}`;

    let footerText = '';
    if (students.length > 0) {
      const instrumentCounts: Record<string, number> = {};
      students.forEach(student => {
        const instrument = student.instrumento || 'No especificado';
        instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
      });
      footerText += '\n\nDistribución de Instrumentos:\n';
      Object.entries(instrumentCounts).forEach(([instrument, count]) => {
        footerText += `- ${instrument}: ${count}\n`;
      });
    }
    footerText += `\n\nGenerado el: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}`;

    const pdfOptions = {
      title: 'Detalles de la Clase',
      fileName: `DetallesClase_${className.replace(/\s+/g, '_')}_${dateForFileName}.pdf`,
      columns: columns,
      data: tableData,
      institutionName: 'El Sistema Punta Cana',
      logoUrl: new URL('../assets/ElSistemaPCLogo.jpeg', import.meta.url).href,
      headerText: headerInfo,
      footerText: footerText,
      startY: 65, // Ajustar según necesidad
      headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        numero: { cellWidth: 10, halign: 'center' },
        nombreCompleto: { cellWidth: 50 },
        email: { cellWidth: 45 },
        telefono: { cellWidth: 35 },
        instrumento: { cellWidth: 40 },
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      bodyStyles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
      pageSettings: {
        orientation: 'portrait',
        format: 'letter',
        unit: 'mm'
      }
    };

    await generarPdfTabla(pdfOptions);

  } catch (error) {
    console.error("Error generando PDF de detalles de clase:", error);
    alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
    // return Promise.reject(error); // Considerar propagar el error
  }
};
