// src/utils/pdfExport.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student } from '../modulos/Students/types/student';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTeachersStore } from '../modulos/Teachers/store/teachers';
import { useAuthStore } from '../stores/auth';

/**
 * Genera un PDF con la lista de asistencia de una clase específica
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
    // If teacherName is missing or looks like a date, try to get it from the store
    if (!teacherName || teacherName.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const teachersStore = useTeachersStore();
        const authStore = useAuthStore();
        
        if (authStore.user?.uid) {
          const teacher = await teachersStore.fetchTeacherByAuthUid(authStore.user.uid);
          if (teacher) {
            teacherName = teacher.name;
          }
        }
      } catch (error) {
        console.warn('Error obtaining teacher name from store:', error);
      }
    }
    
    // Formatear fecha para mostrar - con validación para evitar errores
    let formattedDate = "Fecha no disponible";
    let dateObj: Date;
    
    try {
      // Verificar si la fecha es válida
      if (date && !isNaN(new Date(date).getTime())) {
        dateObj = new Date(date);
        formattedDate = format(dateObj, "d 'de' MMMM yyyy", { locale: es });
      } else {
        console.warn("Fecha inválida proporcionada:", date);
        dateObj = new Date();
        formattedDate = format(dateObj, "d 'de' MMMM yyyy", { locale: es });
      }
    } catch (dateError) {
      console.warn("Error al formatear fecha:", dateError);
      dateObj = new Date();
      formattedDate = format(dateObj, "d 'de' MMMM yyyy", { locale: es });
    }
    
    // Crear instancia de jsPDF con tamaño carta (8.5 x 11 pulgadas)
    const doc = new jsPDF({
      format: 'letter', // Tamaño carta (215.9 x 279.4 mm)
      orientation: 'portrait',
      unit: 'mm'
    });
    
    // --- Diseño del PDF ---
    
    // Cargar y añadir logo
    try {
      const logoPath = new URL('../assets/ElSistemaPCLogo.jpeg', import.meta.url).href;
      
      // Cargar imagen (necesitas esperar a que se cargue)
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn("No se pudo cargar el logo", img.src);
          reject(new Error('Error al cargar el logo'));
        };
        img.src = logoPath;
      });
      
      // Añadir imagen al PDF
      // Ajustar tamaño para que no sea demasiado grande (máximo 40mm de ancho)
      const imgWidth = 40;
      const imgHeight = (img.height * imgWidth) / img.width;
      doc.addImage(img, 'JPEG', 14, 10, imgWidth, imgHeight);
    } catch (logoError) {
      console.warn('No se pudo cargar el logo, continuando sin él:', logoError);
    }
    
    // Identificación de la institución
    doc.setFontSize(16);
    doc.setTextColor(0); // Negro
    doc.setFont(undefined, 'bold');
    doc.text('El Sistema Punta Cana', 105, 15, { align: 'center' });
    
    // Enunciado (Reporte de Asistencia)
    doc.setFontSize(18);
    doc.text('Reporte de Asistencia', 105, 25, { align: 'center' });
    
    // Información básica del reporte - asegurar que se muestran correctamente
    doc.setFontSize(11);
    doc.setTextColor(60); // Gris oscuro
    doc.setFont(undefined, 'normal');
    
    // Verificar cada parámetro para evitar datos incorrectos
    const displayDate = formattedDate;
    const displayClassName = className || "Clase sin nombre";
    // Use the teacher name we've now ensured is valid
    const displayTeacherName = teacherName || "Profesor no especificado";
    
    doc.text(`Fecha: ${displayDate}`, 14, 40);
    doc.text(`Clase: ${displayClassName}`, 14, 47);
    doc.text(`Profesor: ${displayTeacherName}`, 14, 54);
    
    // Calcular estadísticas de asistencia
    const stats = {
      presentes: 0,
      ausentes: 0,
      tardanzas: 0,
      justificados: 0,
      total: students.length
    };
    
    Object.values(records).forEach(status => {
      if (status.toLowerCase().includes('presente')) stats.presentes++;
      else if (status.toLowerCase().includes('ausente')) stats.ausentes++;
      else if (status.toLowerCase().includes('tarde')) stats.tardanzas++;
      else if (status.toLowerCase().includes('justificad')) stats.justificados++;
    });
    
    // Mostrar estadísticas
    doc.setFontSize(10);
    doc.setTextColor(0); // Negro
    doc.setFont(undefined, 'bold');
    doc.text('Resumen de Asistencia:', 14, 65);
    doc.setFont(undefined, 'normal');
    
    // Recuadros con estadísticas en escala de grises
    const boxWidth = 40;
    const boxHeight = 7;
    const boxY = 67;
    const margin = 5;
    
    // Función helper para dibujar cajas de estadísticas con escala de grises
    const drawStatBox = (x: number, label: string, value: number, grayLevel: number) => {
      doc.setFillColor(grayLevel, grayLevel, grayLevel); // Gris con diferentes niveles
      doc.roundedRect(x, boxY, boxWidth, boxHeight, 1, 1, 'F');
      doc.setTextColor(255); // Texto blanco
      doc.setFontSize(9);
      doc.text(`${label}: ${value}`, x + boxWidth/2, boxY + 4.5, { align: 'center' });
    };
    
    // Dibujar estadísticas con diferentes tonos de gris
    drawStatBox(14, 'Presentes', stats.presentes, 80); // Gris medio-oscuro
    drawStatBox(14 + boxWidth + margin, 'Ausentes', stats.ausentes, 40); // Gris oscuro
    drawStatBox(14 + (boxWidth + margin) * 2, 'Tardanzas', stats.tardanzas, 60); // Gris medio
    drawStatBox(14 + (boxWidth + margin) * 3, 'Justificados', stats.justificados, 100); // Gris claro
    
    // Organizar estudiantes por estado y orden alfabético
    type StudentWithStatus = {
      student: Student;
      status: string;
    };
    
    // Crear array con información combinada
    const studentsWithStatus: StudentWithStatus[] = students.map(student => ({
      student,
      status: records[student.id] || 'No registrado'
    }));
    
    // Función para obtener el nombre completo del estudiante
    const getFullName = (student: Student): string => {
      return `${student.nombre || ''} ${student.apellido || ''}`.trim();
    };
    
    // Función para determinar la prioridad del estado
    const getStatusPriority = (status: string): number => {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus.includes('presente')) return 1;
      if (lowerStatus.includes('tarde')) return 2;
      if (lowerStatus.includes('justificad')) return 3;
      if (lowerStatus.includes('ausente')) return 4;
      return 5; // No registrado u otro
    };
    
    // Ordenar primero por estado (según prioridad) y luego alfabéticamente
    studentsWithStatus.sort((a, b) => {
      // Primero ordenar por estado (presente, tarde, justificado, ausente)
      const statusCompare = getStatusPriority(a.status) - getStatusPriority(b.status);
      
      // Si los estados son iguales, ordenar alfabéticamente
      if (statusCompare === 0) {
        return getFullName(a.student).localeCompare(getFullName(b.student));
      }
      
      return statusCompare;
    });
    
    // Preparar datos para la tabla
    const tableColumn = ["N°", "Lista de Asistencia", "Estado"];
    const tableRows: (string | number)[][] = studentsWithStatus.map((item, index) => [
      index + 1,
      getFullName(item.student),
      item.status
    ]);

    // Usar autoTable con estilos mejorados
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: boxY + boxHeight + 7, // Posición después de las estadísticas
      theme: 'grid',
      headStyles: {
        fillColor: [50, 50, 50], // Gris oscuro
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' }, // N°
        1: { cellWidth: 'auto' }, // Nombre
        2: { cellWidth: 30, halign: 'center' } // Estado
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      didDrawCell: (data) => {
        // Colorear celdas de estado según el valor con escala de grises
        if (data.column.index === 2 && data.section === 'body') {
          const status = String(data.cell.text).toLowerCase();
          
          if (status.includes('presente')) {
            doc.setFillColor(220, 220, 220); // Gris muy claro
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(40, 40, 40); // Casi negro
            doc.text(String(data.cell.text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
              align: 'center',
              baseline: 'middle'
            });
            return false; // No dibujar el texto original
          } 
          else if (status.includes('ausente')) {
            doc.setFillColor(180, 180, 180); // Gris intermedio
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(20, 20, 20); // Negro
            doc.text(String(data.cell.text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
              align: 'center',
              baseline: 'middle'
            });
            return false; // No dibujar el texto original
          }
          else if (status.includes('tarde')) {
            doc.setFillColor(200, 200, 200); // Gris claro
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(30, 30, 30); // Muy oscuro
            doc.text(String(data.cell.text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
              align: 'center',
              baseline: 'middle'
            });
            return false; // No dibujar el texto original
          }
          else if (status.includes('justificad')) {
            doc.setFillColor(160, 160, 160); // Gris medio
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(10, 10, 10); // Casi negro
            doc.text(String(data.cell.text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
              align: 'center',
              baseline: 'middle'
            });
            return false; // No dibujar el texto original
          }
        }
        return true; // Dibujar el texto normalmente
      }
    });

    // Sección de Justificaciones (si existen)
    let finalY = (doc as any).lastAutoTable.finalY + 10;

    if (Object.keys(justifications).length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0); // Negro
      doc.setFont(undefined, 'bold');
      doc.text('Justificaciones:', 14, finalY);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      finalY += 7;
      
      // Listar justificaciones
      Object.entries(justifications).forEach(([studentId, justification], index) => {
        const student = students.find(s => s.id === studentId);
        if (student && justification) {
          const studentName = getFullName(student);
          
          // Nombre del estudiante en negrita
          doc.setFont(undefined, 'bold');
          doc.text(`${studentName}:`, 14, finalY);
          doc.setFont(undefined, 'normal');
          
          // Justificación (con manejo de texto largo)
          const splitJustification = doc.splitTextToSize(justification, 180);
          doc.text(splitJustification, 14, finalY + 5);
          
          finalY += 5 + (splitJustification.length * 5); // Ajustar según el número de líneas
          
          // Separador entre justificaciones
          if (index < Object.keys(justifications).length - 1) {
            finalY += 3;
            doc.setDrawColor(200);
            doc.line(14, finalY, 196, finalY);
            finalY += 5;
          }
        }
      });
      
      finalY += 5;
    }

    // Sección de Observaciones
    doc.setFontSize(12);
    doc.setTextColor(0); // Negro
    doc.setFont(undefined, 'bold');
    doc.text('Observaciones de la clase:', 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    // Manejar textos largos para observaciones
    const splitObservations = doc.splitTextToSize(observations, 180);
    doc.text(splitObservations, 14, finalY + 7);
    
    // Ajustar la posición Y para la siguiente sección
    finalY += 7 + (splitObservations.length * 5);
    
    // Sección de Alumnos Justificados (nuevo)
    const justifiedStudents = students.filter(student => 
      records[student.id]?.toLowerCase().includes('justificad')
    );
    
    if (justifiedStudents.length > 0) {
      finalY += 10; // Espacio adicional después de las observaciones
      
      doc.setFontSize(12);
      doc.setTextColor(0); // Negro
      doc.setFont(undefined, 'bold');
      doc.text('Alumnos Justificados:', 14, finalY);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      finalY += 7;
      
      // Listar alumnos justificados con sus razones
      justifiedStudents.forEach((student, index) => {
        const studentName = getFullName(student);
        const justification = justifications[student.id] || 'Sin razón especificada';
        
        // Formato: - [Nombre del alumno]: [Razón]
        doc.setFont(undefined, 'bold');
        doc.text('- ' + studentName + ':', 14, finalY);
        doc.setFont(undefined, 'normal');
        
        // Manejar textos largos para la justificación
        const splitJustification = doc.splitTextToSize(justification, 170);
        doc.text(splitJustification, 24, finalY + 5); // Indentado para mejor legibilidad
        
        finalY += 5 + (splitJustification.length * 5);
        
        // Espacio entre justificaciones
        if (index < justifiedStudents.length - 1) {
          finalY += 3;
        }
      });
    }
    
    // Añadir pie de página con fecha de generación (usando la fecha actual)
    const generationDate = format(new Date(), "'Generado el' d 'de' MMMM yyyy 'a las' HH:mm", { locale: es });
    doc.setFontSize(8);
    doc.setTextColor(100); // Gris medio
    doc.text(generationDate, 105, 285, { align: 'center' });

    // --- Fin Diseño ---

    // Guardar el PDF con la fecha de la asistencia, no la actual
    let safeDate;
    try {
      safeDate = dateObj instanceof Date && !isNaN(dateObj.getTime())
        ? format(dateObj, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
    } catch (e) {
      safeDate = format(new Date(), 'yyyy-MM-dd');
    }
    
    const safeClassName = className.replace(/\s+/g, '_');
    const pdfFileName = `Asistencia_${safeClassName}_${safeDate}.pdf`;
    doc.save(pdfFileName);

    return Promise.resolve();
  } catch (error) {
    console.error("Error generando PDF:", error);
    return Promise.reject(error);
  }
};

/**
 * Generates a PDF with the class details and student list
 */
export const generateClassDetailsPDF = async (
  className: string,
  teacherName: string,
  weeklyHours: number,
  students: Student[],
  reportDate: string = new Date().toISOString().split('T')[0] // Default to today
): Promise<void> => {
  try {
    // Create new PDF document using letter size paper
    const doc = new jsPDF({
      format: 'letter', // Tamaño carta (215.9 x 279.4 mm)
      orientation: 'portrait',
      unit: 'mm'
    });
    
    // Format the provided date instead of using current date
    let dateObj: Date;
    let formattedDate: string;
    
    try {
      if (reportDate && !isNaN(new Date(reportDate).getTime())) {
        dateObj = new Date(reportDate);
        formattedDate = format(dateObj, "d 'de' MMMM yyyy", { locale: es });
      } else {
        dateObj = new Date();
        formattedDate = format(dateObj, "d 'de' MMMM yyyy", { locale: es });
      }
    } catch (error) {
      dateObj = new Date();
      formattedDate = format(dateObj, "d 'de' MMMM yyyy", { locale: es });
    }

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30); // Gris muy oscuro
    doc.text('Detalles de la Clase', 14, 20);

    // Class Information
    doc.setFontSize(12);
    doc.setTextColor(0); // Black color
    doc.text(`Clase: ${className}`, 14, 35);
    doc.text(`Profesor: ${teacherName}`, 14, 43);
    doc.text(`Horas semanales: ${weeklyHours}`, 14, 51);
    doc.text(`Fecha del reporte: ${formattedDate}`, 14, 59);
    
    // Students Table
    const tableColumn = ["#", "Nombre del Estudiante", "Email", "Teléfono", "Instrumento"];
    const tableRows = students.map((student, index) => [
      index + 1,
      `${student.nombre} ${student.apellido}`,
      student.email || 'No registrado',
      student.phone || student.tlf || 'No registrado',
      student.instrumento || 'No especificado'
    ]);

    // Add students table with grayscale
    doc.autoTable({
      startY: 70,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { 
        fillColor: [50, 50, 50], // Gris oscuro
        textColor: 255 // Blanco
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto',
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 10 },  // #
        1: { cellWidth: 50 },  // Nombre
        2: { cellWidth: 45 },  // Email
        3: { cellWidth: 35 },  // Teléfono
        4: { cellWidth: 40 }   // Instrumento
      },
      alternateRowStyles: { 
        fillColor: [240, 240, 240] // Gris muy claro para filas alternas
      }
    });

    // Save the PDF
    let safeDate;
    try {
      safeDate = dateObj instanceof Date && !isNaN(dateObj.getTime())
        ? format(dateObj, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
    } catch (e) {
      safeDate = format(new Date(), 'yyyy-MM-dd');
    }
    
    const safeClassName = className.replace(/\s+/g, '_');
    const pdfFileName = `Lista_Alumnos_${safeClassName}_${safeDate}.pdf`;
    doc.save(pdfFileName);

  } catch (error) {
    console.error("Error generating class details PDF:", error);
    return Promise.reject(error);
  }
};
