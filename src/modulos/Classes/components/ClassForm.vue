<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTeachersStore } from '@/modulos/Teachers/store/teachers';

const props = defineProps({
  classData: {
    type: Object,
    default: null
  }
});
const emit = defineEmits(['save', 'cancel']);

const authStore = useAuthStore();
const teachersStore = useTeachersStore();

// Usamos reactive para objetos complejos
const form = reactive({
  name: '',
  description: '',
  level: 'Principiante',
  instrument: '',
  teacherId: authStore.user?.uid || '',
  classroom: '',
  schedule: {
    slots: [
      { day: '', startTime: '', endTime: '' }
    ]
  }
});

// Opciones para selects
const levels = ['Principiante', 'Intermedio', 'Avanzado'];
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Errores (para múltiples validaciones en schedule se usa un array)
const errors = reactive({
  name: '',
  level: '',
  teacherId: '',
  schedule: [] as string[]
});
const isSubmitting = ref(false);

// Funciones para agregar/eliminar sesiones
const addSession = () => {
  if (form.schedule.slots.length < 5) {
    form.schedule.slots.push({ day: '', startTime: '', endTime: '' });
  }
};
const removeSession = (index: number) => {
  if (form.schedule.slots.length > 1) {
    form.schedule.slots.splice(index, 1);
  }
};

// Función helper para limpiar datos (similar al del componente padre)
function cleanData(obj: any): any {
  if (Array.isArray(obj)) {
    // Limpia cada elemento y elimina los que resulten vacíos (sin propiedades)
    return obj
      .map(item => cleanData(item))
      .filter(item => 
        (typeof item === 'object' ? Object.keys(item).length > 0 : item !== undefined && item !== null && item !== '')
      );
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).reduce((acc, key) => {
      const value = cleanData(obj[key]);
      // Si value es string y vacía, o si es undefined, se omite
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return acc;
      }
      // Si es objeto y quedó vacío, se omite
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {} as any);
  } else {
    return obj;
  }
}


// Validación del formulario
const validateForm = () => {
  let isValid = true;
  errors.name = '';
  errors.level = '';
  errors.teacherId = '';
  errors.schedule = [];

  if (!form.name.trim()) {
    errors.name = 'El nombre de la clase es requerido';
    isValid = false;
  }
  if (!form.level) {
    errors.level = 'El nivel es requerido';
    isValid = false;
  }
  if (form.schedule.slots.length === 0) {
    errors.schedule.push('Agrega al menos un horario');
    isValid = false;
  } else {
    form.schedule.slots.forEach((session, index) => {
      let sessionError = '';
      if (!session.day) {
        sessionError = `Selecciona un día para el horario ${index + 1}`;
      } else if (!session.startTime) {
        sessionError = `Selecciona hora de inicio para el horario ${index + 1}`;
      } else if (!session.endTime) {
        sessionError = `Selecciona hora de fin para el horario ${index + 1}`;
      } else if (session.startTime >= session.endTime) {
        sessionError = `La hora de inicio debe ser anterior a la hora de fin en el horario ${index + 1}`;
      }
      if (sessionError) {
        errors.schedule.push(sessionError);
        isValid = false;
      }
    });
  }
  return isValid;
};

// Preparar datos del formulario antes de emitir el evento
const prepareClassData = () => cleanData({
  name: form.name.trim(),
  description: form.description.trim(),
  level: form.level,
  instrument: form.instrument.trim(),
  teacherId: form.teacherId,
  classroom: form.classroom.trim(),
  schedule: {
    slots: form.schedule.slots.map(session => ({
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime
    }))
  },
  studentIds: props.classData?.studentIds || []
});


// Manejar envío del formulario
const handleSubmit = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;
  try {
    const cleanFormData = prepareClassData();
    emit('save', cleanFormData);
  } catch (error) {
    console.error('Error al preparar datos de la clase:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Watch para inicializar/resetear el formulario
watch(() => props.classData, (newVal) => {
  if (newVal) {
    form.name = newVal.name || '';
    form.description = newVal.description || '';
    form.level = newVal.level || 'Principiante';
    form.instrument = newVal.instrument || '';
    form.teacherId = newVal.teacherId || authStore.user?.uid || '';
    form.classroom = newVal.classroom || '';
    form.schedule.slots = newVal.schedule && Array.isArray(newVal.schedule.slots) && newVal.schedule.slots.length > 0
      ? newVal.schedule.slots
      : [{ day: '', startTime: '', endTime: '' }];
  } else {
    form.name = '';
    form.description = '';
    form.level = 'Principiante';
    form.instrument = '';
    form.teacherId = authStore.user?.uid || '';
    form.classroom = '';
    form.schedule.slots = [{ day: '', startTime: '', endTime: '' }];
  }
}, { immediate: true });

onMounted(() => {
  if (!form.teacherId && authStore.user?.uid) {
    form.teacherId = authStore.user.uid;
  }
});
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Campo: Nombre -->
    <div>
      <label for="name" class="block text-sm font-medium">Nombre de la clase *</label>
      <input id="name" v-model="form.name" type="text" class="mt-1 block w-full p-2 border rounded-md" :class="{'border-red-500': errors.name}">
      <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
    </div>
    <!-- Campo: Descripción -->
    <div>
      <label for="description" class="block text-sm font-medium">Descripción</label>
      <textarea id="description" v-model="form.description" rows="3" class="mt-1 block w-full p-2 border rounded-md"></textarea>
    </div>
    <!-- Selección: Nivel e Instrumento -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="level" class="block text-sm font-medium">Nivel *</label>
        <select id="level" v-model="form.level" class="mt-1 block w-full p-2 border rounded-md" :class="{'border-red-500': errors.level}">
          <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
        </select>
        <p v-if="errors.level" class="mt-1 text-sm text-red-500">{{ errors.level }}</p>
      </div>
      <div>
        <label for="instrument" class="block text-sm font-medium">Instrumento</label>
        <input id="instrument" v-model="form.instrument" type="text" class="mt-1 block w-full p-2 border rounded-md" />
      </div>
    </div>
    <!-- Campo: Aula -->
    <div>
      <label for="classroom" class="block text-sm font-medium">Aula</label>
      <input id="classroom" v-model="form.classroom" type="text" class="mt-1 block w-full p-2 border rounded-md" />
    </div>
    <!-- Sección: Horarios -->
    <div>
      <label class="block text-sm font-medium">Horarios *</label>
      <div v-for="(slot, index) in form.schedule.slots" :key="index" class="flex items-center gap-2 mt-2">
        <select v-model="slot.day" class="block w-1/4 p-2 border rounded-md">
          <option value="" disabled>Seleccione un día</option>
          <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
        </select>
        <input type="time" v-model="slot.startTime" class="block w-1/4 p-2 border rounded-md" placeholder="Inicio" />
        <input type="time" v-model="slot.endTime" class="block w-1/4 p-2 border rounded-md" placeholder="Fin" />
        <button type="button" @click="removeSession(index)" class="text-red-500" :disabled="form.schedule.slots.length <= 1">Eliminar</button>
      </div>
      <button type="button" @click="addSession" class="mt-2 text-blue-600" :disabled="form.schedule.slots.length >= 5">Agregar horario</button>
      <p v-if="errors.schedule.length" class="mt-1 text-sm text-red-500">
        <span v-for="(err, i) in errors.schedule" :key="i">{{ err }}<br/></span>
      </p>
    </div>
    <!-- Botones de acción -->
    <div class="flex justify-end space-x-3 pt-4 border-t">
      <button type="button" @click="emit('cancel')" class="px-4 py-2 border rounded-md">Cancelar</button>
      <button type="submit" :disabled="isSubmitting" class="px-4 py-2 border rounded-md bg-blue-600 text-white">
        {{ isSubmitting ? 'Guardando...' : (props.classData ? 'Actualizar' : 'Crear') }}
      </button>
    </div>
  </form>
</template>
