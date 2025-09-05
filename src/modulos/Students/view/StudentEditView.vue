<template>
  <div v-if="formData" class="py-6">
    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6"
    >
      {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6"
    >
      {{ error }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Editar</h1>
      <button
        class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        :disabled="isLoading"
        @click="handleCancel"
      >
        Cancelar
      </button>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        <span v-if="isLoading" class="flex items-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Guardando...
        </span>
        <span v-else>Guardar</span>
      </button>
      <!-- Información Personal -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información Personal</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <input v-model="formData.nombre" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Apellido</label>
            <input v-model="formData.apellido" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Edad</label>
            <input v-model="formData.edad" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Fecha de Nacimiento</label>
            <input v-model="formData.nac" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Sexo</label>
            <select v-model="formData.sexo" class="input">
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Instrumento</label>
            <!-- campo de texto para el instrumento -->
            <input v-model="formData.instrumento" type="text" class="input" />
          </div>
        </div>
      </div>

      <!-- Información de Contacto -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información de Contacto</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono</label>
            <input v-model="formData.tlf" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input v-model="formData.email" type="email" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nombre de la Madre</label>
            <input v-model="formData.madre" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nombre del Padre</label>
            <input v-model="formData.padre" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono de la Madre</label>
            <input v-model="formData.tlf_madre" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono del Padre</label>
            <input v-model="formData.tlf_padre" type="text" class="input" />
          </div>
        </div>
      </div>

      <!-- Información Académica -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información Académica</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Institución</label>
            <input v-model="formData.colegio_trabajo" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Horario</label>
            <input v-model="formData.horario_colegio_trabajo" type="text" class="input" />
          </div>
        </div>
      </div>

      <!-- Groups Management -->
      <div class="card mt-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Grupos</h2>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Modo texto</span>
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                useTextMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              ]"
              @click="toggleTextMode"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition',
                  useTextMode ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
          </div>
        </div>

        <!-- Text Mode -->
        <div v-if="useTextMode" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grupos del Alumno
            </label>
            <textarea
              v-model="gruposText"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Escriba los grupos separados por comas (ej: Coro, Orquesta, Solfeo)"
              @input="updateGruposFromText"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Separe múltiples grupos con comas. El texto se guardará como está escrito.
            </p>
          </div>
          
          <!-- Preview of groups -->
          <div v-if="currentGroups.length > 0" class="mt-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vista previa:</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="group in currentGroups"
                :key="group"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
              >
                {{ group.trim() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Checkbox Mode (original) -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="group in classesStore.classes"
            :key="group.id"
            class="flex items-center space-x-2"
          >
            <input
              :id="group.id"
              v-model="formData.grupo"
              type="checkbox"
              :value="group.name"
              class="rounded text-blue-600 focus:ring-blue-500"
            />
            <label :for="group.id" class="text-sm">{{ group.name }}</label>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 mb-24">
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="flex items-center">
            <svg
              class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Guardando...
          </span>
          <span v-else>Guardar Cambios</span>
        </button>
        <button
          type="button"
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          :disabled="isLoading"
          @click="handleCancel"
        >
          Cancelar
        </button>
      </div>
    </form>
  </div>
  <div v-else class="py-6">
    <p>Estudiante no encontrado</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStudentsStore } from '../store/students';
import { useClassesStore } from '../../Classes/store/classes';
import { useInstrumentoStore } from '../../Instruments/store/instrumento';

const route = useRoute();
const router = useRouter();
const studentsStore = useStudentsStore();
const classesStore = useClassesStore();
const instrumentoStore = useInstrumentoStore();

const studentId = String(route.params.id);
const isLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Groups management
const useTextMode = ref(false);
const gruposText = ref('');

// Cargar datos necesarios al montar el componente
onMounted(async () => {
  try {
    await Promise.all([
      studentsStore.fetchStudents(),
      classesStore.fetchClasses(),
      instrumentoStore.fetchInstruments(),
    ]);
  } catch (err: any) {
    error.value = err.message || 'Error al cargar los datos';
  }
});

const originalStudent = computed(() =>
  studentsStore.students.find((s) => s.id.toString() === studentId),
);

const instruments = computed(() => instrumentoStore.instruments);

// Asegurar que el campo grupo siempre sea un array al cargar el estudiante
const normalizeGrupo = (grupo: any): string[] => {
  if (Array.isArray(grupo)) {
    return grupo;
  } else if (grupo) {
    if (typeof grupo === 'string') {
      if (grupo.startsWith('[') && grupo.endsWith(']')) {
        try {
          const parsed = JSON.parse(grupo);
          return Array.isArray(parsed) ? parsed : [grupo];
        } catch (e) {
          console.warn('Error parsing grupo value:', e);
          return [grupo];
        }
      }
      return [grupo];
    }
    return [String(grupo)];
  }
  return [];
};

const formData = ref<any>(null);

// Computed property for current groups
const currentGroups = computed(() => {
  if (useTextMode.value) {
    return gruposText.value ? gruposText.value.split(',').map(g => g.trim()).filter(g => g.length > 0) : [];
  } else {
    return formData.value?.grupo || [];
  }
});

// Functions for groups management
const toggleTextMode = () => {
  if (useTextMode.value) {
    // Switching from text mode to checkbox mode
    // Update formData.grupo with the parsed text
    formData.value.grupo = currentGroups.value;
  } else {
    // Switching from checkbox mode to text mode  
    // Update gruposText with current selection
    if (formData.value?.grupo && Array.isArray(formData.value.grupo)) {
      gruposText.value = formData.value.grupo.join(', ');
    }
  }
  useTextMode.value = !useTextMode.value;
};

const updateGruposFromText = () => {
  // Real-time update of formData.grupo when typing in text mode
  if (useTextMode.value && formData.value) {
    const parsedGroups = currentGroups.value;
    formData.value.grupo = parsedGroups;
    console.log('🔄 Grupos actualizados desde texto en tiempo real:', parsedGroups);
  }
};

// Watch para actualizar formData cuando se carga el estudiante
watch(
  originalStudent,
  (newStudent) => {
    if (newStudent) {
      const normalizedGrupo = normalizeGrupo(newStudent.grupo);
      formData.value = {
        ...newStudent,
        grupo: normalizedGrupo,
      };
      
      // Initialize gruposText with current groups
      if (normalizedGrupo.length > 0) {
        gruposText.value = normalizedGrupo.join(', ');
      }
    }
  },
  { immediate: true },
);

const handleSubmit = async () => {
  if (!formData.value) {
    console.error('No hay datos del formulario para guardar');
    return;
  }

  console.log('🔄 Iniciando actualización del estudiante:', studentId);
  console.log('🎛️ Estado del sistema de grupos:');
  console.log('   - Modo texto activo:', useTextMode.value);
  console.log('   - Contenido del textarea:', gruposText.value);
  console.log('   - Grupos actuales (computed):', currentGroups.value);
  console.log('   - Grupos en formData:', formData.value.grupo);
  console.log('📝 Datos completos a guardar:', JSON.stringify(formData.value, null, 2));

  isLoading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    // Sincronizar grupos dependiendo del modo activo
    if (useTextMode.value) {
      // En modo texto, usar los grupos parseados del textarea
      formData.value.grupo = currentGroups.value;
      console.log('📝 Modo texto activo - Grupos sincronizados desde texto:', formData.value.grupo);
    } else {
      // En modo checkbox, asegurar que sea un array
      if (!Array.isArray(formData.value.grupo)) {
        formData.value.grupo = normalizeGrupo(formData.value.grupo);
      }
      console.log('☑️ Modo checkbox activo - Grupos normalizados:', formData.value.grupo);
    }

    // Validación final: asegurar que grupos sea un array válido
    if (!formData.value.grupo || !Array.isArray(formData.value.grupo)) {
      formData.value.grupo = [];
      console.log('⚠️ Grupos no válidos, estableciendo array vacío');
    }
    
    // Limpiar grupos vacíos y espacios
    formData.value.grupo = formData.value.grupo
      .map(grupo => typeof grupo === 'string' ? grupo.trim() : String(grupo).trim())
      .filter(grupo => grupo.length > 0);

    console.log('📋 Grupos finales a guardar:', JSON.stringify(formData.value.grupo, null, 2));
    console.log('📤 Enviando datos al store...');
    await studentsStore.updateStudent(String(studentId), formData.value);

    console.log('✅ Estudiante actualizado exitosamente en Firestore');
    successMessage.value = 'Estudiante actualizado exitosamente';

    console.log('🔄 Refrescando lista de estudiantes...');

    // Refrescar la lista de estudiantes para asegurar que los cambios se reflejen
    await studentsStore.fetchStudents();

    // Esperar un poco para mostrar el mensaje de éxito antes de redirigir
    setTimeout(() => {
      console.log('🏠 Redirigiendo a la lista de estudiantes...');
      router.push('/students/');
    }, 1500);
  } catch (err: any) {
    console.error('❌ Error al actualizar estudiante:', err);
    error.value = err.message || 'Error al actualizar el estudiante';
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  router.push(`/students/${studentId}`);
};
</script>
