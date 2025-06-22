<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Container principal con ancho máximo -->
    <div class="max-w-7xl mx-auto">
      <!-- Header con título y acciones -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Administración de Clases</h1>
            <p class="mt-1 text-sm text-gray-500">Gestiona todas las clases y horarios de la academia</p>
          </div>
          <button 
            @click="showCreateDialog = true"
            class="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Nueva Clase
          </button>
        </div>

        <!-- Pestañas -->
        <div class="mt-6 border-b border-gray-200">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button 
              @click="tab = 'classes'"
              :class="{
                'border-indigo-500 text-indigo-600': tab === 'classes',
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': tab !== 'classes'
              }"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center"
              :aria-current="tab === 'classes' ? 'page' : undefined"
            >
              <svg class="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Todas las Clases
              <span 
                v-if="classes.length > 0"
                class="ml-2 bg-indigo-100 text-indigo-600 text-xs font-medium px-2.5 py-0.5 rounded-full"
              >
                {{ classes.length }}
              </span>
            </button>
            <button 
              @click="tab = 'schedule'"
              :class="{
                'border-indigo-500 text-indigo-600': tab === 'schedule',
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': tab !== 'schedule'
              }"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center"
            >
              <svg class="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              Horarios
            </button>
          </nav>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="mt-6">
        <!-- Estado de carga -->
        <div v-if="loading" class="flex justify-center items-center py-12 bg-white rounded-lg shadow">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>

        <!-- Contenido principal -->
        <template v-else>
          <!-- Vista de clases -->
          <div v-if="tab === 'classes'" class="bg-white shadow overflow-hidden sm:rounded-lg">
            <!-- Lista vacía -->
            <div v-if="classes.length === 0" class="text-center py-12 px-4">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 class="mt-2 text-lg font-medium text-gray-900">No hay clases registradas</h3>
              <p class="mt-1 text-sm text-gray-500">Comienza creando una nueva clase.</p>
              <div class="mt-6">
                <button
                  @click="showCreateDialog = true"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  Nueva Clase
                </button>
              </div>
            </div>

            <!-- Lista de clases -->
            <ClassList 
              v-else
              :classes="classes" 
              @edit="editClass"
              @delete="confirmDelete"
              @view-schedule="viewSchedule"
              class="divide-y divide-gray-200"
            />
          </div>
          
          <!-- Vista de horarios -->
          <div v-else-if="tab === 'schedule'" class="bg-white shadow overflow-hidden sm:rounded-lg">
            <ClassScheduleView />
          </div>
        </template>
      </div>

    <!-- Diálogo de creación/edición -->
    <ClassFormDialog 
      v-model="showCreateDialog"
      :class-data="editingClass"
      :is-editing="!!editingClass"
      @save="handleSave"
      @close="() => {
        showCreateDialog.value = false;
        editingClass.value = null;
      }"
    />

      <!-- Diálogo de confirmación de eliminación -->
      <div v-if="showDeleteDialog" class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Fondo del modal -->
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showDeleteDialog = false"></div>

          <!-- Espacio para evitar que el contenido se desplace -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <!-- Contenido del modal -->
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Eliminar clase
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar la clase <span class="font-medium">"{{ editingClass?.name }}"</span>?
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button 
                type="button" 
                @click="deleteClass"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                :disabled="deleting"
              >
                <span v-if="deleting" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </span>
                <span v-else>Eliminar</span>
              </button>
              <button 
                type="button" 
                @click="showDeleteDialog = false"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                :disabled="deleting"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useClassesStore } from '../store/classes';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useStudentsStore } from '../../Students/store/students';

// Import components with defineAsyncComponent for better code splitting
import { defineAsyncComponent, type Component } from 'vue';

// Define component types
type ComponentModule = { default: Component };
type ComponentLoader = () => Promise<ComponentModule>;

// Define a type for async component options
interface AsyncComponentOptions {
  loadingComponent: string;
  errorComponent: string;
  delay?: number;
  timeout?: number;
}

// Helper function to create async components with proper typing
function createAsyncComponent(
  loader: ComponentLoader,
  { loadingComponent, errorComponent, delay = 200, timeout = 3000 }: AsyncComponentOptions
) {
  return defineAsyncComponent({
    loader: async () => {
      const component = await loader();
      return component;
    },
    loadingComponent: { template: `<div>${loadingComponent}</div>` },
    errorComponent: { template: `<div>${errorComponent}</div>` },
    delay,
    timeout
  });
}

// Import components
const ClassList = createAsyncComponent(
  () => import('../components/ClassList.vue'),
  {
    loadingComponent: 'Cargando lista de clases...',
    errorComponent: 'Error al cargar la lista de clases'
  }
);

const ClassFormDialog = createAsyncComponent(
  () => import('../components/ClassFormDialog.vue'),
  {
    loadingComponent: 'Cargando formulario...',
    errorComponent: 'Error al cargar el formulario'
  }
);

const ClassScheduleView = createAsyncComponent(
  () => import('./ClassScheduleView.vue'),
  {
    loadingComponent: 'Cargando horarios...',
    errorComponent: 'Error al cargar los horarios'
  }
);

import type { ClassData } from '../types/class';

// Component registration
const components = {
  ClassList,
  ClassFormDialog,
  ClassScheduleView
};

// Router and stores
const router = useRouter();
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();

// Reactive state
const tab = ref<'classes' | 'schedule'>('classes');
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const editingClass = ref<ClassData | null>(null);
const loading = ref(true);
const deleting = ref(false);

// Obtener datos del store
const { classes } = storeToRefs(classesStore);

// Computed properties
const hasClasses = computed(() => classes.value.length > 0);

// Cargar datos iniciales
const loadInitialData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents()
    ]);
  } catch (error) {
    console.error('Error al cargar datos:', error);
  } finally {
    loading.value = false;
  }
};

// Cargar datos cuando se monta el componente
onMounted(loadInitialData);

// Métodos de la UI
const editClass = (classItem: ClassData) => {
  editingClass.value = { ...classItem };
  showCreateDialog.value = true;
};

const confirmDelete = (classItem: ClassData) => {
  editingClass.value = { ...classItem };
  showDeleteDialog.value = true;
};

const viewSchedule = (classItem: ClassData) => {
  tab.value = 'schedule';
  // Aquí podrías añadir lógica para resaltar el horario de la clase seleccionada
};

const closeDialog = () => {
  showCreateDialog.value = false;
  editingClass.value = null;
};

// Métodos CRUD
const handleSave = async (classData: ClassData) => {
  try {
    if (editingClass.value) {
      await classesStore.updateClass(editingClass.value.id, classData);
    } else {
      await classesStore.addClass(classData);
    }
    closeDialog();
  } catch (error) {
    console.error('Error al guardar la clase:', error);
  }
};

const deleteClass = async () => {
  if (!editingClass.value) return;
  
  deleting.value = true;
  try {
    await classesStore.removeClass(editingClass.value.id);
    showDeleteDialog.value = false;
    
    // Recargar datos para asegurar consistencia
    await loadInitialData();
  } catch (error) {
    console.error('Error al eliminar la clase:', error);
  } finally {
    deleting.value = false;
  }
};

// Cerrar diálogo de confirmación
const closeDeleteDialog = (): void => {
  showDeleteDialog.value = false;
  editingClass.value = null;
};
</script>

<style scoped>
/* Estilos globales para los diálogos modales */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
