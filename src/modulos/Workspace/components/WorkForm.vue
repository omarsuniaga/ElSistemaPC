<template>
  <Dialog :open="true" class="relative z-50" @close="emit('cancel')">
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full">
        <h2 class="text-lg font-semibold mb-4">
          {{ props.initialData ? "Editar Obra" : "Nueva Obra" }}
        </h2>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Información básica -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Título</label>
              <input v-model="formData.title" type="text" class="input" required />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Compositor</label>
              <input v-model="formData.composer" type="text" class="input" required />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Duración</label>
              <input
                v-model="formData.duration"
                type="text"
                class="input"
                placeholder="Ej: 15:00"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Dificultad</label>
              <select v-model="formData.difficulty" class="input" required>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>

          <!-- Instrumentos por sección -->
          <div class="space-y-4">
            <h3 class="font-medium">Instrumentos por Sección</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Selector de sección -->
              <div>
                <label class="block text-sm font-medium mb-1">Sección</label>
                <select v-model="selectedSection" class="input">
                  <option v-for="section in sections" :key="section.name" :value="section.name">
                    {{ section.displayName }}
                  </option>
                </select>
              </div>

              <!-- Selector de instrumento -->
              <div>
                <label class="block text-sm font-medium mb-1">Instrumento</label>
                <select
                  class="input"
                  @change="
                    addInstrument($event.target.value)
                    $event.target.value = ''
                  "
                >
                  <option value="">Agregar instrumento</option>
                  <option
                    v-for="instrument in availableInstrumentsBySection"
                    :key="instrument"
                    :value="instrument"
                  >
                    {{ instrument }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Lista de instrumentos seleccionados -->
            <div class="space-y-4">
              <div v-for="instrument in formData.instruments" :key="instrument.id" class="card">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h4 class="font-medium">{{ instrument.name }}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ sections.find((s) => s.name === instrument.section)?.displayName }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="btn bg-red-600 text-white hover:bg-red-700"
                    @click="removeInstrument(instrument.id)"
                  >
                    Eliminar
                  </button>
                </div>

                <!-- Selector de estudiantes -->
                <div class="mt-4">
                  <label class="block text-sm font-medium mb-1">Estudiantes asignados</label>
                  <select v-model="instrument.studentProgress" multiple class="input">
                    <option
                      v-for="student in availableStudentsByInstrument(instrument.name)"
                      :key="student.id"
                      :value="student.id"
                    >
                      {{ student.nombre }} {{ student.apellido }}
                    </option>
                  </select>
                </div>

                <!-- Compases -->
                <div class="mt-4">
                  <label class="block text-sm font-medium mb-1"
                    >Compases ({{ instrument.measures.length }})</label
                  >
                  <div class="grid grid-cols-10 gap-1">
                    <div
                      v-for="measure in instrument.measures"
                      :key="measure.id"
                      class="aspect-square rounded cursor-pointer relative group transition-all duration-200"
                      :class="getStatusColor(measure.progress)"
                      @click="updateMeasureProgress(measure.id, instrument.id)"
                    >
                      <span
                        class="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100"
                      >
                        {{ measure.id }}
                      </span>
                    </div>
                  </div>
                  <div class="flex justify-end mt-2">
                    <button
                      type="button"
                      class="btn bg-blue-600 text-white hover:bg-blue-700"
                      @click="addMeasureToInstrument(instrument.id)"
                    >
                      Añadir Compás
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Archivos -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Partitura</label>
              <FileUpload accept=".pdf,.jpg,.jpeg,.png" show-preview @select="handleScoreUpload" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Audio de Referencia</label>
              <FileUpload accept="audio/*" show-preview @select="handleAudioUpload" />
            </div>
          </div>

          <!-- Botones -->
          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              @click="emit('cancel')"
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              {{ props.initialData ? "Guardar Cambios" : "Crear Obra" }}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Dialog, DialogPanel } from '@headlessui/vue';
import type { MusicalWork } from '../types/repertoire';
import { INSTRUMENT_SECTIONS } from '../types/repertoire';
import { useStudentsStore } from '../../Students/store/students';
import FileUpload from './FileUpload.vue';
import * as yup from 'yup';

const props = defineProps<{
  initialData?: Partial<MusicalWork>
}>();

const emit = defineEmits<{
  (e: 'submit', data: Partial<MusicalWork>): void
  (e: 'cancel'): void
}>();

const studentsStore = useStudentsStore();

const formData = ref({
  title: '',
  composer: '',
  duration: '',
  difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
  instruments: [] as {
    id: number
    name: string
    section: 'strings' | 'woodwinds' | 'brass' | 'percussion' | 'other'
    measures: {id: number; progress: number; studentProgress: Record<string, number>}[]
    studentProgress: Record<string, number>
  }[],
  score: '',
  audio: '',
  ...props.initialData,
});

const selectedSection = ref<'strings' | 'woodwinds' | 'brass' | 'percussion' | 'other'>('strings');

const sections = INSTRUMENT_SECTIONS;

const availableInstrumentsBySection = computed(() => {
  const section = sections.find((s) => s.name === selectedSection.value);
  if (!section) return [];
  return section.instruments.filter(
    (instrument) => !formData.value.instruments.some((i) => i.name === instrument),
  );
});

const availableStudentsByInstrument = (instrumentName: string) => {
  return studentsStore.students.filter(
    (student) => student.instrumento.toLowerCase() === instrumentName.toLowerCase(),
  );
};

const addInstrument = (name: string) => {
  if (!formData.value.instruments.some((i) => i.name === name)) {
    const section = sections.find((s) => s.instruments.includes(name));
    if (!section) return;

    formData.value.instruments.push({
      id: Math.max(0, ...formData.value.instruments.map((i) => i.id)) + 1,
      name,
      section: section.name,
      measures: Array.from({ length: 24 }, (_, i) => ({
        id: i + 1,
        progress: 0,
        studentProgress: {},
      })),
      studentProgress: {},
    });
  }
};

const removeInstrument = (id: number) => {
  formData.value.instruments = formData.value.instruments.filter((i) => i.id !== id);
};

const addMeasureToInstrument = (instrumentId: number) => {
  const instrument = formData.value.instruments.find((i) => i.id === instrumentId);
  if (instrument) {
    const nextId = Math.max(0, ...instrument.measures.map((m) => m.id)) + 1;
    instrument.measures.push({
      id: nextId,
      number: nextId,
      progress: 0,
      difficulty: 'easy',
      notes: '',
      studentProgress: {},
    });
  }
};

const updateMeasureProgress = (measureId: number, instrumentId: number) => {
  const instrument = formData.value.instruments.find((i) => i.id === instrumentId);
  if (!instrument) return;

  const measure = instrument.measures.find((m) => m.id === measureId);
  if (measure) {
    measure.progress = (measure.progress + 20) % 120;
  }
};

const getStatusColor = (progress: number) => {
  if (progress <= 20) return 'bg-red-500';
  if (progress <= 40) return 'bg-orange-500';
  if (progress <= 60) return 'bg-yellow-500';
  if (progress <= 80) return 'bg-blue-500';
  return 'bg-green-500';
};

const handleScoreUpload = (files: FileList) => {
  formData.value.score = URL.createObjectURL(files[0]);
};

const handleAudioUpload = (files: FileList) => {
  formData.value.audio = URL.createObjectURL(files[0]);
};

const workSchema = yup.object().shape({
  title: yup.string().required('El título es obligatorio'),
  composer: yup.string().required('El compositor es obligatorio'),
  duration: yup
    .string()
    .matches(/^\d{2}:\d{2}$/, 'La duración debe estar en el formato MM:SS')
    .required('La duración es obligatoria'),
  difficulty: yup
    .string()
    .oneOf(['beginner', 'intermediate', 'advanced'], 'Dificultad inválida')
    .required('La dificultad es obligatoria'),
  instruments: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.number().required(),
        name: yup.string().required(),
        section: yup.string().required(),
        measures: yup.array().required().min(1, 'Debe tener al menos un compás'),
      }),
    )
    .min(1, 'Debe agregar al menos un instrumento'),
  score: yup.string().required('La partitura es obligatoria'),
  audio: yup.string().required('El audio es obligatorio'),
});

const handleSubmit = async () => {
  try {
    await workSchema.validate(formData.value, { abortEarly: false });
    emit('submit', formData.value);
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      err.inner.forEach((error) => {
        console.error(error.message);
      });
    }
  }
};
</script>
