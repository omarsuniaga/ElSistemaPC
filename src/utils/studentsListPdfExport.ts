import {format} from "date-fns"
import es from "date-fns/locale/es"
import {generarPdfTabla, type TableColumn} from "./pdfService" // Ajustar ruta si es necesario

// Simple date formatting function
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

interface Student {
  id: string
  name: string
  age?: number
  instrument?: string
  email?: string
  phone?: string
}

interface ClassDetails {
  className: string
  teacherName: string
  students: Student[]
}

/**
 * Generate a basic PDF with the list of students in a class using pdfService
 */
export const generateStudentListPDF = async (classDetails: ClassDetails): Promise<void> => {
  try {
    const title = `Lista de Estudiantes - ${classDetails.className}`
    const fileName = `lista_estudiantes_${classDetails.className.replace(/\s+/g, "_")}.pdf`

    const columns: TableColumn[] = [
      {header: "#", dataKey: "numero"},
      {header: "Nombre", dataKey: "name"},
      {header: "Edad", dataKey: "age"},
      {header: "Instrumento", dataKey: "instrument"},
    ]

    const data = classDetails.students.map((student, index) => ({
      numero: index + 1,
      name: student.name,
      age: student.age?.toString() || "N/A",
      instrument: student.instrument || "N/A",
    }))

    const headerText = `Profesor: ${classDetails.teacherName}\nFecha: ${formatDate(new Date())}\nTotal estudiantes: ${classDetails.students.length}`

    await generarPdfTabla({
      title,
      fileName,
      columns,
      data,
      headerText,
      startY: 45,
      headStyles: {fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold"},
      alternateRowStyles: {fillColor: [240, 240, 240]},
      bodyStyles: {fontSize: 10},
      pageSettings: {orientation: "portrait", format: "a4", unit: "mm"},
    })
  } catch (error) {
    console.error("Error generating student list PDF:", error)
    alert("Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.")
  }
}

/**
 * Generate a detailed PDF with class information and student details using pdfService
 */
export const generateClassDetailsPDF = async (
  className: string,
  teacherName: string,
  weeklyHours: number,
  students: Student[],
  reportDateInput: string = new Date().toISOString().split("T")[0] // Default to today
): Promise<void> => {
  try {
    const reportTitle = "Reporte de Clase"
    const safeClassName = className.replace(/\s+/g, "_")

    let parsedReportDate: Date
    try {
      parsedReportDate = new Date(reportDateInput)
      if (isNaN(parsedReportDate.getTime())) {
        parsedReportDate = new Date() // Fallback to current date if input is invalid
      }
    } catch (e) {
      parsedReportDate = new Date() // Fallback on parsing error
    }
    const formattedReportDateForFile = format(parsedReportDate, "yyyy-MM-dd")
    const formattedReportDateDisplay = formatDate(parsedReportDate)

    const fileName = `DetallesClase_${safeClassName}_${formattedReportDateForFile}.pdf`

    const columns: TableColumn[] = [
      {header: "#", dataKey: "numero"},
      {header: "Nombre", dataKey: "name"},
      {header: "Edad", dataKey: "age"},
      {header: "Instrumento", dataKey: "instrument"},
      {header: "Email", dataKey: "email"},
      {header: "Teléfono", dataKey: "phone"},
    ]

    const data = students.map((student, index) => ({
      numero: index + 1,
      name: student.name,
      age: student.age?.toString() || "N/A",
      instrument: student.instrument || "N/A",
      email: student.email || "N/A",
      phone: student.phone || "N/A",
    }))

    let headerText = `ACADEMIA DE MÚSICA\n${reportTitle}\n\nInformación de la Clase:\n`
    headerText += `Nombre de la clase: ${className}\n`
    headerText += `Profesor: ${teacherName}\n`
    headerText += `Horas semanales: ${weeklyHours} horas\n`
    headerText += `Total de estudiantes: ${students.length}\n`
    headerText += `Fecha del reporte: ${formattedReportDateDisplay}`

    let footerContent = ""
    if (students.length > 0) {
      footerContent += "\n\nEstadísticas:\nDistribución por instrumento:\n"
      const instruments = students.reduce<Record<string, number>>((acc, student) => {
        if (student.instrument) {
          acc[student.instrument] = (acc[student.instrument] || 0) + 1
        }
        return acc
      }, {})
      Object.entries(instruments).forEach(([instrument, count]) => {
        footerContent += `${instrument}: ${count} estudiante(s)\n`
      })
    }

    await generarPdfTabla({
      title: "", // El título principal ya está en el headerText
      fileName,
      columns,
      data,
      headerText,
      footerText: footerContent.trim() !== "" ? footerContent : undefined,
      startY: 60,
      headStyles: {fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold"},
      alternateRowStyles: {fillColor: [240, 240, 240]},
      bodyStyles: {fontSize: 10},
      columnStyles: {
        numero: {cellWidth: 10, halign: "center"},
        name: {cellWidth: 40},
      },
      pageSettings: {orientation: "portrait", format: "a4", unit: "mm"},
    })
  } catch (error) {
    console.error("Error generating class details PDF:", error)
    alert("Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.")
  }
}
