<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditing ? "Editar Frase Musical" : "Nueva Frase Musical" }}
          </h2>
          <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="closeModal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Frase *
            </label>
            <input
              v-model="form.nombre"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Tema Principal del Primer Movimiento"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Obra Asociada * </label>
            <select
              v-model="form.obraId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar obra...</option>
              <option v-for="obra in availableWorks" :key="obra.id" :value="obra.id">
                {{ obra.titulo }} - {{ obra.compositor }}
              </option>
            </select>
          </div>
        </div>

        <!-- Musical Information -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Compases </label>
            <input
              v-model="form.compases"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 1-16, 32-48"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Tempo </label>
            <input
              v-model="form.tempo"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Allegro, ♩ = 120"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Tonalidad </label>
            <input
              v-model="form.tonalidad"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Do Mayor, La menor"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Descripción Musical </label>
          <textarea
            v-model="form.descripcion"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe las características musicales de esta frase..."
          />
        </div>

        <!-- Difficulty and Priority -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Dificultad *
            </label>
            <select
              v-model="form.dificultad"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar nivel...</option>
              <option value="facil">Fácil</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="experto">Experto</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Prioridad * </label>
            <select
              v-model="form.prioridad"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar prioridad...</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>

        <!-- Technical Focus -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Aspectos Técnicos a Trabajar
          </label>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label
              v-for="aspecto in aspectosTecnicos"
              :key="aspecto.value"
              class="flex items-center space-x-2 cursor-pointer"
            >
              <input
                v-model="form.aspectosTecnicos"
                type="checkbox"
                :value="aspecto.value"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">{{ aspecto.label }}</span>
            </label>
          </div>
        </div>

        <!-- Study Goals -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Objetivos de Estudio </label>
          <div class="space-y-2">
            <div
              v-for="(objetivo, index) in form.objetivosEstudio"
              :key="index"
              class="flex items-center space-x-2"
            >
              <input
                v-model="form.objetivosEstudio[index]"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Objetivo de estudio..."
              />
              <button
                type="button"
                class="text-red-500 hover:text-red-700 p-1"
                @click="removeObjective(index)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            <button
              type="button"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              @click="addObjective"
            >
              + Agregar Objetivo
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Notas Adicionales </label>
          <textarea
            v-model="form.notas"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notas adicionales sobre esta frase musical..."
          />
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            @click="closeModal"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear Frase" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMontaje } from '../composables/useMontaje';
import { useMontajeStore } from '../store/montaje';
import { Timestamp } from 'firebase/firestore';
import type { FraseMontaje, Obra } from '../types';

interface Props {
  isOpen: boolean
  phrase?: FraseMontaje | null
  availableWorks: Obra[]
}

interface Emits {
  (e: 'close'): void
  (e: 'saved', phrase: FraseMontaje): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const montajeStore = useMontajeStore();

const isSubmitting = ref(false);

const isEditing = computed(() => !!props.phrase);

const aspectosTecnicos = [
  { value: 'afinacion', label: 'Afinación' },
  { value: 'ritmo', label: 'Ritmo' },
  { value: 'dinamica', label: 'Dinámica' },
  { value: 'articulacion', label: 'Articulación' },
  { value: 'fraseo', label: 'Fraseo' },
  { value: 'tecnica', label: 'Técnica' },
  { value: 'expresion', label: 'Expresión' },
  { value: 'balance', label: 'Balance' },
  { value: 'precision', label: 'Precisión' },
];

const form = ref({
  nombre: '',
  obraId: '',
  descripcion: '',
  compases: '',
  tempo: '',
  tonalidad: '',
  dificultad: '',
  prioridad: '',
  aspectosTecnicos: [] as string[],
  objetivosEstudio: [''],
  notas: '',
});

watch(
  () => props.phrase,
  (newPhrase) => {
    if (newPhrase) {
      form.value = {
        nombre: newPhrase.nombre,
        obraId: newPhrase.obraId,
        descripcion: newPhrase.descripcion || '',
        compases: `${newPhrase.compasInicio}-${newPhrase.compasFinalizacion}`,
        tempo: '',
        tonalidad: '',
        dificultad: newPhrase.dificultad,
        prioridad: 'media',
        aspectosTecnicos: [...newPhrase.objetivosTecnicos],
        objetivosEstudio:
          newPhrase.objetivosMusicales.length > 0 ? [...newPhrase.objetivosMusicales] : [''],
        notas: '',
      };
    }
  },
  { immediate: true },
);

const addObjective = () => {
  form.value.objetivosEstudio.push('');
};

const removeObjective = (index: number) => {
  if (form.value.objetivosEstudio.length > 1) {
    form.value.objetivosEstudio.splice(index, 1);
  }
};

const handleSubmit = async () => {
  isSubmitting.value = true;

  try {
    const phraseData = {
      nombre: form.value.nombre,
      obraId: form.value.obraId,
      planAccionId: 'default-plan', // TODO: Get from context
      descripcion: form.value.descripcion,
      compasInicio: parseInt(form.value.compases.split('-')[0]) || 1,
      compasFinalizacion:
        parseInt(form.value.compases.split('-')[1]) ||
        parseInt(form.value.compases.split('-')[0]) ||
        1,
      dificultad: form.value.dificultad as any,
      objetivosTecnicos: form.value.aspectosTecnicos,
      objetivosMusicales: form.value.objetivosEstudio.filter((obj) => obj.trim() !== ''),
      metadatos: {
        totalCompases: 0,
        estadosCompases: {},
        progresoPorcentaje: 0,
        horasEnsayoAcumuladas: 0,
        dificultadesIdentificadas: [],
        logrosAlcanzados: [],
      },
    };

    let savedPhrase: FraseMontaje;

    if (isEditing.value && props.phrase) {
      // TODO: Implement updatePhrase when available
      console.log('Updating phrase:', phraseData);
      savedPhrase = { ...props.phrase, ...phraseData };
    } else {
      const fraseId = await montajeStore.crearFrase(phraseData);
      // Create the saved phrase object with the returned ID
      savedPhrase = {
        id: fraseId,
        ...phraseData,
        auditoria: {
          creadoPor: 'current-user-id', // TODO: Get from auth
          fechaCreacion: Timestamp.now(),
          modificadoPor: 'current-user-id',
          fechaModificacion: Timestamp.now(),
          version: 1,
          activo: true,
        },
      };
    }

    emit('saved', savedPhrase);
    closeModal();
  } catch (error) {
    console.error('Error saving phrase:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  emit('close');
  // Reset form
  form.value = {
    nombre: '',
    obraId: '',
    descripcion: '',
    compases: '',
    tempo: '',
    tonalidad: '',
    dificultad: '',
    prioridad: '',
    aspectosTecnicos: [],
    objetivosEstudio: [''],
    notas: '',
  };
};
</script>
