<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <div class="p-8">
      <h1 class="text-3xl font-bold text-center mb-4">El Sistema PC</h1>
      <div class="text-center">
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Aplicación funcionando correctamente
        </div>
        <p class="mb-4">Inicialización: {{ initStatus }}</p>
        <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          @click="testFirebase"
        >
          Probar Firebase
        </button>
        <div v-if="firebaseStatus" class="mt-4 p-4 bg-gray-100 rounded">
          <pre>{{ firebaseStatus }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const initStatus = ref('Inicializando...');
const firebaseStatus = ref('');

onMounted(async () => {
  try {
    console.log('🔍 [Test App] Iniciando prueba básica...');

    // Test basic initialization
    initStatus.value = 'Probando importaciones...';

    // Test Firebase import
    const firebaseModule = await import('./firebase/config');
    console.log('✅ [Test App] Firebase importado:', firebaseModule);

    initStatus.value = 'Firebase importado ✅';

    // Test stores
    const { useAuthStore } = await import('./stores/auth');
    const authStore = useAuthStore();
    console.log('✅ [Test App] Auth store:', authStore);

    initStatus.value = 'Stores funcionando ✅';
  } catch (error: any) {
    console.error('❌ [Test App] Error:', error);
    initStatus.value = `Error: ${error.message}`;
  }
});

const testFirebase = async () => {
  try {
    const { db, auth } = await import('./firebase/config');
    firebaseStatus.value = JSON.stringify(
      {
        hasDB: !!db,
        hasAuth: !!auth,
        authCurrentUser: auth.currentUser,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    );
  } catch (error: any) {
    firebaseStatus.value = `Error: ${error.message}`;
  }
};
</script>
