<!-- Página de test para RBAC -->
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="container mx-auto px-4">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">🧪 Centro de Pruebas RBAC</h1>
        <p class="text-gray-600">Herramientas para verificar la comunicación con Firestore</p>
      </div>
      
      <!-- Componente de test -->
      <RBACTestComponent />
      
      <!-- Instrucciones adicionales -->
      <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">📋 Instrucciones de Uso</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold text-gray-800 mb-2">🚀 Test Completo</h3>
            <p class="text-sm text-gray-600 mb-2">
              Ejecuta una verificación completa de la comunicación con Firestore:
            </p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Lee roles, permisos y navegación</li>
              <li>• Prueba escritura y lectura</li>
              <li>• Verifica integridad de datos</li>
              <li>• Limpia datos temporales</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-semibold text-gray-800 mb-2">📊 Estado Actual</h3>
            <p class="text-sm text-gray-600 mb-2">
              Muestra un resumen del estado actual del sistema RBAC:
            </p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Cantidad de roles y permisos</li>
              <li>• Elementos de navegación</li>
              <li>• Distribución por módulos</li>
            </ul>
          </div>
        </div>
        
        <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 class="font-semibold text-yellow-800 mb-2">⚠️ Notas Importantes</h4>
          <ul class="text-sm text-yellow-700 space-y-1">
            <li>• Esta página es solo para testing y desarrollo</li>
            <li>• Los datos se guardan en Firestore real</li>
            <li>• Use "Inicializar Datos" solo si no hay datos en el sistema</li>
            <li>• Los tests crean y eliminan datos temporales automáticamente</li>
          </ul>
        </div>
      </div>
      
      <!-- Herramientas adicionales -->
      <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">🔧 Herramientas Adicionales</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded">
            <div>
              <h3 class="font-semibold">🔗 Consola del Navegador</h3>
              <p class="text-sm text-gray-600">Ejecutar tests desde la consola del navegador</p>
            </div>
            <div class="text-sm text-gray-500">
              <code class="bg-gray-100 px-2 py-1 rounded">testRBACFirestore()</code>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded">
            <div>
              <h3 class="font-semibold">📊 Estado desde Consola</h3>
              <p class="text-sm text-gray-600">Ver estado del sistema desde la consola</p>
            </div>
            <div class="text-sm text-gray-500">
              <code class="bg-gray-100 px-2 py-1 rounded">showRBACStatus()</code>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded">
            <div>
              <h3 class="font-semibold">🗄️ Firebase Console</h3>
              <p class="text-sm text-gray-600">Ver datos directamente en Firebase Console</p>
            </div>
            <div class="text-sm text-gray-500">
              Collections: <code class="bg-gray-100 px-1 rounded">RBAC_CONFIG</code>, <code class="bg-gray-100 px-1 rounded">NAVIGATION_CONFIG</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RBACTestComponent from '@/components/RBACTestComponent.vue'

// Agregar funciones globales para testing desde consola
if (typeof window !== 'undefined') {
  // Las funciones se cargarán desde el archivo de test
  const script = document.createElement('script')
  script.src = '/test-rbac-firestore.js'
  document.head.appendChild(script)
}
</script>
