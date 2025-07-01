<template>
  <div class="shared-classes-list">
    <!-- Header -->
    <div
      class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
    >
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Clases Compartidas</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las clases que has compartido con otros maestros y las que han compartido
            contigo
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Filtro rápido -->
          <select
            v-model="filterType"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Todas las compartidas</option>
            <option value="owned">Mis clases compartidas</option>
            <option value="shared-with-me">Compartidas conmigo</option>
          </select>

          <!-- Botón compartir nueva clase -->
          <button
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            @click="showShareDialog = true"
          >
            <ShareIcon class="h-5 w-5 mr-2" />
            Compartir Clase
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center">
            <ShareIcon class="h-5 w-5 text-purple-500 mr-2" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Total Compartidas</span
            >
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {{ filteredSharedClasses.length }}
          </p>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center">
            <UserIcon class="h-5 w-5 text-green-500 mr-2" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Mis Clases</span>
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {{ ownedSharedClasses.length }}
          </p>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center">
            <UsersIcon class="h-5 w-5 text-blue-500 mr-2" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Compartidas Conmigo</span
            >
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {{ sharedWithMeClasses.length }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Empty state -->
      <div v-if="filteredSharedClasses.length === 0" class="text-center py-12">
        <div
          class="mx-auto h-24 w-24 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4"
        >
          <ShareIcon class="h-12 w-12 text-purple-500" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ getEmptyStateTitle() }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {{ getEmptyStateDescription() }}
        </p>
        <button
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          @click="showShareDialog = true"
        >
          <ShareIcon class="mr-2 h-4 w-4" />
          Compartir Mi Primera Clase
        </button>
      </div>
      <!-- Classes grid -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="classItem in filteredSharedClasses"
          :key="classItem.id"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
        >
          <!-- Card Header -->
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {{ classItem.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {{ classItem.description || "Sin descripción" }}
                </p>
              </div>

              <!-- Class Owner Badge -->
              <div class="ml-3 flex-shrink-0">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    isClassOwner(classItem)
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
                  ]"
                >
                  <UserIcon class="w-3 h-3 mr-1" />
                  {{ isClassOwner(classItem) ? "Propietario" : "Invitado" }}
                </span>
              </div>
            </div>

            <!-- Class Info -->
            <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div class="flex items-center text-gray-600 dark:text-gray-400">
                <MusicalNoteIcon class="h-4 w-4 mr-2" />
                <span>{{ classItem.instrument || "Sin instrumento" }}</span>
              </div>
              <div class="flex items-center text-gray-600 dark:text-gray-400">
                <AcademicCapIcon class="h-4 w-4 mr-2" />
                <span>{{ getProgramName(classItem.level) }}</span>
              </div>
              <div class="flex items-center text-gray-600 dark:text-gray-400">
                <UsersIcon class="h-4 w-4 mr-2" />
                <span>{{ classItem.studentIds?.length || 0 }} estudiantes</span>
              </div>
              <div class="flex items-center text-gray-600 dark:text-gray-400">
                <ShareIcon class="h-4 w-4 mr-2" />
                <span>{{ classItem.teachers?.length || 0 }} maestros</span>
              </div>
            </div>
          </div>

          <!-- Shared Teachers List -->
          <div class="p-4 bg-gray-50 dark:bg-gray-900/50">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Maestros con Acceso
            </h4>

            <div
              v-if="getSharedTeachers(classItem).length === 0"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              Solo el propietario tiene acceso
            </div>
            <div v-else class="space-y-2 max-h-32 overflow-y-auto">
              <template
                v-for="teacher in getSharedTeachers(classItem)"
                :key="teacher?.id || 'unknown'"
              >
                <div
                  v-if="teacher"
                  class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center"
                    >
                      <UserIcon class="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ teacher.name || "Maestro sin nombre" }}
                    </span>
                  </div>

                  <div class="flex items-center space-x-2">
                    <!-- Permission Badge -->
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getPermissionBadgeColor(
                          getTeacherPermissions(
                            classItem,
                            typeof teacher.id === 'string' ? teacher.id : ''
                          )
                        ),
                      ]"
                    >
                      {{
                        getPermissionText(
                          getTeacherPermissions(
                            classItem,
                            typeof teacher.id === "string" ? teacher.id : ""
                          )
                        )
                      }}
                    </span>
                    <!-- Actions -->
                    <button
                      v-if="isClassOwner(classItem)"
                      class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Editar permisos"
                      @click="editTeacherPermissions(classItem, teacher)"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex space-x-2">
                <button
                  class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  @click="$emit('view-schedule', classItem)"
                >
                  <CalendarIcon class="h-4 w-4 mr-2" />
                  Ver Horario
                </button>

                <button
                  v-if="canEditClass(classItem)"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  @click="$emit('edit', classItem)"
                >
                  <PencilIcon class="h-4 w-4 mr-2" />
                  Editar
                </button>
              </div>

              <button
                v-if="isClassOwner(classItem)"
                class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                @click="manageClassSharing(classItem)"
              >
                <CogIcon class="h-4 w-4 mr-2" />
                Gestionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Share Class Dialog -->
    <ShareClassDialog
      :open="showShareDialog"
      :available-classes="availableClassesToShare"
      @close="showShareDialog = false"
      @share="handleShareClass"
    />
    <!-- Manage Permissions Dialog -->
    <ManagePermissionsDialog
      :open="showPermissionsDialog"
      :class-data="selectedClass"
      :teacher="selectedTeacher"
      @close="closePermissionsDialog"
      @save="handleUpdatePermissions"
      @remove="handleRemoveAccess"
    />

    <!-- Manage Class Sharing Dialog -->
    <!-- TODO: Implement ManageClassSharingDialog component -->
    <!--
    <ManageClassSharingDialog 
      :open="showManageSharingDialog"
      :class-data="selectedClassForSharing"
      @close="showManageSharingDialog = false"
      @update="handleUpdateSharing"
    />
    -->
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, withDefaults} from "vue"
import {useAuthStore} from "../../../stores/auth"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useClassesStore} from "../store/classes"
import type {ClassData, SharedClassPermission, ClassTeacher} from "../types/class"
import {TeacherRole} from "../types/class"
import {
  ShareIcon,
  UserIcon,
  UsersIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  CalendarIcon,
  PencilIcon,
  CogIcon,
} from "@heroicons/vue/24/outline"

// Import dialogs
import ShareClassDialog from "./ShareClassDialog.vue"
import ManagePermissionsDialog from "./ManagePermissionsDialog.vue"

interface Props {
  classes: ClassData[]
}

const props = withDefaults(defineProps<Props>(), {
  classes: () => [],
})

// Define emits
const emit = defineEmits<{
  edit: [classData: ClassData]
  "manage-permissions": [classData: ClassData, teacherId: string]
  "view-schedule": [classData: ClassData]
}>()

// Stores
const authStore = useAuthStore()
const teachersStore = useTeachersStore()
const classesStore = useClassesStore()

// Reactive data
const filterType = ref<"all" | "owned" | "shared-with-me">("all")
const showShareDialog = ref(false)
const showPermissionsDialog = ref(false)
const showManageSharingDialog = ref(false)
const selectedClass = ref<ClassData | null>(null)
const selectedTeacher = ref<any>(null)
const selectedClassForSharing = ref<ClassData | null>(null)

// Computed properties
const currentUserId = computed(() => authStore.user?.uid || "")

const sharedClasses = computed(() => {
  // Asegurar que props.classes existe y es un array
  if (!props.classes || !Array.isArray(props.classes)) {
    console.log("⚠️  No hay props.classes, usando datos demo")
    return getDemoSharedClasses()
  }

  console.log("📊 Total de clases recibidas:", props.classes.length)

  // Filtrar clases que tienen la propiedad "teachers" con elementos
  const realShared = props.classes.filter(
    (classItem) =>
      classItem &&
      classItem.teachers &&
      Array.isArray(classItem.teachers) &&
      classItem.teachers.length > 0
  )

  console.log("📚 Clases compartidas encontradas:", realShared.length)

  realShared.forEach((cls) => {
    console.log(`✅ COMPARTIDA: ${cls.name} → teachers = [${cls.teachers?.join(", ")}]`)
  })

  // Si no hay clases reales compartidas, usar demo
  if (realShared.length === 0) {
    console.log("💡 No se encontraron clases compartidas reales, usando datos demo")
    return getDemoSharedClasses()
  }

  return realShared
})

// Helper function to get demo data
const getDemoSharedClasses = (): ClassData[] => {
  return [
    {
      id: "demo-1",
      name: "Piano Intermedio - Grupo A",
      description: "Clase de piano para estudiantes de nivel intermedio",
      instrument: "Piano",
      level: "preparatoria",
      teacherId: currentUserId.value,
      studentIds: ["student1", "student2", "student3"],
      teachers: [currentUserId.value, "teacher-demo-1", "teacher-demo-2"] as any,
      permissions: {
        "teacher-demo-1": ["read", "write"],
        "teacher-demo-2": ["read"],
      },
      capacity: 8,
      status: "active" as const,
    },
    {
      id: "demo-2",
      name: "Guitarra Avanzada",
      description: "Técnicas avanzadas de guitarra clásica",
      instrument: "Guitarra",
      level: "orquesta",
      teacherId: "teacher-demo-1",
      studentIds: ["student4", "student5"],
      teachers: ["teacher-demo-1", currentUserId.value] as any,
      permissions: {
        [currentUserId.value]: ["read", "write"],
      },
      capacity: 6,
      status: "active" as const,
    },
  ]
}

const ownedSharedClasses = computed(() => {
  if (!sharedClasses.value || !Array.isArray(sharedClasses.value)) {
    return []
  }

  // Una clase es "owned" si el usuario actual está en el array teachers
  return sharedClasses.value.filter((classItem) => {
    if (!classItem || !classItem.teachers || !Array.isArray(classItem.teachers)) {
      return false
    }

    return classItem.teachers.some((teacherItem) => {
      if (typeof teacherItem === "string") {
        return teacherItem === currentUserId.value
      } else if (typeof teacherItem === "object" && teacherItem.teacherId) {
        return teacherItem.teacherId === currentUserId.value
      }
      return false
    })
  })
})

const sharedWithMeClasses = computed(() => {
  if (!sharedClasses.value || !Array.isArray(sharedClasses.value)) {
    return []
  }

  // Una clase está "shared with me" si el usuario actual está en el array teachers
  // pero no es el propietario principal (teacherId)
  return sharedClasses.value.filter((classItem) => {
    if (!classItem || !classItem.teachers || !Array.isArray(classItem.teachers)) {
      return false
    }

    const isInTeachers = classItem.teachers.some((teacherItem) => {
      if (typeof teacherItem === "string") {
        return teacherItem === currentUserId.value
      } else if (typeof teacherItem === "object" && teacherItem.teacherId) {
        return teacherItem.teacherId === currentUserId.value
      }
      return false
    })

    return isInTeachers && classItem.teacherId !== currentUserId.value
  })
})

const filteredSharedClasses = computed(() => {
  switch (filterType.value) {
    case "owned":
      return ownedSharedClasses.value
    case "shared-with-me":
      return sharedWithMeClasses.value
    default:
      return sharedClasses.value || []
  }
})

const availableClassesToShare = computed(() => {
  // Asegurar que props.classes existe y es un array
  if (!props.classes || !Array.isArray(props.classes)) {
    return []
  }

  return props.classes.filter(
    (classItem) =>
      classItem &&
      classItem.teacherId === currentUserId.value &&
      (!classItem.teachers || !Array.isArray(classItem.teachers) || classItem.teachers.length === 0)
  )
})

const teachers = computed(() => teachersStore.teachers)

// Methods
const isClassOwner = (classItem: ClassData): boolean => {
  return classItem.teacherId === currentUserId.value
}

const canEditClass = (classItem: ClassData): boolean => {
  if (isClassOwner(classItem)) return true

  const permissions = getTeacherPermissions(classItem, currentUserId.value)
  return (
    permissions.includes("write") ||
    permissions.includes("manage") ||
    permissions.includes("canEditClass")
  )
}

const getSharedTeachers = (classItem: ClassData) => {
  if (!classItem || !classItem.teachers || !Array.isArray(classItem.teachers)) {
    return []
  }

  return classItem.teachers
    .map((teacherItem) => {
      // Si teachers es un array de strings (como en Firestore)
      let teacherId: string
      if (typeof teacherItem === "string") {
        teacherId = teacherItem
      } else if (typeof teacherItem === "object" && teacherItem.teacherId) {
        // Si teachers es un array de objetos ClassTeacher
        teacherId = teacherItem.teacherId
      } else {
        return null
      }

      const teacher = teachers.value.find((t) => t && t.id === teacherId)
      // For demo purposes, create mock teacher names
      if (!teacher) {
        const demoNames = {
          "teacher-demo-1": "María González",
          "teacher-demo-2": "Carlos Rodríguez",
        }
        return {
          id: teacherId,
          name: demoNames[teacherId as keyof typeof demoNames] || "Maestro Demo",
        }
      }
      return teacher
    })
    .filter(Boolean) // Filtrar valores null/undefined
}

const getTeacherPermissions = (classItem: ClassData, teacherId: string): string[] => {
  if (!classItem || !teacherId) {
    return []
  }

  // Para la nueva estructura con teachers array
  if (classItem.teachers && Array.isArray(classItem.teachers)) {
    const teacher = classItem.teachers.find((t) => {
      if (typeof t === "string") {
        return t === teacherId
      } else if (typeof t === "object" && t.teacherId) {
        return t.teacherId === teacherId
      }
      return false
    })

    if (teacher && typeof teacher === "object" && teacher.permissions) {
      const permissions: string[] = []

      // Convertir el objeto de permisos a array de strings
      if (teacher.permissions.canAddObservations) permissions.push("canAddObservations")
      if (teacher.permissions.canTakeAttendance) permissions.push("canTakeAttendance")
      if (teacher.permissions.canViewAttendanceHistory) permissions.push("canViewAttendanceHistory")
      if (teacher.permissions.canEditClass) permissions.push("canEditClass")
      if (teacher.permissions.canManageStudents) permissions.push("canManageStudents")
      if (teacher.permissions.canManageTeachers) permissions.push("canManageTeachers")
      if (teacher.permissions.canManageSchedule) permissions.push("canManageSchedule")

      // Determinar el nivel de acceso basado en los permisos
      if (teacher.permissions.canManageTeachers && teacher.permissions.canManageSchedule) {
        permissions.push("manage")
      } else if (teacher.permissions.canEditClass || teacher.permissions.canManageStudents) {
        permissions.push("write")
      } else {
        permissions.push("read")
      }

      return permissions
    }
  }

  // Fallback para estructura legacy con permissions object
  if (classItem.permissions && classItem.permissions[teacherId]) {
    return classItem.permissions[teacherId]
  }

  return ["read"] // Permisos por defecto
}

const getPermissionText = (permissions: string[]): string => {
  if (!permissions || permissions.length === 0) return "Sin permisos"

  if (permissions.includes("manage")) return "Administrador"
  if (permissions.includes("write")) return "Editor"
  if (permissions.includes("read")) return "Solo lectura"

  return "Permisos personalizados"
}

const getPermissionBadgeColor = (permissions: string[]): string => {
  if (!permissions || permissions.length === 0) {
    return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
  }

  if (permissions.includes("manage")) {
    return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400"
  }
  if (permissions.includes("write")) {
    return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
  }
  if (permissions.includes("read")) {
    return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
  }

  return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
}

const getProgramName = (level?: string): string => {
  if (!level) return "Sin programa"
  const programs: Record<string, string> = {
    preparatoria: "Preparatoria",
    "teoria-musical": "Teoría Musical",
    coro: "Coro",
    orquesta: "Orquesta",
    otros: "Otros",
  }
  return programs[level] || level
}

const getEmptyStateTitle = (): string => {
  switch (filterType.value) {
    case "owned":
      return "No has compartido ninguna clase"
    case "shared-with-me":
      return "No tienes clases compartidas contigo"
    default:
      return "No hay clases compartidas"
  }
}

const getEmptyStateDescription = (): string => {
  switch (filterType.value) {
    case "owned":
      return "Comparte tus clases con otros maestros para colaborar en la enseñanza."
    case "shared-with-me":
      return "Cuando otros maestros compartan clases contigo, aparecerán aquí."
    default:
      return "Las clases compartidas permiten la colaboración entre maestros."
  }
}

const editTeacherPermissions = (classItem: ClassData, teacher: any) => {
  selectedClass.value = classItem
  selectedTeacher.value = teacher
  showPermissionsDialog.value = true
}

const manageClassSharing = (classItem: ClassData) => {
  selectedClassForSharing.value = classItem
  showManageSharingDialog.value = true
}

const closePermissionsDialog = () => {
  showPermissionsDialog.value = false
  selectedClass.value = null
  selectedTeacher.value = null
}

const handleShareClass = async (data: {
  classId: string
  teachers: Array<{teacherId: string; permissions: string[]}>
}) => {
  try {
    console.log("Sharing class:", data)

    // Encontrar la clase a compartir
    const classToShare = props.classes.find((c) => c.id === data.classId)
    if (!classToShare) {
      console.error("Clase no encontrada")
      return
    }

    // Preparar la lista de maestros (incluyendo los nuevos)
    const existingTeachers = classToShare.teachers || []
    const newTeachers = [...existingTeachers]

    // Agregar los nuevos maestros
    for (const teacherData of data.teachers) {
      // Verificar que el maestro no esté ya agregado
      const alreadyExists = existingTeachers.some((teacher) => {
        return typeof teacher === "string"
          ? teacher === teacherData.teacherId
          : teacher.teacherId === teacherData.teacherId
      })

      if (!alreadyExists) {
        // Determinar permisos basados en el nivel
        const permissionLevel = teacherData.permissions[0] // 'read', 'write', o 'manage'

        const permissions = {
          canTakeAttendance: true,
          canAddObservations: true,
          canViewAttendanceHistory: true,
          canEditClass: false,
          canManageTeachers: false,
          canManageStudents: false,
          canManageSchedule: false,
        }

        if (permissionLevel === "write") {
          permissions.canEditClass = true
          permissions.canManageStudents = true
        } else if (permissionLevel === "manage") {
          permissions.canEditClass = true
          permissions.canManageStudents = true
          permissions.canManageTeachers = true
          permissions.canManageSchedule = true
        }
        // Agregar como objeto ClassTeacher completo
        newTeachers.push({
          teacherId: teacherData.teacherId,
          role: TeacherRole.ASSISTANT,
          assignedAt: new Date(),
          assignedBy: currentUserId.value,
          permissions,
        } as ClassTeacher)
      }
    }

    // Actualizar la clase en Firestore
    await classesStore.updateClass(data.classId, {
      teachers: newTeachers,
      updatedAt: new Date(),
    })

    // Actualizar localmente
    const classIndex = props.classes.findIndex((c) => c.id === data.classId)
    if (classIndex !== -1) {
      props.classes[classIndex] = {
        ...props.classes[classIndex],
        teachers: newTeachers,
      }
    }

    console.log("✅ Clase compartida exitosamente")
    showShareDialog.value = false

    // Opcional: mostrar notificación de éxito
  } catch (error) {
    console.error("❌ Error compartiendo clase:", error)
    // TODO: Mostrar mensaje de error al usuario
  }
}

const handleUpdatePermissions = async (data: {
  classId: string
  teacherId: string
  permissions: {
    canAddObservations: boolean
    canEditClass: boolean
    canManageTeachers: boolean
    canTakeAttendance: boolean
    canViewAttendanceHistory: boolean
    canManageStudents: boolean
    canManageSchedule: boolean
  }
  role: string
}) => {
  try {
    console.log("Updating permissions:", data)

    if (!selectedClass.value) {
      console.error("No hay clase seleccionada")
      return
    }

    // Usar el store para actualizar permisos
    await classesStore.updateAssistantPermissions(
      data.classId,
      data.teacherId,
      data.permissions,
      currentUserId.value
    )
    // Actualizar la clase localmente
    const classIndex = props.classes.findIndex((c) => c.id === data.classId)
    if (classIndex !== -1 && props.classes[classIndex].teachers) {
      const updatedClass = {...props.classes[classIndex]}
      if (updatedClass.teachers) {
        updatedClass.teachers = updatedClass.teachers.map((teacher) => {
          const teacherId = typeof teacher === "string" ? teacher : teacher.teacherId
          if (teacherId === data.teacherId) {
            if (typeof teacher === "string") {
              // Convertir de string a ClassTeacher completo
              return {
                teacherId: teacher,
                role: TeacherRole.ASSISTANT,
                assignedAt: new Date(),
                assignedBy: currentUserId.value,
                permissions: data.permissions,
              } as ClassTeacher
            } else {
              // Actualizar ClassTeacher existente
              return {
                ...teacher,
                permissions: data.permissions,
              }
            }
          }
          return teacher
        })
      }

      // Actualizar el array de clases
      props.classes[classIndex] = updatedClass
    }

    console.log("✅ Permisos actualizados exitosamente")
    closePermissionsDialog()

    // Opcional: mostrar notificación de éxito
    // TODO: Implementar sistema de notificaciones
  } catch (error) {
    console.error("❌ Error actualizando permisos:", error)
    // TODO: Mostrar mensaje de error al usuario
  }
}

const handleRemoveAccess = async (data: {classId: string; teacherId: string}) => {
  try {
    console.log("Removing access:", data)

    if (!selectedClass.value) {
      console.error("No hay clase seleccionada")
      return
    }
    // Usar el store para remover acceso
    await classesStore.removeAssistant(data.classId, data.teacherId, currentUserId.value)

    // Actualizar la clase localmente
    const classIndex = props.classes.findIndex((c) => c.id === data.classId)
    if (classIndex !== -1 && props.classes[classIndex].teachers) {
      const updatedClass = {...props.classes[classIndex]}
      if (updatedClass.teachers) {
        updatedClass.teachers = updatedClass.teachers.filter((teacher) => {
          const teacherId = typeof teacher === "string" ? teacher : teacher.teacherId
          return teacherId !== data.teacherId
        })
      }

      // Actualizar el array de clases
      props.classes[classIndex] = updatedClass
    }

    console.log("✅ Acceso removido exitosamente")
    closePermissionsDialog()

    // Opcional: mostrar notificación de éxito
    // TODO: Implementar sistema de notificaciones
  } catch (error) {
    console.error("❌ Error removiendo acceso:", error)
    // TODO: Mostrar mensaje de error al usuario
  }
}

const handleUpdateSharing = (data: any) => {
  console.log("Updating sharing:", data)
  // TODO: Implement update sharing logic
  showManageSharingDialog.value = false
}

// Lifecycle
onMounted(async () => {
  // Load teachers if not already loaded
  if (teachers.value.length === 0) {
    await teachersStore.fetchTeachers()
  }
})
</script>

<style scoped>
.shared-classes-list {
  font-family: "Inter", sans-serif;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Scrollbar styles */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
