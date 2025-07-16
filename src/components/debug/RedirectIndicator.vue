<template>
  <div class="fixed top-4 right-4 z-50">
    <div v-if="showRedirectInfo" class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
      <div class="flex items-center space-x-2">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-sm font-medium">{{ redirectInfo }}</span>
      </div>
    </div>

    <div v-if="userInfo" class="mt-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg">
      <div class="text-xs">
        <div><strong>Usuario:</strong> {{ userInfo.role }}</div>
        <div><strong>Ruta:</strong> {{ currentRoute }}</div>
        <div><strong>Admin Route:</strong> {{ shouldRedirect ? "Sí" : "No" }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { shouldUseAdminRoute, getAdminRoute } from '@/router/guards/roleBasedRedirect';

const route = useRoute();
const authStore = useAuthStore();

const showRedirectInfo = ref(false);
const redirectInfo = ref('');

const currentRoute = computed(() => route.path);
const userInfo = computed(() => authStore.user);

const shouldRedirect = computed(() => {
  if (!userInfo.value?.role) return false;
  return shouldUseAdminRoute(userInfo.value.role, currentRoute.value);
});

const adminRouteForCurrent = computed(() => {
  return getAdminRoute(currentRoute.value);
});

// Mostrar información de redirección cuando sea aplicable
watch(
  [currentRoute, userInfo],
  () => {
    if (shouldRedirect.value && adminRouteForCurrent.value) {
      redirectInfo.value = `Redirigiendo a: ${adminRouteForCurrent.value}`;
      showRedirectInfo.value = true;

      // Ocultar después de 3 segundos
      setTimeout(() => {
        showRedirectInfo.value = false;
      }, 3000);
    }
  },
  { immediate: true },
);

onMounted(() => {
  console.log('🔧 RedirectIndicator montado');
  console.log('👤 Usuario actual:', userInfo.value);
  console.log('📍 Ruta actual:', currentRoute.value);
  console.log('🔄 Debería redirigir:', shouldRedirect.value);
});
</script>
