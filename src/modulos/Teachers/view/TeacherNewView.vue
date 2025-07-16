<template>
  <div class="py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Nuevo Maestro</h1>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
    >
      {{ error }}
    </div>

    <div class="card p-6">
      <TeacherForm :is-loading="isLoading" @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
// src/modulos/Teachers/view/TeacherNewView.vue
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTeachersStore } from '../store/teachers';
import TeacherForm from '../components/TeacherForm.vue';

const router = useRouter();
const teachersStore = useTeachersStore();

const isLoading = ref(false);
const error = ref<string | null>(null);

const handleSubmit = async (data: any) => {
  isLoading.value = true;
  error.value = null;

  try {
    const newTeacher = await teachersStore.addTeacher(data);
    router.push(`/teachers/${newTeacher.id}`);
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  router.push('/teachers');
};
</script>
