<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">🎼 Crear Nuevo Proyecto Montaje</h3>
      
      <div class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Información Básica</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto *</label>
              <input
                v-model="projectForm.name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Concierto de Primavera 2024"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Organización *</label>
              <input
                v-model="projectForm.organization"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Orquesta Sinfónica Municipal"
              >
            </div>
          </div>
          
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              v-model="projectForm.description"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Descripción del proyecto, objetivos, repertorio..."
            ></textarea>
          </div>
        </div>

        <!-- Project Details -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Detalles del Proyecto</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Director *</label>
              <input
                v-model="projectForm.director"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del director"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Temporada</label>
              <select
                v-model="projectForm.season"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option v-for="season in seasons" :key="season" :value="season">{{ season }}</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Proyecto</label>
              <select
                v-model="projectForm.type"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option v-for="type in projectTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
              <input
                v-model="projectForm.startDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Objetivo *</label>
              <input
                v-model="projectForm.endDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
          </div>
        </div>

        <!-- Project Settings -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Configuración</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Frecuencia de Evaluación</label>
              <select
                v-model="projectForm.evaluationFrequency"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Generación de Reportes</label>
              <select
                v-model="projectForm.reportGeneration"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automática</option>
              </select>
            </div>
          </div>
          
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Integraciones</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="flex items-center gap-2">
                <input
                  v-model="projectForm.integrations.calendar"
                  type="checkbox"
                  class="rounded"
                >
                <span class="text-sm text-gray-700">📅 Calendario</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="projectForm.integrations.email"
                  type="checkbox"
                  class="rounded"
                >
                <span class="text-sm text-gray-700">📧 Email</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="projectForm.integrations.metronome"
                  type="checkbox"
                  class="rounded"
                >
                <span class="text-sm text-gray-700">🎵 Metrónomo</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="projectForm.integrations.tuner"
                  type="checkbox"
                  class="rounded"
                >
                <span class="text-sm text-gray-700">🎼 Afinador</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Initial Team -->
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Equipo Inicial (Opcional)</h4>
          <div class="space-y-3">
            <div 
              v-for="(member, index) in projectForm.initialMembers"
              :key="index"
              class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
            >
              <div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  v-model="member.name"
                  type="text"
                  class="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre completo"
                >
                <input
                  v-model="member.email"
                  type="email"
                  class="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email"
                >
                <select
                  v-model="member.role"
                  class="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="director">Director</option>
                  <option value="assistant">Asistente</option>
                  <option value="section_leader">Jefe de Sección</option>
                  <option value="musician">Músico</option>
                </select>
                <input
                  v-model="member.instruments"
                  type="text"
                  class="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Instrumentos (separados por coma)"
                >
              </div>
              <button
                class="text-red-500 hover:text-red-700 text-sm"
                @click="removeMember(index)"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <button
            class="mt-3 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            @click="addMember"
          >
            ➕ Agregar Miembro
          </button>
        </div>
      </div>
      
      <div class="flex gap-3 mt-6">
        <button
          :disabled="!isFormValid || creating"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          @click="handleCreateProject"
        >
          {{ creating ? 'Creando...' : 'Crear Proyecto' }}
        </button>
        <button
          :disabled="creating"
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
import { reactive, ref, computed } from 'vue';
import { useMontaje } from '../composables/useMontaje';

const emit = defineEmits<{
  projectCreated: [project: any]
  close: []
}>();

const { createProject } = useMontaje();
const creating = ref(false);

const seasons = [
  'Primavera 2024',
  'Verano 2024',
  'Otoño 2024',
  'Invierno 2024',
  'Primavera 2025',
  'Temporada 2024-2025',
];

const projectTypes = [
  { value: 'concert', label: 'Concierto' },
  { value: 'opera', label: 'Ópera' },
  { value: 'ballet', label: 'Ballet' },
  { value: 'chamber', label: 'Música de Cámara' },
  { value: 'educational', label: 'Educativo' },
  { value: 'recording', label: 'Grabación' },
  { value: 'competition', label: 'Competencia' },
  { value: 'festival', label: 'Festival' },
];

const projectForm = reactive({
  name: '',
  description: '',
  director: '',
  organization: '',
  season: 'Primavera 2024',
  type: 'concert',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  evaluationFrequency: 'weekly',
  reportGeneration: 'manual',
  integrations: {
    calendar: true,
    email: true,
    metronome: false,
    tuner: false,
  },
  initialMembers: [],
});

const isFormValid = computed(() => {
  return projectForm.name.trim() && 
         projectForm.director.trim() && 
         projectForm.organization.trim() &&
         projectForm.startDate &&
         projectForm.endDate;
});

const addMember = () => {
  projectForm.initialMembers.push({
    name: '',
    email: '',
    role: 'musician',
    instruments: '',
  });
};

const removeMember = (index: number) => {
  projectForm.initialMembers.splice(index, 1);
};

const handleCreateProject = async () => {
  if (!isFormValid.value) return;
  
  creating.value = true;
  
  try {
    const projectId = await createProject(
      projectForm.name,
      projectForm.description,
      projectForm.director,
      projectForm.organization,
      projectForm.season,
      projectForm.startDate,
      projectForm.endDate,
    );
    
    // Create project object for emission
    const newProject = {
      id: projectId,
      ...projectForm,
      status: 'planning',
      works: [],
      members: projectForm.initialMembers.map(member => ({
        ...member,
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        instruments: member.instruments.split(',').map(i => i.trim()).filter(Boolean),
        joinedAt: new Date().toISOString(),
        permissions: [],
      })),
      settings: {
        evaluationFrequency: projectForm.evaluationFrequency,
        autoReminders: true,
        reportGeneration: projectForm.reportGeneration,
        exportFormats: ['pdf', 'excel'],
        integrations: projectForm.integrations,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    emit('projectCreated', newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    alert('Error al crear el proyecto. Por favor, intenta de nuevo.');
  } finally {
    creating.value = false;
  }
};
</script>