<template>
  <div class="teacher-classes">
    <!-- Filtros y búsqueda -->
    <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1">Buscar</label>
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre de clase o instrumento..."
            class="input w-full pl-10"
          />
          <MagnifyingGlassIcon class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Instrumento</label>
        <select v-model="filterInstrument" class="input w-full">
          <option value="">Todos los instrumentos</option>
          <option v-for="instrument in instruments" :key="instrument" :value="instrument">
            {{ instrument }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Nivel</label>
        <select v-model="filterLevel" class="input w-full">
          <option value="">Todos los niveles</option>
          <option v-for="level in levels" :key="level" :value="level">
            {{ level }}
          </option>
        </select>
      </div>
    </div>

    <!-- Pestañas para separar tipos de clases -->
    <div class="mb-6">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'my-classes'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="activeTab = 'my-classes'"
          >
            Mis Clases ({{ myClasses.length }})
          </button>
          <button
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'shared-classes'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="activeTab = 'shared-classes'"
          >
            Clases Compartidas ({{ sharedClasses.length }})
          </button>
        </nav>
      </div>
    </div>

    <!-- Estadísticas de clases -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h4 class="text-sm text-gray-600 dark:text-gray-400">Total de Clases</h4>
        <div class="flex items-center justify-between mt-2">
          <p class="text-2xl font-bold">{{ classesStats.total }}</p>
          <AcademicCapIcon class="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div class="stat-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h4 class="text-sm text-gray-600 dark:text-gray-400">Total de Estudiantes</h4>
        <div class="flex items-center justify-between mt-2">
          <p class="text-2xl font-bold">{{ classesStats.students }}</p>
          <UserGroupIcon class="h-8 w-8 text-green-500" />
        </div>
      </div>

      <div class="stat-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h4 class="text-sm text-gray-600 dark:text-gray-400">Clases Individuales</h4>
        <div class="flex items-center justify-between mt-2">
          <p class="text-2xl font-bold">{{ classesStats.individual }}</p>
          <UserIcon class="h-8 w-8 text-purple-500" />
        </div>
      </div>

      <div class="stat-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h4 class="text-sm text-gray-600 dark:text-gray-400">Clases Grupales</h4>
        <div class="flex items-center justify-between mt-2">
          <p class="text-2xl font-bold">{{ classesStats.group }}</p>
          <UsersIcon class="h-8 w-8 text-orange-500" />
        </div>
      </div>
    </div>
    <!-- Lista de clases -->
    <div class="space-y-6 mb-6">
      <div v-if="filteredClasses.length === 0" class="text-center py-12">
        <DocumentTextIcon class="h-12 w-12 mx-auto text-gray-400" />
        <h3 class="mt-2 text-lg font-medium text-gray-500">
          {{
            activeTab === "shared-classes"
              ? "No tienes clases compartidas"
              : "No se encontraron clases"
          }}
        </h3>
        <p class="mt-1 text-gray-500">
          {{
            hasFilters
              ? "Intenta cambiar tus filtros de búsqueda."
              : activeTab === "shared-classes"
                ? "No tienes clases compartidas actualmente."
                : "No tienes clases asignadas actualmente."
          }}
        </p>
      </div>

      <!-- Mostrar clases compartidas con componente especializado -->
      <div v-if="activeTab === 'shared-classes'">
        <SharedClassCard
          v-for="class_ in filteredClasses"
          :key="class_.id"
          :class-data="class_"
          @view="showClassDetails"
          @take-attendance="takeAttendance"
          @view-history="viewHistory"
        />
      </div>

      <!-- Mostrar clases propias con diseño regular -->
      <div v-else>
        <div
          v-for="class_ in filteredClasses"
          :key="class_.id"
          class="class-card bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all hover:shadow-lg"
        >
          <!-- Contenido de clase propia existente -->
          <div class="p-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div class="flex items-center mb-2">
                  <h3 class="text-lg font-semibold mr-3">{{ class_.nombre || class_.name }}</h3>
                  <span
                    class="px-2 py-1 text-xs rounded-full"
                    :class="getClassTypeClass(class_.type || 'group')"
                  >
                    {{ getClassTypeLabel(class_.type || "group") }}
                  </span>
                </div>
                <p class="text-gray-600 dark:text-gray-400 mb-2">{{ class_.description }}</p>
                <div class="flex flex-wrap gap-2 mb-3">
                  <span
                    class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    {{ class_.instrument || "Múltiples instrumentos" }}
                  </span>
                  <span
                    class="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                  >
                    {{ class_.level || "Todos los niveles" }}
                  </span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div class="flex items-center">
                    <UserGroupIcon class="h-5 w-5 mr-2 text-gray-500" />
                    <span class="text-sm"
                      >{{ (class_.studentIds || class_.alumnos)?.length || 0 }} estudiantes</span
                    >
                  </div>
                  <div class="flex items-center">
                    <ClockIcon class="h-5 w-5 mr-2 text-gray-500" />
                    <span class="text-sm">{{ formatScheduleCount(class_) }}</span>
                  </div>
                  <div class="flex items-center">
                    <CalendarIcon class="h-5 w-5 mr-2 text-gray-500" />
                    <span class="text-sm">{{ formatNextClass(class_) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex justify-end items-start space-x-2 flex-shrink-0">
                <button
                  class="btn bg-blue-600 text-white hover:bg-blue-700"
                  @click="showClassDetails(class_)"
                >
                  Ver Detalles
                </button>
                <button
                  class="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  @click="showStudentList(class_)"
                >
                  Estudiantes
                </button>
              </div>
            </div>
          </div>
          <!-- Horarios de la clase -->
          <div
            v-if="class_.schedule && class_.schedule.length > 0"
            class="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t dark:border-gray-700"
          >
            <h4 class="font-medium mb-2">Horarios</h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(schedule, index) in class_.schedule"
                :key="index"
                class="px-3 py-1 bg-white dark:bg-gray-700 text-sm rounded-md shadow-sm"
              >
                {{ schedule.day }}, {{ schedule.startTime }} - {{ formatEndTime(schedule) }} ·
                {{ schedule.location }}
              </div>
            </div>
          </div>
        </div>
        <!-- End class card -->
      </div>
      <!-- Paginación -->
      <div v-if="filteredClasses.length > 0" class="flex justify-between items-center">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {{ paginatedClasses.length }} de {{ filteredClasses.length }} clases
        </div>
        <div class="flex space-x-1">
          <button
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded-md"
            :class="
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            "
            @click="currentPage = Math.max(1, currentPage - 1)"
          >
            Anterior
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            class="px-3 py-1 rounded-md"
            :class="
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            "
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
    <!-- Modal de lista de estudiantes -->
    <div
      v-if="selectedClassStudents"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl">
        <div class="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h3 class="text-lg font-semibold">Estudiantes de {{ selectedClassStudents.name }}</h3>
          <button
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            @click="selectedClassStudents = null"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        <div class="p-6">
          <div v-if="classStudents.length > 0" class="space-y-4 max-h-[60vh] overflow-y-auto">
            <div
              v-for="student in classStudents"
              :key="student.id"
              class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div
                class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-4 overflow-hidden"
              >
                <StudentAvatar
                  :first-name="student.nombre || ''"
                  :last-name="student.apellido || ''"
                  size="lg"
                />
              </div>
              <div class="flex-grow">
                <h4 class="font-medium">{{ student.nombre }} {{ student.apellido }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ student.instrumento }} · {{ student.edad }} años
                </p>
              </div>
              <div>
                <button
                  class="btn bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  @click="showStudentDetails(student.id)"
                >
                  Ver Perfil
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12">
            <UserIcon class="h-12 w-12 mx-auto text-gray-400" />
            <h3 class="mt-2 text-lg font-medium text-gray-500">No hay estudiantes asignados</h3>
            <p class="mt-1 text-gray-500">Esta clase aún no tiene estudiantes asignados.</p>
          </div>
        </div>
        <div class="px-6 py-4 border-t dark:border-gray-700 flex justify-end">
          <button
            class="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            @click="selectedClassStudents = null"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
  <div>
    <div
      v-if="selectedStudentDetails"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl">
        <div class="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h3 class="text-lg font-semibold">Detalles del Estudiante</h3>
          <button
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            @click="selectedStudentDetails = null"
          >
            <XMarkIcon class="h-5 w-5" />
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, addMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'vue-router';
import { useClassesStore } from '../../stores/classes';
import { useStudentsStore } from '../../modulos/Students/store/students';
import { useTeachersStore } from '../../modulos/Teachers/store/teachers';
import type { Student } from '../../modulos/Students/types/student';
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';
import StudentAvatar from '../../modulos/Students/components/StudentAvatar.vue';
import SharedClassCard from '../../modulos/Teachers/components/SharedClassCard.vue';

// Interfaces
interface Schedule {
  day: string
  startTime: string
  endTime: string
  location?: string
}

interface TeacherClass {
  id: string
  nombre: string
  name?: string // Para compatibilidad
  description?: string
  instrument?: string
  level?: string
  type?: 'individual' | 'group'
  teacherId: string
  studentIds?: string[]
  alumnos?: string[] // Nombre real de la propiedad
  horario?: {
    dia: string
    horaInicio: string
    horaFin: string
  }
  schedule?: Schedule[]
  nextDate?: string
  contenido?: string
  temas?: Array<{
    id: string
    titulo: string
    descripcion?: string
  }>
}

// Router
const router = useRouter();

// Stores
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const teachersStore = useTeachersStore();

// Estado
const searchQuery = ref('');
const filterInstrument = ref('');
const filterLevel = ref('');
const currentPage = ref(1);
const pageSize = 5;
const selectedClassStudents = ref<TeacherClass | null>(null);
const classStudents = ref<Student[]>([]);
const activeTab = ref('my-classes');
const teacherClasses = ref<TeacherClass[]>([]);

// ID del profesor (simulado)
const teacherId = '1'; // En un caso real, se obtendría del usuario autenticado

// Opciones de filtro
const instruments = ['Piano', 'Violín', 'Guitarra', 'Flauta', 'Violonchelo', 'Percusión'];
const levels = ['Principiante', 'Intermedio', 'Avanzado'];

// Estadísticas de clases
const classesStats = computed(() => {
  const total = teacherClasses.value.length;
  const students = 0;
  let individual = 0;
  let group = 0;

  const uniqueStudents = new Set();

  teacherClasses.value.forEach((cls) => {
    const studentList = cls.studentIds || cls.alumnos;
    if (studentList) {
      studentList.forEach((id: string) => uniqueStudents.add(id));
    }

    if (cls.type === 'individual') {
      individual++;
    } else {
      group++;
    }
  });

  return {
    total,
    students: uniqueStudents.size,
    individual,
    group,
  };
});

// Clases del profesor
const sharedClasses = ref<TeacherClass[]>([]);

// Clases mostradas según la pestaña activa
const myClasses = computed(() => teacherClasses.value);
const currentClasses = computed(() => {
  return activeTab.value === 'my-classes' ? myClasses.value : sharedClasses.value;
});

// Clases filtradas (usa currentClasses en lugar de teacherClasses)
const filteredClasses = computed(() => {
  let result = [...currentClasses.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (cls) =>
        (cls.name ?? '').toLowerCase().includes(query) ||
        (cls.instrument && cls.instrument.toLowerCase().includes(query)),
    );
  }

  if (filterInstrument.value) {
    result = result.filter((cls) => cls.instrument === filterInstrument.value);
  }

  if (filterLevel.value) {
    result = result.filter((cls) => cls.level === filterLevel.value);
  }

  return result;
});

// Clases paginadas
const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredClasses.value.slice(start, end);
});

// Total de páginas
const totalPages = computed(() => Math.ceil(filteredClasses.value.length / pageSize));

// Verificar si hay filtros activos
const hasFilters = computed(() => searchQuery.value || filterInstrument.value || filterLevel.value);

// Formatear el número de horarios
const formatScheduleCount = (class_: TeacherClass) => {
  const count = class_.schedule?.length || 0;
  return count === 1 ? '1 sesión semanal' : `${count} sesiones semanales`;
};

// Formatear la fecha de la próxima clase
const formatNextClass = (class_: TeacherClass) => {
  if (!class_.nextDate) return 'Sin programación';

  const nextDate = parseISO(class_.nextDate);
  return format(nextDate, 'd \'de\' MMMM', { locale: es });
};

// Formatear la hora de finalización
const formatEndTime = (schedule: Schedule) => {
  const [hours, minutes] = schedule.startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0);

  const durationMinutes = 90; // 1.5 horas por defecto
  const endDate = addMinutes(startDate, durationMinutes);

  return format(endDate, 'HH:mm');
};

// Obtener etiqueta del tipo de clase
const getClassTypeLabel = (type: string) => {
  switch (type) {
  case 'individual':
    return 'Individual';
  case 'group':
    return 'Grupal';
  case 'ensemble':
    return 'Conjunto';
  case 'workshop':
    return 'Taller';
  default:
    return 'Regular';
  }
};

// Obtener clase CSS para el tipo de clase
const getClassTypeClass = (type: string) => {
  switch (type) {
  case 'individual':
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
  case 'group':
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
  case 'ensemble':
    return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
  case 'workshop':
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
  default:
    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
  }
};

// Mostrar detalles de la clase
const showClassDetails = (class_: TeacherClass) => {
  router.push(`/classes/${class_.id}`);
};

// Mostrar lista de estudiantes
const showStudentList = async (class_: TeacherClass) => {
  selectedClassStudents.value = class_;

  try {
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents();
    }

    // Filtrar estudiantes de esta clase
    const studentList = class_.studentIds || class_.alumnos || [];
    classStudents.value = studentsStore.students.filter((student) =>
      studentList.includes(student.id),
    );
  } catch (error) {
    console.error('Error al cargar estudiantes de la clase:', error);
  }
};

// Mostrar detalles del estudiante
const showStudentDetails = (studentId: string) => {
  router.push(`/students/${studentId}`);
};

// Funciones para clases compartidas
const takeAttendance = (class_: TeacherClass) => {
  router.push(`/teacher/classes/${class_.id}/attendance`);
};

const viewHistory = (class_: TeacherClass) => {
  router.push(`/teacher/classes/${class_.id}/history`);
};

// Resetear la página actual cuando cambian los filtros
watch([searchQuery, filterInstrument, filterLevel], () => {
  currentPage.value = 1;
});

// Cargar datos al montar el componente
onMounted(async () => {
  try {
    // Cargar clases
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
    }

    // Filtrar clases para este profesor (como maestro principal)
    teacherClasses.value = classesStore.classes.filter((c) => c.teacherId === teacherId);

    // Cargar clases compartidas (donde es asistente)
    sharedClasses.value = await teachersStore.getSharedClasses(teacherId);
  } catch (error) {
    console.error('Error al cargar clases del profesor:', error);
  }
});
</script>

<style scoped>
.input {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  background-color: white;
  outline: none;
}

.input:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  border-color: #3b82f6;
}

.dark .input {
  border-color: #4b5563;
  background-color: #374151;
}

.btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-card,
.class-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover,
.class-card:hover {
  transform: translateY(-2px);
}
</style>
