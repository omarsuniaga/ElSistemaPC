<template>
  <div
    ref="appContainer"
    class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900"
    @touchstart="startTouch"
    @touchend="endTouch"
  >
    <!-- Loader overlay -->
    <div
      v-if="isLoadingData"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
        <p class="text-gray-700 dark:text-gray-300">Cargando evaluaciones...</p>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="loadError" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow">
        <p>{{ loadError }}</p>
      </div>
    </div>

    <NotificationSystem :notifications="notifications" @dismiss="dismissNotification" />

    <WorkspaceHeader
      :filters-visible="filtersVisible"
      :classes="classes"
      @toggle-filters="toggleFiltersVisible"
      @export="exportData"
      @filter="handleFilter"
    />

    <div class="flex flex-1 overflow-hidden flex-col lg:flex-row relative">
      <StudentsPanel
        :students="filteredStudents"
        :expanded="studentsExpanded"
        :is-mobile="isMobile"
        :selected-students="selectedStudents"
        @toggle-panel="studentsExpanded = !studentsExpanded"
        @select-student="selectStudent"
        @update:search="studentSearch = $event"
      />

      <!-- Contenido Central: Cards de Evaluación -->
      <main
        class="flex-1 p-4 overflow-y-auto dark:bg-gray-900 transition-colors relative"
        :class="{
          'lg:ml-0': !studentsExpanded,
          'lg:mr-0': !contentsExpanded,
          'blur-sm': isMobile && (studentsExpanded || contentsExpanded),
          'w-full': isMobile,
          'w-[calc(100%-2rem)]': !isMobile && !studentsExpanded && !contentsExpanded,
          'w-[calc(100%-20rem)]': !isMobile && (studentsExpanded || contentsExpanded),
        }"
      >
        <!-- Mensaje de estado -->
        <div class="mb-4 flex justify-between items-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span v-if="evaluationCards.length">{{ evaluationCards.length }} evaluaciones </span>
            <span v-else
              >Ninguna evaluación activa. Selecciona estudiantes y un contenido para comenzar.</span
            >
          </p>
          <div class="flex gap-2">
            <!-- Agregar botón para contenido eventual -->
            <button
              class="btn-secondary flex items-center gap-1 text-sm"
              @click="showEmergentContentModal = true"
            >
              <PlusIcon class="h-4 w-4" />
              Contenido Emergente
            </button>
            <button
              v-if="selectedStudents.length"
              class="btn-primary flex items-center gap-1 text-sm"
              @click="createEvaluationCard()"
            >
              <PlusIcon class="h-4 w-4" />
              Nueva evaluación ({{ selectedStudents.length }})
            </button>
          </div>
        </div>

        <!-- Mensaje cuando no hay cards -->
        <div
          v-if="evaluationCards.length === 0"
          class="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <DocumentIcon class="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            No hay evaluaciones
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            Selecciona estudiantes del panel izquierdo y luego un contenido del panel derecho para
            crear una evaluación.
          </p>
          <button
            class="btn-secondary"
            @click="
              studentsExpanded = true
              contentsExpanded = true
            "
          >
            Comenzar
          </button>
        </div>

        <!-- Cards de evaluación -->
        <EvaluationCard
          v-for="card in evaluationCards"
          :key="card.id"
          :card="card"
          @toggle-progress="toggleProgressVisibility(card)"
          @toggle-edit="toggleCardEdit(card)"
          @delete="deleteCard(card)"
          @remove-student="removeStudentFromCard(card, $event)"
          @show-extra-students="showExtraStudents(card)"
        />
      </main>

      <ContentsPanel
        :contents="contents"
        :expanded="contentsExpanded"
        :is-mobile="isMobile"
        @toggle-panel="contentsExpanded = !contentsExpanded"
        @select-content="handleContentSelection"
      />

      <!-- Botones flotantes para móviles -->
      <div
        v-if="isMobile"
        class="fixed bottom-16 left-0 right-0 flex justify-between items-center px-3 items- gap-4 z-30"
      >
        <button
          class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          :class="{'bg-gray-500 hover:bg-gray-600': studentsExpanded}"
          @click="studentsExpanded = !studentsExpanded"
        >
          <UserIcon v-if="!studentsExpanded" class="h-6 w-6" />
          <XMarkIcon v-else class="h-6 w-6" />
        </button>

        <button
          class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          :class="{'bg-gray-500 hover:bg-gray-600': contentsExpanded}"
          @click="contentsExpanded = !contentsExpanded"
        >
          <BookOpenIcon v-if="!contentsExpanded" class="h-6 w-6" />
          <XMarkIcon v-else class="h-6 w-6" />
        </button>
      </div>

      <!-- Overlay para cerrar menús en móvil -->
      <div
        v-if="isMobile && (studentsExpanded || contentsExpanded)"
        class="fixed inset-0 bg-black bg-opacity-50 z-10 backdrop-blur-sm"
        @click="closeMenus"
      />
    </div>

    <!-- Modal para Contenido Emergente -->
    <Dialog
      :open="showEmergentContentModal"
      class="relative z-50"
      @close="showEmergentContentModal = false"
    >
      <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h2 class="text-lg font-semibold mb-4">Crear Contenido Emergente</h2>

          <form class="space-y-4" @submit.prevent="createEmergentContent">
            <!-- Nombre del Contenido -->
            <div>
              <label class="block text-sm font-medium mb-1">Título del Contenido</label>
              <input
                v-model="emergentContent.title"
                type="text"
                class="input w-full"
                placeholder="Ej: Técnica de respiración"
                required
              />
            </div>

            <!-- Subtítulo o Categoría -->
            <div>
              <label class="block text-sm font-medium mb-1">Subtítulo/Categoría</label>
              <input
                v-model="emergentContent.subtitle"
                type="text"
                class="input w-full"
                placeholder="Ej: Clase especial"
              />
            </div>

            <!-- Indicadores -->
            <div>
              <label class="block text-sm font-medium mb-1">Indicadores de Evaluación</label>
              <div
                v-for="(indicator, index) in emergentContent.indicators"
                :key="index"
                class="flex gap-2 mb-2"
              >
                <input
                  v-model="emergentContent.indicators[index]"
                  type="text"
                  class="input flex-grow"
                  placeholder="Ej: Precisión rítmica"
                />
                <button
                  type="button"
                  class="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                  @click="emergentContent.indicators.splice(index, 1)"
                >
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                class="btn-secondary mt-2 w-full"
                @click="emergentContent.indicators.push('')"
              >
                Agregar Indicador
              </button>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button type="button" class="btn-secondary" @click="showEmergentContentModal = false">
                Cancelar
              </button>
              <button type="submit" class="btn-primary">Crear Contenido</button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { PlusIcon, DocumentIcon, UserIcon, BookOpenIcon, XMarkIcon } from '@heroicons/vue/20/solid';
import { useRoute } from 'vue-router';
import { Dialog, DialogPanel } from '@headlessui/vue';

// Componentes
import NotificationSystem from '../components/NotificationSystem.vue';
import WorkspaceHeader from '../components/WorkspaceHeader.vue';
import StudentsPanel from '../components/StudentsPanel.vue';
import ContentsPanel from '../components/ContentsPanel.vue';
import EvaluationCard from '../components/EvaluationCard.vue';

// Stores
import { useAttendanceStore } from '../../Classes/stores/attendance';
import { useStudentsStore } from '../../Students/store/students';
import { useClassesStore } from '../../Classes/stores/classes';
import { useQualificationStore } from '../../Classes/stores/qualification';

// Variables reactivas
const attendanceStore = useAttendanceStore();
const studentsStore = useStudentsStore();
const classesStore = useClassesStore();
const selectedDate = ref(useAttendanceStore().selectedDate);
const notifications = ref([]);
const students = ref([]);
const route = useRoute();

// Reactive references for filters and UI state
const filtersVisible = ref(false);
const classes = ref([]);
const selectedClass = ref(null);
const selectedPeriod = ref('month');
const sortBy = ref('name');

// Handle filter changes
const handleFilter = ({ type, value }) => {
  switch (type) {
  case 'class':
    selectedClass.value = value;
    loadStudentsForClass(value);
    break;
  case 'period':
    selectedPeriod.value = value;
    break;
  case 'sort':
    sortBy.value = value;
    break;
  }
};

// Load students for a specific class
const loadStudentsForClass = async (classId) => {
  if (!classId) return;

  try {
    // First ensure students are loaded in the store
    await studentsStore.fetchStudents();
    students.value = studentsStore.getStudentsByClass(classId);

    if (students.value.length === 0) {
      showNotification('info', 'Sin estudiantes', 'No hay estudiantes asignados a esta clase.');
    }
  } catch (error) {
    console.error('Error loading students:', error);
    showNotification('error', 'Error', 'No se pudieron cargar los estudiantes.');
  }
};

// Load initial data
const loadInitialData = async () => {
  try {
    // First fetch classes
    await classesStore.fetchClasses();

    // Then get classes from store using the getter
    const storeClasses = classesStore.getClasses;
    classes.value = storeClasses;

    // Get class from route or use first available class
    const classFromRoute = route.params.classId;
    selectedClass.value = classFromRoute || (storeClasses.length > 0 ? storeClasses[0].id : null);

    if (!selectedClass.value) {
      throw new Error('No hay clases disponibles');
    }

    // Set selected class in attendance store
    attendanceStore.setSelectedClass(selectedClass.value);

    // Load students for selected class
    await loadStudentsForClass(selectedClass.value);

    // Load qualifications
    await loadInitialQualifications();
  } catch (error) {
    console.error('Error en la inicialización:', error);
    showNotification('error', 'Error', 'Ocurrió un error al cargar los datos iniciales.');
  }
};

// Configuración inicial y limpieza
onMounted(async () => {
  handleResize();
  window.addEventListener('resize', handleResize);
  await loadInitialData();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Búsqueda de estudiantes
const studentSearch = ref('');

// Array de cards de evaluación
const evaluationCards = ref([]);

// Card activa (para edición)
const activeCard = ref(null);

// Array global de alumnos seleccionados
const selectedStudents = ref([]);

// Contador global para nombres únicos
let globalGroupCounter = 1;

// Datos demo: menú recursivo de contenidos
const contents = ref([
  {
    title: 'Figuras Rítmicas Básicas',
    children: [
      {
        title: 'Teoría y Solfeo',
        children: [
          { title: 'Unidad de Tiempo', type: 'indicator' },
          { title: 'Ritmo Base', type: 'indicator' },
        ],
      },
      {
        title: 'Aplicaciones Prácticas',
        children: [{ title: 'Ejercicios de Ritmo', type: 'indicator' }],
      },
    ],
  },
  {
    title: 'Escalas Mayores',
    children: [
      {
        title: 'Teoría Musical',
        children: [{ title: 'Construcción de Escalas', type: 'indicator' }],
      },
      {
        title: 'Ejercicios Prácticos',
        children: [{ title: 'Ejercicios de Escalas', type: 'indicator' }],
      },
    ],
  },
  {
    title: 'Cifrado Armónico',
    children: [
      {
        title: 'Acordes',
        children: [
          { title: 'Triada Mayor', type: 'indicator' },
          { title: 'Triada Menor', type: 'indicator' },
        ],
      },
    ],
  },
]);

// Filtrar estudiantes para mostrar solo los que pertenecen a la clase activa
const filteredStudents = computed(() => {
  if (!selectedClass.value) return [];

  // Obtener los estudiantes de la clase activa
  const studentsInClass = studentsStore.getStudentsByClass(selectedClass.value);

  // Aplicar búsqueda si hay un término de búsqueda
  if (!studentSearch.value.trim()) return studentsInClass;

  const search = studentSearch.value.toLowerCase();
  return studentsInClass.filter(
    (student) =>
      student.nombre.toLowerCase().includes(search) ||
      student.apellido.toLowerCase().includes(search),
  );
});

// Verifica si un estudiante está seleccionado (en cualquier card o en la selección global)
const isStudentSelected = (student) => {
  // Verificar si está en la selección global
  if (selectedStudents.value.some((s) => s.id === student.id)) {
    return true;
  }

  // Verificar si está en alguna card en edición
  return evaluationCards.value.some(
    (card) => !card.locked && card.group.some((s) => s.id === student.id),
  );
};

// Al seleccionar un alumno desde el sidebar
const selectStudent = (student) => {
  // Si hay una card en edición
  const editableCard = evaluationCards.value.find((card) => !card.locked);

  if (editableCard) {
    // Verificar si el estudiante ya está en esta card
    const existsInCard = editableCard.group.some((s) => s.id === student.id);
    if (existsInCard) {
      // Si el estudiante ya está en la card, lo removemos (toggle)
      editableCard.group = editableCard.group.filter((s) => s.id !== student.id);
    } else {
      // Verificar si el estudiante ya está en otra card con el mismo contenido
      const isDuplicate = evaluationCards.value.some(
        (card) =>
          card !== editableCard &&
          card.contentTitle === editableCard.contentTitle &&
          card.group.some((s) => s.id === student.id),
      );

      if (isDuplicate) {
        alert('Este estudiante ya está siendo evaluado en este contenido en otra card');
        return;
      }

      // Agregar el estudiante a la card en edición
      editableCard.group.push(student);
    }
  } else {
    // Si no hay card en edición, toggle en la selección global
    const index = selectedStudents.value.findIndex((s) => s.id === student.id);
    if (index !== -1) {
      selectedStudents.value.splice(index, 1);
    } else {
      selectedStudents.value.push(student);
    }
  }
};

// Remover un alumno de una card (si está en edición)
const removeStudentFromCard = (card, student) => {
  if (!card.locked) {
    card.group = card.group.filter((s) => s.id !== student.id);
  }
};

// Mostrar nombres de alumnos adicionales (más de 6)
const showExtraStudents = (card) => {
  const sorted = sortedStudents(card.group);
  if (sorted.length > 6) {
    const extra = sorted.slice(6).map((s) => s.name);
    alert('Alumnos adicionales: ' + extra.join(', '));
  }
};

// Modifying the sortedStudents function around line 796
const sortedStudents = (group) => {
  return group.slice().sort((a, b) => {
    // Check if objects have the necessary properties
    const nameA = a.nombre || a.name || '';
    const nameB = b.nombre || b.name || '';
    return nameA.localeCompare(nameB);
  });
};

// Crear una nueva card de evaluación usando los alumnos globales seleccionados y luego limpiar el array
const createEvaluationCard = () => {
  if (selectedStudents.value.length === 0) return;
  const newCard = {
    id: Date.now(),
    group: [...selectedStudents.value],
    contentTitle: '',
    contentSubtitle: '',
    indicators: [],
    locked: false,
    hideProgress: false,
    comments: '',
  };
  evaluationCards.value.push(newCard);
  activeCard.value = newCard;
  selectedStudents.value = [];
  return newCard;
};

// Al seleccionar un indicador desde el menú recursivo
const handleContentSelection = (item, parentChain) => {
  // Verificar si hay estudiantes seleccionados o si ya existe una card activa
  if (!activeCard.value || activeCard.value.locked) {
    if (selectedStudents.value.length === 0) {
      // Mostrar alerta al usuario
      showNotification(
        'warning',
        'Selecciona al menos un estudiante',
        'Debes seleccionar estudiantes antes de crear una evaluación.',
      );

      // Destacar visualmente la sección de estudiantes
      studentsExpanded.value = true;

      // No proceder con la creación de la card
      return;
    }
    // cerrar el panel de estudiantes
    studentsExpanded.value = false;

    // Crear nueva card solo si hay estudiantes seleccionados
    activeCard.value = createEvaluationCard();

    // Si createEvaluationCard devolvió undefined (por alguna razón adicional), no continuar
    if (!activeCard.value) return;
  }

  // Continuar con el proceso normal usando activeCard.value que ahora es seguro
  const card = activeCard.value;
  if (parentChain && parentChain.length >= 2) {
    card.contentTitle = parentChain[0];
    card.contentSubtitle = parentChain[1] + ' - ' + item.title;
  } else {
    card.contentTitle = parentChain ? parentChain[0] : '';
    card.contentSubtitle = item.title;
  }
  const uniqueId = generateUniqueName(item, card);
  const newIndicator = {
    uniqueId,
    label: item.title,
    score: 0,
    selectedStudents: card.group,
  };
  const exists = card.indicators.find((ind) => ind.uniqueId === uniqueId);
  if (exists) {
    newIndicator.uniqueId = uniqueId + '_' + globalGroupCounter++;
  }
  card.indicators.push(newIndicator);
};

// Genera un nombre único combinando fecha, contenido, el primer alumno y el indicador
const generateUniqueName = (item, card) => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const groupId = card.group.length ? card.group[0].id : 'group';
  return `${day}${month}${year}_${card.contentTitle.toLowerCase().replace(/\s+/g, '_')}_${groupId}_${item.title.toLowerCase().replace(/\s+/g, '_')}`;
};

// Añadir estas variables para manejar el almacenamiento local
const pendingOperations = ref([]);
const isOfflineMode = ref(false);

// Simula guardar la card (aquí se llamarían métodos del store de Pinia)
const saveCard = async (card) => {
  try {
    card.locked = true;
    card.hideProgress = true;

    // Ensure group is an array of string IDs only
    const group = Array.isArray(card.group) ? card.group.map((student) => student.id) : [];

    const qualificationData = {
      classId: useAttendanceStore().selectedClass,
      contentTitle: card.contentTitle,
      contentSubtitle: card.contentSubtitle,
      group, // Now contains only IDs
      indicators: card.indicators,
      comments: card.comments,
      locked: card.locked,
      hideProgress: card.hideProgress,
      date: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    try {
      let savedId;

      if (card.id) {
        // Intentar actualizar en Firestore primero
        try {
          await useQualificationStore().updateQualification(card.id, qualificationData);
          showNotification(
            'success',
            'Actualizado',
            'La evaluación se ha actualizado correctamente.',
          );
        } catch (firestoreError) {
          console.warn(
            'Error al guardar en Firestore, usando almacenamiento local:',
            firestoreError,
          );
          isOfflineMode.value = true;

          // Guardar en localStorage
          saveToLocalStorage('update', card.id, qualificationData);
          showNotification(
            'warning',
            'Guardado local',
            'La evaluación se ha guardado localmente. Se sincronizará cuando se restablezca la conexión.',
          );

          // Añadir a la cola de operaciones pendientes
          addToPendingOperations('update', card.id, qualificationData);
        }
      } else {
        // Crear un nuevo ID único
        const newId = Date.now().toString();
        qualificationData.id = newId;

        // Intentar guardar en Firestore primero
        try {
          savedId = await useQualificationStore().saveQualification(qualificationData);
          card.id = savedId;
          showNotification('success', 'Guardado', 'La evaluación se ha guardado correctamente.');
        } catch (firestoreError) {
          console.warn(
            'Error al guardar en Firestore, usando almacenamiento local:',
            firestoreError,
          );
          isOfflineMode.value = true;

          // Guardar en localStorage
          saveToLocalStorage('create', newId, qualificationData);
          showNotification(
            'warning',
            'Guardado local',
            'La evaluación se ha guardado localmente. Se sincronizará cuando se restablezca la conexión.',
          );

          // Asignar el ID local a la card
          card.id = newId;

          // Añadir a la cola de operaciones pendientes
          addToPendingOperations('create', newId, qualificationData);
        }
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error al guardar la evaluación:', error);
    showNotification('error', 'Error', 'No se pudo guardar la evaluación.');
    card.locked = false;
    card.hideProgress = false;
  }
};

// Función para guardar en localStorage
const saveToLocalStorage = (operation, id, data) => {
  try {
    // Obtener datos existentes o crear un nuevo objeto
    const localQualifications = JSON.parse(localStorage.getItem('qualifications') || '{}');

    // Agregar o actualizar los datos
    localQualifications[id] = {
      ...data,
      _localOperation: operation, // Marcar la operación (create/update/delete)
      _timestamp: new Date().toISOString(),
    };

    // Guardar de vuelta a localStorage
    localStorage.setItem('qualifications', JSON.stringify(localQualifications));
    console.log(
      `Calificación ${operation === 'create' ? 'creada' : 'actualizada'} localmente con ID: ${id}`,
    );
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
};

// Función para agregar a la cola de operaciones pendientes
const addToPendingOperations = (operation, id, data) => {
  // Añadir a la cola en memoria
  pendingOperations.value.push({
    operation,
    id,
    data,
    timestamp: new Date().toISOString(),
  });

  // También guardar la cola en localStorage
  localStorage.setItem('pendingQualificationOperations', JSON.stringify(pendingOperations.value));
};

// Función para intentar sincronizar las operaciones pendientes
const syncPendingOperations = async () => {
  if (pendingOperations.value.length === 0) return;

  showNotification('info', 'Sincronizando', 'Intentando sincronizar datos guardados localmente...');

  const qualificationStore = useQualificationStore();
  const operations = [...pendingOperations.value]; // Copia para no modificar durante la iteración

  for (const op of operations) {
    try {
      if (op.operation === 'create') {
        await qualificationStore.saveQualification(op.data);
      } else if (op.operation === 'update') {
        await qualificationStore.updateQualification(op.id, op.data);
      } else if (op.operation === 'delete') {
        await qualificationStore.deleteQualification(op.id);
      }

      // Si tiene éxito, eliminar de la cola
      const index = pendingOperations.value.findIndex(
        (p) => p.id === op.id && p.operation === op.operation,
      );
      if (index !== -1) {
        pendingOperations.value.splice(index, 1);
      }

      // También eliminar del localStorage
      const localQualifications = JSON.parse(localStorage.getItem('qualifications') || '{}');
      if (localQualifications[op.id]) {
        delete localQualifications[op.id]; // Remover del almacenamiento local
        localStorage.setItem('qualifications', JSON.stringify(localQualifications));
      }
    } catch (error) {
      console.error(`Error al sincronizar operación ${op.operation} para ID ${op.id}:`, error);
    }
  }

  // Actualizar la cola guardada
  localStorage.setItem('pendingQualificationOperations', JSON.stringify(pendingOperations.value));

  if (pendingOperations.value.length === 0) {
    showNotification(
      'success',
      'Sincronizado',
      'Todos los cambios se han sincronizado con el servidor.',
    );
    isOfflineMode.value = false;
  } else {
    showNotification(
      'warning',
      'Sincronización parcial',
      'Algunos cambios no pudieron sincronizarse.',
    );
  }
};

// Cargar operaciones pendientes del localStorage al iniciar
const loadPendingOperations = () => {
  try {
    const storedOperations = localStorage.getItem('pendingQualificationOperations');
    if (storedOperations) {
      pendingOperations.value = JSON.parse(storedOperations);

      if (pendingOperations.value.length > 0) {
        isOfflineMode.value = true;
        showNotification(
          'info',
          'Modo desconectado',
          `Hay ${pendingOperations.value.length} cambios pendientes de sincronizar.`,
        );
      }
    }
  } catch (error) {
    console.error('Error al cargar operaciones pendientes:', error);
  }
};

// Cargar operaciones pendientes al iniciar la aplicación
onMounted(() => {
  loadPendingOperations();

  // Añadir la siguiente línea para recuperar calificaciones locales y procesarlas
  loadLocalQualifications();

  // Comprobar conexión cada cierto tiempo e intentar sincronizar
  setInterval(() => {
    if (navigator.onLine && pendingOperations.value.length > 0) {
      syncPendingOperations();
    }
  }, 60000); // Intentar cada minuto
});

// Función para cargar calificaciones locales
const loadLocalQualifications = () => {
  try {
    const localQualifications = JSON.parse(localStorage.getItem('qualifications') || '{}');

    // Solo procesar si hay calificaciones locales
    if (Object.keys(localQualifications).length > 0) {
      console.log(
        `Recuperando ${Object.keys(localQualifications).length} calificaciones del almacenamiento local`,
      );

      // Convertir las calificaciones locales a formato de cards
      Object.entries(localQualifications).forEach(([id, data]) => {
        // Verificar si la card ya existe para evitar duplicados
        const existingCardIndex = evaluationCards.value.findIndex((card) => card.id === id);

        if (existingCardIndex === -1) {
          // Agregar la card si no existe
          evaluationCards.value.push({
            id,
            group: data.group
              .map((studentId) => students.value.find((s) => s.id === studentId))
              .filter(Boolean),
            contentTitle: data.contentTitle,
            contentSubtitle: data.contentSubtitle,
            indicators: data.indicators,
            locked: data.locked || true,
            hideProgress: data.hideProgress || false,
            comments: data.comments || '',
            isLocalOnly: true, // Marcar como solo local
          });
        }
      });

      showNotification(
        'info',
        'Datos locales',
        `Se cargaron ${Object.keys(localQualifications).length} evaluaciones desde el almacenamiento local.`,
      );
    }
  } catch (error) {
    console.error('Error al cargar calificaciones locales:', error);
  }
};

// Añadir un botón para forzar la sincronización
const manualSync = async () => {
  if (!navigator.onLine) {
    showNotification(
      'error',
      'Sin conexión',
      'No hay conexión a Internet. No se puede sincronizar.',
    );
    return;
  }

  await syncPendingOperations();
};

// Alterna el modo de edición de la card: si está bloqueada, habilita edición; si está en edición, guarda
const toggleCardEdit = (card) => {
  if (card.locked) {
    card.locked = false;
    activeCard.value = card;
  } else {
    saveCard(card);
    activeCard.value = null;
  }
};

// Toggle visibility of progress indicators
const toggleProgressVisibility = (card) => {
  card.hideProgress = !card.hideProgress;
};

// Elimina una card de evaluación
const deleteCard = async (card) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta evaluación?')) return;

  try {
    if (card.id) {
      try {
        // Intentar eliminar en Firestore primero
        await useQualificationStore().deleteQualification(card.id);
        evaluationCards.value = evaluationCards.value.filter((c) => c.id !== card.id);
        showNotification('success', 'Eliminado', 'La evaluación se ha eliminado correctamente.');
      } catch (firestoreError) {
        console.warn(
          'Error al eliminar en Firestore, marcando para eliminación futura:',
          firestoreError,
        );

        // Si la card es solo local, eliminarla directamente del localStorage
        if (card.isLocalOnly) {
          const localQualifications = JSON.parse(localStorage.getItem('qualifications') || '{}');
          if (localQualifications[card.id]) {
            delete localQualifications[card.id];
            localStorage.setItem('qualifications', JSON.stringify(localQualifications));
          }
        } else {
          // Si la card está en Firestore, marcar para eliminación futura
          addToPendingOperations('delete', card.id, { id: card.id });
          saveToLocalStorage('delete', card.id, { id: card.id });
        }

        // Eliminar de la UI
        evaluationCards.value = evaluationCards.value.filter((c) => c.id !== card.id);
        showNotification(
          'warning',
          'Eliminación pendiente',
          'La evaluación se eliminará del servidor cuando se restablezca la conexión.',
        );
      }
    } else {
      evaluationCards.value = evaluationCards.value.filter((c) => c.id !== card.id);
    }
  } catch (error) {
    console.error('Error al eliminar la evaluación:', error);
    showNotification('error', 'Error', 'No se pudo eliminar la evaluación.');
  }
};

// Calcula el promedio de los indicadores de una card
const calculateAverage = (card) => {
  if (!card.indicators.length) return 0;
  const total = card.indicators.reduce((sum, indicator) => sum + indicator.score, 0);
  return Math.round(total / card.indicators.length);
};

// Función para obtener clases de color según el puntaje
const getScoreColorClass = (score, type = 'bar') => {
  if (type === 'bar') {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  } else if (type === 'badge') {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 75) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
};

// Función para exportar datos (simulada)
const exportData = () => {
  alert('Exportando datos de evaluación...');
  console.log('Datos a exportar:', evaluationCards.value);
};

// Función para alternar visibilidad de filtros
const toggleFiltersVisible = () => {
  filtersVisible.value = !filtersVisible.value;
};

// Sistema de notificaciones
const notificationTimeout = ref(null);

const showNotification = (type, title, message) => {
  const id = Date.now();

  // Agregar notificación
  notifications.value.push({
    id,
    type, // 'success', 'warning', 'error', 'info'
    title,
    message,
    visible: true,
  });

  // Configurar tiempo para ocultar automáticamente
  setTimeout(() => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications.value[index].visible = false;

      // Remover completamente después de la animación
      setTimeout(() => {
        notifications.value = notifications.value.filter((n) => n.id !== id);
      }, 500);
    }
  }, 5000);
};

// Función para cerrar una notificación específica
const dismissNotification = (id) => {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications.value[index].visible = false;
    setTimeout(() => {
      notifications.value = notifications.value.filter((n) => n.id !== id);
    }, 500);
  }
};

// Variables reactivas adicionales para el estado de carga
const isLoadingData = ref(false);
const loadError = ref(null);

// Función para cargar las calificaciones iniciales
const loadInitialQualifications = async () => {
  isLoadingData.value = true;
  loadError.value = null;

  try {
    // Obtener el ID de la clase seleccionada del store de attendance
    const selectedClassId = useAttendanceStore().selectedClass;

    if (!selectedClassId) {
      throw new Error('No hay una clase seleccionada');
    }

    // Obtener calificaciones existentes usando el store
    const existingQualifications =
      await useQualificationStore().fetchQualifications(selectedClassId);

    // Convertir calificaciones a formato de cards
    if (existingQualifications && existingQualifications.length > 0) {
      evaluationCards.value = existingQualifications.map((qual) => ({
        id: qual.id,
        group: qual.group
          .map((studentId) => students.value.find((s) => s.id === studentId))
          .filter(Boolean),
        contentTitle: qual.contentTitle,
        contentSubtitle: qual.contentSubtitle,
        indicators: qual.indicators,
        locked: qual.locked || true,
        hideProgress: qual.hideProgress || false,
        comments: qual.comments || '',
      }));

      showNotification(
        'info',
        'Datos cargados',
        `Se encontraron ${existingQualifications.length} evaluaciones.`,
      );
    } else {
      evaluationCards.value = [];
      showNotification('info', 'Sin evaluaciones', 'No hay evaluaciones previas para esta clase.');
    }
  } catch (error) {
    console.error('Error al cargar calificaciones:', error);
    loadError.value = error.message;
    showNotification('error', 'Error', 'No se pudieron cargar las evaluaciones.');
  } finally {
    isLoadingData.value = false;
  }
};

// Reactive references for responsive design
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 1024);
const studentsExpanded = ref(!isMobile.value);
const contentsExpanded = ref(!isMobile.value);
const appContainer = ref(null);

// Touch handling for mobile
const touchStartX = ref(0);
const touchEndX = ref(0);
const MIN_SWIPE_DISTANCE = 100;

const startTouch = (e) => {
  touchStartX.value = e.touches[0].clientX;
};

const endTouch = (e) => {
  touchEndX.value = e.changedTouches[0].clientX;
  handleSwipe();
};

const handleSwipe = () => {
  const swipeDistance = touchEndX.value - touchStartX.value;

  if (Math.abs(swipeDistance) < MIN_SWIPE_DISTANCE) return;

  if (swipeDistance > 0) {
    // Swipe right
    if (!studentsExpanded.value) {
      studentsExpanded.value = true;
      contentsExpanded.value = false;
    }
  } else {
    // Swipe left
    if (!contentsExpanded.value) {
      contentsExpanded.value = true;
      studentsExpanded.value = false;
    }
  }
};

// Handle window resize
const handleResize = () => {
  if (width.value >= 1024) {
    // Desktop view
    studentsExpanded.value = true;
    contentsExpanded.value = true;
  } else {
    // Mobile view
    studentsExpanded.value = false;
    contentsExpanded.value = false;
  }
};

// Close mobile menus
const closeMenus = () => {
  if (isMobile.value) {
    studentsExpanded.value = false;
    contentsExpanded.value = false;
  }
};

// Watch for window size changes
watch(width, (newWidth) => {
  handleResize();
});

// Lifecycle hooks
onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Estado para el modal de contenido emergente
const showEmergentContentModal = ref(false);
const emergentContent = ref({
  title: '',
  subtitle: '',
  indicators: [''],
});

// Función para crear un contenido emergente
const createEmergentContent = () => {
  // Validar que al menos haya un indicador válido
  const validIndicators = emergentContent.value.indicators.filter((ind) => ind.trim() !== '');
  if (validIndicators.length === 0) {
    showNotification(
      'warning',
      'Indicadores requeridos',
      'Añade al menos un indicador de evaluación',
    );
    return;
  }

  // Crear el nuevo contenido emergente
  const newContent = {
    title: emergentContent.value.title,
    type: 'indicator', // Para que sea compatible con el sistema existente
    isEmergent: true, // Marcar como contenido emergente
    parentChain: ['Contenido Emergente', emergentContent.value.subtitle || 'Sin categoría'],
  };

  // Si no hay estudiantes seleccionados, mostrar una alerta
  if (selectedStudents.value.length === 0) {
    showNotification(
      'warning',
      'Selecciona estudiantes',
      'Debes seleccionar estudiantes antes de crear una evaluación',
    );
    studentsExpanded.value = true;
    showEmergentContentModal.value = false;
    return;
  }

  // Crear una nueva card de evaluación con este contenido
  const newCard = createEvaluationCard();

  if (newCard) {
    newCard.contentTitle = 'Contenido Emergente';
    newCard.contentSubtitle = emergentContent.value.subtitle || emergentContent.value.title;

    // Agregar los indicadores
    validIndicators.forEach((indicator) => {
      const uniqueId = generateUniqueName({ title: indicator }, newCard);
      newCard.indicators.push({
        uniqueId,
        label: indicator,
        score: 0,
        selectedStudents: newCard.group,
      });
    });

    // Cerrar el modal y limpiar el formulario
    showEmergentContentModal.value = false;
    emergentContent.value = {
      title: '',
      subtitle: '',
      indicators: [''],
    };

    // Mostrar notificación de éxito
    showNotification(
      'success',
      'Contenido creado',
      'Se ha creado una evaluación con el contenido emergente',
    );
  }
};
</script>

<style scoped>
.btn-primary {
  @apply px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900;
}

.btn-secondary {
  @apply px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900;
}

/* Transitions for panels */
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.3s ease-in-out;
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(-100%);
}

/* Mobile optimizations */
@media (max-width: 1024px) {
  .panel-enter-from.right,
  .panel-leave-to.right {
    transform: translateX(100%);
  }
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  .dark\:shadow-xl-dark {
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
  }
}

/* Smooth scrolling for panels */
.overflow-y-auto {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Prevent content shift when scrollbar appears */
.overflow-y-auto {
  scrollbar-gutter: stable;
}

/* Custom scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.5);
}

/* Better touch targets for mobile */
@media (max-width: 1024px) {
  button {
    min-height: 44px;
    min-width: 44px;
  }

  select,
  input {
    min-height: 44px;
  }
}

/* Prevent text selection during swipe */
.prevent-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
