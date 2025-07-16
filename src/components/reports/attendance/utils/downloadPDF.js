/**
 * Función especializada para generar PDFs desde elementos HTML
 * Utiliza html2pdf.js para convertir elementos DOM a PDF
 */

import html2pdf from 'html2pdf.js';

export async function generatePDF(element, filename, options = {}) {
  const defaultOptions = {
    margin: 1,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: false,
    },
    jsPDF: {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      before: '.pdf-page-break',
      avoid: '.page-break-avoid',
    },
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    await html2pdf().set(finalOptions).from(element).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Error al generar PDF: ${error.message}`);
  }
}
