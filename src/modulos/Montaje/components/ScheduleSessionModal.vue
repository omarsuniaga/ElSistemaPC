<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">📅 Programar Ensayo</h3>
      
      <div class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Información Básica</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Título del Ensayo *</label>
              <input
                v-model="sessionForm.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Ensayo General - Sinfonía No. 40"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Ensayo *</label>
              <select
                v-model="sessionForm.type"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">Ensayo General</option>
                <option value="sectional">Ensayo Seccional</option>
                <option value="individual">Ensayo Individual</option>
                <option value="dress">Ensayo de Vestuario</option>
                <option value="technical">Ensayo Técnico</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Date and Time -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Fecha y Hora</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                v-model="sessionForm.date"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hora de Inicio *</label>
              <input
                v-model="sessionForm.startTime"
                type="time"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Duración (minutos) *</label>
              <input
                v-model.number="sessionForm.duration"
                type="number"
                min="30"
                max="480"
                step="15"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="120"
              >
            </div>
          </div>
        </div>

        <!-- Location -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Ubicación</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sala/Lugar *</label>
              <select
                v-model="sessionForm.location"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option v-for="location in availableLocations" :key="location" :value="location">
                  {{ location }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                v-model="sessionForm.address"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dirección completa (opcional)"
              >
            </div>
          </div>
        </div>

        <!-- Works and Repertoire -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Repertorio</h4>
          <div class="space-y-3">
            <div 
              v-for="(workId, index) in sessionForm.workIds"
              :key="index"
              class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
            >
              <select
                v-model="sessionForm.workIds[index]"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar obra...</option>
                <option v-for="work in availableWorks" :key="work.id" :value="work.id">
                  {{ work.name }} - {{ work.composer }}
                </option>
              </select>
              <button
                class="text-red-500 hover:text-red-700 text-sm"
                @click="removeWork(index)"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <button
            class="mt-3 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            @click="addWork"
          >
            ➕ Agregar Obra
          </button>
        </div>

        <!-- Attendees -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Participantes</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Convocatoria</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input
                    v-model="sessionForm.attendeeType"
                    type="radio"
                    value="all"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">Todos los miembros</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="sessionForm.attendeeType"
                    type="radio"
                    value="sections"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">Por secciones</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="sessionForm.attendeeType"
                    type="radio"
                    value="custom"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">Selección personalizada</span>
                </label>
              </div>
            </div>
            
            <div v-if="sessionForm.attendeeType === 'sections'">
              <label class="block text-sm font-medium text-gray-700 mb-2">Secciones</label>
              <div class="space-y-1">
                <label 
                  v-for="section in instrumentSections" 
                  :key="section"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="sessionForm.selectedSections"
                    type="checkbox"
                    :value="section"
                    class="rounded"
                  >
                  <span class="text-sm text-gray-700">{{ section }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Objectives and Notes -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Objetivos y Notas</h4>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Objetivos del Ensayo</label>
              <textarea
                v-model="sessionForm.objectives"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Ej: Trabajar afinación en cuerdas, pulir transiciones en movimiento II..."
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
              <textarea
                v-model="sessionForm.notes"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="Información adicional, recordatorios, material necesario..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Reminders -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Recordatorios</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label class="flex items-center gap-2">
              <input
                v-model="sessionForm.reminders.email24h"
                type="checkbox"
                class="rounded"
              >
              <span class="text-sm text-gray-700">📧 24h antes</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="sessionForm.reminders.email2h"
                type="checkbox"
                class="rounded"
              >
              <span class="text-sm text-gray-700">📧 2h antes</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="sessionForm.reminders.push1h"
                type="checkbox"
                class="rounded"
              >
              <span class="text-sm text-gray-700">📱 1h antes</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="sessionForm.reminders.sms30min"
                type="checkbox"
                class="rounded"
              >
              <span class="text-sm text-gray-700">💬 30min antes</span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="flex gap-3 mt-6">
        <button
          :disabled="!isFormValid || scheduling"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          @click="scheduleSession"
        >
          {{ scheduling ? 'Programando...' : 'Programar Ensayo' }}
        </button>
        <button
          :disabled="scheduling"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          @click="$emit('close')"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useMontaje } from '../composables/useMontaje';
import { useMusicalWorks } from '../composables/useHeatMapProjects';

const emit = defineEmits<{
  sessionScheduled: [session: any]
  close: []
}>();

const { currentProject } = useMontaje();
const { works } = useMusicalWorks();
const scheduling = ref(false);

const availableLocations = [
  'Sala Principal',
  'Sala de Ensayos 1',
  'Sala de Ensayos 2',
  'Auditorio',
  'Teatro Municipal',
  'Conservatorio - Sala A',
  'Conservatorio - Sala B',
  'Otra ubicación',
];

const instrumentSections = [
  'Cuerdas',
  'Viento-madera',
  'Viento-metal',
  'Percusión',
  'Teclados',
  'Voces',
];

const sessionForm = reactive({
  title: '',
  type: 'general',
  date: '',
  startTime: '',
  duration: 120,
  location: 'Sala Principal',
  address: '',
  workIds: [''],
  attendeeType: 'all',
  selectedSections: [],
  objectives: '',
  notes: '',
  reminders: {
    email24h: true,
    email2h: false,
    push1h: true,
    sms30min: false,
  },
});

const availableWorks = computed(() => works.value);

const isFormValid = computed(() => {
  return sessionForm.title.trim() && 
         sessionForm.date && 
         sessionForm.startTime && 
         sessionForm.duration > 0 &&
         sessionForm.location &&
         sessionForm.workIds.some(id => id);
});

const addWork = () => {
  sessionForm.workIds.push('');
};

const removeWork = (index: number) => {
  sessionForm.workIds.splice(index, 1);
};

const scheduleSession = async () => {
  if (!isFormValid.value) return;
  
  scheduling.value = true;
  
  try {
    const sessionData = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: currentProject.value?.id,
      title: sessionForm.title,
      type: sessionForm.type,
      date: sessionForm.date,
      startTime: sessionForm.startTime,
      duration: sessionForm.duration,
      location: sessionForm.location,
      address: sessionForm.address,
      workIds: sessionForm.workIds.filter(id => id),
      attendeeType: sessionForm.attendeeType,
      selectedSections: sessionForm.selectedSections,
      objectives: sessionForm.objectives,
      notes: sessionForm.notes,
      reminders: sessionForm.reminders,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      createdBy: 'current_user_id',
    };
    
    // Here you would save to your backend/Firebase
    console.log('Scheduling session:', sessionData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    emit('sessionScheduled', sessionData);
  } catch (error) {
    console.error('Error scheduling session:', error);
    alert('Error al programar el ensayo. Por favor, intenta de nuevo.');
  } finally {
    scheduling.value = false;
  }
};

onMounted(() => {
  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  sessionForm.date = tomorrow.toISOString().split('T')[0];
  
  // Set default time
  sessionForm.startTime = '19:00';
});
</script>