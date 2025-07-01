// src/components/downloadPDF.js
import {generarPdfDesdeHtml} from "../utils/pdfService"

/**
 * Genera un PDF a partir de un elemento HTML utilizando el servicio pdfService.
 * @param {HTMLElement} element - El elemento HTML a convertir.
 * @param {string} fileName - El nombre del archivo PDF de salida.
 * @param {object} options - Opciones adicionales para la generación del PDF (ver HtmlToPdfOptions en pdfService.ts).
 */
export async function generatePDF(element, fileName, options = {}) {
  if (!element || !(element instanceof HTMLElement)) {
    console.error("Error en generatePDF: El primer argumento debe ser un elemento HTML válido.")
    throw new Error("Elemento HTML no válido proporcionado.")
  }
  if (typeof fileName !== "string" || fileName.trim() === "") {
    console.error(
      "Error en generatePDF: El segundo argumento debe ser un nombre de archivo válido."
    )
    throw new Error("Nombre de archivo no válido proporcionado.")
  }

  // El ID del elemento es necesario para pdfService
  // Si el elemento no tiene ID, se le asigna uno temporalmente
  let tempId = null
  if (!element.id) {
    tempId = `pdf-export-${Date.now()}`
    element.id = tempId
  }

  const pdfOptions = {
    elementId: element.id,
    filename: fileName,
    // Mapeo de opciones de html2pdf.js a las opciones de pdfService
    // Las opciones por defecto de pdfService ya cubren la mayoría de los casos
    margin:
      options.margin !== undefined
        ? Array.isArray(options.margin)
          ? options.margin.map((m) => m / 10)
          : options.margin / 10
        : undefined, // Convertir mm a pt (aprox 1mm ~ 2.83pt, aquí simplificado a 10 para margen)
    image: options.image,
    html2canvas: options.html2canvas,
    jsPDF: options.jsPDF,
    pagebreak: options.pagebreak,
    ...options, // Permite pasar otras opciones compatibles con HtmlToPdfOptions
  }

  try {
    console.log(`Iniciando generación del PDF: ${fileName}`)
    await generarPdfDesdeHtml(pdfOptions)
    console.log(`PDF '${fileName}' generado exitosamente.`)
    return true
  } catch (error) {
    console.error(`Error al generar PDF '${fileName}':`, error)
    // No relanzar el error aquí para mantener la firma original de la función si es necesario,
    // pero se podría considerar relanzar para un manejo de errores más consistente.
    return false // Opcional: devolver false en caso de error
  } finally {
    // Si se asignó un ID temporal, se elimina
    if (tempId && document.getElementById(tempId)) {
      document.getElementById(tempId).removeAttribute("id")
    }
  }
}
