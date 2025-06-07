// src/utils/pdfService.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2pdf from 'html2pdf.js';

// Opciones comunes para la generación de PDF
interface PdfCommonOptions {
  filename?: string;
  logoUrl?: string; // URL o ruta base64 de la imagen del logo
  institutionName?: string;
  footerText?: string;
  orientation?: 'p' | 'portrait' | 'l' | 'landscape';
  format?: string | number[]; // ej. 'a4', [width, height]
  unit?: 'pt' | 'mm' | 'cm' | 'in';
}

// Opciones específicas para generar PDF desde HTML
interface HtmlToPdfOptions extends PdfCommonOptions {
  elementId: string;
  pagebreak?: { mode?: string | string[], before?: string | string[], after?: string | string[], avoid?: string | string[] };
  image?: { type?: string, quality?: number };
  html2canvas?: any; // Opciones para html2canvas
  jsPDF?: any; // Opciones específicas para jsPDF al usar html2pdf
  margin?: number | number[];
}

// Opciones específicas para generar PDF tabulares
interface TableToPdfOptions extends PdfCommonOptions {
  title?: string;
  columns: any[]; // Definición de columnas para jspdf-autotable
  data: any[][]; // Datos para la tabla
  startY?: number;
  headStyles?: any;
  bodyStyles?: any;
  alternateRowStyles?: any;
  columnStyles?: any;
  theme?: 'striped' | 'grid' | 'plain';
  showHead?: 'everyPage' | 'firstPage' | 'never';
  tableWidth?: 'auto' | 'wrap' | number;
}

/**
 * Genera un PDF a partir de un elemento HTML.
 * @param options - Opciones para la generación del PDF.
 */
export const generarPdfDesdeHtml = async (options: HtmlToPdfOptions): Promise<void> => {
  const { 
    elementId, 
    filename = 'documento.pdf', 
    pagebreak, 
    image, 
    html2canvas: html2canvasOps, 
    jsPDF: jsPdfOps, 
    margin = 10 
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Elemento con id '${elementId}' no encontrado.`);
    throw new Error(`Elemento con id '${elementId}' no encontrado.`);
  }

  // Forzar tema claro para la exportación a PDF
  const originalTheme = document.documentElement.classList.contains('dark');
  if (originalTheme) {
    document.documentElement.classList.remove('dark');
  }

  try {
    const worker = html2pdf()
      .from(element)
      .set({
        margin: margin,
        filename: filename,
        image: image || { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, backgroundColor: '#ffffff', ...html2canvasOps },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait', ...jsPdfOps },
        pagebreak: pagebreak || { mode: ['css', 'legacy'], avoid: '.no-break' }
      });

    // TODO: Añadir cabecera y pie de página si se proporcionan en options (logoUrl, institutionName, footerText)
    // Esto podría requerir manipular el objeto jsPDF directamente antes de guardar.

    await worker.save();
  } catch (error) {
    console.error('Error generando PDF desde HTML:', error);
    throw error;
  } finally {
    // Restaurar tema original
    if (originalTheme) {
      document.documentElement.classList.add('dark');
    }
  }
};

/**
 * Genera un PDF tabular.
 * @param options - Opciones para la generación del PDF.
 */
export const generarPdfTabla = async (options: TableToPdfOptions): Promise<void> => {
  const {
    title = 'Reporte',
    columns,
    data,
    filename = 'reporte.pdf',
    startY = 80, // Aumentado para dejar espacio para el título y logo
    logoUrl,
    institutionName = 'Academia de Música',
    footerText = `Generado el ${new Date().toLocaleDateString()}`,
    orientation = 'p',
    format = 'a4',
    unit = 'pt',
    headStyles = { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    bodyStyles = {},
    alternateRowStyles = { fillColor: [240, 240, 240] },
    columnStyles = {},
    theme = 'striped',
    showHead = 'everyPage',
    tableWidth = 'auto'
  } = options;

  try {
    const doc = new jsPDF({ orientation, unit, format });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Añadir Logo e Nombre de Institución si se proporcionan
    let currentY = 20;
    if (logoUrl) {
      try {
        // Asumiendo que logoUrl es una URL o base64. Necesitarás manejar la carga de imágenes.
        // Para simplificar, este ejemplo asume que es una imagen ya cargada o base64.
        // const imgData = await fetch(logoUrl).then(res => res.blob()).then(blob => URL.createObjectURL(blob)); // Ejemplo para URL
        // doc.addImage(imgData, 'PNG', 15, currentY, 40, 40); // Ajusta tamaño y posición
        // currentY += 50;
        // Por ahora, solo un placeholder si se necesita cargar la imagen de forma asíncrona
        console.warn('La carga dinámica de logos en generarPdfTabla necesita implementación.');
      } catch (e) {
        console.error('Error al cargar el logo:', e);
      }
    }
    if (institutionName) {
      doc.setFontSize(16);
      doc.text(institutionName, pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
    }

    // Añadir Título del Reporte
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10; // Espacio antes de la tabla, ajustar según sea necesario

    autoTable(doc, {
      head: [columns.map(col => col.header || col.title || col.dataKey)], // Asegurar que head es un array de arrays
      body: data,
      startY: Math.max(startY, currentY), // Asegurar que la tabla no sobreponga el título/logo
      headStyles,
      bodyStyles,
      alternateRowStyles,
      columnStyles,
      theme,
      showHead,
      tableWidth,
      didDrawPage: (data) => {
        // Pie de página
        if (footerText) {
          doc.setFontSize(10);
          doc.text(footerText, data.settings.margin.left, pageHeight - 10);
        }
        // Numeración de páginas
        const pageCount = doc.internal.getNumberOfPages();
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth - data.settings.margin.right - 10, pageHeight - 10, {align: 'right'});
      }
    });

    doc.save(filename);
  } catch (error) {
    console.error('Error generando PDF tabular:', error);
    throw error;
  }
};

// Ejemplo de cómo se podrían definir las columnas para generarPdfTabla
// const ejemploColumnas = [
//   { header: 'ID', dataKey: 'id' },
//   { header: 'Nombre', dataKey: 'nombre' },
//   { header: 'Email', dataKey: 'email' }
// ];

// Ejemplo de datos
// const ejemploDatos = [
//   { id: 1, nombre: 'Juan Perez', email: 'juan@example.com' },
//   { id: 2, nombre: 'Ana Gomez', email: 'ana@example.com' }
// ];

// Para usarlo:
// generarPdfTabla({
//   title: 'Lista de Usuarios',
//   columns: ejemploColumnas,
//   data: ejemploDatos.map(item => Object.values(item)), // jspdf-autotable espera un array de arrays para el body
//   filename: 'usuarios.pdf'
// });