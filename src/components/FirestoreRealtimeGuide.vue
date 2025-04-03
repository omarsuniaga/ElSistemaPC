<template>
  <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
      Guía de Consultas en Tiempo Real con Firestore
    </h2>
    
    <div class="prose dark:prose-invert">
      <h3>Implementación básica de onSnapshot</h3>
      <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
// Ejemplo 1: Consulta básica en tiempo real
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

// En setup o methods
const unsubscribe = ref(null);
const classes = ref([]);

// Función para iniciar escucha
function subscribeToClasses(teacherId) {
  // Crear query
  const classesRef = collection(db, 'classes');
  const q = query(
    classesRef, 
    where('teacherId', '==', teacherId),
    where('active', '==', true)
  );
  
  // Iniciar escucha en tiempo real
  const unsub = onSnapshot(q, (snapshot) => {
    classes.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }, (error) => {
    console.error('Error en listener:', error);
  });
  
  // Guardar función para cancelar suscripción
  unsubscribe.value = unsub;
}

// Importante: Limpiar en onUnmounted
onUnmounted(() => {
  // Cancelar suscripción cuando el componente se desmonta
  if (unsubscribe.value) {
    unsubscribe.value();
  }
});
      </pre>

      <h3>Consultas con múltiples filtros y fecha</h3>
      <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
// Ejemplo 2: Filtros por fecha y otros campos
import { Timestamp } from 'firebase/firestore';

// Función para crear timestamp de inicio/fin del día actual
function getTodayTimestamps() {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));
  
  return {
    start: Timestamp.fromDate(startOfDay),
    end: Timestamp.fromDate(endOfDay)
  };
}

// En setup o methods
function subscribeToTodayClasses() {
  const { start, end } = getTodayTimestamps();
  
  const classesRef = collection(db, 'classes');
  const q = query(
    classesRef,
    where('date', '>=', start),
    where('date', '<=', end),
    where('status', '==', 'scheduled')
  );
  
  // Iniciar escucha
  unsubscribe.value = onSnapshot(q, (snapshot) => {
    // Procesar datos...
  });
}
      </pre>

      <h3>Gestión de suscripciones múltiples</h3>
      <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
// Ejemplo 3: Manejo de múltiples suscripciones
const subscriptions = ref([]);

// Añadir nueva suscripción
function addSubscription(collection, filters, callback) {
  const collectionRef = collection(db, collection);
  const q = query(collectionRef, ...filters);
  
  const unsub = onSnapshot(q, callback);
  subscriptions.value.push(unsub);
  
  return unsub;
}

// Ejemplo de uso
function initSubscriptions() {
  // Añadir varias suscripciones
  addSubscription(
    'classes',
    [where('teacherId', '==', currentTeacher.value)],
    handleClassesUpdate
  );
  
  addSubscription(
    'attendance',
    [where('date', '==', today.value)],
    handleAttendanceUpdate
  );
}

// Limpiar todas las suscripciones
function cleanupSubscriptions() {
  subscriptions.value.forEach(unsub => unsub());
  subscriptions.value = [];
}

// En ciclo de vida
onMounted(() => {
  initSubscriptions();
});

onUnmounted(() => {
  cleanupSubscriptions();
});
      </pre>

      <h3>Manejo de errores y estado offline</h3>
      <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
// Ejemplo 4: Manejo de errores y estado offline
const isLoading = ref(true);
const error = ref(null);

function subscribeWithErrorHandling() {
  try {
    isLoading.value = true;
    error.value = null;
    
    const q = query(collection(db, 'classes'));
    
    const unsub = onSnapshot(
      q, 
      (snapshot) => {
        isLoading.value = false;
        // Procesar datos...
      }, 
      (err) => {
        isLoading.value = false;
        error.value = err.message;
        console.error('Error en Firestore:', err);
        
        // Opcional: Reintentar conexión después de un tiempo
        if (err.code === 'unavailable') {
          setTimeout(() => subscribeWithErrorHandling(), 5000);
        }
      }
    );
    
    return unsub;
  } catch (err) {
    isLoading.value = false;
    error.value = err.message;
    console.error('Error al crear suscripción:', err);
    return () => {}; // Función vacía como fallback
  }
}
      </pre>

      <h3>Combinación con composables y pinia stores</h3>
      <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
// Ejemplo 5: Uso de composables para reutilización
// useFirestoreSubscription.js
import { ref, onUnmounted } from 'vue';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

export function useFirestoreSubscription() {
  const subscriptions = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  
  function subscribe(collectionName, queryConstraints = [], callback) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          isLoading.value = false;
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(items);
        },
        (err) => {
          isLoading.value = false;
          error.value = err.message;
          console.error(`Error en suscripción a ${collectionName}:`, err);
        }
      );
      
      subscriptions.value.push(unsub);
      return unsub;
    } catch (err) {
      isLoading.value = false;
      error.value = err.message;
      console.error(`Error al crear suscripción a ${collectionName}:`, err);
      return () => {};
    }
  }
  
  // Limpiar automáticamente al desmontar
  onUnmounted(() => {
    subscriptions.value.forEach(unsub => unsub());
    subscriptions.value = [];
  });
  
  return {
    subscribe,
    isLoading,
    error,
    clearSubscriptions: () => {
      subscriptions.value.forEach(unsub => unsub());
      subscriptions.value = [];
    }
  };
}

// Uso en componente
const { subscribe, isLoading, error } = useFirestoreSubscription();

onMounted(() => {
  subscribe(
    'classes',
    [where('teacherId', '==', props.teacherId)],
    (items) => {
      classes.value = items;
    }
  );
});
      </pre>
    </div>
  </div>
</template>

<script setup>
// Este componente es solo una guía de referencia y no necesita lógica específica
</script>

<style scoped>
.prose pre {
  font-size: 0.9em;
  line-height: 1.5;
}
</style>