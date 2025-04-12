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
 * @param date - Fecha de la asistencia (formato ISO)
 * @returns Promesa que se resuelve cuando el PDF se ha generado y guardado
 */
export const generateAttendancePDF = async (
  students: Student[],
  records: Record<string, string>,
  observations: string = 'Sin observaciones.',
  className: string,
  date: string
): Promise<void> => {
  try {
    // Formatear fecha para mostrar
    const formattedDate = format(new Date(date), "d 'de' MMMM yyyy", { locale: es });
    
    // Crear instancia de jsPDF
    const doc = new jsPDF();

    // --- Diseño del PDF ---

    // Título Principal
    doc.setFontSize(18);
    doc.text('Reporte de Asistencia', 14, 22);

    // Información de la Clase y Fecha
    doc.setFontSize(11);
    doc.setTextColor(100); // Gris
    doc.text(`Clase: ${className}`, 14, 30);
    doc.text(`Fecha: ${formattedDate}`, 14, 36);

    // Tabla de Asistencia
    const tableColumn = ["#", "Alumno", "Estado"];
    const tableRows: (string | number)[][] = [];

    students.forEach((student, index) => {
      const studentData = [
        index + 1,
        `${student.nombre} ${student.apellido}`,
        records[student.id] || 'No registrado' // Estado de asistencia
      ];
      tableRows.push(studentData);
    });

    // Usar autoTable importado directamente como función
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] }, // Color verde azulado
      styles: { fontSize: 10 },
    });

    // Sección de Observaciones
    const finalY = (doc as any).lastAutoTable.finalY || 70;
    doc.setFontSize(12);
    doc.setTextColor(0); // Negro
    doc.text('Observaciones del Maestro:', 14, finalY + 15);
    doc.setFontSize(10);
    doc.setTextColor(50); // Gris oscuro
    
    // Manejar textos largos
    const splitObservations = doc.splitTextToSize(observations, 180); // 180 = ancho máximo
    doc.text(splitObservations, 14, finalY + 22);

    // --- Fin Diseño ---

    // Guardar el PDF - nombre con clase y fecha
    const safeClassName = className.replace(/\s+/g, '_'); // Reemplaza espacios con guiones bajos
    const pdfFileName = `Asistencia_${safeClassName}_${date}.pdf`;
    doc.save(pdfFileName);

    return Promise.resolve();
  } catch (error) {
    console.error("Error generando PDF:", error);
    return Promise.reject(error);
  }
};
