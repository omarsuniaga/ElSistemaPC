<template>
  <div class="clases-calendario-container">
    <!-- Selector de fecha -->
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Clases del día</h2>
      <div class="flex items-center space-x-2">
        <button
          class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          @click="changeDate(-1)"
        >
          <ChevronLeftIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        <input
          v-model="selectedDate"
          type="date"
          class="form-input rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />

        <button
          class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          @click="changeDate(1)"
        >
          <ChevronRightIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        <button
          class="ml-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition"
          @click="goToToday"
        >
          Hoy
        </button>
      </div>
    </div>

    <!-- Tabla de clases -->
    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
      <div v-if="loading" class="p-6 text-center">
        <div
          class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"
        />
        <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando clases...</p>
      </div>

      <div v-else-if="!clases.length" class="p-6 text-center">
        <p class="text-gray-600 dark:text-gray-400">No hay clases programadas para esta fecha.</p>
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Clase e Instrumento
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Horario y Estatus
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Profesor
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Estudiantes
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Nivel
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Observaciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="clase in clases"
            :key="clase.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <td class="px-6 py-4">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ clase.nombre }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ clase.instrumento }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900 dark:text-gray-100">
                {{ formatTime(clase.horarioInicio) }} - {{ formatTime(clase.horarioFin) }}
              </div>
              <div class="mt-1">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(clase)"
                >
                  {{ getStatusText(clase) }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900 dark:text-gray-100">
                {{ teacherNames[clase.teacherId] || "Cargando..." }}
              </div>
            </td>
            <td class="px-6 py-4">
              <button
                class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                @click="openStudentModal(clase)"
              >
                {{ clase.alumnos?.length || 0 }} estudiantes
              </button>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900 dark:text-gray-100">{{ clase.nivel }}</div>
            </td>
            <td class="px-6 py-4">
              <div v-if="clase.observaciones" class="text-sm text-gray-500 dark:text-gray-400">
                {{ clase.observaciones }}
              </div>
              <button
                v-else
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                @click="addObservation(clase)"
              >
                + Agregar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de estudiantes -->
    <div
      v-if="showStudentModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg mx-4">
        <div
          class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Estudiantes de {{ selectedClase?.nombre }}
          </h3>
          <button class="text-gray-400 hover:text-gray-500" @click="showStudentModal = false">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        <div class="p-4 max-h-96 overflow-y-auto">
          <ul v-if="selectedClase?.alumnos?.length" class="space-y-2">
            <li
              v-for="(alumno, index) in selectedClase.alumnos"
              :key="index"
              class="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
            >
              <div class="flex items-center">
                <div
                  class="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300"
                >
                  {{ getInitials(alumno.nombre) }}
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ alumno.nombre }}
                  </p>
                  <p v-if="alumno.asistencia" class="text-xs text-green-600 dark:text-green-400">
                    Presente
                  </p>
                  <p v-else class="text-xs text-red-600 dark:text-red-400">Ausente</p>
                </div>
              </div>
            </li>
          </ul>
          <p v-else class="text-gray-500 dark:text-gray-400 text-center">
            No hay estudiantes asignados a esta clase.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/vue/20/solid';

// Interfaces
interface Alumno {
  id: string
  nombre: string
  asistencia?: boolean
}

interface Clase {
  id: string
  nombre: string
  instrumento: string
  horarioInicio: Timestamp
  horarioFin: Timestamp
  teacherId: string
  alumnos: Alumno[]
  nivel: string
  observaciones?: string
  fecha: Timestamp
}

// Estado reactivo
const selectedDate = ref(new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD
const clases = ref<Clase[]>([]);
const loading = ref(false);
const teacherNames = ref<Record<string, string>>({});
const showStudentModal = ref(false);
const selectedClase = ref<Clase | null>(null);

// Cambiar de día
const changeDate = (days: number) => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() + days);
  selectedDate.value = date.toISOString().split('T')[0];
};

// Ir al día de hoy
const goToToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0];
};

// Formatear hora (Timestamp a string "HH:MM")
const formatTime = (timestamp: Timestamp): string => {
  if (!timestamp) return '--:--';

  const date = timestamp.toDate();
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Obtener texto y clase CSS para el estado de la clase
const getStatusClass = (clase: Clase): string => {
  const now = new Date();
  const inicio = clase.horarioInicio?.toDate();
  const fin = clase.horarioFin?.toDate();

  if (!inicio || !fin) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

  // Si la fecha es hoy
  if (isToday(clase.fecha?.toDate())) {
    if (now < inicio) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else if (now >= inicio && now <= fin) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  } else if (clase.fecha?.toDate() < now) {
    // Fecha pasada
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  } else {
    // Fecha futura
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
  }
};

const getStatusText = (clase: Clase): string => {
  const now = new Date();
  const inicio = clase.horarioInicio?.toDate();
  const fin = clase.horarioFin?.toDate();

  if (!inicio || !fin) return 'Sin horario';

  // Si la fecha es hoy
  if (isToday(clase.fecha?.toDate())) {
    if (now < inicio) {
      return 'Próxima';
    } else if (now >= inicio && now <= fin) {
      return 'En curso';
    } else {
      return 'Finalizada';
    }
  } else if (clase.fecha?.toDate() < now) {
    // Fecha pasada
    return 'Histórico';
  } else {
    // Fecha futura
    return 'Programada';
  }
};

// Comprobar si una fecha es hoy
const isToday = (date?: Date): boolean => {
  if (!date) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Obtener iniciales de un nombre
const getInitials = (name: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Cargar datos de las clases
const fetchClases = async () => {
  if (!selectedDate.value) return;

  loading.value = true;
  clases.value = [];

  try {
    // Convertir la fecha seleccionada a objeto Date (inicio y fin del día)
    const startDate = new Date(selectedDate.value);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(selectedDate.value);
    endDate.setHours(23, 59, 59, 999);

    // Convertir a Timestamps de Firestore
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Consulta a Firestore
    const clasesRef = collection(db, 'CLASES');
    const q = query(
      clasesRef,
      where('fecha', '>=', startTimestamp),
      where('fecha', '<=', endTimestamp),
      orderBy('fecha'),
      orderBy('horarioInicio'),
    );

    const querySnapshot = await getDocs(q);
    const clasesData: Clase[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<Clase, 'id'>;
      clasesData.push({
        id: doc.id,
        ...data,
      });
    });

    clases.value = clasesData;

    // Cargar nombres de profesores
    await loadTeacherNames();
  } catch (error) {
    console.error('Error al cargar las clases:', error);
  } finally {
    loading.value = false;
  }
};

// Cargar nombres de profesores
const loadTeacherNames = async () => {
  const teacherIds = new Set<string>();

  // Recopilar todos los IDs de profesores
  clases.value.forEach((clase) => {
    if (clase.teacherId) {
      teacherIds.add(clase.teacherId);
    }
  });

  // Consultar la información de cada profesor
  for (const teacherId of teacherIds) {
    try {
      const teacherDoc = await getDoc(doc(db, 'PROFESORES', teacherId));
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        teacherNames.value[teacherId] = `${teacherData.nombre} ${teacherData.apellido}`;
      } else {
        teacherNames.value[teacherId] = 'Profesor no encontrado';
      }
    } catch (error) {
      console.error(`Error al cargar profesor con ID ${teacherId}:`, error);
      teacherNames.value[teacherId] = 'Error al cargar';
    }
  }
};

// Abrir modal de estudiantes
const openStudentModal = (clase: Clase) => {
  selectedClase.value = clase;
  showStudentModal.value = true;
};

// Agregar observación a una clase
const addObservation = async (clase: Clase) => {
  // Implementar lógica para agregar observación
  // Esta funcionalidad requeriría un modal adicional o una UI específica
  console.log('Agregar observación a clase:', clase.id);
  // Ejemplo: mostrar un modal para agregar observación
};

// Observar cambios en la fecha seleccionada
watch(selectedDate, () => {
  fetchClases();
});

// Cargar datos al montar el componente
onMounted(() => {
  fetchClases();
});
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
