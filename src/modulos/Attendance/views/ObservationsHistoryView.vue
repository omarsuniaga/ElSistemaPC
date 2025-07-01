<template>
  <div class="observations-history-view min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Historial de Observaciones
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Revisa y gestiona todas las observaciones registradas en las clases
        </p>
      </div>
    </div>

    <!-- Main content -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <ObservationsHistoryTable :teacher-filter="isTeacher ? currentUserId : undefined" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import ObservationsHistoryTable from "../components/ObservationsHistoryTable.vue"
import {useAuthStore} from "../../../stores/auth"
import {useTeachersStore} from "../../Teachers/store/teachers"

const authStore = useAuthStore()
const teachersStore = useTeachersStore()

// Determine if current user is a teacher or admin
const isTeacher = computed(() => {
  return authStore.user?.role === "teacher"
})

const isAdmin = computed(() => {
  return authStore.user?.role === "admin"
})

// Get current user ID (UID or teacher ID)
const currentUserId = computed(() => {
  if (!authStore.user) return ""

  const teacherId = authStore.user.uid
  const teacher = teachersStore.getTeacherByAuthUid(teacherId)

  // If teacher found in store, use that ID
  if (teacher) return teacher.id

  // Fall back to auth UID
  return teacherId
})
</script>
