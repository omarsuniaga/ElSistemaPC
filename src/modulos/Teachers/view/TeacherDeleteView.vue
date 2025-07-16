<template>
  <div class="py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-red-600 dark:text-red-500">Eliminar Maestro</h1>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
    >
      {{ error }}
    </div>

    <div v-if="teacher" class="card p-6">
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <h3 class="mt-4 text-lg font-medium">¿Estás seguro que deseas eliminar este maestro?</h3>

        <div class="mt-2">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Esta acción eliminará permanentemente al maestro
            <strong>{{ teacher.name }} </strong>
            y todos sus datos asociados. Esta acción no se puede deshacer.
          </p>
        </div>

        <div class="mt-6 flex justify-center gap-3">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isLoading"
            @click="handleCancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            :disabled="isLoading"
            @click="handleConfirm"
          >
            {{ isLoading ? "Eliminando..." : "Sí, eliminar" }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
      Maestro no encontrado
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeachersStore } from '../store/teachers';

const route = useRoute();
const router = useRouter();
const teachersStore = useTeachersStore();

const teacherId = route.params.id as string;
const teacher = computed(() => teachersStore.teachers.find((t) => t.id === teacherId));

const isLoading = ref(false);
const error = ref<string | null>(null);

const handleConfirm = async () => {
  if (!teacher.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    await teachersStore.deleteTeacher(teacherId);
    router.push('/teachers');
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
.btn {
  @apply px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500;
}
</style>
