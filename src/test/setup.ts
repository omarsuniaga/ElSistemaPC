import {vi, beforeEach} from "vitest"
import {config} from "@vue/test-utils"
import {createPinia, setActivePinia} from "pinia"

// --- Firebase Mocking ---
// This mock is now more complete to satisfy the imports in the app's source code.
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getFirestore: vi.fn(),
    initializeFirestore: vi.fn(),
    persistentLocalCache: vi.fn(),
    persistentMultipleTabManager: vi.fn(),
  }
})

vi.mock("@/firebase/config", () => ({
  auth: {currentUser: null},
  db: {},
  storage: {},
}))

// --- Pinia Setup ---
beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
})

// --- Vue Router Mock ---
vi.mock("vue-router", () => ({
  createRouter: vi.fn(() => ({beforeEach: vi.fn()})),
  createWebHistory: vi.fn(),
  useRouter: vi.fn(() => ({push: vi.fn(), replace: vi.fn()})),
  useRoute: vi.fn(() => ({params: {}, query: {}})),
}))

// --- Global Mocks & Cleanup ---
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

config.global.mocks = {
  $t: (key) => key, // Mock i18n
}

// Mock Pinia
vi.mock("pinia", () => ({
  defineStore: vi.fn(() => vi.fn()),
  createPinia: vi.fn(),
  setActivePinia: vi.fn(),
}))

// Mock Vue Router
vi.mock("vue-router", () => ({
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
    path: "/",
    name: "home",
  })),
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal("localStorage", localStorageMock)

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal("sessionStorage", sessionStorageMock)

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
})

// Configure Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key, // Mock i18n
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  },
  $route: {
    params: {},
    query: {},
    path: "/",
    name: "home",
  },
}
