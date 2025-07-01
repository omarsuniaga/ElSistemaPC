// src/utils/pdfService.ts
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import html2pdf from "html2pdf.js"

// Opciones comunes para la generación de PDF
interface PdfCommonOptions {
  filename?: string
  logoUrl?: string // URL o ruta base64 de la imagen del logo
  institutionName?: string
  footerText?: string
  orientation?: "p" | "portrait" | "l" | "landscape"
  format?: string | number[] // ej. 'a4', [width, height]
  unit?: "pt" | "mm" | "cm" | "in"
}

// Opciones específicas para generar PDF desde HTML
interface HtmlToPdfOptions extends PdfCommonOptions {
  elementId: string
  pagebreak?: {
    mode?: string | string[]
    before?: string | string[]
    after?: string | string[]
    avoid?: string | string[]
  }
  image?: {type?: string; quality?: number}
  html2canvas?: any // Opciones para html2canvas
  jsPDF?: any // Opciones específicas para jsPDF al usar html2pdf
  margin?: number | number[]
}

// Opciones específicas para generar PDF tabulares
interface TableToPdfOptions extends PdfCommonOptions {
  title?: string
  columns: any[] // Definición de columnas para jspdf-autotable
  data: any[][] // Datos para la tabla
  startY?: number
  headStyles?: any
  bodyStyles?: any
  alternateRowStyles?: any
  columnStyles?: any
  theme?: "striped" | "grid" | "plain"
  showHead?: "everyPage" | "firstPage" | "never"
  tableWidth?: "auto" | "wrap" | number
  headerText?: string // Texto adicional para el encabezado
  teacherName?: string // Nombre del maestro
  className?: string // Nombre de la clase
  schedule?: string // Horario de la clase
  totalStudents?: number // Total de estudiantes
  stats?: {
    presentes: number
    ausentes: number
    tardanzas: number
    justificados: number
  }
  observations?: string // Observaciones de la clase
  didDrawCell?: (data: any, doc: any) => boolean | void // Callback para personalizar celdas
}

/**
 * Genera un PDF a partir de un elemento HTML.
 * @param options - Opciones para la generación del PDF.
 */
export const generarPdfDesdeHtml = async (options: HtmlToPdfOptions): Promise<void> => {
  const {
    elementId,
    filename = "documento.pdf",
    pagebreak,
    image,
    html2canvas: html2canvasOps,
    jsPDF: jsPdfOps,
    margin = 10,
  } = options

  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Elemento con id '${elementId}' no encontrado.`)
    throw new Error(`Elemento con id '${elementId}' no encontrado.`)
  }

  // Forzar tema claro para la exportación a PDF
  const originalTheme = document.documentElement.classList.contains("dark")
  if (originalTheme) {
    document.documentElement.classList.remove("dark")
  }

  try {
    const worker = html2pdf()
      .from(element)
      .set({
        margin,
        filename,
        image: image
          ? {type: image.type || "jpeg", quality: image.quality || 0.98}
          : {type: "jpeg", quality: 0.98},
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          backgroundColor: "#ffffff",
          ...html2canvasOps,
        },
        jsPDF: {unit: "pt", format: "a4", orientation: "portrait", ...jsPdfOps},
        pagebreak: {mode: ["css", "legacy"], avoid: ".no-break"},
      })

    // TODO: Añadir cabecera y pie de página si se proporcionan en options (logoUrl, institutionName, footerText)
    // Esto podría requerir manipular el objeto jsPDF directamente antes de guardar.

    await worker.save()
  } catch (error) {
    console.error("Error generando PDF desde HTML:", error)
    throw error
  } finally {
    // Restaurar tema original
    if (originalTheme) {
      document.documentElement.classList.add("dark")
    }
  }
}

/**
 * Genera un PDF tabular con diseño profesional mejorado.
 * @param options - Opciones para la generación del PDF.
 */
export const generarPdfTabla = async (options: TableToPdfOptions): Promise<void> => {
  const {
    title = "Reporte",
    columns,
    data,
    filename = "reporte.pdf",
    startY = 80,
    logoUrl,
    institutionName = "Academia de Música",
    footerText = `Generado el ${new Date().toLocaleDateString()}`,
    orientation = "p",
    format = "a4",
    unit = "pt",
    headStyles = {fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold"},
    bodyStyles = {},
    alternateRowStyles = {fillColor: [240, 240, 240]},
    columnStyles = {},
    theme = "striped",
    showHead = "everyPage",
    tableWidth = "auto",
    ...extraOptions
  } = options

  try {
    const doc = new jsPDF({orientation, unit, format})
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Función para dibujar el encabezado estilo Google Sheet
    const drawProfessionalHeader = async (doc: jsPDF, pageWidth: number) => {
      const leftMargin = 20
      const rightMargin = pageWidth - 20
      const headerY = 20

      // Intentar cargar y dibujar el logo (esquina superior izquierda)
      if (logoUrl) {
        try {
          const logoImg = new Image()
          logoImg.crossOrigin = "anonymous"

          await new Promise((resolve, reject) => {
            logoImg.onload = () => resolve(logoImg)
            logoImg.onerror = () => reject(new Error("Error loading logo"))
            logoImg.src = logoUrl
          })

          // Dibujar logo en esquina superior izquierda (tamaño reducido)
          const logoSize = 25
          doc.addImage(logoImg, "JPEG", leftMargin, headerY, logoSize, logoSize)
        } catch (error) {
          console.warn("Error cargando logo:", error)
        }
      }

      // Título principal centrado (FUNDACIÓN PARA LA EXPANSIÓN...)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)

      const titleLines = ["FUNDACIÓN PARA LA EXPANSIÓN", "CULTURAL Y ARTÍSTICA DE PUNTA", "CANA"]

      let yPosition = headerY + 10
      titleLines.forEach((line) => {
        const textWidth = doc.getTextWidth(line)
        const centerX = pageWidth / 2 - textWidth / 2
        doc.text(line, centerX, yPosition)
        yPosition += 5
      })

      // FUNEYCA PC con un poco más de espacio
      yPosition += 3
      doc.setFontSize(14)
      const funeyca = "FUNEYCA PC"
      const funeycaWidth = doc.getTextWidth(funeyca)
      const funeycaCenterX = pageWidth / 2 - funeycaWidth / 2
      doc.text(funeyca, funeycaCenterX, yPosition)

      // Campos de fecha y entrada (lado derecho)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      const dateFieldsX = rightMargin - 80
      doc.text("FECHA:", dateFieldsX, headerY + 15)
      doc.text("/", dateFieldsX + 35, headerY + 15)
      doc.text("/", dateFieldsX + 50, headerY + 15)

      doc.text("ENTRADA:", dateFieldsX, headerY + 30)

      // Líneas para llenar
      doc.setLineWidth(0.5)
      doc.setDrawColor(0, 0, 0)
      doc.line(dateFieldsX + 25, headerY + 17, dateFieldsX + 33, headerY + 17) // Día
      doc.line(dateFieldsX + 37, headerY + 17, dateFieldsX + 48, headerY + 17) // Mes
      doc.line(dateFieldsX + 52, headerY + 17, dateFieldsX + 75, headerY + 17) // Año
      doc.line(dateFieldsX + 35, headerY + 32, dateFieldsX + 75, headerY + 32) // Entrada

      // Título del reporte (centrado) si existe
      if (title) {
        yPosition += 15
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(60, 60, 60)
        doc.text(title, pageWidth / 2, yPosition, {align: "center"})
        yPosition += 15
      }

      return yPosition + 10 // Retornar posición Y para continuar el contenido
    }

    // Dibujar encabezado profesional
    let currentY = await drawProfessionalHeader(doc, pageWidth)

    // Si hay información adicional del encabezado (sección azul + información)
    if (extraOptions.headerText) {
      const headerLines = extraOptions.headerText.split("\n")
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)

      let lineIndex = 0
      for (let i = 0; i < headerLines.length; i++) {
        const line = headerLines[i].trim()

        // Si la línea comienza con "SALÓN:", crear la barra azul
        if (line.startsWith("SALÓN:")) {
          // Dibujar rectángulo azul de fondo
          doc.setFillColor(41, 98, 255) // Azul como en el Google Sheet
          doc.rect(25, currentY + lineIndex * 12 - 3, pageWidth - 50, 12, "F")

          // Texto blanco sobre el fondo azul
          doc.setTextColor(255, 255, 255)
          doc.setFont("helvetica", "bold")
          doc.text(line, 30, currentY + lineIndex * 12 + 5)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(60, 60, 60)
        } else {
          // Texto normal
          doc.text(line, 25, currentY + lineIndex * 12)
        }
        lineIndex++
      }
      currentY += headerLines.length * 12 + 15
    }

    // Configurar la tabla con el estilo profesional
    autoTable(doc, {
      head: [columns.map((col: any) => col.header || col.title || col.dataKey)],
      body: data,
      startY: Math.max(startY, currentY),
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        fontSize: 11,
        ...headStyles,
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.5,
        ...bodyStyles,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
        ...alternateRowStyles,
      },
      columnStyles,
      theme,
      showHead,
      tableWidth,
      didDrawCell: (data: any) => {
        if (extraOptions.didDrawCell) {
          // Pasar los dos parámetros que espera la función
          return extraOptions.didDrawCell(data, doc)
        }
      },
      didDrawPage: (data) => {
        // Pie de página profesional
        const footerY = pageHeight - 30

        // Línea superior del pie
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.line(20, footerY - 10, pageWidth - 20, footerY - 10)

        // Texto del pie de página
        if (footerText) {
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 100)
          doc.text(footerText, 25, footerY)
        }

        // Numeración de páginas
        const totalPages = (doc as any).internal.getNumberOfPages()
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Página ${data.pageNumber} de ${totalPages}`, pageWidth - 25, footerY, {
          align: "right",
        })
      },
    })

    doc.save(filename)
  } catch (error) {
    console.error("Error generando PDF tabular:", error)
    throw error
  }
}

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
