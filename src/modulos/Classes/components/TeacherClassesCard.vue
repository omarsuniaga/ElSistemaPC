<template>
  <!-- Your existing template code -->

  <!-- Replace the RouterLink that's causing the error with a regular button -->
  <!-- Look for something like this in the file: -->
  <RouterLink
    :to="{ name: 'AddStudentToClass', params: { classId: class.id } }"
    class="w-full flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
  >
    <!-- ...content... -->
  </RouterLink>

  <!-- Replace it with this button: -->
  <button
    class="w-full flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
    @click="handleAddStudent(class.id)"
  >
    <!-- Keep the same content that was inside the RouterLink -->
    <!-- Example: -->
    <PlusIcon class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
    <span>Añadir estudiante</span>
  </button>

  <!-- Your existing template code -->
</template>

<script>
export default {
  // Your existing script code

  methods: {
    // Your existing methods

    handleAddStudent(classId) {
      alert(
        "Esta función será implementada próximamente. Por ahora, utilice la interfaz de administración de estudiantes para añadir nuevos estudiantes a la clase."
      )
    },
  },
}
</script>

<style>
/* Your existing styles */
</style>
