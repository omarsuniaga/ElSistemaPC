<template>
  <TransitionRoot :show="open" as="template">
    <Dialog :open="open" as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="handleClose">
      <div class="min-h-screen px-4 text-center">
        <!-- Overlay with improved backdrop -->
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm transition-all"
            aria-hidden="true"
          />
        </TransitionChild>

        <!-- Centering container -->
        <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

        <!-- Modal panel -->
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel
            class="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700"
            >
              <div class="flex items-center space-x-3">
                <div class="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <AcademicCapIcon class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <DialogTitle as="h3" class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ isEditing ? "Editar Clase" : "Crear Nueva Clase" }}
                  </DialogTitle>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{
                      isEditing
                        ? "Modifica los detalles de la clase"
                        : "Configura una nueva clase para la academia"
                    }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                @click="handleClose"
              >
                <span class="sr-only">Cerrar</span>
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <!-- Form Content -->
            <div class="max-h-[calc(100vh-200px)] overflow-y-auto">
              <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
                <!-- Basic Information Section -->
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <DocumentTextIcon class="h-5 w-5 text-indigo-500 mr-2" />
                    Información Básica
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Class Name -->
                    <div class="md:col-span-2">
                      <label
                        for="name"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Nombre de la Clase *
                      </label>
                      <input
                        id="name"
                        v-model="formData.name"
                        type="text"
                        required
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Ej: Piano Intermedio, Guitarra Avanzada..."
                      />
                    </div>

                    <!-- Description -->
                    <div class="md:col-span-2">
                      <label
                        for="description"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Descripción
                      </label>
                      <textarea
                        id="description"
                        v-model="formData.description"
                        rows="3"
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Describe el contenido y objetivos de la clase..."
                      />
                    </div>

                    <!-- Instrument -->
                    <div class="md:col-span-2">
                      <label
                        for="instrument"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Instrumento
                      </label>
                      <input
                        id="instrument"
                        v-model="formData.instrument"
                        type="text"
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Ej: Piano, Guitarra, Violín, Batería..."
                      />
                    </div>
                  </div>
                </div>

                <!-- Teachers Section -->
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <UsersIcon class="h-5 w-5 text-blue-500 mr-2" />
                    Gestión de Maestros
                  </h4>

                  <!-- Main Teacher -->
                  <div class="space-y-4">
                    <div>
                      <label
                        for="teacherId"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Maestro Principal *
                      </label>
                      <select
                        id="teacherId"
                        v-model="formData.teacherId"
                        required
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="">Seleccionar maestro principal</option>
                        <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                          {{ teacher.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Shared Teachers -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Maestros Colaboradores
                      </label>
                      <div class="space-y-3">
                        <select
                          v-model="selectedSharedTeacher"
                          class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                          @change="addSharedTeacher"
                        >
                          <option value="">Agregar maestro colaborador</option>
                          <option
                            v-for="teacher in availableSharedTeachers"
                            :key="teacher.id"
                            :value="teacher.id"
                          >
                            {{ teacher.name }}
                          </option>
                        </select>

                        <!-- Shared Teachers List -->
                        <div v-if="formData.sharedWith.length > 0" class="space-y-2">
                          <div
                            v-for="teacherId in formData.sharedWith"
                            :key="teacherId"
                            class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div class="flex items-center space-x-3">
                              <UserCircleIcon class="h-5 w-5 text-gray-400" />
                              <span class="text-sm font-medium text-gray-900 dark:text-white">
                                {{ getTeacherName(teacherId) }}
                              </span>
                            </div>
                            <div class="flex items-center space-x-2">
                              <select
                                :value="getTeacherPermissionLevel(teacherId)"
                                class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                @change="
                                  updateTeacherPermission(
                                    teacherId,
                                    ($event.target as HTMLSelectElement).value
                                  )
                                "
                              >
                                <option value="read">Lectura</option>
                                <option value="write">Escritura</option>
                                <option value="manage">Administración</option>
                              </select>
                              <button
                                type="button"
                                class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                @click="removeSharedTeacher(teacherId)"
                              >
                                <XMarkIcon class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Schedule Section -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <ClockIcon class="h-5 w-5 text-green-500 mr-2" />
                    Horarios de Clase
                  </h4>

                  <div class="space-y-4">
                    <div
                      v-for="(schedule, index) in formData.schedules"
                      :key="index"
                      class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <!-- Day -->
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Día
                          </label>
                          <select
                            v-model="schedule.day"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-colors"
                          >
                            <option value="">Seleccionar día</option>
                            <option value="Lunes">Lunes</option>
                            <option value="Martes">Martes</option>
                            <option value="Miércoles">Miércoles</option>
                            <option value="Jueves">Jueves</option>
                            <option value="Viernes">Viernes</option>
                            <option value="Sábado">Sábado</option>
                            <option value="Domingo">Domingo</option>
                          </select>
                        </div>

                        <!-- Start Time -->
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Hora Inicio
                          </label>
                          <input
                            v-model="schedule.startTime"
                            type="time"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-colors"
                          />
                        </div>

                        <!-- End Time -->
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Hora Fin
                          </label>
                          <input
                            v-model="schedule.endTime"
                            type="time"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-colors"
                          />
                        </div>

                        <!-- Actions -->
                        <div class="flex items-end">
                          <button
                            v-if="formData.schedules.length > 1"
                            type="button"
                            class="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-lg transition-colors"
                            @click="removeScheduleSlot(index)"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Add Schedule Button -->
                    <button
                      type="button"
                      class="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      @click="addScheduleSlot"
                    >
                      <PlusIcon class="h-5 w-5 mx-auto mb-1" />
                      Agregar Horario Adicional
                    </button>
                  </div>
                </div>

                <!-- Current Enrolled Students Section (only show when editing) -->
                <div v-if="isEditing && currentEnrolledStudents.length > 0" class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <UserGroupIcon class="h-5 w-5 text-amber-500 mr-2" />
                    Estudiantes Inscritos Actualmente ({{ currentEnrolledStudents.length }})
                  </h4>
                  
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Estos son los estudiantes que ya están inscritos en esta clase. Puedes modificar su inscripción usando los controles de abajo.
                  </p>

                  <!-- Current Students Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div
                      v-for="student in currentEnrolledStudents"
                      :key="student.id"
                      class="relative p-3 bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200"
                      :class="{
                        'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20': formData.studentIds.includes(student.id),
                        'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20': !formData.studentIds.includes(student.id),
                        'border-gray-200 dark:border-gray-600': !isEditing
                      }"
                    >
                      <!-- Status Indicator -->
                      <div class="absolute top-2 right-2">
                        <div
                          v-if="formData.studentIds.includes(student.id)"
                          class="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
                          title="Permanece inscrito"
                        />
                        <div
                          v-else
                          class="w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"
                          title="Será removido de la clase"
                        />
                      </div>

                      <!-- Student Info -->
                      <div class="pr-6">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {{ student.nombre }} {{ student.apellido }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ student.instrumento || 'Sin instrumento' }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-gray-500">
                          <span v-if="student.codigo_estudiante">
                            #{{ student.codigo_estudiante }}
                          </span>
                        </p>
                      </div>

                      <!-- Toggle Button -->
                      <div class="mt-2 flex justify-end">
                        <button
                          type="button"
                          class="text-xs px-2 py-1 rounded-md transition-colors"
                          :class="{
                            'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800': formData.studentIds.includes(student.id),
                            'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800': !formData.studentIds.includes(student.id)
                          }"
                          @click="toggleStudentEnrollment(student.id)"
                        >
                          {{ formData.studentIds.includes(student.id) ? 'Remover' : 'Mantener' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Quick Actions for Current Students -->
                  <div class="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="text-xs px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                      @click="keepAllCurrentStudents"
                    >
                      Mantener todos
                    </button>
                    <button
                      type="button"
                      class="text-xs px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      @click="removeAllCurrentStudents"
                    >
                      Remover todos
                    </button>
                  </div>
                  
                  <!-- Status Summary -->
                  <div class="mt-3 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                    <div class="flex justify-between text-xs">
                      <span class="text-green-600 dark:text-green-400">
                        Mantienen inscripción: {{ studentsToKeep }}
                      </span>
                      <span class="text-red-600 dark:text-red-400">
                        Serán removidos: {{ studentsToRemove }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Students Section -->
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <UserGroupIcon class="h-5 w-5 text-purple-500 mr-2" />
                    {{ isEditing ? 'Agregar Nuevos Estudiantes' : 'Estudiantes de la Clase' }}
                  </h4>
                  
                  <p v-if="isEditing" class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Selecciona estudiantes adicionales para agregar a esta clase.
                  </p>

                  <!-- Search Students -->
                  <div class="mb-4">
                    <div class="relative">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        v-model="studentSearchTerm"
                        type="text"
                        class="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Buscar estudiantes por nombre, apellido o instrumento..."
                      />
                    </div>
                  </div>

                  <!-- Students List -->
                  <div
                    class="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div v-if="loading.students" class="flex justify-center items-center p-8">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>

                    <div
                      v-else-if="filteredStudents.length === 0"
                      class="text-center p-8 text-gray-500 dark:text-gray-400"
                    >
                      {{
                        students.length === 0
                          ? "No hay estudiantes disponibles"
                          : "No se encontraron estudiantes"
                      }}
                    </div>

                    <div v-else class="divide-y divide-gray-200 dark:divide-gray-600">
                      <label
                        v-for="student in filteredStudents"
                        :key="student.id"
                        class="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <input
                          v-model="formData.studentIds"
                          type="checkbox"
                          :value="student.id"
                          class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <div class="ml-3 flex-1">
                          <div class="flex items-center justify-between">
                            <div>
                              <p class="text-sm font-medium text-gray-900 dark:text-white">
                                {{ student.nombre }} {{ student.apellido }}
                              </p>
                              <p class="text-xs text-gray-500 dark:text-gray-400">
                                {{ student.instrumento || "Sin instrumento" }}
                              </p>
                            </div>
                            <div
                              v-if="student.codigo_estudiante"
                              class="text-xs text-gray-400 dark:text-gray-500"
                            >
                              #{{ student.codigo_estudiante }}
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Selected Students Summary -->
                  <div
                    v-if="formData.studentIds.length > 0"
                    class="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <h5 class="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center">
                        <UserGroupIcon class="h-4 w-4 mr-2" />
                        Estudiantes Seleccionados ({{ formData.studentIds.length }})
                      </h5>
                      <button
                        v-if="formData.studentIds.length > 0"
                        type="button"
                        class="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
                        @click="clearAllStudents"
                      >
                        Deseleccionar todos
                      </button>
                    </div>

                    <!-- Grouped by Instrument -->
                    <div class="space-y-3">
                      <div
                        v-for="(group, instrument) in selectedStudentsByInstrument"
                        :key="instrument"
                        class="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                      >
                        <div class="flex items-center justify-between mb-2">
                          <h6 class="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {{ instrument }} ({{ group.length }})
                          </h6>
                          <button
                            type="button"
                            class="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            @click="removeStudentsByInstrument(instrument)"
                          >
                            Quitar todos
                          </button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <div
                            v-for="student in group"
                            :key="student.id"
                            class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div class="flex items-center space-x-2 min-w-0 flex-1">
                              <div class="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                              <div class="min-w-0 flex-1">
                                <p class="text-xs font-medium text-gray-900 dark:text-white truncate">
                                  {{ student.nombre }} {{ student.apellido }}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  <span v-if="student.codigo_estudiante">
                                    #{{ student.codigo_estudiante }}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              class="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-opacity"
                              @click="removeStudent(student.id)"
                            >
                              <XMarkIcon class="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        Total: {{ formData.studentIds.length }}
                      </span>
                    </div>
                  </div>

                  <!-- No Selection Message -->
                  <div
                    v-else
                    class="mt-3 text-sm text-gray-500 dark:text-gray-400 italic text-center"
                  >
                    No hay estudiantes seleccionados
                  </div>
                </div>
              </form>
            </div>

            <!-- Footer Actions -->
            <div
              class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
            >
              <button
                type="button"
                class="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                @click="handleClose"
              >
                Cancelar
              </button>

              <div class="flex items-center space-x-3">
                <div v-if="!isFormValid" class="text-sm text-amber-600 dark:text-amber-400">
                  Completa los campos obligatorios
                </div>
                <button
                  type="submit"
                  :disabled="!isFormValid || saving"
                  class="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  @click="handleSubmit"
                >
                  <span v-if="saving" class="flex items-center">
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {{ isEditing ? "Actualizando..." : "Creando..." }}
                  </span>
                  <span v-else>
                    {{ isEditing ? "Actualizar Clase" : "Crear Clase" }}
                  </span>
                </button>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, shallowRef, nextTick } from 'vue';
import { debounce } from 'lodash-es';
import { Dialog, DialogPanel, TransitionRoot, TransitionChild, DialogTitle } from '@headlessui/vue';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AcademicCapIcon,
  UsersIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useStudentsStore } from '../../Students/store/students';
import { useNotification } from '@/composables/useNotification';
import type { ClassData } from '../types/class';

interface Props {
  open: boolean
  classData?: ClassData | null
}

const props = withDefaults(defineProps<Props>(), {
  classData: null,
});

const emit = defineEmits<{
  (e: 'save', data: Partial<ClassData>): void
  (e: 'close'): void
}>();

// Stores and composables
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const { showNotification } = useNotification();

// Reactive state
const saving = ref(false);
const studentSearchTerm = ref('');
const selectedSharedTeacher = ref('');

// Data loading
const teachers = shallowRef<any[]>([]);
const students = shallowRef<any[]>([]);
const loading = ref({
  students: false,
});


// Form structure
interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

interface FormData {
  name: string
  description: string
  instrument: string
  teacherId: string
  studentIds: string[]
  sharedWith: string[]
  permissions: Record<string, string[]>
  schedules: ScheduleSlot[]
  status: 'active' | 'inactive' | 'suspended'
}

const formData = ref<FormData>({
  name: '',
  description: '',
  instrument: '',
  teacherId: '',
  studentIds: [],
  sharedWith: [],
  permissions: {},
  schedules: [{ day: '', startTime: '', endTime: '' }],
  status: 'active',
});

// Computed properties
const isEditing = computed(() => !!props.classData?.id);

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.teacherId !== '';
});

const availableSharedTeachers = computed(() =>
  teachers.value.filter(
    (teacher) =>
      teacher.id !== formData.value.teacherId && !formData.value.sharedWith.includes(teacher.id),
  ),
);

// Search functionality
const debouncedSearch = debounce((term: string) => {
  // Implement search logic if needed
}, 300);

watch(studentSearchTerm, (newTerm) => {
  debouncedSearch(newTerm);
});

const filteredStudents = computed(() => {
  if (!studentSearchTerm.value.trim()) return students.value;

  const searchTerm = studentSearchTerm.value.toLowerCase();
  return students.value.filter((student) => {
    // Helper function to safely check string fields
    const safeStringIncludes = (value: any) => {
      return value && typeof value === 'string' && value.toLowerCase().includes(searchTerm);
    };

    // Helper function to safely check numeric fields
    const safeNumberIncludes = (value: any) => {
      return value && value.toString().includes(searchTerm);
    };

    return (
      safeStringIncludes(student.nombre) ||
      safeStringIncludes(student.apellido) ||
      safeStringIncludes(student.instrumento) ||
      safeNumberIncludes(student.codigo_estudiante)
    );
  });
});

const selectedStudentsByInstrument = computed(() => {
  const selected = students.value.filter(student => 
    formData.value.studentIds.includes(student.id)
  );
  
  const grouped: Record<string, any[]> = {};
  
  selected.forEach(student => {
    const instrument = student.instrumento || 'Sin instrumento';
    if (!grouped[instrument]) {
      grouped[instrument] = [];
    }
    grouped[instrument].push(student);
  });
  
  // Sort students within each group by name
  Object.keys(grouped).forEach(instrument => {
    grouped[instrument].sort((a, b) => 
      `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`)
    );
  });
  
  return grouped;
});


// Computed properties for current enrolled students section
const currentEnrolledStudents = computed(() => {
  if (!props.classData?.studentIds) return [];
  
  return students.value.filter(student => 
    props.classData!.studentIds.includes(student.id)
  );
});

const studentsToKeep = computed(() => {
  return currentEnrolledStudents.value.filter(student =>
    formData.value.studentIds.includes(student.id)
  ).length;
});

const studentsToRemove = computed(() => {
  return currentEnrolledStudents.value.length - studentsToKeep.value;
});

// Methods
const loadData = async () => {
  loading.value.students = true;
  try {
    await Promise.all([teachersStore.fetchTeachers(), studentsStore.fetchStudents()]);

    teachers.value = teachersStore.teachers || [];

    // Normalize student data to ensure all properties are correct types
    students.value = (studentsStore.students || []).map((student) => ({
      ...student,
      nombre: student.nombre ? String(student.nombre) : '',
      apellido: student.apellido ? String(student.apellido) : '',
      instrumento: student.instrumento ? String(student.instrumento) : '',
      codigo_estudiante: student.codigo_estudiante || '',
    }));
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Error al cargar datos', 'error');
  } finally {
    loading.value.students = false;
  }
};

const getTeacherName = (teacherId: string): string => {
  const teacher = teachers.value.find((t) => t.id === teacherId);
  return teacher ? teacher.name : 'Maestro no encontrado';
};

const getTeacherPermissionLevel = (teacherId: string): string => {
  const permissions = formData.value.permissions[teacherId];
  if (!permissions || permissions.length === 0) return 'read';

  if (permissions.includes('manage')) return 'manage';
  if (permissions.includes('write')) return 'write';
  return 'read';
};

const updateTeacherPermission = (teacherId: string, permissionLevel: string) => {
  switch (permissionLevel) {
  case 'read':
    formData.value.permissions[teacherId] = ['read'];
    break;
  case 'write':
    formData.value.permissions[teacherId] = ['read', 'write'];
    break;
  case 'manage':
    formData.value.permissions[teacherId] = ['read', 'write', 'manage'];
    break;
  default:
    formData.value.permissions[teacherId] = ['read'];
  }
};

const addSharedTeacher = () => {
  if (
    selectedSharedTeacher.value &&
    !formData.value.sharedWith.includes(selectedSharedTeacher.value)
  ) {
    formData.value.sharedWith.push(selectedSharedTeacher.value);
    formData.value.permissions[selectedSharedTeacher.value] = ['read'];
    selectedSharedTeacher.value = '';
  }
};

const removeSharedTeacher = (teacherId: string) => {
  formData.value.sharedWith = formData.value.sharedWith.filter((id) => id !== teacherId);
  delete formData.value.permissions[teacherId];
};

const addScheduleSlot = () => {
  formData.value.schedules.push({ day: '', startTime: '', endTime: '' });
};

const removeScheduleSlot = (index: number) => {
  if (formData.value.schedules.length > 1) {
    formData.value.schedules.splice(index, 1);
  }
};

const clearAllStudents = () => {
  formData.value.studentIds = [];
};

const removeStudent = (studentId: string) => {
  formData.value.studentIds = formData.value.studentIds.filter(id => id !== studentId);
};

const removeStudentsByInstrument = (instrument: string) => {
  const studentsInInstrument = students.value
    .filter(student => (student.instrumento || 'Sin instrumento') === instrument)
    .map(student => student.id);
  
  formData.value.studentIds = formData.value.studentIds.filter(
    id => !studentsInInstrument.includes(id)
  );
};

// Methods for current enrolled students section
const toggleStudentEnrollment = (studentId: string) => {
  const index = formData.value.studentIds.indexOf(studentId);
  if (index > -1) {
    // Student is currently selected, remove them
    formData.value.studentIds.splice(index, 1);
  } else {
    // Student is not selected, add them
    formData.value.studentIds.push(studentId);
  }
};

const keepAllCurrentStudents = () => {
  const currentStudentIds = currentEnrolledStudents.value.map(student => student.id);
  // Add all current students to the selection if not already there
  currentStudentIds.forEach(studentId => {
    if (!formData.value.studentIds.includes(studentId)) {
      formData.value.studentIds.push(studentId);
    }
  });
};

const removeAllCurrentStudents = () => {
  const currentStudentIds = currentEnrolledStudents.value.map(student => student.id);
  // Remove all current students from the selection
  formData.value.studentIds = formData.value.studentIds.filter(
    studentId => !currentStudentIds.includes(studentId)
  );
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  saving.value = true;
  try {
    // Convertir schedules a schedule.slots para compatibilidad con el store
    const scheduleSlots = formData.value.schedules.filter(
      (slot) => slot.day && slot.startTime && slot.endTime,
    );

    const classDataToSave: Partial<ClassData> = {
      ...formData.value,
      id: props.classData?.id,
      createdAt: props.classData?.createdAt || new Date(),
      updatedAt: new Date(),
      // Convertir el formato de horarios para que sea compatible
      schedule: {
        slots: scheduleSlots,
      },
    };

    // Eliminar el campo schedules ya que lo convertimos a schedule.slots
    delete (classDataToSave as any).schedules;

    console.log('📤 Datos enviados desde ClassFormDialog:', {
      schedule: classDataToSave.schedule,
      slots: classDataToSave.schedule?.slots,
      slotsCount: classDataToSave.schedule?.slots?.length,
    });

    emit('save', classDataToSave);
    handleClose();
  } catch (error) {
    console.error('Error saving class:', error);
    showNotification('Error al guardar la clase', 'error');
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  emit('close');
  resetForm();
};

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    instrument: '',
    teacherId: '',
    studentIds: [],
    sharedWith: [],
    permissions: {},
    schedules: [{ day: '', startTime: '', endTime: '' }],
    status: 'active',
  };
  studentSearchTerm.value = '';
  selectedSharedTeacher.value = '';
};

const loadFormData = () => {
  if (props.classData) {
    formData.value = {
      name: props.classData.name || '',
      description: props.classData.description || '',
      instrument: props.classData.instrument || '',
      teacherId: props.classData.teacherId || '',
      studentIds: props.classData.studentIds || [],
      sharedWith: props.classData.sharedWith || [],
      permissions: props.classData.permissions || {},
      schedules:
        props.classData.schedule?.slots?.length > 0
          ? props.classData.schedule.slots.map((slot) => ({
            day: slot.day || '',
            startTime: slot.startTime || '',
            endTime: slot.endTime || '',
          }))
          : [{ day: '', startTime: '', endTime: '' }],
      status: props.classData.status || 'active',
    };
  }
};

// Lifecycle
onMounted(() => {
  loadData();
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadFormData();
      nextTick(() => {
        const nameInput = document.getElementById('name');
        if (nameInput) nameInput.focus();
      });
    }
  },
);
</script>

<style scoped>
/* Custom scrollbar for the modal content */
.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar {
  width: 6px;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb {
  background: rgb(156 163 175 / 0.5);
  border-radius: 3px;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb:hover {
  background: rgb(156 163 175 / 0.7);
}

/* Dark mode scrollbar */
.dark .max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb {
  background: rgb(75 85 99 / 0.5);
}

.dark .max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb:hover {
  background: rgb(75 85 99 / 0.7);
}
</style>
