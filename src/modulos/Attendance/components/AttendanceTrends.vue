<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg"
    >
      {{ error }}
    </div>

    <div v-else>
      <!-- Filtros -->
      <div class="card mb-4">
        <h3 class="text-lg font-semibold mb-4">Filtros de Tendencias</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option v-for="class_ in classes" :key="class_.id" :value="class_.id">
                {{ class_.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-1">Agrupación</label>
            <select v-model="filters.groupBy" class="input w-full">
              <option value="day">Por día</option>
              <option value="week">Por semana</option>
              <option value="month">Por mes</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <button class="btn btn-primary" @click="generateTrends">Generar Tendencias</button>
        </div>
      </div>

      <!-- Gráfico de Tendencias -->
      <div v-if="hasTrendData" class="card">
        <h3 class="text-lg font-semibold mb-4">Tendencias de Asistencia</h3>
        <div class="h-80">
          <AttendanceTrendChart :data="trendChartData" />
        </div>

        <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Este gráfico muestra la evolución de la asistencia a lo largo del tiempo. Las líneas
            representan los diferentes estados de asistencia.
          </p>
          <p>
            Puedes cambiar el rango de fechas y la agrupación para ver diferentes perspectivas de
            los datos.
          </p>
        </div>
      </div>

      <!-- Sin datos -->
      <div v-else-if="!isLoading" class="card">
        <div class="text-center py-8 text-gray-500">
          <p>No hay datos suficientes para mostrar tendencias.</p>
          <p>Intenta seleccionar un rango de fechas más amplio o cambiar los filtros.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import {
  format,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useAttendanceStore } from '../store/attendance';
import { useClassesStore } from '../../Classes/store/classes';
import { useAttendanceOptimized } from '../../../obsoleto/useAttendanceOptimized';
import AttendanceTrendChart from './AttendanceTrendChart.vue';
import { ChartData, TrendData, TrendDataPoint } from '../types/chartTypes';

interface AttendanceRecord {
  id: string
  Fecha: string
  classId: string
  studentId: string
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado'
}

export default defineComponent({
  name: 'AttendanceTrends',
  components: {
    AttendanceTrendChart,
  },
  setup() {
    const attendanceStore = useAttendanceStore();
    const classesStore = useClassesStore();

    // Composable optimizado
    const {
      loading: optimizedLoading,
      error: optimizedError,
      documents: attendanceDocuments,
      searchByDateRange,
    } = useAttendanceOptimized();

    const localError = ref<string>('');
    const isLoading = computed(() => optimizedLoading.value);
    const error = computed(() => optimizedError.value || localError.value);

    // Obtener la fecha actual y restar 3 meses para el rango predeterminado
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    // Filtros
    const filters = ref({
      startDate: format(threeMonthsAgo, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      class: '',
      groupBy: 'week', // 'day', 'week', 'month'
    }); // Datos para el gráfico
    const trendData = ref<TrendData>({
      present: [],
      absent: [],
      late: [],
      justified: [],
    });

    // Clases disponibles
    const classes = computed(() => classesStore.classes);

    // Verificar si hay datos para mostrar
    const hasTrendData = computed(
      () =>
        trendData.value.present.length > 0 ||
        trendData.value.absent.length > 0 ||
        trendData.value.late.length > 0 ||
        trendData.value.justified.length > 0,
    ); // Datos formateados para el gráfico de líneas
    const trendChartData = computed<ChartData>(() => {
      // Obtener todas las fechas únicas de todos los conjuntos de datos
      const allDates = [
        ...trendData.value.present.map((item) => item.date),
        ...trendData.value.absent.map((item) => item.date),
        ...trendData.value.late.map((item) => item.date),
        ...trendData.value.justified.map((item) => item.date),
      ];

      // Eliminar duplicados y ordenar
      const uniqueDates = [...new Set(allDates)].sort();

      // Formatear las fechas según la agrupación
      const formattedLabels = uniqueDates.map((date) => {
        if (filters.value.groupBy === 'day') {
          return format(new Date(date), 'dd/MM/yyyy');
        } else if (filters.value.groupBy === 'week') {
          return `Semana del ${format(new Date(date), 'dd/MM/yyyy')}`;
        } else {
          return format(new Date(date), 'MMMM yyyy', { locale: es });
        }
      });

      // Crear los conjuntos de datos para el gráfico
      return {
        labels: formattedLabels,
        datasets: [
          {
            label: 'Presentes',
            data: uniqueDates.map((date) => {
              const found = trendData.value.present.find((item) => item.date === date);
              return found ? found.value : 0;
            }),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
          },
          {
            label: 'Ausentes',
            data: uniqueDates.map((date) => {
              const found = trendData.value.absent.find((item) => item.date === date);
              return found ? found.value : 0;
            }),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
          },
          {
            label: 'Tardanzas',
            data: uniqueDates.map((date) => {
              const found = trendData.value.late.find((item) => item.date === date);
              return found ? found.value : 0;
            }),
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgba(234, 179, 8, 0.5)',
          },
          {
            label: 'Justificados',
            data: uniqueDates.map((date) => {
              const found = trendData.value.justified.find((item) => item.date === date);
              return found ? found.value : 0;
            }),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
          },
        ],
      };
    });

    // Generar puntos de fecha según la agrupación
    const generateDatePoints = (startDate, endDate, groupBy) => {
      if (groupBy === 'day') {
        return eachDayOfInterval({ start: startDate, end: endDate });
      } else if (groupBy === 'week') {
        return eachWeekOfInterval(
          { start: startDate, end: endDate },
          { weekStartsOn: 1 }, // Semana comienza el lunes
        );
      } else {
        return eachMonthOfInterval({ start: startDate, end: endDate });
      }
    };

    // Filtrar registros por punto de fecha
    const filterRecordsByDatePoint = (records, datePoint, groupBy) => {
      return records.filter((record) => {
        const recordDate = new Date(record.Fecha);

        if (groupBy === 'day') {
          // Para agrupación diaria, comparar año, mes y día
          return (
            recordDate.getFullYear() === datePoint.getFullYear() &&
            recordDate.getMonth() === datePoint.getMonth() &&
            recordDate.getDate() === datePoint.getDate()
          );
        } else if (groupBy === 'week') {
          // Para agrupación semanal, verificar si el registro está en la misma semana
          const recordWeekStart = startOfWeek(recordDate, { weekStartsOn: 1 });
          const pointWeekStart = startOfWeek(datePoint, { weekStartsOn: 1 });

          return recordWeekStart.getTime() === pointWeekStart.getTime();
        } else {
          // Para agrupación mensual, comparar año y mes
          const recordMonthStart = startOfMonth(recordDate);
          const pointMonthStart = startOfMonth(datePoint);

          return recordMonthStart.getTime() === pointMonthStart.getTime();
        }
      });
    }; // Generar tendencias
    const generateTrends = async () => {
      try {
        // Validar fechas
        if (!filters.value.startDate || !filters.value.endDate) {
          localError.value = 'Por favor seleccione un rango de fechas válido';
          return;
        }
        // Asegurarse de que la fecha de inicio es anterior a la fecha de fin
        if (new Date(filters.value.startDate) > new Date(filters.value.endDate)) {
          localError.value = 'La fecha de inicio debe ser anterior a la fecha de fin';
          return;
        }

        localError.value = ''; // Limpiar errores previos

        // Obtener registros de asistencia optimizados por rango de fechas
        await searchByDateRange(filters.value.startDate, filters.value.endDate);
        const documents = attendanceDocuments.value;
        // Convertir documentos a registros con filtros aplicados
        const records: AttendanceRecord[] = [];

        documents.forEach((doc) => {
          // Aplicar filtro de clase si está seleccionado
          if (filters.value.class && doc.classId !== filters.value.class) {
            return;
          }

          // Procesar presentes
          doc.data.presentes?.forEach((studentId) => {
            records.push({
              id: `${doc.fecha}_${doc.classId}_${studentId}_presente`,
              Fecha: doc.fecha,
              classId: doc.classId,
              studentId,
              status: 'Presente',
            });
          });

          // Procesar ausentes
          doc.data.ausentes?.forEach((studentId) => {
            const justification = doc.data.justificacion?.find((j) => j.id === studentId);
            records.push({
              id: `${doc.fecha}_${doc.classId}_${studentId}_ausente`,
              Fecha: doc.fecha,
              classId: doc.classId,
              studentId,
              status: justification ? 'Justificado' : 'Ausente',
            });
          });

          // Procesar tarde
          doc.data.tarde?.forEach((studentId) => {
            const justification = doc.data.justificacion?.find((j) => j.id === studentId);
            records.push({
              id: `${doc.fecha}_${doc.classId}_${studentId}_tarde`,
              Fecha: doc.fecha,
              classId: doc.classId,
              studentId,
              status: justification ? 'Justificado' : 'Tardanza',
            });
          });
        });

        // Generar los puntos de datos según la agrupación seleccionada
        const datePoints = generateDatePoints(
          new Date(filters.value.startDate),
          new Date(filters.value.endDate),
          filters.value.groupBy,
        );
        // Inicializar los datos de tendencias
        const present: TrendDataPoint[] = [];
        const absent: TrendDataPoint[] = [];
        const late: TrendDataPoint[] = [];
        const justified: TrendDataPoint[] = [];

        // Calcular los porcentajes para cada punto de fecha
        datePoints.forEach((datePoint) => {
          // Filtrar registros para este punto de fecha
          const pointRecords = filterRecordsByDatePoint(records, datePoint, filters.value.groupBy);

          // Si no hay registros para este punto, omitirlo
          if (pointRecords.length === 0) return;

          // Contar los diferentes estados
          const presentCount = pointRecords.filter((r) => r.status === 'Presente').length;
          const absentCount = pointRecords.filter((r) => r.status === 'Ausente').length;
          const lateCount = pointRecords.filter((r) => r.status === 'Tardanza').length;
          const justifiedCount = pointRecords.filter((r) => r.status === 'Justificado').length;

          // Calcular porcentajes
          const total = pointRecords.length;
          const presentPercentage = (presentCount / total) * 100;
          const absentPercentage = (absentCount / total) * 100;
          const latePercentage = (lateCount / total) * 100;
          const justifiedPercentage = (justifiedCount / total) * 100;

          // Agregar los datos a los arrays
          present.push({ date: datePoint.toISOString(), value: Math.round(presentPercentage) });
          absent.push({ date: datePoint.toISOString(), value: Math.round(absentPercentage) });
          late.push({ date: datePoint.toISOString(), value: Math.round(latePercentage) });
          justified.push({ date: datePoint.toISOString(), value: Math.round(justifiedPercentage) });
        });

        // Actualizar los datos de tendencias
        trendData.value = {
          present,
          absent,
          late,
          justified,
        };
      } catch (err) {
        console.error('Error generando tendencias:', err);
      }
    };

    // Cargar datos iniciales
    onMounted(async () => {
      try {
        await classesStore.fetchClasses();
        await generateTrends();
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    });

    // Observar cambios en los filtros para regenerar tendencias
    watch(
      [() => filters.value.startDate, () => filters.value.endDate, () => filters.value.class],
      () => {
        // No regenerar automáticamente para evitar muchas llamadas
        // El usuario debe hacer clic en el botón "Generar Tendencias"
      },
      { deep: true },
    );

    return {
      isLoading,
      error,
      filters,
      classes,
      hasTrendData,
      trendChartData,
      generateTrends,
    };
  },
});
</script>
