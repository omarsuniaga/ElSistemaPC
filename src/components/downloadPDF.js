// Función para generar PDF con html2pdf
export async function generatePDF(element, fileName, options = {}) {
  try {
    // Forzar tema claro eliminando modo oscuro
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
    // Asegurar que el elemento no tenga clases dark
    element.classList.remove('dark');
    // Importar la librería html2pdf dinámicamente
    const html2pdf = (await import('html2pdf.js')).default;

    // Configuraciones por defecto para PDF
    const defaultOptions = {
      margin: [5, 5, 5, 5], // [top, right, bottom, left] en mm
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        backgroundColor: '#ffffff' // Forzar fondo claro en PDF
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        // orientation: 'landscape'
      },
      // Configuración mejorada de saltos de página
      pagebreak: {
        mode: ['css', 'legacy'],
        before: '.pdf-page-break',
        avoid: '.page-break-avoid'
      }
    };

    // Fusionar opciones
    const mergedOptions = { ...defaultOptions, ...options };

    // Preparar el elemento para la exportación - añadir clase temporal
    element.classList.add('pdf-export');
    
    console.log('Iniciando generación del PDF con configuración horizontal...');
    
    // Para mejorar el rendimiento y evitar problemas con elementos anidados
    const worker = html2pdf()
      .from(element)
      .set(mergedOptions);
      
    // Si hay muchos elementos, usar paginación por lotes
    if (element.querySelectorAll('table').length > 3) {
      console.log('Detectadas múltiples tablas. Usando paginación por lotes...');
      return worker.toPdf().get('pdf').then((pdf) => {
        pdf.save();
        element.classList.remove('pdf-export');
        console.log('PDF generado exitosamente con paginación optimizada');
        return true;
      });
    } else {
      // Proceso estándar para pocos elementos
      return worker.save().then(() => {
        element.classList.remove('pdf-export');
        console.log('PDF generado exitosamente');
        return true;
      });
    }
      
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
}
