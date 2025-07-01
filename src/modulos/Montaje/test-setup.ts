// src/modulos/Montaje/test-setup.ts
import {vi} from "vitest"
import {config} from "@vue/test-utils"
import {createPinia} from "pinia"

// Mock global de Firebase
vi.mock("@/firebase/config", () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        onSnapshot: vi.fn(),
      })),
      where: vi.fn(() => ({
        get: vi.fn(),
      })),
      orderBy: vi.fn(() => ({
        get: vi.fn(),
      })),
      limit: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
  },
  auth: {
    currentUser: {
      uid: "test-user-id",
      email: "test@example.com",
    },
  },
}))

// Mock de servicios de Firebase
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: () => ({toDate: () => new Date()}),
    fromDate: (date: Date) => ({toDate: () => date}),
  },
}))

// Mock de Vue Router
vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router")
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      currentRoute: {
        value: {
          params: {id: "test-obra-id"},
          query: {},
          path: "/montaje/test-obra-id",
        },
      },
    }),
    useRoute: () => ({
      params: {id: "test-obra-id"},
      query: {},
      path: "/montaje/test-obra-id",
    }),
  }
})

// Mock de composables globales
vi.mock("@/composables/useAuth", () => ({
  useAuth: () => ({
    user: {
      value: {
        uid: "test-user-id",
        email: "test@example.com",
        displayName: "Test User",
      },
    },
    isAuthenticated: {value: true},
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

// Configuración global de Vue Test Utils
config.global.plugins = [createPinia()]
config.global.mocks = {
  $t: (msg: string) => msg, // Mock de i18n
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
  },
  $route: {
    params: {id: "test-obra-id"},
    query: {},
    path: "/montaje/test-obra-id",
  },
}

// Stubs globales para componentes complejos
config.global.stubs = {
  transition: false,
  "router-link": false,
  "router-view": false,
}

// Mock de utilidades de notificaciones
vi.mock("@/utils/notifications", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

// Mock de validaciones
vi.mock("@/utils/validators", () => ({
  isValidEmail: vi.fn(() => true),
  isValidPhone: vi.fn(() => true),
  validateRequired: vi.fn(() => ({isValid: true, message: ""})),
}))

// Datos de prueba comunes
export const mockObra = {
  id: "obra-test-1",
  titulo: "Sinfonía de Prueba",
  compositor: "Compositor Test",
  descripcion: "Una obra para testing",
  duracionEstimada: 3600,
  nivelDificultad: 3,
  fechaCreacion: new Date("2024-01-01"),
  fechaModificacion: new Date("2024-01-15"),
  metadatos: {
    totalCompases: 120,
    progresoPorcentaje: 65,
    instrumentos: ["Violín", "Piano", "Flauta"],
    observacionesGenerales: "Obra de nivel intermedio",
  },
}

export const mockCompases = [
  {
    numero: 1,
    estado: "COMPLETADO",
    observaciones: "Primera sección completa",
    fechaModificacion: new Date("2024-01-10"),
  },
  {
    numero: 2,
    estado: "EN_PROGRESO",
    observaciones: "Trabajando en dinámica",
    fechaModificacion: new Date("2024-01-12"),
  },
  {
    numero: 3,
    estado: "NO_TRABAJADO",
    observaciones: "",
    fechaModificacion: null,
  },
  {
    numero: 4,
    estado: "CON_DIFICULTAD",
    observaciones: "Problemas de entonación",
    fechaModificacion: new Date("2024-01-14"),
  },
]

export const mockStudents = [
  {
    id: "student-1",
    nombre: "Ana García",
    apellido: "García",
    email: "ana@test.com",
    instrumento: "Violín",
    nivel: "Intermedio",
    fechaIngreso: new Date("2023-09-01"),
  },
  {
    id: "student-2",
    nombre: "Carlos López",
    apellido: "López",
    email: "carlos@test.com",
    instrumento: "Piano",
    nivel: "Avanzado",
    fechaIngreso: new Date("2023-08-15"),
  },
  {
    id: "student-3",
    nombre: "María Rodríguez",
    apellido: "Rodríguez",
    email: "maria@test.com",
    instrumento: "Flauta",
    nivel: "Principiante",
    fechaIngreso: new Date("2023-10-01"),
  },
]

export const mockClasses = [
  {
    id: "class-1",
    nombre: "Orquesta Juvenil",
    descripcion: "Orquesta para estudiantes intermedios",
    horario: "Martes 18:00-20:00",
    estudiantes: ["student-1", "student-3"],
    profesor: "prof-1",
  },
  {
    id: "class-2",
    nombre: "Piano Avanzado",
    descripcion: "Clase individual de piano nivel avanzado",
    horario: "Jueves 19:00-20:00",
    estudiantes: ["student-2"],
    profesor: "prof-2",
  },
]

// Utilidades de test
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

export const createMockStore = () => {
  const pinia = createPinia()
  return pinia
}

export const mockFirestoreData = {
  obras: new Map([["obra-test-1", mockObra]]),
  compases: new Map([["obra-test-1", mockCompases]]),
  students: mockStudents,
  classes: mockClasses,
}

// Función para resetear todos los mocks
export const resetAllMocks = () => {
  vi.clearAllMocks()
}

// Función para esperar que termine el DOM
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

console.log("✅ Test setup para módulo Montaje cargado correctamente")
