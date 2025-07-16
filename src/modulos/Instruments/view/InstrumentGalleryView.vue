<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
      Galería de Fotos del Instrumento
    </h1>
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      <span class="ml-3">Cargando fotos...</span>
    </div>
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <p class="text-red-600">{{ error }}</p>
    </div>
    <div v-else>
      <div v-if="photos.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="(photo, idx) in photos"
          :key="idx"
          class="bg-white rounded shadow overflow-hidden"
        >
          <img :src="photo" alt="Foto de instrumento" class="w-full h-48 object-cover" />
        </div>
      </div>
      <div v-else class="text-gray-500 text-center py-12">No hay fotos para este instrumento.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
// Reemplaza esto con tu servicio real de obtención de fotos
// import { getInstrumentPhotos } from '../service/instruments';

const route = useRoute();
const instrumentId = route.params.id as string;
const isLoading = ref(true);
const error = ref<string | null>(null);
const photos = ref<string[]>([]);

onMounted(async () => {
  try {
    // photos.value = await getInstrumentPhotos(instrumentId);
    // Simulación de fotos:
    photos.value = [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    ];
  } catch (e: any) {
    error.value = e.message || 'Error al cargar fotos';
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
img {
  transition: transform 0.2s;
}
img:hover {
  transform: scale(1.05);
}
</style>
