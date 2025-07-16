import { ref } from 'vue';

/**
 * Composable para manejar las exportaciones del informe de asistencia
 */
export function useAttendanceExport() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Formatear fecha para archivos
  const formatDateShort = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  // Obtener símbolo de estado
  const getStatusSymbol = (status: string): string => {
    switch (status) {
    case 'P':
      return 'P';
    case 'A':
      return 'A';
    case 'T':
      return 'T';
    case 'J':
      return 'J';
    default:
      return '-';
    }
  };

  // Descargar PDF
  const downloadPDF = async (from: string, to: string) => {
    const reportElement = document.getElementById('printable-report');

    if (!reportElement) {
      error.value = 'No se pudo encontrar el elemento del informe';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // @ts-ignore - Importación dinámica
      const { generatePDF } = await import('../utils/downloadPDF.js');

      const fileName = `informe-asistencia-${from}-${to}.pdf`;

      // Agregar marcadores de salto de página
      const classElements = reportElement.querySelectorAll('.mb-10');
      classElements.forEach((el) => {
        el.classList.add('pdf-page-break');
      });

      const options = {
        filename: fileName,
        jsPDF: { format: 'A4' },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: true,
          letterRendering: true,
          allowTaint: false,
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          before: '.pdf-page-break',
          avoid: '.page-break-avoid',
        },
      };

      await generatePDF(reportElement, fileName, options);

      // Limpiar clases agregadas
      classElements.forEach((el) => el.classList.remove('pdf-page-break'));
    } catch (err) {
      console.error('Error al generar PDF:', err);
      error.value = `Error al generar PDF: ${err instanceof Error ? err.message : 'Error desconocido'}`;
    } finally {
      loading.value = false;
    }
  };

  // Exportar CSV
  const exportCSV = (classReports: any[], dateRange: string[], from: string, to: string) => {
    try {
      const headers = ['Clase', 'Estudiante', ...dateRange.map(formatDateShort), 'Observaciones'];
      const rows: string[][] = [];

      classReports.forEach((classData) => {
        classData.students.forEach((student: any) => {
          const row = [
            classData.className,
            student.name,
            ...dateRange.map((date) => getStatusSymbol(student.attendance[date])),
            student.observations,
          ];
          rows.push(row);
        });
      });

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `informe_asistencia_${from}_${to}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      error.value = 'Error al exportar CSV';
    }
  };

  // Exportar XLS
  const exportXLS = (classReports: any[], dateRange: string[], from: string, to: string) => {
    try {
      let htmlTable = '<table border="1">';

      // Encabezados
      htmlTable += '<tr><th>Clase</th><th>Estudiante</th>';
      dateRange.forEach((date) => {
        htmlTable += `<th>${formatDateShort(date)}</th>`;
      });
      htmlTable += '<th>Observaciones</th></tr>';

      // Filas
      classReports.forEach((classData) => {
        classData.students.forEach((student: any) => {
          htmlTable += `<tr><td>${classData.className}</td><td>${student.name}</td>`;
          dateRange.forEach((date) => {
            htmlTable += `<td>${getStatusSymbol(student.attendance[date])}</td>`;
          });
          htmlTable += `<td>${student.observations}</td></tr>`;
        });
      });

      htmlTable += '</table>';

      const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe_asistencia_${from}_${to}.xls`;
      link.click();
    } catch (err) {
      console.error('Error al exportar XLS:', err);
      error.value = 'Error al exportar XLS';
    }
  };

  return {
    loading,
    error,
    downloadPDF,
    exportCSV,
    exportXLS,
  };
}
