<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header: Título, subtítulo y botón Evaluar/Guardar -->
    <header class="flex justify-between items-center p-4 bg-white shadow-md">
      <div>
        <h1 class="text-2xl font-bold">Espacio de Trabajo</h1>
        <p class="text-gray-600 text-sm">
          presiona el botón evaluar y empieza a calificar a tus alumnos, selecciona una clase,
          selecciona a un grupo de alumnos y selecciona el contenido que vas a evaluar
        </p>
      </div>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
        @click="toggleEvaluationMode"
      >
        {{ evaluationMode ? "Guardar" : "Evaluar" }}
      </button>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar Izquierdo: #Menu de Alumnos -->
      <aside class="w-full md:w-1/4 p-4 border-r border-gray-200 overflow-y-auto">
        <h2 class="text-xl font-semibold mb-2">#Menu de Alumnos</h2>
        <ul>
          <li
            v-for="student in students"
            :key="student.id"
            class="cursor-pointer hover:bg-gray-100 p-2 rounded flex items-center"
            @click="selectStudent(student)"
          >
            <img :src="student.avatar" alt="avatar" class="w-8 h-8 rounded-full mr-2" />
            <span>{{ student.name }}</span>
          </li>
        </ul>
      </aside>

      <!-- Contenido Central: Cards de Evaluación -->
      <main class="flex-1 p-4 overflow-y-auto">
        <div
          v-for="card in evaluationCards"
          :key="card.id"
          class="bg-white shadow rounded-lg p-4 mb-4 relative"
        >
          <!-- Botón Delete (parte superior derecha) -->
          <button
            class="absolute top-2 right-2 text-red-500 hover:text-red-600 focus:outline-none"
            @click="deleteCard(card)"
          >
            <i class="fas fa-trash" />
          </button>

          <!-- Título y Subtítulo -->
          <h2 class="text-lg font-bold">
            {{ card.contentTitle || "Contenido no seleccionado" }}
          </h2>
          <p class="text-gray-600 text-sm mb-2">
            {{ card.contentSubtitle || "Tema - Indicador" }}
          </p>

          <!-- Avatares (grupo de alumnos ordenado alfabéticamente) -->
          <div class="flex -space-x-3 mb-4">
            <template v-for="(student, index) in sortedStudents(card.group)">
              <img
                v-if="index < 6"
                :key="student.id"
                :src="student.avatar"
                :alt="student.name"
                class="w-10 h-10 rounded-full border-2 border-white"
              />
            </template>
            <div
              v-if="card.group.length > 6"
              class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold border-2 border-white"
            >
              +{{ card.group.length - 6 }}
            </div>
          </div>

          <!-- Sección Calificadora: Linear Progress para cada indicador -->
          <div v-for="(indicator, idx) in card.indicators" :key="indicator.uniqueId" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ indicator.label }}
            </label>
            <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div class="bg-blue-600 h-2.5 rounded-full" :style="{width: indicator.score + '%'}" />
            </div>
            <input
              v-model.number="indicator.score"
              type="range"
              min="0"
              max="100"
              :disabled="card.locked"
              class="w-full"
            />
            <p class="text-sm text-gray-600 text-right">{{ indicator.score }}%</p>
          </div>

          <!-- Footer de Acciones: Botón Editar/Guardar -->
          <div class="flex justify-end space-x-2">
            <button
              class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
              @click="toggleCardEdit(card)"
            >
              <i v-if="card.locked" class="fas fa-edit" />
              <i v-else class="fas fa-save" />
            </button>
          </div>
        </div>
      </main>

      <!-- Sidebar Derecho: #Menu de Contenidos -->
      <aside class="w-full md:w-1/4 p-4 border-l border-gray-200 overflow-y-auto">
        <h2 class="text-xl font-semibold mb-2">#Menu de Contenidos</h2>
        <RecursiveMenu :items="contents" @item-selected="handleContentSelection" />
      </aside>
    </div>
  </div>
</template>

<script setup>
import {ref} from "vue"
import RecursiveMenu from "./RecursiveMenu.vue"

// Modo de evaluación (global)
const evaluationMode = ref(false)

// Cards de evaluación: cada card representa una evaluación de un grupo de alumnos
const evaluationCards = ref([])
// Card activa para edición (si existe)
const activeCard = ref(null)
// Array de alumnos seleccionados (selectedStudents)
const selectedStudents = ref([])
// Contador global para nombres únicos
let globalGroupCounter = 1

// Datos simulados de alumnos
const students = ref([
  {id: 1, name: "Patricia Lopez", avatar: "https://i.pravatar.cc/150?u=patricia"},
  {id: 2, name: "Maria Albonoz", avatar: "https://i.pravatar.cc/150?u=maria"},
  {id: 3, name: "Dyankeson Lamprea", avatar: "https://i.pravatar.cc/150?u=dyankeson"},
  {id: 4, name: "Edelyn Abreu", avatar: "https://i.pravatar.cc/150?u=edelyn"},
  {id: 5, name: "Eilyn Michelle", avatar: "https://i.pravatar.cc/150?u=eilyn"},
  {id: 6, name: "Yuraima Mujica", avatar: "https://i.pravatar.cc/150?u=yuraima"},
  {id: 7, name: "John Doe", avatar: "https://i.pravatar.cc/150?u=johndoe"},
])

// Datos simulados: menú recursivo de contenidos (estructura recursiva)
const contents = ref([
  {
    title: "Figuras Rítmicas Básicas",
    children: [
      {
        title: "Teoría y Solfeo",
        children: [
          {title: "Unidad de Tiempo", type: "indicator"},
          {title: "Ritmo Base", type: "indicator"},
        ],
      },
      {
        title: "Aplicaciones Prácticas",
        children: [{title: "Ejercicios de Ritmo", type: "indicator"}],
      },
    ],
  },
  {
    title: "Escalas Mayores",
    children: [
      {
        title: "Teoría Musical",
        children: [{title: "Construcción de Escalas", type: "indicator"}],
      },
      {
        title: "Ejercicios Prácticos",
        children: [{title: "Ejercicios de Escalas", type: "indicator"}],
      },
    ],
  },
  {
    title: "Cifrado Armónico",
    children: [
      {
        title: "Acordes",
        children: [
          {title: "Triada Mayor", type: "indicator"},
          {title: "Triada Menor", type: "indicator"},
        ],
      },
    ],
  },
])

// Alterna el modo global de evaluación: Evaluar <-> Guardar
const toggleEvaluationMode = () => {
  if (!evaluationMode.value) {
    evaluationMode.value = true
  } else {
    // Al presionar "Guardar", se guardan todas las cards en edición
    evaluationCards.value.forEach((card) => {
      if (!card.locked) {
        saveCard(card)
      }
    })
    evaluationMode.value = false
  }
}

// Al seleccionar un alumno se agrega al array (evitando duplicados)
const selectStudent = (student) => {
  const exists = selectedStudents.value.some((s) => s.id === student.id)
  if (!exists) {
    selectedStudents.value.push(student)
  }
}

// Retorna el grupo de alumnos ordenado alfabéticamente
const sortedStudents = (group) => {
  return group.slice().sort((a, b) => a.name.localeCompare(b.name))
}

// Crea una nueva card de evaluación usando los alumnos seleccionados y limpia el array
const createEvaluationCard = () => {
  if (selectedStudents.value.length === 0) return
  const newCard = {
    id: Date.now(),
    group: [...selectedStudents.value],
    contentTitle: "",
    contentSubtitle: "",
    indicators: [],
    locked: false,
  }
  evaluationCards.value.push(newCard)
  activeCard.value = newCard
  selectedStudents.value = []
  return newCard
}

// Maneja la selección de un indicador desde el menú recursivo
// parentChain es un array con los títulos de cada nivel (por ejemplo, [Contenido, Tema])
const handleContentSelection = (item, parentChain) => {
  if (!evaluationMode.value) return

  if (!activeCard.value || activeCard.value.locked) {
    activeCard.value = createEvaluationCard()
  }
  const card = activeCard.value

  // Se asignan el título y subtítulo según el parentChain e indicador
  if (parentChain && parentChain.length >= 2) {
    card.contentTitle = parentChain[0]
    card.contentSubtitle = parentChain[1] + " - " + item.title
  } else {
    card.contentTitle = parentChain ? parentChain[0] : ""
    card.contentSubtitle = item.title
  }

  // Genera un nombre único para el indicador
  const uniqueId = generateUniqueName(item, card)
  const newIndicator = {
    uniqueId,
    label: item.title,
    score: 0,
    selectedStudents: card.group,
  }
  const exists = card.indicators.find((ind) => ind.uniqueId === uniqueId)
  if (exists) {
    newIndicator.uniqueId = uniqueId + "_" + globalGroupCounter++
  }
  card.indicators.push(newIndicator)
}

// Genera un nombre único combinando la fecha, el contenido, grupo e indicador
const generateUniqueName = (item, card) => {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const year = now.getFullYear()
  const groupId = card.group.length ? card.group[0].id : "group"
  return `${day}${month}${year}_${card.contentTitle.toLowerCase().replace(/\s+/g, "_")}_${groupId}_${item.title.toLowerCase().replace(/\s+/g, "_")}`
}

// Alterna el modo de edición en una card: si está bloqueada, se vuelve a habilitar, y viceversa
const toggleCardEdit = (card) => {
  if (card.locked) {
    card.locked = false
  } else {
    saveCard(card)
  }
}

// Simula la acción de guardar la card (donde se llamarían los métodos CRUD del store de Pinia)
const saveCard = (card) => {
  card.locked = true
  alert(`Guardado: Evaluación de ${card.contentSubtitle}`)
}

// Elimina una card de evaluación
const deleteCard = (card) => {
  const index = evaluationCards.value.findIndex((c) => c.id === card.id)
  if (index !== -1) {
    evaluationCards.value.splice(index, 1)
    alert("Evaluación eliminada")
  }
}
</script>

<style scoped>
/* Los estilos se basan en Tailwind CSS; se pueden agregar reglas personalizadas si se requiere */
</style>
