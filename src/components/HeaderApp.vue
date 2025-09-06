<template>
  <header
    v-if="authStore.isLoggedIn"
    class="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50"
  >
    <div class="flex items-center justify-between px-4 py-2">
      <div class="flex items-center">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">El Sistema PC</h1>
      </div>

      <div class="flex items-center space-x-4">
        <!-- Botón de tema oscuro/claro -->
        <button
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          title="Cambiar tema"
          @click="toggleTheme"
        >
          <MoonIcon v-if="!isDarkMode" class="h-6 w-6 text-gray-600 dark:text-gray-300" />
          <SunIcon v-else class="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>

        <!-- Botón SuperAdmin (solo para admin/director) -->
        <button
          v-if="isAdminOrDirector"
          class="p-2 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full"
          title="Panel de Administración"
          @click="goToSuperAdmin"
        >
          <CogIcon class="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </button>

        <!-- NUEVO: Botón Módulo Musical -->
        <button
          v-if="canAccessMontaje"
          class="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full relative"
          title="Sistema Musical"
          @click="toggleMontajeModule"
        >
          <span class="text-xl">🎼</span>
          <span
            v-if="isMontajeActive"
            class="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
          />
        </button>
        <!-- Buscador -->
        <button
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          title="Buscar estudiantes"
          @click="toggleSearch"
        >
          <MagnifyingGlassIcon class="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>

        <!-- Menú de opciones -->
        <div class="relative">
          <button
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            @click="toggleMenu"
          >
            <EllipsisVerticalIcon class="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>

          <!-- Menú desplegable -->
          <div
            v-if="showMenu"
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
          >
            <a
              class="block px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              @click="navigateToProfile"
            >
              <UserIcon class="inline-block h-5 w-5 mr-2" />
              Perfil
            </a>
            <router-link
              to="/settings"
              class="block px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Cog6ToothIcon class="inline-block h-5 w-5 mr-2" />
              Ajustes
            </router-link>
            <button
              class="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="handleLogout"
            >
              <ArrowRightOnRectangleIcon class="inline-block h-5 w-5 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Barra de búsqueda -->
    <div
      v-if="showSearch"
      class="px-4 py-2 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="relative">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Buscar estudiantes (mínimo 3 caracteres)..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @input="handleSearch"
        />
        <MagnifyingGlassIcon class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />

        <!-- Mensaje cuando se necesitan más caracteres -->
        <div
          v-if="searchQuery.length > 0 && searchQuery.length < 3"
          class="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg p-3 z-10 border border-gray-200 dark:border-gray-700"
        >
          <p class="text-gray-600 dark:text-gray-400 text-sm text-center">
            Escribe al menos 3 caracteres para buscar
          </p>
        </div>

        <!-- Mensaje cuando no hay resultados -->

        <!-- Resultados de búsqueda -->
        <div
          v-if="searchQuery.length >= 3"
          class="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-80 overflow-y-auto z-10 search-results border border-gray-200 dark:border-gray-700"
        >
          <div
            v-if="searchLoading"
            class="px-4 py-3 text-center text-gray-600 dark:text-gray-400"
          >
            <div
              class="inline-block animate-spin mr-2 h-4 w-4 border-t-2 border-blue-500 rounded-full"
            />
            <span>Buscando estudiantes...</span>
          </div>

          <div
            v-else-if="searchResults.length === 0 && searchQuery.length >= 3"
            class="px-4 py-3 text-center text-gray-600 dark:text-gray-400"
          >
            <ExclamationCircleIcon class="h-5 w-5 mx-auto mb-1" />
            <p>No se encontraron estudiantes</p>
          </div>

          <div v-else>
            <div
              class="p-2 bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400"
            >
              {{ searchResults.length }} resultado{{
                searchResults.length !== 1 ? "s" : ""
              }}
              encontrado{{ searchResults.length !== 1 ? "s" : "" }}
            </div>
            <div
              v-for="student in searchResults"
              :key="student.id"
              class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center border-b border-gray-200 dark:border-gray-700"
              @click="showStudentDetails(student)"
            >
              <img
                :src="
                  student.photoURL ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    student.nombre || ''
                  )}+${encodeURIComponent(student.apellido || '')}&background=random`
                "
                :alt="`${student.nombre || ''} ${student.apellido || ''}`"
                class="w-10 h-10 rounded-full mr-3 object-cover"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ student.nombre || "" }} {{ student.apellido || "" }}
                </p>
                <div class="flex items-center text-xs">
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ student.instrumento || "Estudiante" }}
                  </span>
                  <span
                    v-if="student.grado"
                    class="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-xs"
                  >
                    {{ student.grado }}
                  </span>
                </div>
              </div>
              <ChevronRightIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Modal de detalles del estudiante -->
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        <!-- Header del modal -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white relative">
          <button
            class="absolute right-4 top-4 text-white hover:text-gray-200"
            @click="closeModal"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
          <h3 class="text-xl font-bold mb-1">Detalles Estudiante</h3>
          <p class="text-sm text-blue-100">ID: {{ selectedStudent?.id }}</p>
        </div>

        <!-- Contenido del modal -->
        <div v-if="selectedStudent" class="p-4">
          <div class="flex items-center mb-4">
            <img
              :src="
                selectedStudent.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  selectedStudent.nombre || ''
                )}+${encodeURIComponent(
                  selectedStudent.apellido || ''
                )}&background=random&size=128`
              "
              :alt="`${selectedStudent.nombre || ''} ${selectedStudent.apellido || ''}`"
              class="w-20 h-20 rounded-full mr-4 object-cover border-2 border-gray-200 dark:border-gray-600"
            />
            <div>
              <h4 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ selectedStudent.nombre || "" }} {{ selectedStudent.apellido || "" }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ selectedStudent.email || "No hay email registrado" }}
              </p>
              <div class="mt-1 flex items-center">
                <AcademicCapIcon class="h-4 w-4 text-gray-600 dark:text-gray-400 mr-1" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ selectedStudent.instrumento || "Instrumento no asignado" }}
                </span>
                <span
                  v-if="selectedStudent.grado"
                  class="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs"
                >
                  {{ selectedStudent.grado }}
                </span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <PhoneIcon class="h-4 w-4 text-gray-600 dark:text-gray-400 mr-1" />
                <p class="text-xs text-gray-600 dark:text-gray-400">Teléfono</p>
              </div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ selectedStudent.telefono || "No registrado" }}
              </p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p class="text-xs text-gray-600 dark:text-gray-400">Fecha de Inscripción</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatDate(selectedStudent.fechaInscripcion) }}
              </p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <ClockIcon class="h-4 w-4 text-gray-600 dark:text-gray-400 mr-1" />
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Última Modificación
                </p>
              </div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{
                  formatDate(
                    selectedStudent.updatedAt || selectedStudent.fechaModificacion
                  )
                }}
              </p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <BookOpenIcon class="h-4 w-4 text-gray-600 dark:text-gray-400 mr-1" />
                <p class="text-xs text-gray-600 dark:text-gray-400">Clases Registradas</p>
              </div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ studentClasses.length }}
                {{ studentClasses.length === 1 ? "clase" : "clases" }}
              </p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg col-span-2">
              <p class="text-xs text-gray-600 dark:text-gray-400">Dirección</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ selectedStudent.direccion || "No registrada" }}
              </p>
            </div>
          </div>

          <!-- Lista de clases registradas -->
          <div v-if="studentClasses.length > 0" class="mb-4">
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clases Inscritas:
            </h5>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <div
                v-for="clase in studentClasses"
                :key="clase.id"
                class="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md"
              >
                <div class="flex items-center">
                  <AcademicCapIcon
                    class="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2"
                  />
                  <span class="text-sm font-medium text-blue-900 dark:text-blue-100">{{
                    clase.nombre
                  }}</span>
                </div>
                <span class="text-xs text-blue-600 dark:text-blue-400">
                  {{ clase.horario?.dia }} {{ clase.horario?.horaInicio }}
                </span>
              </div>
            </div>
          </div>

          <div
            class="flex justify-between items-center mt-4 border-t border-gray-200 dark:border-gray-600 pt-4"
          >
            <!-- Botón de eliminar a la izquierda -->
            <button
              v-if="isAdminOrDirector"
              class="px-4 py-2 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
              @click="confirmDeleteStudent"
            >
              <TrashIcon class="h-4 w-4 mr-2" />
              Eliminar
            </button>
            <div v-else></div>

            <!-- Botones de acción a la derecha -->
            <div class="flex gap-3">
              <button
                class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                @click="closeModal"
              >
                Cerrar
              </button>
              <button
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                @click="navigateToStudentProfile(selectedStudent.id)"
              >
                Ver Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal de confirmación para eliminar estudiante -->
  <Teleport to="body">
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div class="p-6">
          <div class="flex items-center mb-4">
            <ExclamationCircleIcon class="h-8 w-8 text-red-600 mr-3" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Confirmar Eliminación
            </h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            ¿Estás seguro de que deseas eliminar al estudiante
            <strong>{{ selectedStudent?.nombre }} {{ selectedStudent?.apellido }}</strong
            >? Esta acción no se puede deshacer.
          </p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              @click="cancelDelete"
            >
              Cancelar
            </button>
            <button
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
              @click="deleteStudent"
            >
              <TrashIcon class="h-4 w-4 mr-2" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";

import {
  MagnifyingGlassIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  TrashIcon,
  PhoneIcon,
  ClockIcon,
  BookOpenIcon,
} from "@heroicons/vue/24/outline";

import { useAuthStore } from "../stores/auth";
import { useTheme } from "../composables/useTheme";
import { useStudentsStore } from "../modulos/Students/store/students";
import { useClassesStore } from "../stores/classes";
import { moduleManager } from "../modulos/Montaje/core/ModuleManager";
import type { Student } from "../modulos/Students/types/student";

const router = useRouter();
const authStore = useAuthStore();
const studentsStore = useStudentsStore();
const classesStore = useClassesStore();
const { isDarkMode, toggleTheme: switchTheme } = useTheme();

// Estado para menús y búsqueda
const showMenu = ref(false);
const showSearch = ref(false);
const searchQuery = ref("");
const searchResults = ref<Student[]>([]);
const searchLoading = ref(false);
const searchTimeout = ref<number | null>(null);

// AGREGAR: Estado para el sistema de módulos
const isMontajeActive = ref(false);

// Estado para el modal de detalles
const showModal = ref(false);
const selectedStudent = ref<Student | null>(null);
const showDeleteConfirm = ref(false);
const studentClasses = ref<
  Array<{ id: string; nombre: string; horario?: { dia: string; horaInicio: string } }>
>([]);

// Referencia al input de búsqueda
const searchInput = ref<HTMLInputElement | null>(null);

// AGREGAR: Computed para verificar acceso al módulo Montaje
const canAccessMontaje = computed(() => {
  const user = moduleManager.getCurrentUser();
  return user && moduleManager.hasPermissions(["montaje:access"]);
});

// Funciones para menús
const toggleMenu = () => {
  showMenu.value = !showMenu.value;
  if (showMenu.value) showSearch.value = false;
};

const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (showSearch.value) {
    showMenu.value = false;
    searchQuery.value = "";
    // Inicializar la carga de estudiantes si no lo están ya
    if (studentsStore.students.length === 0) {
      loadStudents();
    }
    
    // Enfocar el input de búsqueda después de que se renderice
    nextTick(() => {
      if (searchInput.value) {
        searchInput.value.focus();
      }
    });
  } else {
    searchResults.value = [];
    searchQuery.value = "";
  }

  // Emitir evento para ajustar el espaciado en la aplicación principal
  document.body.classList.toggle("header-has-search", showSearch.value);
};

const toggleTheme = async () => {
  switchTheme();
};

// Cargar estudiantes
const loadStudents = async () => {
  try {
    searchLoading.value = true;
    await studentsStore.fetchStudents();
    searchLoading.value = false;
  } catch (error) {
    console.error("Error al cargar estudiantes:", error);
    searchLoading.value = false;
  }
};

// Observar cambios en la búsqueda para implementar debounce
watch(searchQuery, (newQuery) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  if (newQuery.length >= 3) {
    searchLoading.value = true;
    searchTimeout.value = (setTimeout(() => {
      handleSearch();
    }, 300) as unknown) as number;
  } else {
    searchResults.value = [];
    searchLoading.value = false;
  }
});

// Función de búsqueda mejorada
const handleSearch = () => {
  if (searchQuery.value.length < 3) {
    searchResults.value = [];
    searchLoading.value = false;
    return;
  }

  const query = searchQuery.value.toLowerCase().trim();

  // Si no hay estudiantes cargados, iniciar carga
  if (studentsStore.students.length === 0) {
    loadStudents().then(() => performSearch(query));
    return;
  }

  performSearch(query);
};

// Función para normalizar texto (quitar acentos y convertir a minúsculas)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .trim();
};

// Realizar la búsqueda con la query
const performSearch = (query: string) => {
  const normalizedQuery = normalizeText(query);
  
  searchResults.value = studentsStore.students
    .filter((student) => {
      // Normalizar todos los campos de búsqueda
      const searchableFields = [
        normalizeText(student.nombre || ""),
        normalizeText(student.apellido || ""),
        normalizeText(student.instrumento || ""),
        normalizeText(student.email || ""),
        normalizeText(student.grupo || ""),
        normalizeText(`${student.nombre || ""} ${student.apellido || ""}`),
        normalizeText(student.id || ""), // Agregar búsqueda por ID
        normalizeText(student.telefono || ""), // Agregar búsqueda por teléfono
      ];

      // Buscar en cualquier campo
      return searchableFields.some(field => field.includes(normalizedQuery));
    })
    .sort((a, b) => {
      // Ordenar por relevancia: primero los que empiezan con la consulta
      const nameA = normalizeText(`${a.nombre || ""} ${a.apellido || ""}`);
      const nameB = normalizeText(`${b.nombre || ""} ${b.apellido || ""}`);
      const idA = normalizeText(a.id || "");
      const idB = normalizeText(b.id || "");

      // Prioridad 1: ID exacto
      if (idA === normalizedQuery && idB !== normalizedQuery) return -1;
      if (idA !== normalizedQuery && idB === normalizedQuery) return 1;
      
      // Prioridad 2: ID que empiece con la query
      if (idA.startsWith(normalizedQuery) && !idB.startsWith(normalizedQuery)) return -1;
      if (!idA.startsWith(normalizedQuery) && idB.startsWith(normalizedQuery)) return 1;
      
      // Prioridad 3: Nombre que empiece con la query
      if (nameA.startsWith(normalizedQuery) && !nameB.startsWith(normalizedQuery)) return -1;
      if (!nameA.startsWith(normalizedQuery) && nameB.startsWith(normalizedQuery)) return 1;

      // Luego ordenar alfabéticamente por nombre
      return nameA.localeCompare(nameB);
    })
    .slice(0, 20); // Limitar a 20 resultados para mejorar el rendimiento

  searchLoading.value = false;
};

// Mostrar detalles del estudiante en modal
const showStudentDetails = async (student: Student) => {
  selectedStudent.value = student;
  showModal.value = true;

  // Cargar clases del estudiante
  await loadStudentClasses(student.id);
};

// Cargar clases del estudiante
const loadStudentClasses = async (studentId: string) => {
  try {
    await classesStore.fetchClasses();
    studentClasses.value = classesStore.classes.filter(
      (clase) => clase.alumnos && clase.alumnos.includes(studentId)
    );
  } catch (error) {
    console.error("Error al cargar clases del estudiante:", error);
    studentClasses.value = [];
  }
};

// Cerrar modal
const closeModal = () => {
  showModal.value = false;
  selectedStudent.value = null;
  studentClasses.value = [];
};

// Confirmar eliminación de estudiante
const confirmDeleteStudent = () => {
  showDeleteConfirm.value = true;
};

// Cancelar eliminación
const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

// Eliminar estudiante
const deleteStudent = async () => {
  try {
    if (selectedStudent.value) {
      await studentsStore.deleteStudent(selectedStudent.value.id);
      showDeleteConfirm.value = false;
      closeModal();

      // Actualizar resultados de búsqueda
      if (searchQuery.value.length >= 3) {
        handleSearch();
      }
    }
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    alert("Error al eliminar el estudiante. Por favor, inténtalo de nuevo.");
  }
};

// Navegar al perfil completo del estudiante
const navigateToStudentProfile = (studentId: string) => {
  showSearch.value = false;
  searchQuery.value = "";
  searchResults.value = [];
  showModal.value = false;
  router.push(`/students/${studentId}`);
};

// Formatear fecha para mostrar en el modal
const formatDate = (dateString: string) => {
  if (!dateString) return "No registrada";

  try {
    const date =
      typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return "Fecha inválida";
    return format(date, "dd/MM/yyyy", { locale: es });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "Fecha inválida";
  }
};

// Navegar al perfil según rol

const navigateToProfile = () => {
  showMenu.value = false;

  // Navegar según el rol del usuario
  if (authStore.user?.role === "Maestro") {
    router.push("/teacher/profile");
  } else {
    router.push("/profile");
  }
};

// Cerrar sesión
const handleLogout = async () => {
  try {
    await authStore.signOut();
    router.push("/login");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};

// Computed para verificar si es admin o director
const isAdminOrDirector = computed(() => {
  const role = authStore.user?.role;
  return (
    role === "admin" || role === "director" || role === "Admin" || role === "Director"
  );
});

// Función para ir al SuperAdmin
const goToSuperAdmin = () => {
  showMenu.value = false;
  router.push("/admin");
};

// AGREGAR: Función para alternar el módulo Montaje
const toggleMontajeModule = () => {
  showMenu.value = false;
  try {
    if (isMontajeActive.value) {
      // Si ya está activo, volver al sistema principal
      router.push("/");
      isMontajeActive.value = false;
    } else {
      // Activar el módulo Montaje
      moduleManager.activateModule("montaje");
      router.push("/montaje");
      isMontajeActive.value = true;
    }
  } catch (error) {
    console.error("Error al alternar módulo Montaje:", error);
  }
};

// Cerrar menús al hacer clic fuera
const closeMenus = (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  // No cerrar si se hace clic en el modal
  if (target.closest(".fixed.inset-0")) {
    return;
  }

  // No cerrar si se hace clic en la barra de búsqueda o en el botón de búsqueda
  if (
    target.closest(".MagnifyingGlassIcon") ||
    target.closest('input[type="text"]') ||
    target.closest('button[title="Buscar estudiantes"]')
  ) {
    return;
  }

  // Cerrar menú si hace clic fuera
  if (!target.closest(".relative")) {
    showMenu.value = false;
  }

  // Cerrar búsqueda si hace clic fuera y no en los resultados
  if (
    !target.closest(".relative") &&
    !target.closest(".search-results") &&
    !target.closest('input[type="text"]') &&
    !target.closest('button[title="Buscar estudiantes"]')
  ) {
    showSearch.value = false;
  }
};

// Manejar tecla Escape para cerrar modal y búsqueda
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    if (showModal.value) {
      closeModal();
    } else if (showSearch.value) {
      showSearch.value = false;
      searchQuery.value = "";
    }
  }
};

onMounted(() => {
  document.addEventListener("click", closeMenus);
  document.addEventListener("keydown", handleKeyDown);

  // Precargar estudiantes si hay una sesión activa
  if (authStore.isLoggedIn && studentsStore.students.length === 0) {
    loadStudents();
  }
});

onUnmounted(() => {
  document.removeEventListener("click", closeMenus);
  document.removeEventListener("keydown", handleKeyDown);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style scoped>
.search-results {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
