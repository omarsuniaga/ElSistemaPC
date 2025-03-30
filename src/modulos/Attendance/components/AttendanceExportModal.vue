<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAttendanceStore } from '../store/attendance'
import { useStudentsStore } from '../../Students/store/students'
import { useClassesStore } from '../../Classes/store/classes'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
// Reemplazar xlsx por ExcelJS
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Stores
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()

// Estado local
const isLoading = ref(false)
const error = ref<string | null>(null)
const isExporting = ref(false)
const exportFormat = ref('excel')
const includeStats = ref(true)
const includeCharts = ref(true)
const groupByClass = ref(false)
const groupByStudent = ref(false)

// Filtros
const filters = ref({
  startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
  endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
  class: '',
  student: ''
})

// Nombre del formato seleccionado
const exportFormatName = computed(() => {
  switch (exportFormat.value) {
    case 'excel': return 'Excel (.xlsx)'
    case 'pdf': return 'PDF'
    case 'csv': return 'CSV'
    default: return 'Reporte'
  }
})

// Datos
const classes = computed(() => classesStore.classes)

const students = computed(() => studentsStore.students)

// Filtra estudiantes dependiendo de la clase seleccionada
const filteredStudents = computed(() => {
  if (!filters.value.class) return students.value
  
  return students.value.filter(student => {
    const foundClass = classesStore.classes.find(c => c.name === filters.value.class)
    return foundClass && foundClass.studentIds.includes(Number(student.id))
  })
})

// Registros filtrados
const filteredRecords = computed(() => {
  let records = attendanceStore.records

  // Filtro por rango de fechas
  records = records.filter(record => {
    return record.Fecha >= filters.value.startDate && record.Fecha <= filters.value.endDate
  })
  
  // Filtro por clase
  if (filters.value.class) {
    records = records.filter(record => record.classId === filters.value.class)
  }
  
  // Filtro por estudiante
  if (filters.value.student) {
    records = records.filter(record => record.studentId === filters.value.student)
  }
  
  // Ordenar por fecha
  return [...records].sort((a, b) => {
    return new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime()
  })
})

// Estadísticas calculadas
const stats = computed(() => {
  const present = filteredRecords.value.filter(r => r.status === 'Presente').length
  const absent = filteredRecords.value.filter(r => r.status === 'Ausente').length
  const late = filteredRecords.value.filter(r => r.status === 'Tardanza').length
  const justified = filteredRecords.value.filter(r => r.status === 'Justificado').length
  
  return {
    present,
    absent,
    late,
    justified,
    total: filteredRecords.value.length,
    attendanceRate: filteredRecords.value.length > 0 
      ? Math.round((present / filteredRecords.value.length) * 100) 
      : 0
  }
})

// Formatear fecha
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'PPP', { locale: es })
  } catch (error) {
    return dateString
  }
}

// Obtener nombre del estudiante
const getStudentName = (studentId: string): string => {
  const student = studentsStore.students.find(s => s.id === studentId)
  if (!student) return 'Estudiante desconocido'
  return `${student.nombre} ${student.apellido}`
}

// Exportar datos
const exportData = async () => {
  if (filteredRecords.value.length === 0) {
    error.value = 'No hay datos para exportar'
    return
  }
  
  isExporting.value = true
  error.value = null
  
  try {
    const reportTitle = `Reporte de Asistencias - ${formatDate(filters.value.startDate)} a ${formatDate(filters.value.endDate)}`
    
    // Preparar datos para exportar
    const exportData = filteredRecords.value.map(record => ({
      Estudiante: getStudentName(record.studentId),
      Clase: record.classId,
      Fecha: formatDate(record.Fecha),
      Estado: record.status,
      Justificacion: record.justification || '-'
    }))
    
    // Dependiendo del formato seleccionado
    switch (exportFormat.value) {
      case 'excel':
        exportToExcel(exportData, reportTitle)
        break
      case 'pdf':
        exportToPdf(exportData, reportTitle)
        break
      case 'csv':
        exportToCsv(exportData, reportTitle)
        break
    }
  } catch (err) {
    console.error('Error al exportar:', err)
    error.value = 'Ocurrió un error durante la exportación'
  } finally {
    isExporting.value = false
  }
}

// Exportar a Excel con ExcelJS (más seguro)
const exportToExcel = async (data: any[], title: string) => {
  // Crear un nuevo libro de trabajo
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Music Academy App';
  workbook.lastModifiedBy = 'Music Academy App';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Crear hoja principal para datos de asistencia
  const worksheet = workbook.addWorksheet('Asistencias');
  
  // Añadir encabezados
  const headers = Object.keys(data[0] || {});
  worksheet.addRow(headers);
  
  // Añadir datos
  data.forEach(row => {
    worksheet.addRow(Object.values(row));
  });
  
  // Dar formato a las columnas
  worksheet.columns.forEach(column => {
    column.width = 20;
  });
  
  // Dar formato a los encabezados
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2980B9' } // Azul
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Si se incluyen estadísticas, añadir hoja de estadísticas
  if (includeStats.value) {
    const statsSheet = workbook.addWorksheet('Estadísticas');
    
    // Añadir encabezados de estadísticas
    statsSheet.addRow(['Métrica', 'Valor']);
    
    // Añadir datos de estadísticas
    statsSheet.addRow(['Total de registros', stats.value.total]);
    statsSheet.addRow(['Presentes', stats.value.present]);
    statsSheet.addRow(['Ausentes', stats.value.absent]);
    statsSheet.addRow(['Tardanzas', stats.value.late]);
    statsSheet.addRow(['Justificados', stats.value.justified]);
    statsSheet.addRow(['Tasa de asistencia', `${stats.value.attendanceRate}%`]);
    
    // Dar formato a la hoja de estadísticas
    statsSheet.getColumn('A').width = 25;
    statsSheet.getColumn('B').width = 15;
    statsSheet.getRow(1).font = { bold: true };
  }
  
  // Generar nombre de archivo
  const fileName = `asistencias_${filters.value.startDate}_${filters.value.endDate}.xlsx`;
  
  // Escribir a un buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Crear blob y descargar
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Exportar a CSV con ExcelJS en lugar de XLSX
const exportToCsv = async (data: any[], title: string) => {
  // Crear un nuevo libro de trabajo
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Asistencias');
  
  // Añadir encabezados
  const headers = Object.keys(data[0] || {});
  worksheet.addRow(headers);
  
  // Añadir datos
  data.forEach(row => {
    worksheet.addRow(Object.values(row));
  });
  
  // Generar nombre de archivo
  const fileName = `asistencias_${filters.value.startDate}_${filters.value.endDate}.csv`;
  
  // Escribir a un buffer
  const buffer = await workbook.csv.writeBuffer();
  
  // Crear blob y descargar
  const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Cargar datos al montar el componente
onMounted(async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Asegurarse de que todos los datos estén cargados
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAttendance()
    ])
  } catch (err) {
    console.error('Error al cargar datos:', err)
    error.value = 'Error al cargar los datos para el reporte'
  } finally {
    isLoading.value = false
  }
})
</script>
<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 flex items-center justify-center z-50"
  >
    <div class="absolute inset-0 bg-black/50" @click="close"></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto z-10">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Exportar Reportes de Asistencias</h2>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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
                  <input
                    type="date"
                    v-model="filters.startDate"
                    class="input w-full"
                  />
                </div>
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Hasta</label>
                  <input
                    type="date"
                    v-model="filters.endDate"
                    class="input w-full"
                  />
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
              <input type="checkbox" id="includeStats" v-model="includeStats" class="mr-2">
              <label for="includeStats">Incluir estadísticas generales</label>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="includeCharts" v-model="includeCharts" class="mr-2">
              <label for="includeCharts">Incluir gráficos (solo PDF)</label>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="groupByClass" v-model="groupByClass" class="mr-2">
              <label for="groupByClass">Agrupar por clase</label>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="groupByStudent" v-model="groupByStudent" class="mr-2">
              <label for="groupByStudent">Agrupar por estudiante</label>
            </div>
          </div>
        </div>
        
        <!-- Vista previa -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">Vista previa de datos</h3>
          
          <div v-if="isLoading" class="flex justify-center py-6">
            <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
          
          <div v-else-if="error" class="bg-red-100 text-red-700 p-4 rounded-md">
            {{ error }}
          </div>
          
          <div v-else-if="!filteredRecords.length" class="text-center py-6 text-gray-500">
            No se encontraron registros con los filtros seleccionados.
          </div>
          
          <div v-else class="text-sm">
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
              <p><strong>{{ filteredRecords.length }}</strong> registros encontrados</p>
              <p><strong>Rango de fechas:</strong> {{ formatDate(filters.startDate) }} - {{ formatDate(filters.endDate) }}</p>
              <p v-if="filters.class"><strong>Clase:</strong> {{ filters.class }}</p>
              <p v-if="filters.student"><strong>Estudiante:</strong> {{ getStudentName(filters.student) }}</p>
              
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
          <button @click="close" class="btn">
            Cancelar
          </button>
          <button 
            @click="exportData"
            :disabled="!filteredRecords.length || isExporting"
            class="btn btn-primary"
          >
            <span v-if="isExporting">
              Exportando...
            </span>
            <span v-else>
              Exportar {{ exportFormatName }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
