import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Simple date formatting function
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

interface Student {
  id: string;
  name: string;
  age?: number;
  instrument?: string;
  email?: string;
  phone?: string;
}

interface ClassDetails {
  className: string;
  teacherName: string;
  students: Student[];
}

/**
 * Generate a basic PDF with the list of students in a class
 */
export const generateStudentListPDF = async (classDetails: ClassDetails): Promise<void> => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    const title = `Lista de Estudiantes - ${classDetails.className}`;
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    // Add class information
    doc.setFontSize(12);
    doc.text(`Profesor: ${classDetails.teacherName}`, 14, 30);
    doc.text(`Fecha: ${formatDate(new Date())}`, 14, 36);
    doc.text(`Total estudiantes: ${classDetails.students.length}`, 14, 42);
    
    // Create table with student data
    const tableData = classDetails.students.map((student, index) => [
      (index + 1).toString(), // Add number
      student.name,
      student.age?.toString() || 'N/A',
      student.instrument || 'N/A'
    ]);
    
    // Add table to document
    autoTable(doc, {
      head: [['#', 'Nombre', 'Edad', 'Instrumento']],
      body: tableData,
      startY: 50,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 50 },
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`lista_estudiantes_${classDetails.className.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating student list PDF:', error);
    alert('Hubo un error al generar el PDF. Verifica que todas las dependencias estén instaladas.');
  }
};

/**
 * Generate a detailed PDF with class information and student details
 */
export const generateClassDetailsPDF = async (
  className: string,
  teacherName: string,
  weeklyHours: number,
  students: Student[]
): Promise<void> => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add header/logo
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255);
    doc.setFontSize(22);
    doc.text('ACADEMIA DE MÚSICA', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Reporte de Clase', pageWidth / 2, 30, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0);
    
    // Add class information
    doc.setFontSize(16);
    doc.text('Información de la Clase', 14, 50);
    
    doc.setFontSize(12);
    const classInfo = [
      ['Nombre de la clase:', className],
      ['Profesor:', teacherName],
      ['Horas semanales:', `${weeklyHours} horas`],
      ['Total de estudiantes:', `${students.length}`],
      ['Fecha del reporte:', formatDate(new Date())]
    ];
    
    let yPos = 60;
    classInfo.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, 14, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(value.toString(), 70, yPos);
      yPos += 8;
    });
    
    // Add students table
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Lista de Estudiantes', 14, yPos + 10);
    
    const tableData = students.map((student, index) => [
      (index + 1).toString(),
      student.name,
      student.age?.toString() || 'N/A',
      student.instrument || 'N/A',
      student.email || 'N/A',
      student.phone || 'N/A'
    ]);
    
    autoTable(doc, {
      head: [['#', 'Nombre', 'Edad', 'Instrumento', 'Email', 'Teléfono']],
      body: tableData,
      startY: yPos + 15,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
      },
    });
    
    // Add statistics section if needed
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    
    if (students.length > 0) {
      // Add simple statistics
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Estadísticas', 14, finalY + 15);
      
      // Get instrument distribution
      const instruments = students.reduce<Record<string, number>>((acc, student) => {
        if (student.instrument) {
          acc[student.instrument] = (acc[student.instrument] || 0) + 1;
        }
        return acc;
      }, {});
      
      let statsY = finalY + 25;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Distribución por instrumento:', 14, statsY);
      doc.setFont(undefined, 'normal');
      
      statsY += 8;
      Object.entries(instruments).forEach(([instrument, count]) => {
        doc.text(`${instrument}: ${count} estudiante(s)`, 20, statsY);
        statsY += 6;
      });
    }
    
    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`reporte_clase_${className.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating class details PDF:', error);
    alert('Hubo un error al generar el PDF. Verifica que todas las dependencias estén instaladas.');
  }
};
