<!-- src/views/AdminHomeView.vue -->

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Dashboard header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-1">
          Panel de Control
        </h1>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Administra maestros, estudiantes y clases desde un solo lugar
        </p>
      </div>
      
      <!-- Quick actions -->
      <div class="mt-4 sm:mt-0 flex flex-wrap gap-2">
        <button @click="openModal('newTeacher')" class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-all duration-200 shadow-sm">
          <UserPlusIcon class="h-5 w-5 mr-1" />
          Nuevo Maestro
        </button>
        <button @click="refreshData" class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm">
          <ArrowPathIcon class="h-5 w-5 mr-1" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Teachers KPI -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4">
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
              <UserIcon class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div class="ml-4 flex-1">
              <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Maestros</h2>
              <div class="flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                  {{ teachersList.length }}
                </p>
                <p v-if="teachersList.length > 0" class="ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                  {{ Math.round((activeTeachers.length / teachersList.length) * 100) }}% activos
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3 bg-gray-50 dark:bg-gray-700/50">
          <router-link to="/teachers" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
            Ver todos los maestros
          </router-link>
        </div>
      </div>

      <!-- Students KPI -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4">
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <UsersIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="ml-4 flex-1">
              <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Estudiantes</h2>
              <div class="flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                  {{ studentsStore.students.length }}
                </p>
                <p class="ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                  {{ activeStudents.length }} activos
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3 bg-gray-50 dark:bg-gray-700/50">
          <router-link to="/students" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Ver todos los estudiantes
          </router-link>
        </div>
      </div>

      <!-- Classes KPI -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4">
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 rounded-lg bg-green-50 dark:bg-green-900/30">
              <AcademicCapIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div class="ml-4 flex-1">
              <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Clases</h2>
              <div class="flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                  {{ classesStore.classes.length }}
                </p>
                <p class="ml-2 text-xs font-medium">
                  <span class="text-green-600 dark:text-green-400">
                    {{ classesStore.classes.filter(c => c.active !== false).length }} activas
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3 bg-gray-50 dark:bg-gray-700/50">
          <router-link to="/classes" class="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
            Ver todas las clases
          </router-link>
        </div>
      </div>

      <!-- Attendance KPI -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4">
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30">
              <ClockIcon class="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div class="ml-4 flex-1">
              <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">Asistencia Promedio</h2>
              <div class="flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                  {{ attendanceRate }}%
                </p>
                <p class="ml-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Últimos 30 días
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3 bg-gray-50 dark:bg-gray-700/50">
          <router-link to="/attendance" class="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
            Ver reportes de asistencia
          </router-link>
        </div>
      </div>
    </div>

    <!-- Teacher Management -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <UserGroupIcon class="h-5 w-5 mr-2 text-gray-500" />
          Gestión de Maestros
        </h2>
        
        <!-- Teacher search & filter -->
        <div class="mt-3 sm:mt-0 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div class="relative">
            <input
              v-model="teacherSearch"
              type="text"
              placeholder="Buscar maestro..."
              class="w-full sm:w-64 pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <div>
            <select
              v-model="teacherFilter"
              class="w-full sm:w-auto pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos los maestros</option>
              <option value="active">Maestros activos</option>
              <option value="inactive">Maestros inactivos</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Teachers list -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Maestro
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Clases
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contacto
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="isLoading" class="animate-pulse">
              <td colspan="5" class="px-6 py-4">
                <div class="flex items-center space-x-3">
                  <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredTeachers.length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-750">
              <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <FolderOpenIcon class="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No se encontraron maestros con los criterios seleccionados</p>
                <button @click="resetTeacherFilters" class="mt-2 text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 font-medium text-sm">
                  Mostrar todos los maestros
                </button>
              </td>
            </tr>
            <tr v-for="teacher in filteredTeachers" :key="teacher.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <img v-if="teacher.photoURL" :src="teacher.photoURL" class="h-10 w-10 rounded-full object-cover" alt="" />
                    <div v-else class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-lg">
                      {{ teacher.name.charAt(0) }}
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ teacher.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ teacher.specialties?.join(', ') || 'Sin especialidad' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="teacher.active !== false" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                  Activo
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                  Inactivo
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ getTeacherClassesCount(teacher.id) }}
                </div>
                <div v-if="getTeacherClassesCount(teacher.id) > 0" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ getTeacherStudentsCount(teacher.id) }} estudiantes
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <EnvelopeIcon class="h-4 w-4 mr-1" />
                  {{ teacher.email }}
                </div>
                <div v-if="teacher.phone" class="flex items-center text-gray-500 dark:text-gray-400">
                  <PhoneIcon class="h-4 w-4 mr-1" />
                  {{ teacher.phone }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <router-link :to="`/teacher/${teacher.id}/attendance`" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/20 p-2 rounded-md">
                    <ClipboardDocumentIcon class="h-5 w-5" aria-hidden="true" />
                    <span class="sr-only">Ver asistencias</span>
                  </router-link>
                  <router-link :to="`/teacher/${teacher.id}/classes`" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                    <AcademicCapIcon class="h-5 w-5" aria-hidden="true" />
                    <span class="sr-only">Ver clases</span>
                  </router-link>
                  <router-link :to="`/teacher/${teacher.id}`" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                    <EllipsisHorizontalIcon class="h-5 w-5" aria-hidden="true" />
                    <span class="sr-only">Más opciones</span>
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="filteredTeachers.length > 0" class="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div class="flex-1 flex justify-between sm:hidden">
          <button @click="prevPage" :disabled="currentPage === 1" class="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
            Anterior
          </button>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span class="font-medium">{{ startItem }}</span> a <span class="font-medium">{{ endItem }}</span> de <span class="font-medium">{{ filteredTeachers.length }}</span> maestros
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button @click="currentPage = 1" :disabled="currentPage === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span class="sr-only">First</span>
                <ChevronDoubleLeftIcon class="h-5 w-5" aria-hidden="true" />
              </button>
              <button @click="prevPage" :disabled="currentPage === 1" class="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span class="sr-only">Previous</span>
                <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
              </button>
              <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ currentPage }} / {{ totalPages }}
              </span>
              <button @click="nextPage" :disabled="currentPage === totalPages" class="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span class="sr-only">Next</span>
                <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
              </button>
              <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span class="sr-only">Last</span>
                <ChevronDoubleRightIcon class="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity Dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Latest attendance activity -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ClockIcon class="h-5 w-5 mr-2 text-gray-500" />
            Asistencias Recientes
          </h2>
        </div>
        
        <div class="p-6">
          <div v-if="recentAttendance.length > 0" class="space-y-4">
            <div v-for="(record, index) in recentAttendance" :key="index" class="flex items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-lg">
                  {{ record.studentName?.charAt(0) || 'S' }}
                </div>
              </div>
              <div class="ml-3 flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ record.studentName || 'Estudiante' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(record.date) }}
                  </p>
                </div>
                <div class="mt-1 flex items-center">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ record.className || 'Clase sin nombre' }}
                  </p>
                  <span v-if="record.status === 'Presente'" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                    Presente
                  </span>
                  <span v-else-if="record.status === 'Ausente'" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                    Ausente
                  </span>
                  <span v-else-if="record.status === 'Tardanza'" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                    Tardanza
                  </span>
                  <span v-else-if="record.status === 'Justificado'" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    Justificado
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="py-8 text-center">
            <ClockIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay asistencias recientes</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No se han registrado asistencias en los últimos días.
            </p>
          </div>
        </div>
      </div>

      <!-- Students without classes or attention needed -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ExclamationTriangleIcon class="h-5 w-5 mr-2 text-amber-500" />
            Requiere Atención
          </h2>
        </div>
        
        <div class="p-6">
          <div v-if="unassignedStudents.length > 0" class="mb-6">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <UserGroupIcon class="h-4 w-4 mr-1" />
              Estudiantes sin Clase Asignada ({{ unassignedStudents.length }})
            </h3>
            <ul class="divide-y divide-gray-200 dark:divide-gray-700">
              <li v-for="student in unassignedStudents.slice(0, 3)" :key="student.id" class="py-3 flex justify-between items-center">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                    {{ student.nombre.charAt(0) }}
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ student.nombre }} {{ student.apellido }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(student.createdAt) || 'Sin fecha de registro' }}
                    </p>
                  </div>
                </div>
                <button @click="assignClassToStudent(student.id)" class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-300 dark:bg-primary-900/20 dark:hover:bg-primary-900/30">
                  Asignar Clase
                </button>
              </li>
            </ul>
            <div v-if="unassignedStudents.length > 3" class="mt-3 text-right">
              <router-link to="/students?filter=unassigned" class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Ver todos ({{ unassignedStudents.length }})
              </router-link>
            </div>
          </div>
          
          <div v-if="emptyClasses.length > 0">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <AcademicCapIcon class="h-4 w-4 mr-1" />
              Clases sin Estudiantes ({{ emptyClasses.length }})
            </h3>
            <ul class="divide-y divide-gray-200 dark:divide-gray-700">
              <li v-for="classItem in emptyClasses.slice(0, 3)" :key="classItem.id" class="py-3 flex justify-between items-center">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold">
                    {{ classItem.name.charAt(0) }}
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ classItem.name }}</p>
                    <p v-if="getTeacherName(classItem.teacherId)" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ getTeacherName(classItem.teacherId) }}
                    </p>
                  </div>
                </div>
                <button @click="enrollStudentToClass(classItem.id)" class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30">
                  Inscribir Estudiante
                </button>
              </li>
            </ul>
            <div v-if="emptyClasses.length > 3" class="mt-3 text-right">
              <router-link to="/classes?filter=empty" class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Ver todas ({{ emptyClasses.length }})
              </router-link>
            </div>
          </div>
          
          <div v-if="unassignedStudents.length === 0 && emptyClasses.length === 0" class="py-8 text-center">
            <CheckCircleIcon class="mx-auto h-12 w-12 text-green-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">¡Todo en orden!</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No hay problemas que requieran su atención inmediata.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Teacher management modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6" @click.stop>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ modalMode === 'newTeacher' ? 'Agregar Nuevo Maestro' : 'Editar Maestro' }}
            </h3>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          
          <!-- Teacher form would go here -->
          <div class="space-y-4">
            <div>
              <label for="teacherName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <input
                id="teacherName"
                v-model="teacherForm.name"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label for="teacherEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                id="teacherEmail"
                v-model="teacherForm.email"
                type="email"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label for="teacherPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
              <input
                id="teacherPhone"
                v-model="teacherForm.phone"
                type="tel"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Especialidades</label>
              <div class="mt-1 flex flex-wrap gap-2">
                <div v-for="(specialty, index) in teacherSpecialties" :key="index" class="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm">
                  <span>{{ specialty }}</span>
                  <button @click="removeSpecialty(index)" class="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <XMarkIcon class="h-4 w-4" />
                  </button>
                </div>
                <input
                  v-model="newSpecialty"
                  @keydown.enter.prevent="addSpecialty"
                  placeholder="+ Añadir"
                  class="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm border-0 focus:ring-0"
                />
              </div>
            </div>
          </div>
          
          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="closeModal"
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              @click="saveTeacher"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {{ modalMode === 'newTeacher' ? 'Agregar' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Import necessary stores
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { useClassesStore } from '../stores/classes';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useUsersStore } from '../stores/users'; // For teachers management

// Import necessary icons
import {
  UserIcon,
  UsersIcon,
  AcademicCapIcon,
  ClockIcon,
  UserPlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon, 
  ChevronDoubleRightIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
  FolderOpenIcon
} from '@heroicons/vue/24/outline';

// Store instances
const attendanceStore = useAttendanceStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const usersStore = useUsersStore();
const router = useRouter();

// State management
const isLoading = ref(false);
const teachersList = ref([]);
const activeTeachers = ref([]);
const attendanceRate = ref(85); // Default placeholder value
const teacherSearch = ref('');
const teacherFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const showModal = ref(false);
const modalMode = ref('newTeacher');
const teacherForm = reactive({
  id: '',
  name: '',
  email: '',
  phone: '',
  specialties: []
});
const teacherSpecialties = ref([]);
const newSpecialty = ref('');
const recentAttendance = ref([]);

// Make sure activeStudents is properly accessed via a computed property
const activeStudents = computed(() => {
  return attendanceStore.getActiveStudents || [];
});

// Get students without assigned classes
const unassignedStudents = computed(() => {
  return studentsStore.students.filter(s => !s.classId);
});

// Get classes without students
const emptyClasses = computed(() => {
  return classesStore.classes.filter(c => !c.studentIds || c.studentIds.length === 0);
});

// Filter teachers by search term and filter option
const filteredTeachers = computed(() => {
  let result = [...teachersList.value];
  
  // Apply search filter
  if (teacherSearch.value) {
    const searchTerm = teacherSearch.value.toLowerCase();
    result = result.filter(teacher => 
      teacher.name.toLowerCase().includes(searchTerm) ||
      teacher.email.toLowerCase().includes(searchTerm) ||
      (teacher.specialties && teacher.specialties.some(s => s.toLowerCase().includes(searchTerm)))
    );
  }
  
  // Apply status filter
  if (teacherFilter.value === 'active') {
    result = result.filter(teacher => teacher.active !== false);
  } else if (teacherFilter.value === 'inactive') {
    result = result.filter(teacher => teacher.active === false);
  }
  
  return result;
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredTeachers.value.length / pageSize.value);
});

const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTeachers.value.slice(start, end);
});

const startItem = computed(() => {
  return (currentPage.value - 1) * pageSize.value + 1;
});

const endItem = computed(() => {
  return Math.min(currentPage.value * pageSize.value, filteredTeachers.value.length);
});

// Methods
function resetTeacherFilters() {
  teacherSearch.value = '';
  teacherFilter.value = 'all';
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function getTeacherClassesCount(teacherId) {
  return classesStore.classes.filter(cls => cls.teacherId === teacherId).length;
}

function getTeacherStudentsCount(teacherId) {
  // Get all classes for this teacher
  const teacherClassIds = classesStore.classes
    .filter(cls => cls.teacherId === teacherId)
    .map(cls => cls.id);
    
  // Count unique students in these classes
  const studentIds = new Set();
  teacherClassIds.forEach(classId => {
    const studentsInClass = studentsStore.students.filter(s => s.classId === classId);
    studentsInClass.forEach(student => studentIds.add(student.id));
  });
  
  return studentIds.size;
}

function getTeacherName(teacherId) {
  const teacher = teachersList.value.find(t => t.id === teacherId);
  return teacher ? teacher.name : 'Maestro sin asignar';
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    // Handle different date formats
    let date;
    if (dateString instanceof Date) {
      date = dateString;
    } else if (dateString.seconds) {
      // Firebase Timestamp
      date = new Date(dateString.seconds * 1000);
    } else {
      // ISO string or other format
      date = new Date(dateString);
    }
    
    // Format date to a readable string
    return format(date, 'dd MMM yyyy', { locale: es });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
}

function openModal(mode, teacher = null) {
  modalMode.value = mode;
  
  if (teacher) {
    teacherForm.id = teacher.id;
    teacherForm.name = teacher.name;
    teacherForm.email = teacher.email;
    teacherForm.phone = teacher.phone || '';
    teacherSpecialties.value = [...(teacher.specialties || [])];
  } else {
    // Reset form for new teacher
    teacherForm.id = '';
    teacherForm.name = '';
    teacherForm.email = '';
    teacherForm.phone = '';
    teacherSpecialties.value = [];
  }
  
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  newSpecialty.value = '';
}

function addSpecialty() {
  if (newSpecialty.value.trim()) {
    teacherSpecialties.value.push(newSpecialty.value.trim());
    newSpecialty.value = '';
  }
}

function removeSpecialty(index) {
  teacherSpecialties.value.splice(index, 1);
}

async function saveTeacher() {
  try {
    // Prepare teacher object
    const teacherData = {
      name: teacherForm.name,
      email: teacherForm.email,
      phone: teacherForm.phone,
      specialties: teacherSpecialties.value,
      role: 'teacher',
      active: true,
      updatedAt: new Date()
    };
    
    if (modalMode.value === 'newTeacher') {
      // Add created timestamp for new teachers
      teacherData.createdAt = new Date();
      await usersStore.addUser(teacherData);
    } else {
      await usersStore.updateUser(teacherForm.id, teacherData);
    }
    
    // Close modal and refresh teacher list
    closeModal();
    await loadTeachers();
  } catch (error) {
    console.error('Error saving teacher:', error);
    // You would typically show an error notification here
  }
}

async function assignClassToStudent(studentId) {
  router.push({ name: 'AssignClass', params: { studentId } });
}

async function enrollStudentToClass(classId) {
  router.push({ name: 'EnrollStudent', params: { classId } });
}

async function loadTeachers() {
  isLoading.value = true;
  try {
    await usersStore.fetchUsers();
    
    // Filter and format teachers
    teachersList.value = usersStore.users
      .filter(user => user.role === 'teacher')
      .map(teacher => ({
        id: teacher.id,
        name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.displayName || teacher.email,
        email: teacher.email,
        phone: teacher.phone,
        photoURL: teacher.photoURL,
        specialties: teacher.specialties || [],
        active: teacher.active !== false
      }));
      
    // Filter active teachers
    activeTeachers.value = teachersList.value.filter(teacher => teacher.active !== false);
  } catch (error) {
    console.error('Error loading teachers:', error);
  } finally {
    isLoading.value = false;
  }
}

async function loadRecentAttendance() {
  try {
    // Get last 30 days of attendance records
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');
    
    await attendanceStore.fetchAttendanceByDateRange(startDate, endDate);
    
    // Format recent attendance records
    const records = attendanceStore.attendanceDocuments
      .slice(0, 10) // Get just the most recent ones
      .map(doc => {
        const student = studentsStore.students.find(s => {
          const stuId = Array.isArray(doc.data?.presentes) ? doc.data.presentes[0] : null;
          return s.id === stuId;
        });
        
        const classData = classesStore.classes.find(c => c.id === doc.classId);
        
        return {
          id: doc.id || doc.fecha + doc.classId,
          date: doc.fecha,
          studentId: student?.id,
          studentName: student ? `${student.nombre} ${student.apellido}` : 'Estudiante',
          classId: doc.classId,
          className: classData?.name || 'Clase',
          status: doc.data?.presentes?.length > 0 ? 'Presente' : 'Ausente'
        };
      });
      
    recentAttendance.value = records;
  } catch (error) {
    console.error('Error loading recent attendance:', error);
  }
}

async function refreshData() {
  isLoading.value = true;
  try {
    await Promise.all([
      loadTeachers(),
      loadRecentAttendance(),
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
    ]);
  } catch (error) {
    console.error("Error refreshing data:", error);
  } finally {
    isLoading.value = false;
  }
}

// Initialize data on component mount
onMounted(async () => {
  await refreshData();
});
</script>

<style scoped>
/* Add any component-specific styles here */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>