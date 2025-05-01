// Función para generar PDF con html2pdf
export async function generatePDF(element, fileName, options = {}) {
  try {
    // Importar la librería html2pdf dinámicamente
    const html2pdf = (await import('html2pdf.js')).default;

    // Configuraciones por defecto para PDF
    const defaultOptions = {
      margin: [15, 15],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape'
      },
      // Configuración de saltos de página - usamos CSS para controlar los saltos
      pagebreak: {
        mode: ['css', 'legacy'],
        after: '.page-break-after',
        avoid: '.page-break-avoid'
      }
    };

    // Fusionar opciones
    const mergedOptions = { ...defaultOptions, ...options };

    // Preparar el elemento para la exportación - añadir clase temporal
    element.classList.add('pdf-export');

    // Añadir clase de salto de página a cada clase
    const classElements = element.querySelectorAll('.mb-10');
    classElements.forEach((el, index) => {
      if (index < classElements.length - 1) {
        el.classList.add('page-break-after');
      }
    });

    // Generar el PDF
    console.log('Iniciando generación del PDF con html2pdf...');
    
    return html2pdf()
      .from(element)
      .set(mergedOptions)
      .save()
      .then(() => {
        // Limpiar clases temporales
        element.classList.remove('pdf-export');
        classElements.forEach(el => {
          el.classList.remove('page-break-after');
        });
        
        console.log('PDF generado exitosamente');
        return true;
      });
      
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
}
