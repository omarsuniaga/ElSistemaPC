// src/utils/pdfExport.ts
// Usando la importación específica recomendada para jsPDF v3+
import { jsPDF } from 'jspdf';
// Importar autoTable como plugin
import autoTable from 'jspdf-autotable';
import type { Student } from '../modulos/Students/types/student';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
    // Formatear fecha para mostrar
    const formattedDate = format(new Date(date), "d 'de' MMMM yyyy", { locale: es });
    
    // Crear instancia de jsPDF
    const doc = new jsPDF();
    
    // --- Diseño del PDF ---
    
    // Cargar y añadir logo
    try {
      const logoPath = new URL('../assets/ElSistemaPCLogo.jpeg', import.meta.url).href;
      
      // Cargar imagen (necesitas esperar a que se cargue)
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Error al cargar el logo'));
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
    doc.setTextColor(0, 51, 102); // Azul oscuro institucional
    doc.setFont(undefined, 'bold');
    doc.text('El Sistema Punta Cana', 105, 15, { align: 'center' });
    
    // Enunciado (Reporte de Asistencia)
    doc.setFontSize(18);
    doc.text('Reporte de Asistencia', 105, 25, { align: 'center' });
    
    // Información básica del reporte
    doc.setFontSize(11);
    doc.setTextColor(60); // Gris oscuro
    doc.setFont(undefined, 'normal');
    doc.text(`Fecha: ${formattedDate}`, 14, 40);
    doc.text(`Clase: ${className}`, 14, 47);
    doc.text(`Profesor: ${teacherName}`, 14, 54);
    
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
    
    // Recuadros con estadísticas
    const boxWidth = 40;
    const boxHeight = 7;
    const boxY = 67;
    const margin = 5;
    
    // Función helper para dibujar cajas de estadísticas con colores
    const drawStatBox = (x: number, label: string, value: number, color: number[]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(x, boxY, boxWidth, boxHeight, 1, 1, 'F');
      doc.setTextColor(255); // Texto blanco
      doc.setFontSize(9);
      doc.text(`${label}: ${value}`, x + boxWidth/2, boxY + 4.5, { align: 'center' });
    };
    
    // Dibujar estadísticas con colores diferentes
    drawStatBox(14, 'Presentes', stats.presentes, [39, 174, 96]); // Verde
    drawStatBox(14 + boxWidth + margin, 'Ausentes', stats.ausentes, [231, 76, 60]); // Rojo
    drawStatBox(14 + (boxWidth + margin) * 2, 'Tardanzas', stats.tardanzas, [243, 156, 18]); // Amarillo
    drawStatBox(14 + (boxWidth + margin) * 3, 'Justificados', stats.justificados, [52, 152, 219]); // Azul
    
    // Tabla de Asistencia
    const tableColumn = ["N°", "Lista de Asistencia", "Estado"];
    const tableRows: (string | number)[][] = [];

    students.forEach((student, index) => {
      const studentName = `${student.nombre || ''} ${student.apellido || ''}`.trim();
      const attendanceStatus = records[student.id] || 'No registrado';
      
      tableRows.push([
        index + 1,
        studentName,
        attendanceStatus
      ]);
    });

    // Usar autoTable con estilos mejorados
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: boxY + boxHeight + 7, // Posición después de las estadísticas
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102], // Azul oscuro institucional
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
        // Colorear celdas de estado según el valor
        if (data.column.index === 2 && data.section === 'body') {
          const status = String(data.cell.text).toLowerCase();
          
          if (status.includes('presente')) {
            doc.setFillColor(220, 255, 220); // Verde claro
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(20, 120, 20); // Verde oscuro
            doc.text(String(data.cell.text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
              align: 'center',
              baseline: 'middle'
            });
            return false; // No dibujar el texto original
          } 
          else if (status.includes('ausente')) {
            doc.setFillColor(255, 220, 220); // Rojo claro
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(180, 20, 20); // Rojo oscuro
            doc.text(String(data.cell.text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
              align: 'center',
              baseline: 'middle'
            });
            return false; // No dibujar el texto original
          }
          else if (status.includes('tarde')) {
            doc.setFillColor(255, 243, 200); // Amarillo claro
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(180, 120, 10); // Naranja oscuro
            doc.text(String(data.cell.text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
              align: 'center',
              baseline: 'middle'
            });
            return false; // No dibujar el texto original
          }
          else if (status.includes('justificad')) {
            doc.setFillColor(210, 230, 255); // Azul claro
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(20, 80, 180); // Azul oscuro
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
          const studentName = `${student.nombre || ''} ${student.apellido || ''}`.trim();
          
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
    
    // Añadir pie de página con fecha de generación
    const generationDate = format(new Date(), "'Generado el' d 'de' MMMM yyyy 'a las' HH:mm", { locale: es });
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(generationDate, 105, 285, { align: 'center' });

    // --- Fin Diseño ---

    // Guardar el PDF - nombre con clase y fecha
    const safeClassName = className.replace(/\s+/g, '_');
    const formattedFileDate = date.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
    const pdfFileName = `Asistencia_${safeClassName}_${formattedFileDate}.pdf`;
    doc.save(pdfFileName);

    return Promise.resolve();
  } catch (error) {
    console.error("Error generando PDF:", error);
    return Promise.reject(error);
  }
};

/**
 * Generates a PDF with the class details and student list
 * @param className - Name of the class
 * @param teacherName - Name of the teacher
 * @param weeklyHours - Weekly hours of the class
 * @param students - List of students in the class
 * @returns Promise that resolves when the PDF has been generated and saved
 */
export const generateClassDetailsPDF = async (
  className: string,
  teacherName: string,
  weeklyHours: number,
  students: Student[]
): Promise<void> => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    const currentDate = format(new Date(), "d 'de' MMMM yyyy", { locale: es });

    // Title
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text('Detalles de la Clase', 14, 20);

    // Class Information
    doc.setFontSize(12);
    doc.setTextColor(0); // Black color
    doc.text(`Clase: ${className}`, 14, 35);
    doc.text(`Profesor: ${teacherName}`, 14, 43);
    doc.text(`Horas semanales: ${weeklyHours}`, 14, 51);
    doc.text(`Fecha de impresión: ${currentDate}`, 14, 59);    // Students Table
    const tableColumn = ["#", "Nombre del Estudiante", "Email", "Teléfono", "Instrumento"];
    const tableRows = students.map((student, index) => [
      index + 1,
      `${student.nombre} ${student.apellido}`,
      student.email || 'No registrado',
      student.phone || student.tlf || 'No registrado',
      student.instrumento || 'No especificado'
    ]);

    // Add students table
    doc.autoTable({
      startY: 70,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },      styles: {
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
      }
    });

    // Save the PDF
    const safeClassName = className.replace(/\s+/g, '_');
    const formattedDate = format(new Date(), 'yyyy-MM-dd');
    doc.save(`Lista_Alumnos_${safeClassName}_${formattedDate}.pdf`);

  } catch (error) {
    console.error("Error generating class details PDF:", error);
    return Promise.reject(error);
  }
};
