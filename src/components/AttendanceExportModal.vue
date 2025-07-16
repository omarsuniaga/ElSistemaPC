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
            :disabled="!filteredRecords.length || isExporting"
            class="btn btn-primary"
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
import { ref, computed, onMounted } from 'vue';
import { useAttendanceStore } from '../store/attendances';
import { useStudentsStore } from '../../modulos/Students/store/students';
import { exportToExcel } from '@/utils/exportToExcel';
import { useClassesStore } from '../../modulos/Classes/store/classes';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'close']);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

// Stores
const attendanceStore = useAttendanceStore();
const studentsStore = useStudentsStore();
const classesStore = useClassesStore();

// Estado local
const isLoading = ref(false);
const error = ref<string | null>(null);
const isExporting = ref(false);
const exportFormat = ref('excel');
const includeStats = ref(true);
const includeCharts = ref(true);
const groupByClass = ref(false);
const groupByStudent = ref(false);

// Filtros
const filters = ref({
  startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
  endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
  class: '',
  student: '',
});

// Nombre del formato seleccionado
const exportFormatName = computed(() => {
  switch (exportFormat.value) {
  case 'excel':
    return 'Excel (.xlsx)';
  case 'pdf':
    return 'PDF';
  case 'csv':
    return 'CSV';
  default:
    return 'Reporte';
  }
});

// Datos
const classes = computed(() => classesStore.classes);

const students = computed(() => studentsStore.students);

// Filtra estudiantes dependiendo de la clase seleccionada
const filteredStudents = computed(() => {
  if (!filters.value.class) return students.value;

  return students.value.filter((student) => {
    const foundClass = classesStore.classes.find((c) => c.name === filters.value.class);
    return foundClass && foundClass.studentIds.includes(Number(student.id));
  });
});

// Registros filtrados
const filteredRecords = computed(() => {
  let records = attendanceStore.records;

  // Filtro por rango de fechas
  records = records.filter((record) => {
    return record.Fecha >= filters.value.startDate && record.Fecha <= filters.value.endDate;
  });

  // Filtro por clase
  if (filters.value.class) {
    records = records.filter((record) => record.classId === filters.value.class);
  }

  // Filtro por estudiante
  if (filters.value.student) {
    records = records.filter((record) => record.studentId === filters.value.student);
  }

  // Ordenar por fecha
  return [...records].sort((a, b) => {
    return new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime();
  });
});

// Estadísticas calculadas
const stats = computed(() => {
  const present = filteredRecords.value.filter((r) => r.status === 'Presente').length;
  const absent = filteredRecords.value.filter((r) => r.status === 'Ausente').length;
  const late = filteredRecords.value.filter((r) => r.status === 'Tardanza').length;
  const justified = filteredRecords.value.filter((r) => r.status === 'Justificado').length;

  return {
    present,
    absent,
    late,
    justified,
    total: filteredRecords.value.length,
    attendanceRate:
      filteredRecords.value.length > 0
        ? Math.round((present / filteredRecords.value.length) * 100)
        : 0,
  };
});

// Formatear fecha
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'PPP', { locale: es });
  } catch (error) {
    return dateString;
  }
};

// Obtener nombre del estudiante
const getStudentName = (studentId: string): string => {
  const student = studentsStore.students.find((s) => s.id === studentId);
  if (!student) return 'Estudiante desconocido';
  return `${student.nombre} ${student.apellido}`;
};

// Exportar datos
const exportData = async () => {
  if (filteredRecords.value.length === 0) {
    error.value = 'No hay datos para exportar';
    return;
  }

  isExporting.value = true;
  error.value = null;

  try {
    const reportTitle = `Reporte de Asistencias - ${formatDate(filters.value.startDate)} a ${formatDate(filters.value.endDate)}`;

    // Preparar datos para exportar
    const exportData = filteredRecords.value.map((record) => ({
      Estudiante: getStudentName(record.studentId),
      Clase: record.classId,
      Fecha: formatDate(record.Fecha),
      Estado: record.status,
      Justificacion: record.justification || '-',
      Observaciones: record.observaciones || '-',
    }));

    // Dependiendo del formato seleccionado
    if (exportFormat.value === 'excel') {
      await exportToExcel(exportData, reportTitle);
    } else if (exportFormat.value === 'pdf') {
      await exportToPdf(exportData, reportTitle);
    } else if (exportFormat.value === 'csv') {
      await exportToCsv(exportData, reportTitle);
    }
  } catch (err) {
    console.error('Error al exportar:', err);
    error.value = `Ocurrió un error durante la exportación: ${err.message || err}`;
  } finally {
    isExporting.value = false;
  }
};

// Exportar a PDF
const exportToPdf = (data, title) => {
  try {
    // Crear documento PDF
    const doc = new jsPDF();

    // Añadir título
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Añadir filtros aplicados
    doc.setFontSize(11);
    doc.text(
      `Periodo: ${formatDate(filters.value.startDate)} - ${formatDate(filters.value.endDate)}`,
      14,
      30,
    );

    if (filters.value.class) {
      doc.text(`Clase: ${filters.value.class}`, 14, 35);
    }

    if (filters.value.student) {
      doc.text(`Estudiante: ${getStudentName(filters.value.student)}`, 14, 40);
    }

    let yPosition = 45;

    // Si se incluyen estadísticas, añadirlas
    if (includeStats.value) {
      doc.setFontSize(14);
      doc.text('Estadísticas Generales', 14, (yPosition += 10));

      const statsData = [
        ['Métrica', 'Valor'],
        ['Total de registros', stats.value.total.toString()],
        ['Presentes', stats.value.present.toString()],
        ['Ausentes', stats.value.absent.toString()],
        ['Tardanzas', stats.value.late.toString()],
        ['Justificados', stats.value.justified.toString()],
        ['Tasa de asistencia', `${stats.value.attendanceRate}%`],
      ];

      doc.autoTable({
        startY: (yPosition += 5),
        head: [statsData[0]],
        body: statsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Añadir tabla principal
    doc.setFontSize(14);
    doc.text('Registros de Asistencia', 14, yPosition);

    doc.autoTable({
      startY: yPosition + 5,
      head: [['Estudiante', 'Clase', 'Fecha', 'Estado', 'Justificación', 'Observaciones']],
      body: data.map((row) => [
        row.Estudiante,
        row.Clase,
        row.Fecha,
        row.Estado,
        row.Justificacion || '-',
        row.Observaciones || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    // Si estamos agrupando por días y hay observaciones, añadir sección específica
    if (groupByStudent.value && includeStats.value) {
      const studentGroups = {};
      filteredRecords.value.forEach((record) => {
        if (!studentGroups[record.studentId]) {
          studentGroups[record.studentId] = [];
        }
        studentGroups[record.studentId].push(record);
      });

      let currentY = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.text('Observaciones por Estudiante', 14, currentY);
      currentY += 10;

      Object.entries(studentGroups).forEach(([studentId, records]) => {
        const studentName = getStudentName(studentId);
        const observations = records.filter((r) => r.observaciones && r.observaciones.trim() !== '');

        if (observations.length > 0) {
          doc.setFontSize(12);
          doc.text(studentName, 14, currentY);
          currentY += 5;

          doc.autoTable({
            startY: currentY,
            head: [['Fecha', 'Estado', 'Observaciones']],
            body: observations.map((r) => [formatDate(r.Fecha), r.status, r.observaciones]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          });

          currentY = doc.lastAutoTable.finalY + 10;
        }
      });
    }

    // Si estamos agrupando por clase, añadir sección específica por clase
    if (groupByClass.value) {
      const classGroups = {};
      filteredRecords.value.forEach((record) => {
        if (!classGroups[record.classId]) {
          classGroups[record.classId] = [];
        }
        classGroups[record.classId].push(record);
      });

      let currentY = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.text('Registros por Clase', 14, currentY);
      currentY += 10;

      Object.entries(classGroups).forEach(([className, records]) => {
        if (doc.internal.pageSize.height - currentY < 40) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.text(className, 14, currentY);
        currentY += 5;

        // Estadísticas por clase
        const classStats = {
          present: records.filter((r) => r.status === 'Presente').length,
          absent: records.filter((r) => r.status === 'Ausente').length,
          late: records.filter((r) => r.status === 'Tardanza').length,
          justified: records.filter((r) => r.status === 'Justificado').length,
        };

        doc.autoTable({
          startY: currentY,
          head: [['Total', 'Presentes', 'Ausentes', 'Tardanzas', 'Justificados']],
          body: [
            [
              records.length,
              classStats.present,
              classStats.absent,
              classStats.late,
              classStats.justified,
            ],
          ],
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        });

        currentY = doc.lastAutoTable.finalY + 10;
      });
    }

    // Guardar PDF
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);

    return true;
  } catch (error) {
    console.error('Error exportando a PDF:', error);
    throw error;
  }
};

// Exportar a Excel
const exportToExcel = (data, title) => {
  try {
    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Añadir worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');

    // Si se incluyen estadísticas, agregar hoja de estadísticas
    if (includeStats.value) {
      const statsData = [
        { Métrica: 'Total de registros', Valor: stats.value.total },
        { Métrica: 'Presentes', Valor: stats.value.present },
        { Métrica: 'Ausentes', Valor: stats.value.absent },
        { Métrica: 'Tardanzas', Valor: stats.value.late },
        { Métrica: 'Justificados', Valor: stats.value.justified },
        { Métrica: 'Tasa de asistencia', Valor: `${stats.value.attendanceRate}%` },
      ];

      const statsWorksheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Estadísticas');
    }

    // Si agrupamos por clase, agregar hojas por clase
    if (groupByClass.value) {
      const classGroups = {};
      filteredRecords.value.forEach((record) => {
        if (!classGroups[record.classId]) {
          classGroups[record.classId] = [];
        }
        classGroups[record.classId].push(record);
      });

      Object.entries(classGroups).forEach(([className, records]) => {
        const classData = records.map((record) => ({
          Estudiante: getStudentName(record.studentId),
          Fecha: formatDate(record.Fecha),
          Estado: record.status,
          Justificacion: record.justification || '-',
          Observaciones: record.observaciones || '-',
        }));

        const classSheet = XLSX.utils.json_to_sheet(classData);
        XLSX.utils.book_append_sheet(workbook, classSheet, className.substring(0, 30)); // Excel tiene límite de longitud para nombres de hoja
      });
    }

    // Si agrupamos por estudiante, agregar hojas por estudiante
    if (groupByStudent.value) {
      const studentGroups = {};
      filteredRecords.value.forEach((record) => {
        if (!studentGroups[record.studentId]) {
          studentGroups[record.studentId] = [];
        }
        studentGroups[record.studentId].push(record);
      });

      Object.entries(studentGroups).forEach(([studentId, records]) => {
        const studentName = getStudentName(studentId).substring(0, 30);
        const studentData = records.map((record) => ({
          Clase: record.classId,
          Fecha: formatDate(record.Fecha),
          Estado: record.status,
          Justificacion: record.justification || '-',
          Observaciones: record.observaciones || '-',
        }));

        const studentSheet = XLSX.utils.json_to_sheet(studentData);
        XLSX.utils.book_append_sheet(workbook, studentSheet, studentName);
      });
    }

    // Guardar archivo
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    throw error;
  }
};

// Exportar a CSV
const exportToCsv = (data, title) => {
  try {
    // Convertir datos a CSV
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

    // Crear blob
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });

    // Crear link para descarga
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error exportando a CSV:', error);
    throw error;
  }
};

// Cargar datos al montar el componente
onMounted(async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // Asegurarse de que todos los datos estén cargados
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAttendance(),
    ]);
  } catch (err) {
    console.error('Error al cargar datos:', err);
    error.value = 'Error al cargar los datos para el reporte';
  } finally {
    isLoading.value = false;
  }
});
</script>
