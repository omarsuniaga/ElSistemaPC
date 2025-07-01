<template>
  <div v-if="modelValue" class="fixed flex items-center justify-center z-50">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto z-10"
    >
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Exportar Reportes de Asistencias</h2>
          <button class="text-gray-500 hover:text-gray-700" @click="close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Filtros -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">Configuración del reporte</h3>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1">Rango de fechas</label>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Desde</label>
                  <input v-model="filters.startDate" type="date" class="input w-full" />
                </div>
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Hasta</label>
                  <input v-model="filters.endDate" type="date" class="input w-full" />
                </div>
              </div>
            </div>

            <div>
              <label class="block mb-1">Clase</label>
              <select v-model="filters.class" class="input w-full">
                <option value="">Todas las clases</option>
                <option v-for="class_ in classes" :key="class_.id" :value="class_.name">
                  {{ class_.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block mb-1">Estudiante</label>
              <select v-model="filters.student" class="input w-full">
                <option value="">Todos los estudiantes</option>
                <option v-for="student in filteredStudents" :key="student.id" :value="student.id">
                  {{ student.nombre }} {{ student.apellido }}
                </option>
              </select>
            </div>

            <div>
              <label class="block mb-1">Formato</label>
              <select v-model="exportFormat" class="input w-full">
                <option value="excel">Excel (.xlsx)</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Opciones avanzadas -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">Opciones avanzadas</h3>

          <div class="space-y-3">
            <div class="flex items-center">
              <input id="includeStats" v-model="includeStats" type="checkbox" class="mr-2" />
              <label for="includeStats">Incluir estadísticas generales</label>
            </div>

            <div class="flex items-center">
              <input id="includeCharts" v-model="includeCharts" type="checkbox" class="mr-2" />
              <label for="includeCharts">Incluir gráficos (solo PDF)</label>
            </div>

            <div class="flex items-center">
              <input id="groupByClass" v-model="groupByClass" type="checkbox" class="mr-2" />
              <label for="groupByClass">Agrupar por clase</label>
            </div>

            <div class="flex items-center">
              <input id="groupByStudent" v-model="groupByStudent" type="checkbox" class="mr-2" />
              <label for="groupByStudent">Agrupar por estudiante</label>
            </div>
          </div>
        </div>

        <!-- Vista previa -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">Vista previa de datos</h3>

          <div v-if="isLoading" class="flex justify-center py-6">
            <div
              class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"
            />
          </div>

          <div v-else-if="error" class="bg-red-100 text-red-700 p-4 rounded-md">
            {{ error }}
          </div>

          <div v-else-if="!filteredRecords.length" class="text-center py-6 text-gray-500">
            No se encontraron registros con los filtros seleccionados.
          </div>

          <div v-else class="text-sm">
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
              <p>
                <strong>{{ filteredRecords.length }}</strong> registros encontrados
              </p>
              <p>
                <strong>Rango de fechas:</strong> {{ formatDate(filters.startDate) }} -
                {{ formatDate(filters.endDate) }}
              </p>
              <p v-if="filters.class"><strong>Clase:</strong> {{ filters.class }}</p>
              <p v-if="filters.student">
                <strong>Estudiante:</strong> {{ getStudentName(filters.student) }}
              </p>

              <div class="mt-3 flex flex-wrap gap-2">
                <div class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Presentes: {{ stats.present }}
                </div>
                <div class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                  Ausentes: {{ stats.absent }}
                </div>
                <div class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                  Tardanzas: {{ stats.late }}
                </div>
                <div class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Justificados: {{ stats.justified }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Botones de acciones -->
        <div class="mt-8 flex justify-end gap-3">
          <button class="btn" @click="close">Cancelar</button>
          <button
            :disabled="!canExport || !filteredRecords.length || isExporting"
            class="btn btn-primary"
            :title="!canExport ? 'No tienes permisos para exportar' : ''"
            @click="exportData"
          >
            <span v-if="isExporting"> Exportando... </span>
            <span v-else> Exportar {{ exportFormatName }} </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useAttendanceStore} from "../store/attendance"
import {useStudentsStore} from "../../Students/store/students"
import {useClassesStore} from "../../Classes/store/classes"
import {useOptimizedAttendance} from "../composables/useOptimizedAttendance"
import {useRBACStore} from "../../../stores/rbacStore"
import {format, parseISO} from "date-fns"
import {es} from "date-fns/locale"
import * as ExcelJS from "exceljs"
import jspdf from "jspdf"
import "jspdf-autotable"
import html2pdf from "html2pdf.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue", "close"])

const close = () => {
  emit("update:modelValue", false)
  emit("close")
}

// Stores
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const rbacStore = useRBACStore()

// RBAC permissions
const canExport = computed(() => rbacStore.hasPermission("attendance_export"))

// Composable optimizado
const {
  loading: optimizedLoading,
  error: optimizedError,
  getFilteredRecords,
  searchByDateRange,
  getStats,
} = useOptimizedAttendance()

// Estado local combinado con composable
const isLoading = computed(() => optimizedLoading.value || isExporting.value)
const error = computed(() => optimizedError.value || localError.value)
const localError = ref<string | null>(null)

// Watcher para cargar datos cuando cambien los filtros
watch(
  [() => filters.value.startDate, () => filters.value.endDate],
  async ([newStartDate, newEndDate]) => {
    if (newStartDate && newEndDate) {
      try {
        await searchByDateRange(newStartDate, newEndDate)
        localError.value = null
      } catch (err: any) {
        localError.value = `Error al cargar datos: ${err.message || err}`
      }
    }
  },
  {immediate: true}
)

// Estado local
const isExporting = ref(false)
const exportFormat = ref("excel")
const includeStats = ref(true)
const includeCharts = ref(true)
const groupByClass = ref(false)
const groupByStudent = ref(false)

// Filtros
const filters = ref({
  startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
  endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd"),
  class: "",
  student: "",
  status: "",
})

// Nombre del formato seleccionado
const exportFormatName = computed(() => {
  switch (exportFormat.value) {
    case "excel":
      return "Excel (.xlsx)"
    case "pdf":
      return "PDF"
    case "csv":
      return "CSV"
    default:
      return "Reporte"
  }
})

// Datos
const classes = computed(() => classesStore.classes)

const students = computed(() => studentsStore.students)

// Filtra estudiantes dependiendo de la clase seleccionada
const filteredStudents = computed(() => {
  if (!filters.value.class) return students.value

  return students.value.filter((student) => {
    const foundClass = classesStore.classes.find((c) => c.name === filters.value.class)
    return foundClass && foundClass.studentIds && foundClass.studentIds.includes(String(student.id))
  })
})

// Registros filtrados - ahora usando composable optimizado
const filteredRecords = computed(() => {
  const records = getFilteredRecords.value({
    classId: filters.value.class,
    studentId: filters.value.student,
    status: filters.value.status,
  })
  return Array.isArray(records) ? records : []
})

// Estadísticas calculadas
const stats = computed(() => {
  const records = filteredRecords.value
  const present = records.filter((r) => r.status === "Presente").length
  const absent = records.filter((r) => r.status === "Ausente").length
  const late = records.filter((r) => r.status === "Tardanza").length
  const justified = records.filter((r) => r.status === "Justificado").length

  return {
    present,
    absent,
    late,
    justified,
    total: records.length,
    attendanceRate:
      filteredRecords.value.length > 0
        ? Math.round((present / filteredRecords.value.length) * 100)
        : 0,
  }
})

// Formatear fecha
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "PPP", {locale: es})
  } catch (error) {
    return dateString
  }
}

// Obtener nombre del estudiante
const getStudentName = (studentId: string): string => {
  const student = studentsStore.students.find((s) => s.id === studentId)
  if (!student) return "Estudiante desconocido"
  return `${student.nombre} ${student.apellido}`
}

// Exportar datos
const exportData = async () => {
  if (filteredRecords.value.length === 0) {
    localError.value = "No hay datos para exportar"
    return
  }

  isExporting.value = true
  localError.value = null

  try {
    const reportTitle = `Reporte de Asistencias - ${formatDate(filters.value.startDate)} a ${formatDate(filters.value.endDate)}`

    // Preparar datos para exportar
    const exportData = filteredRecords.value.map((record) => ({
      Estudiante: getStudentName(record.studentId),
      Clase: record.classId,
      Fecha: formatDate(record.Fecha),
      Estado: record.status,
      Justificacion: record.justification || "-",
      Observaciones: record.observaciones || "-",
    }))

    // Dependiendo del formato seleccionado
    if (exportFormat.value === "excel") {
      await exportToExcel(exportData, reportTitle)
    } else if (exportFormat.value === "pdf") {
      await exportToPdf(exportData, reportTitle)
    } else if (exportFormat.value === "csv") {
      await exportToCsv(exportData, reportTitle)
    }
  } catch (err) {
    console.error("Error al exportar:", err)
    localError.value = `Ocurrió un error durante la exportación: ${err.message || err}`
  } finally {
    isExporting.value = false
  }
}

// Exportar a PDF
const exportToPdf = (data, title) => {
  try {
    // Crear documento PDF
    const doc = new jspdf()

    // Añadir título
    doc.setFontSize(18)
    doc.text(title, 14, 20)

    // Añadir filtros aplicados
    doc.setFontSize(11)
    doc.text(
      `Periodo: ${formatDate(filters.value.startDate)} - ${formatDate(filters.value.endDate)}`,
      14,
      30
    )

    if (filters.value.class) {
      doc.text(`Clase: ${filters.value.class}`, 14, 35)
    }

    if (filters.value.student) {
      doc.text(`Estudiante: ${getStudentName(filters.value.student)}`, 14, 40)
    }

    let yPosition = 45

    // Si se incluyen estadísticas, añadirlas
    if (includeStats.value) {
      doc.setFontSize(14)
      doc.text("Estadísticas Generales", 14, (yPosition += 10))

      const statsData = [
        ["Métrica", "Valor"],
        ["Total de registros", stats.value.total.toString()],
        ["Presentes", stats.value.present.toString()],
        ["Ausentes", stats.value.absent.toString()],
        ["Tardanzas", stats.value.late.toString()],
        ["Justificados", stats.value.justified.toString()],
        ["Tasa de asistencia", `${stats.value.attendanceRate}%`],
      ]
      // Comprobamos si tenemos acceso a autoTable a través del objeto global window
      if (window.jspdf && window.jspdf.autoTable) {
        window.jspdf.autoTable(doc, {
          startY: (yPosition += 5),
          head: [statsData[0]],
          body: statsData.slice(1),
          theme: "grid",
          headStyles: {fillColor: [41, 128, 185], textColor: 255},
        })
      } else if ((doc as any).autoTable) {
        // Intento alternativo si está disponible como método del documento
        ;(doc as any).autoTable({
          startY: (yPosition += 5),
          head: [statsData[0]],
          body: statsData.slice(1),
          theme: "grid",
          headStyles: {fillColor: [41, 128, 185], textColor: 255},
        })
      } else {
        // Fallback simple si autoTable no está disponible
        let y = (yPosition += 5)

        // Dibujar encabezado
        doc.setFillColor(41, 128, 185)
        doc.rect(20, y, 170, 10, "F")
        doc.setTextColor(255)
        doc.text(statsData[0][0], 25, y + 7)
        doc.text(statsData[0][1], 120, y + 7)
        // Dibujar cuerpo
        doc.setTextColor(0)
        for (let i = 1; i < statsData.length; i++) {
          y += 10
          doc.setFillColor(
            i % 2 === 0 ? 240 : 255,
            i % 2 === 0 ? 240 : 255,
            i % 2 === 0 ? 240 : 255
          )
          doc.rect(20, y, 170, 10, "F")
          doc.text(statsData[i][0], 25, y + 7)
          doc.text(statsData[i][1], 120, y + 7)
        }

        yPosition = y + 15
        return
      }

      yPosition = (doc as any).lastAutoTable.finalY + 15
    }

    // Añadir tabla principal
    doc.setFontSize(14)
    doc.text("Registros de Asistencia", 14, yPosition)
    ;(doc as any).autoTable({
      startY: yPosition + 5,
      head: [["Estudiante", "Clase", "Fecha", "Estado", "Justificación", "Observaciones"]],
      body: data.map((row) => [
        row.Estudiante,
        row.Clase,
        row.Fecha,
        row.Estado,
        row.Justificacion || "-",
        row.Observaciones || "-",
      ]),
      theme: "grid",
      headStyles: {fillColor: [41, 128, 185], textColor: 255},
    })

    // Si estamos agrupando por días y hay observaciones, añadir sección específica
    if (groupByStudent.value && includeStats.value) {
      const studentGroups = {}
      filteredRecords.value.forEach((record) => {
        if (!studentGroups[record.studentId]) {
          studentGroups[record.studentId] = []
        }
        studentGroups[record.studentId].push(record)
      })

      let currentY = (doc as any).lastAutoTable.finalY + 15

      doc.setFontSize(14)
      doc.text("Observaciones por Estudiante", 14, currentY)
      currentY += 10
      Object.entries(studentGroups).forEach(([studentId, records]) => {
        const studentName = getStudentName(studentId)
        const recordsArray = Array.isArray(records) ? records : []
        const observations = recordsArray.filter(
          (r: any) => r.observaciones && r.observaciones.trim() !== ""
        )

        if (observations.length > 0) {
          doc.setFontSize(12)
          doc.text(studentName, 14, currentY)
          currentY += 5
          ;(doc as any).autoTable({
            startY: currentY,
            head: [["Fecha", "Estado", "Observaciones"]],
            body: observations.map((r) => [formatDate(r.Fecha), r.status, r.observaciones]),
            theme: "striped",
            headStyles: {fillColor: [41, 128, 185], textColor: 255},
          })

          currentY = (doc as any).lastAutoTable.finalY + 10
        }
      })
    }

    // Si estamos agrupando por clase, añadir sección específica por clase
    if (groupByClass.value) {
      const classGroups = {}
      filteredRecords.value.forEach((record) => {
        if (!classGroups[record.classId]) {
          classGroups[record.classId] = []
        }
        classGroups[record.classId].push(record)
      })

      let currentY = (doc as any).lastAutoTable.finalY + 15

      doc.setFontSize(14)
      doc.text("Registros por Clase", 14, currentY)
      currentY += 10

      Object.entries(classGroups).forEach(([className, records]) => {
        if (doc.internal.pageSize.height - currentY < 40) {
          doc.addPage()
          currentY = 20
        }

        doc.setFontSize(12)
        doc.text(className, 14, currentY)
        currentY += 5
        // Estadísticas por clase
        const recordsArray = Array.isArray(records) ? records : []
        const classStats = {
          present: recordsArray.filter((r: any) => r.status === "Presente").length,
          absent: recordsArray.filter((r: any) => r.status === "Ausente").length,
          late: recordsArray.filter((r: any) => r.status === "Tardanza").length,
          justified: recordsArray.filter((r: any) => r.status === "Justificado").length,
        }

        ;(doc as any).autoTable({
          startY: currentY,
          head: [["Total", "Presentes", "Ausentes", "Tardanzas", "Justificados"]],
          body: [
            [
              recordsArray.length,
              classStats.present,
              classStats.absent,
              classStats.late,
              classStats.justified,
            ],
          ],
          theme: "striped",
          headStyles: {fillColor: [41, 128, 185], textColor: 255},
        })

        currentY = (doc as any).lastAutoTable.finalY + 10
      })
    }

    // Guardar PDF
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`)

    return true
  } catch (error) {
    console.error("Error exportando a PDF:", error)
    throw error
  }
}

// Exportar a Excel
const exportToExcel = (data, title) => {
  try {
    // Crear workbook y worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Asistencias")

    // Añadir encabezados
    worksheet.columns = [
      {header: "Estudiante", key: "Estudiante", width: 30},
      {header: "Clase", key: "Clase", width: 20},
      {header: "Fecha", key: "Fecha", width: 15},
      {header: "Estado", key: "Estado", width: 15},
      {header: "Justificacion", key: "Justificacion", width: 30},
      {header: "Observaciones", key: "Observaciones", width: 30},
    ]

    // Añadir datos
    data.forEach((row) => {
      worksheet.addRow(row)
    })

    // Si se incluyen estadísticas, agregar hoja de estadísticas
    if (includeStats.value) {
      const statsWorksheet = workbook.addWorksheet("Estadísticas")
      statsWorksheet.columns = [
        {header: "Métrica", key: "Métrica", width: 30},
        {header: "Valor", key: "Valor", width: 15},
      ]

      const statsData = [
        {Métrica: "Total de registros", Valor: stats.value.total},
        {Métrica: "Presentes", Valor: stats.value.present},
        {Métrica: "Ausentes", Valor: stats.value.absent},
        {Métrica: "Tardanzas", Valor: stats.value.late},
        {Métrica: "Justificados", Valor: stats.value.justified},
        {Métrica: "Tasa de asistencia", Valor: `${stats.value.attendanceRate}%`},
      ]

      statsData.forEach((row) => {
        statsWorksheet.addRow(row)
      })
    }

    // Si agrupamos por clase, agregar hojas por clase
    if (groupByClass.value) {
      const classGroups = {}
      filteredRecords.value.forEach((record) => {
        if (!classGroups[record.classId]) {
          classGroups[record.classId] = []
        }
        classGroups[record.classId].push(record)
      })

      Object.entries(classGroups).forEach(([className, records]) => {
        const classSheet = workbook.addWorksheet(className.substring(0, 30)) // Excel tiene límite de longitud para nombres de hoja
        classSheet.columns = [
          {header: "Estudiante", key: "Estudiante", width: 30},
          {header: "Fecha", key: "Fecha", width: 15},
          {header: "Estado", key: "Estado", width: 15},
          {header: "Justificacion", key: "Justificacion", width: 30},
          {header: "Observaciones", key: "Observaciones", width: 30},
        ]

        const recordsArray = Array.isArray(records) ? records : []
        recordsArray.forEach((record: any) => {
          classSheet.addRow({
            Estudiante: getStudentName(record.studentId),
            Fecha: formatDate(record.Fecha),
            Estado: record.status,
            Justificacion: record.justification || "-",
            Observaciones: record.observaciones || "-",
          })
        })
      })
    }

    // Si agrupamos por estudiante, agregar hojas por estudiante
    if (groupByStudent.value) {
      const studentGroups = {}
      filteredRecords.value.forEach((record) => {
        if (!studentGroups[record.studentId]) {
          studentGroups[record.studentId] = []
        }
        studentGroups[record.studentId].push(record)
      })

      Object.entries(studentGroups).forEach(([studentId, records]) => {
        const studentName = getStudentName(studentId).substring(0, 30)
        const studentSheet = workbook.addWorksheet(studentName)
        studentSheet.columns = [
          {header: "Clase", key: "Clase", width: 20},
          {header: "Fecha", key: "Fecha", width: 15},
          {header: "Estado", key: "Estado", width: 15},
          {header: "Justificacion", key: "Justificacion", width: 30},
          {header: "Observaciones", key: "Observaciones", width: 30},
        ]

        const recordsArray = Array.isArray(records) ? records : []
        recordsArray.forEach((record: any) => {
          studentSheet.addRow({
            Clase: record.classId,
            Fecha: formatDate(record.Fecha),
            Estado: record.status,
            Justificacion: record.justification || "-",
            Observaciones: record.observaciones || "-",
          })
        })
      })
    }

    // Guardar archivo
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${title.replace(/\s+/g, "_")}.xlsx`
      link.click()
    })

    return true
  } catch (error) {
    console.error("Error exportando a Excel:", error)
    throw error
  }
}

// Exportar a CSV
const exportToCsv = (data, title) => {
  try {
    // Crear workbook solo con una hoja
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Asistencias")

    // Añadir encabezados
    const headers = Object.keys(data[0])
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: 20,
    }))

    // Añadir datos
    data.forEach((row) => {
      worksheet.addRow(row)
    })

    // Crear CSV desde el workbook
    const csvData = []

    // Agregar cabeceras
    csvData.push(headers.join(","))

    // Agregar filas de datos
    data.forEach((row) => {
      const rowData = headers.map((header) => {
        // Escapar comas y comillas
        const cell = row[header] || ""
        if (typeof cell === "string" && (cell.includes(",") || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      })
      csvData.push(rowData.join(","))
    })

    const csvString = csvData.join("\n")

    // Crear blob
    const blob = new Blob([csvString], {type: "text/csv;charset=utf-8;"})

    // Crear link para descarga
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (error) {
    console.error("Error exportando a CSV:", error)
    throw error
  }
}

// Cargar datos al montar el componente
onMounted(async () => {
  isExporting.value = true
  localError.value = null
  try {
    // Asegurarse de que todos los datos estén cargados
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAttendanceDocuments(),
    ])
  } catch (err) {
    console.error("Error al cargar datos:", err)
    localError.value = "Error al cargar los datos para el reporte"
  } finally {
    isExporting.value = false
  }
})

// Make sure the component is exported as default
defineExpose({})
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {}
}
</script>
