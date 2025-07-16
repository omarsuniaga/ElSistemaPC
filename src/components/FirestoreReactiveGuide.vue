<template>
  <div class="reactive-guide p-6">
    <h1 class="text-2xl font-bold mb-4">Guía de Implementación Reactiva</h1>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Consultas reactivas con Firestore</h2>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">
import { computed } from 'vue'
import { where, orderBy } from 'firebase/firestore'
import { useFirestoreCollection } from '../composables/useFirestoreCollection'

// Definir restricciones de consulta reactivas
const queryConstraints = computed(() => {
  const constraints = []
  
  if (selectedGroupId.value) {
    constraints.push(where('groupId', '==', selectedGroupId.value))
  }
  
  constraints.push(orderBy('lastName'))
  return constraints
})

// Usar el composable para obtener datos reactivos
const { items, loading, error } = useFirestoreCollection('students', queryConstraints)
      </pre>
    </div>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Consultas paginadas para datos históricos</h2>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">
import { usePaginatedFirestore } from '../composables/usePaginatedFirestore'
import { where } from 'firebase/firestore'

// Configurar consulta paginada
const { 
  items: records, 
  loading, 
  error,
  hasMore,
  loadNextPage
} = usePaginatedFirestore('attendance', {
  pageSize: 20,
  orderByField: 'date',
  orderDirection: 'desc',
  filters: [where('studentId', '==', studentId)]
})

// Para cargar más resultados
const loadMore = () => {
  if (!loading.value) loadNextPage()
}
      </pre>
    </div>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Componentes UI reutilizables</h2>

      <h3 class="text-lg font-medium mb-2">1. BaseModal</h3>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">
&lt;BaseModal
  v-model="showModal"
  title="Título del Modal"
  size="md"
  :persistent="false"
&gt;
  &lt;div&gt;Contenido del modal&lt;/div&gt;
  
  &lt;template #footer&gt;
    &lt;button @click="showModal = false"&gt;Cerrar&lt;/button&gt;
    &lt;button @click="saveChanges"&gt;Guardar&lt;/button&gt;
  &lt;/template&gt;
&lt;/BaseModal&gt;
      </pre>

      <h3 class="text-lg font-medium mt-4 mb-2">2. BaseCard</h3>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">
&lt;BaseCard
  title="Título de la tarjeta"
  subtitle="Subtítulo"
  hoverable
  clickable
  variant="default"
  @click="handleCardClick"
&gt;
  &lt;p&gt;Contenido de la tarjeta&lt;/p&gt;
  
  &lt;template #footer&gt;
    &lt;div class="flex justify-end gap-2"&gt;
      &lt;button&gt;Acción 1&lt;/button&gt;
      &lt;button&gt;Acción 2&lt;/button&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/BaseCard&gt;
      </pre>

      <h3 class="text-lg font-medium mt-4 mb-2">3. BaseList</h3>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">
&lt;BaseList
  :items="items"
  :loading="loading"
  :error="error"
  empty-message="No hay elementos para mostrar"
  @item-click="handleItemClick"
&gt;
  &lt;template #item="{ item }"&gt;
    &lt;div class="p-2"&gt;{{ item.name }}&lt;/div&gt;
  &lt;/template&gt;
  
  &lt;template #loading&gt;
    Cargando datos personalizados...
  &lt;/template&gt;
  
  &lt;template #empty&gt;
    &lt;div class="text-center py-4"&gt;
      No hay datos disponibles
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/BaseList&gt;
      </pre>
    </div>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Mejores prácticas para UX/UI reactivo</h2>
      <ul class="list-disc pl-6 space-y-2">
        <li>
          Utiliza <code>computed</code> y <code>watch</code> para responder a cambios en los datos
        </li>
        <li>Implementa modales con <code>Teleport</code> para evitar problemas de z-index</li>
        <li>Usa animaciones sutiles para mejorar la experiencia de usuario</li>
        <li>
          Desuscríbete de los listener de Firestore al desmontar componentes usando
          <code>onUnmounted</code>
        </li>
        <li>Maneja los estados de carga y error de forma consistente en toda la aplicación</li>
        <li>Utiliza <code>onMounted</code> para inicializar datos cuando el componente se monta</li>
        <li>Para consultas grandes, implementa paginación para mejorar el rendimiento</li>
      </ul>
    </div>

    <div>
      <h2 class="text-xl font-semibold mb-2">Integración con Pinia</h2>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">
// stores/students.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export const useStudentsStore = defineStore('students', () => {
  const currentStudent = ref(null)
  const currentGroupId = ref(null)
  
  const fetchStudent = async (id) => {
    const docRef = doc(db, 'students', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      currentStudent.value = { id: docSnap.id, ...docSnap.data() }
    }
  }
  
  const updateStudent = async (id, data) => {
    await updateDoc(doc(db, 'students', id), data)
    if (currentStudent.value?.id === id) {
      currentStudent.value = { ...currentStudent.value, ...data }
    }
  }
  
  return {
    currentStudent,
    currentGroupId,
    fetchStudent,
    updateStudent
  }
})
      </pre>
    </div>
  </div>
</template>

<script setup>
// Este componente sirve como documentación sobre cómo implementar componentes reactivos
</script>

<style scoped>
.reactive-guide {
  max-width: 1000px;
  margin: 0 auto;
}

code {
  background-color: #f1f5f9;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}
</style>
