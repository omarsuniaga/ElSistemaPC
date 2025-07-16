<template>
  <div class="py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Editar Formulario de Inscripción</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Actualice sus instrumentos, especialidades y horarios disponibles.
      </p>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
    >
      {{ error }}
    </div>

    <div v-if="teacher" class="card">
      <TeacherForm
        :initial-data="teacher"
        :is-loading="isLoading"
        :enrollment-only="true"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
    <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
      Maestro no encontrado
    </div>
  </div>
</template>

<script setup lang="ts">
// src/modulos/Teachers/view/TeacherEditEnrollmentView.vue
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeachersStore } from '../store/teachers'; // Corrected path
import TeacherForm from '../components/TeacherForm.vue';
import type { Teacher } from '../types/teachers'; // Corrected path

const route = useRoute();
const router = useRouter();
const teachersStore = useTeachersStore();

const teacherId = route.params.id as string;
const isLoading = ref(false);
const error = ref<string | null>(null);
const teacher = computed(() => {
  // Buscar por id (Firestore) o por uid (auth)
  return (
    teachersStore.getTeacherById(teacherId) ||
    teachersStore.teachers.find((t) => t.uid === teacherId)
  );
});

const handleSubmit = async (data: Partial<Teacher>) => {
  if (!teacherId) return;

  isLoading.value = true;
  error.value = null;

  try {
    await teachersStore.updateTeacherEnrollment(teacherId, {
      instruments: data.instruments,
      specialties: data.specialties,
      schedule: data.schedule,
    });
    router.push(`/teachers/${teacherId}`);
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  router.push(`/teachers/${teacherId}`);
};
</script>

<style scoped>
.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden;
}
</style>
