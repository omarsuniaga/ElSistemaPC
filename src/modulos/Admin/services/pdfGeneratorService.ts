import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {format} from "date-fns"
import {es} from "date-fns/locale"

interface PDFData {
  reportType: string
  fields: string[]
  filters: any
  options: any
  data: any[]
  institutionalConfig: any
  tempLogo?: string | null
}

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export class PDFGeneratorService {
  private doc: jsPDF
  private currentY: number = 0
  private pageWidth: number = 0
  private pageHeight: number = 0
  private margin: number = 20

  constructor(
    orientation: "portrait" | "landscape" = "portrait",
    pageSize: "letter" | "a4" | "legal" | "tabloid" = "letter"
  ) {
    this.doc = new jsPDF({
      orientation,
      unit: "mm",
      format: pageSize,
    })
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.currentY = this.margin
  }

  async generatePDF(pdfData: PDFData): Promise<jsPDF> {
    try {
      // Configurar fuente y colores
      this.setupStyles()

      // Agregar encabezado si está habilitado
      if (pdfData.options.includeHeader) {
        const institutionalTitle = pdfData.institutionalConfig?.title || "ACADEMIA DE MÚSICA"
        const reportTitle = this.getReportTitle(pdfData.reportType)
        const filterInfo = this.getFilterSummary(pdfData.filters)

        await this.addHeader(
          institutionalTitle,
          reportTitle,
          pdfData.options.includeLogo,
          pdfData.institutionalConfig?.logoUrl || pdfData.tempLogo,
          pdfData.options.includeDate,
          filterInfo
        )
      }

      // Agregar título del reporte
      this.addReportTitle(pdfData.reportType)

      // Agregar información de filtros si hay
      if (this.hasActiveFilters(pdfData.filters)) {
        this.addFiltersInfo(pdfData.filters)
      }

      // Agregar estadísticas si está habilitado
      if (pdfData.options.includeStats) {
        this.currentY = this.addStatistics(pdfData.data, this.currentY)
      }

      // Agregar tabla de datos
      if (pdfData.reportType.startsWith("schedule_")) {
        this.addScheduleReport(pdfData.data, pdfData.reportType)
      } else {
        this.addDataTable(pdfData.data, pdfData.fields, pdfData.reportType, pdfData.options)
      }

      // Agregar pie de página
      this.addFooter(pdfData.options.includeDate)

      return this.doc
    } catch (error) {
      console.error("Error generando PDF:", error)
      throw error
    }
  }

  private setupStyles() {
    // Configurar fuentes
    this.doc.setFont("helvetica")
    this.doc.setFontSize(12)
  }

  private getReportTitle(reportType: string): string {
    const titles: {[key: string]: string} = {
      by_class: "Reporte por Clase",
      by_teacher: "Reporte por Maestro",
      by_day: "Reporte por Día",
      all_students: "Listado Completo de Estudiantes",
      schedule_by_teacher: "Horarios por Maestro",
      schedule_by_student: "Horarios por Alumno",
      schedule_by_day: "Horarios por Día",
      schedule_by_class: "Horarios por Clase",
      schedule_matrix: "Matriz de Horarios",
    }
    return titles[reportType] || "Reporte de Estudiantes"
  }

  private getFilterSummary(filters: any): string {
    const filterTexts = []

    if (filters.classId) {
      filterTexts.push("Clase específica")
    }

    if (filters.teacherId) {
      filterTexts.push("Maestro específico")
    }

    if (filters.day) {
      filterTexts.push(`Día: ${filters.day}`)
    }

    if (filters.status) {
      filterTexts.push(`Estado: ${filters.status === "active" ? "Activos" : "Inactivos"}`)
    }

    if (filters.ageRange?.min !== null || filters.ageRange?.max !== null) {
      const min = filters.ageRange?.min || 0
      const max = filters.ageRange?.max || 100
      filterTexts.push(`Edad: ${min}-${max} años`)
    }

    return filterTexts.length > 0 ? `Filtros: ${filterTexts.join(", ")}` : ""
  }

  private loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject("Could not get canvas context")
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.onerror = () => reject("Failed to load image")
      img.crossOrigin = "anonymous"
      img.src = url
    })
  }

  /**
   * Añade un encabezado profesional al PDF
   */
  public async addHeader(
    institutionalTitle: string,
    reportTitle: string,
    includeLogo: boolean = true,
    logoUrl?: string,
    includeDate: boolean = true,
    filterInfo?: string
  ): Promise<number> {
    const pageWidth = this.doc.internal.pageSize.width
    let yPosition = 20

    // Add logo if enabled and available
    if (includeLogo && logoUrl) {
      try {
        const logoBase64 = await this.loadImageAsBase64(logoUrl)
        this.doc.addImage(logoBase64, "JPEG", 20, yPosition - 5, 25, 25)
      } catch (error) {
        console.warn("Could not load logo for PDF:", error)
      }
    }

    // Main title
    this.doc.setFontSize(22)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(33, 37, 41)
    this.doc.text(institutionalTitle, pageWidth / 2, yPosition + 8, {align: "center"})

    yPosition += 18

    // Report title
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(108, 117, 125)
    this.doc.text(reportTitle, pageWidth / 2, yPosition, {align: "center"})

    yPosition += 12

    // Date and additional info
    if (includeDate) {
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(108, 117, 125)

      const currentDate = new Date()
      const formattedDate = currentDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const formattedTime = currentDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })

      this.doc.text(
        `Generado el: ${formattedDate} a las ${formattedTime}`,
        pageWidth / 2,
        yPosition,
        {align: "center"}
      )
      yPosition += 6

      if (filterInfo) {
        this.doc.text(filterInfo, pageWidth / 2, yPosition, {align: "center"})
        yPosition += 6
      }
    }

    // Decorative line separator
    this.doc.setLineWidth(0.8)
    this.doc.setDrawColor(52, 144, 220)
    this.doc.line(20, yPosition + 3, pageWidth - 20, yPosition + 3)

    this.doc.setTextColor(0, 0, 0)
    return yPosition + 12
  }

  private addReportTitle(reportType: string) {
    const titles: {[key: string]: string} = {
      students: "Reporte de Estudiantes",
      classes: "Reporte de Clases",
      teachers: "Reporte de Maestros",
      attendance: "Reporte de Asistencias",
      performance: "Reporte de Rendimiento",
    }

    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(41, 128, 185) // Azul
    this.doc.text(titles[reportType] || "Reporte", this.margin, this.currentY)
    this.currentY += 12
  }

  private hasActiveFilters(filters: any): boolean {
    return (
      filters.classId ||
      filters.teacherId ||
      filters.instrumentId ||
      filters.ageRange.min > 0 ||
      filters.ageRange.max < 100 ||
      filters.enrollmentDate.start ||
      filters.enrollmentDate.end ||
      filters.status !== "all"
    )
  }

  private addFiltersInfo(filters: any) {
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "italic")
    this.doc.setTextColor(149, 165, 166) // Gris claro

    const filterTexts = []
    if (filters.classId) filterTexts.push("Clase específica")
    if (filters.teacherId) filterTexts.push("Maestro específico")
    if (filters.instrumentId) filterTexts.push("Instrumento específico")
    if (filters.ageRange.min > 0 || filters.ageRange.max < 100) {
      filterTexts.push(`Edad: ${filters.ageRange.min}-${filters.ageRange.max} años`)
    }
    if (filters.status !== "all") filterTexts.push(`Estado: ${filters.status}`)

    if (filterTexts.length > 0) {
      this.doc.text(`Filtros aplicados: ${filterTexts.join(", ")}`, this.margin, this.currentY)
      this.currentY += 8
    }
  }

  /**
   * Añade estadísticas resumen con diseño mejorado
   */
  public addStatistics(data: any[], yPosition: number): number {
    const pageWidth = this.doc.internal.pageSize.width
    const totalStudents = data.length
    const activeStudents = data.filter((s) => s.activo).length
    const inactiveStudents = totalStudents - activeStudents

    // Statistics header
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(52, 144, 220)
    this.doc.text("📊 ESTADÍSTICAS RESUMEN", 20, yPosition)

    yPosition += 12

    // Background rectangle for statistics
    this.doc.setFillColor(248, 249, 250)
    this.doc.rect(20, yPosition - 8, pageWidth - 40, 45, "F")

    // Border
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setLineWidth(0.3)
    this.doc.rect(20, yPosition - 8, pageWidth - 40, 45)

    // Statistics in columns
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(33, 37, 41)

    // Column 1: Basic stats
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Estudiantes:", 25, yPosition)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`Total: ${totalStudents}`, 25, yPosition + 6)
    this.doc.setTextColor(40, 167, 69)
    this.doc.text(`Activos: ${activeStudents}`, 25, yPosition + 12)
    this.doc.setTextColor(220, 53, 69)
    this.doc.text(`Inactivos: ${inactiveStudents}`, 25, yPosition + 18)

    // Column 2: Age statistics
    this.doc.setTextColor(33, 37, 41)
    const ages = data.map((s) => s.edad).filter((age) => age) as number[]
    if (ages.length > 0) {
      const averageAge = (ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1)
      const minAge = Math.min(...ages)
      const maxAge = Math.max(...ages)

      this.doc.setFont("helvetica", "bold")
      this.doc.text("Edades:", pageWidth / 2, yPosition)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`Promedio: ${averageAge} años`, pageWidth / 2, yPosition + 6)
      this.doc.text(`Rango: ${minAge}-${maxAge} años`, pageWidth / 2, yPosition + 12)
    }

    // Column 3: Additional stats
    const classesMap = new Map<string, number>()
    data.forEach((student) => {
      const className = student.clase || "Sin clase"
      classesMap.set(className, (classesMap.get(className) || 0) + 1)
    })

    const sortedClasses = Array.from(classesMap.entries()).sort((a, b) => b[1] - a[1])

    if (classesMap.size > 0) {
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Clases:", pageWidth - 80, yPosition)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`Total: ${classesMap.size}`, pageWidth - 80, yPosition + 6)
      if (sortedClasses[0]) {
        this.doc.text(`Popular: ${sortedClasses[0][0]}`, pageWidth - 80, yPosition + 12)
      }
    }

    // Percentage bar for active/inactive
    if (totalStudents > 0) {
      const activePercentage = (activeStudents / totalStudents) * 100
      const barWidth = pageWidth - 50
      const barHeight = 4
      const barY = yPosition + 28

      // Background bar
      this.doc.setFillColor(233, 236, 239)
      this.doc.rect(25, barY, barWidth, barHeight, "F")

      // Active students bar
      if (activePercentage > 0) {
        this.doc.setFillColor(40, 167, 69)
        this.doc.rect(25, barY, (barWidth * activePercentage) / 100, barHeight, "F")
      }

      // Percentage text
      this.doc.setFontSize(8)
      this.doc.setTextColor(108, 117, 125)
      this.doc.text(`${activePercentage.toFixed(1)}% activos`, 25, barY - 2)
    }

    this.doc.setTextColor(0, 0, 0)
    return yPosition + 45
  }

  private addDataTable(data: any[], fields: string[], reportType: string, options: any) {
    if (data.length === 0) {
      this.doc.setFontSize(12)
      this.doc.setTextColor(149, 165, 166)
      this.doc.text("No hay datos para mostrar", this.pageWidth / 2, this.currentY, {
        align: "center",
      })
      return
    }

    // Preparar encabezados y datos
    const headers = fields.map((field) => this.getFieldLabel(field))
    const tableData = data.map((item) => fields.map((field) => this.getFieldValue(item, field)))

    // Configuración de la tabla
    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 11,
      },
      bodyStyles: {
        textColor: 52,
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: {left: this.margin, right: this.margin},
      tableWidth: this.pageWidth - this.margin * 2,
      styles: {
        overflow: "linebreak",
        cellWidth: "auto",
      },
      columnStyles: {
        0: {cellWidth: "auto"}, // Primera columna auto-width
      },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private getFieldLabel(field: string): string {
    const labels: {[key: string]: string} = {
      name: "Nombre",
      age: "Edad",
      instrument: "Instrumento",
      teacher: "Maestro",
      class: "Clase",
      schedule: "Horario",
      enrollmentDate: "Fecha de Inscripción",
      status: "Estado",
      phone: "Teléfono",
      email: "Email",
      students: "Estudiantes",
      capacity: "Capacidad",
      classes: "Clases",
      date: "Fecha",
      observations: "Observaciones",
      evaluation: "Evaluación",
      score: "Puntuación",
      comments: "Comentarios",
    }
    return labels[field] || field
  }

  private getFieldValue(item: any, field: string): string {
    const value = item[field] || item[`${field}Name`] || ""

    if (field === "status") {
      const statusLabels: {[key: string]: string} = {
        active: "Activo",
        inactive: "Inactivo",
        pending: "Pendiente",
      }
      return statusLabels[value] || value
    }

    if (field === "enrollmentDate" && value) {
      try {
        return format(new Date(value), "dd/MM/yyyy", {locale: es})
      } catch {
        return value
      }
    }

    if (field === "age" && value) {
      return `${value} años`
    }

    return value.toString()
  }

  private addFooter(includeDate: boolean) {
    const footerY = this.pageHeight - 15

    // Línea separadora
    this.doc.setDrawColor(52, 152, 219)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5)

    // Fecha si está habilitada
    if (includeDate) {
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(149, 165, 166)
      const currentDate = format(new Date(), "dd/MM/yyyy HH:mm", {locale: es})
      this.doc.text(`Generado el: ${currentDate}`, this.margin, footerY)
    }

    // Número de página
    this.doc.text(
      `Página ${this.doc.getCurrentPageInfo().pageNumber}`,
      this.pageWidth - this.margin,
      footerY,
      {align: "right"}
    )
  }

  private addScheduleReport(data: any[], reportType: string) {
    if (reportType === "schedule_by_student") {
      const studentsWithSchedules = this.groupSchedulesByStudent(data)

      studentsWithSchedules.forEach((student, index) => {
        if (index > 0) {
          this.doc.addPage()
          this.currentY = this.margin
        }

        this.doc.setFontSize(14)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(`Alumno: ${student.studentName}`, this.margin, this.currentY)
        this.currentY += 10

        const headers = [["Día", "Horario", "Clase", "Maestro", "Aula"]]
        const body = student.schedules.map((schedule) => [
          this.getDayName(schedule.day),
          this.formatTimeRange(schedule.startTime, schedule.endTime),
          schedule.className,
          schedule.teacherName,
          schedule.classroom || "N/A",
        ])

        autoTable(this.doc, {
          startY: this.currentY,
          head: headers,
          body,
          theme: "striped",
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold",
          },
          didDrawPage: (data) => {
            if (data.cursor) {
              this.currentY = data.cursor.y
            }
          },
        })
        this.currentY = (this.doc as any).lastAutoTable.finalY + 15
      })
    }
    // Aquí se pueden agregar más casos para otros tipos de reportes de horarios
  }

  private groupSchedulesByStudent(data: any[]): {studentName: string; schedules: any[]}[] {
    const studentMap = new Map<string, {student: any; schedules: any[]}>()

    data.forEach((scheduleItem) => {
      scheduleItem.students.forEach((student: any) => {
        if (!studentMap.has(student.name)) {
          studentMap.set(student.name, {student, schedules: []})
        }
        studentMap.get(student.name)?.schedules.push(scheduleItem)
      })
    })

    return Array.from(studentMap.values()).map(({student, schedules}) => ({
      studentName: student.name,
      schedules: schedules.sort((a, b) => this.getDayIndex(a.day) - this.getDayIndex(b.day)),
    }))
  }

  private getDayIndex(day: string): number {
    const order: {[key: string]: number} = {
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
      domingo: 7,
    }
    return order[day.toLowerCase()] || 8
  }

  private getDayName(day: string): string {
    const days: {[key: string]: string} = {
      lunes: "Lunes",
      martes: "Martes",
      miercoles: "Miércoles",
      jueves: "Jueves",
      viernes: "Viernes",
      sabado: "Sábado",
      domingo: "Domingo",
    }
    return days[day.toLowerCase()] || day
  }

  private formatTimeRange(startTime: string, endTime: string): string {
    // Asume formato HH:mm
    return `${startTime} - ${endTime}`
  }
}

export const createPDFGenerator = (options: any) => {
  return new PDFGeneratorService(options.orientation, options.pageSize)
}
