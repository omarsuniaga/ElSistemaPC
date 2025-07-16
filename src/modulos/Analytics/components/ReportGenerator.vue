<template>
  <div class="space-y-6">
    <!-- Report Selection -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="(category, key) in reportCategories" :key="key" class="card">
        <h3 class="text-lg font-semibold mb-4">{{ category.name }}</h3>
        <div class="space-y-2">
          <button
            v-for="report in category.reports"
            :key="report.id"
            class="w-full p-3 rounded-lg text-left transition-colors"
            :class="
              selectedReport === report.id
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            "
            @click="selectedReport = report.id"
          >
            <p class="font-medium">{{ report.name }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ report.description }}
            </p>
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="selectedReport" class="card">
      <h3 class="text-lg font-semibold mb-4">Filtros</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Fecha Inicio</label>
          <input v-model="filters.startDate" type="date" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Fecha Fin</label>
          <input v-model="filters.endDate" type="date" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Clase</label>
          <select v-model="filters.class" class="input">
            <option value="">Todas las clases</option>
            <option v-for="class_ in classesStore.classes" :key="class_.id" :value="class_.name">
              {{ class_.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Maestro</label>
          <select v-model="filters.teacher" class="input">
            <option value="">Todos los maestros</option>
            <option v-for="teacher in teachersStore.teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Alumno</label>
          <select v-model="filters.student" class="input">
            <option value="">Todos los alumnos</option>
            <option v-for="student in studentsStore.students" :key="student.id" :value="student.id">
              {{ student.nombre }} {{ student.apellido }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Nivel</label>
          <select v-model="filters.level" class="input">
            <option value="">Todos los niveles</option>
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>
      </div>

      <!-- Preview Button -->
      <div class="mt-4 flex justify-end gap-3">
        <button
          class="btn bg-blue-600 text-white hover:bg-blue-700"
          @click="showPreview = !showPreview"
        >
          {{ showPreview ? "Ocultar Vista Previa" : "Vista Previa" }}
        </button>
        <select v-model="selectedFormat" class="input w-32">
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
        </select>
        <button class="btn btn-primary" :disabled="isGenerating" @click="exportReport">
          {{ isGenerating ? "Generando..." : "Generar Informe" }}
        </button>
      </div>
    </div>

    <!-- Preview -->
    <div v-if="showPreview && reportData" class="card">
      <h3 class="text-lg font-semibold mb-4">Vista Previa</h3>

      <!-- Attendance General Report -->
      <div v-if="selectedReport === 'attendance-general'" class="space-y-6">
        <!-- Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Registros</p>
            <p class="text-2xl font-bold">{{ reportData.summary.total }}</p>
          </div>
          <div class="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <p class="text-sm text-green-600 dark:text-green-400">Presentes</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ Math.round((reportData.summary.present / reportData.summary.total) * 100) }}%
            </p>
          </div>
          <div class="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <p class="text-sm text-red-600 dark:text-red-400">Ausentes</p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ Math.round((reportData.summary.absent / reportData.summary.total) * 100) }}%
            </p>
          </div>
          <div class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p class="text-sm text-blue-600 dark:text-blue-400">Tasa de Asistencia</p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ Math.round(reportData.summary.attendanceRate) }}%
            </p>
          </div>
        </div>

        <!-- By Class -->
        <div>
          <h4 class="font-semibold mb-3">Por Clase</h4>
          <div class="space-y-3">
            <div
              v-for="(stats, className) in reportData.byClass"
              :key="className"
              class="p-4 border dark:border-gray-700 rounded-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h5 class="font-medium">{{ className }}</h5>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Total: {{ stats.total }} registros
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold">
                    {{ Math.round(((stats.present + stats.justified) / stats.total) * 100) }}%
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">asistencia</p>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex gap-2 items-center">
                  <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-full bg-green-500 rounded-full"
                      :style="{width: `${(stats.present / stats.total) * 100}%`}"
                    />
                  </div>
                  <span class="text-sm">{{ stats.present }} presentes</span>
                </div>
                <div class="flex gap-2 items-center">
                  <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-full bg-red-500 rounded-full"
                      :style="{width: `${(stats.absent / stats.total) * 100}%`}"
                    />
                  </div>
                  <span class="text-sm">{{ stats.absent }} ausentes</span>
                </div>
                <div class="flex gap-2 items-center">
                  <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-full bg-yellow-500 rounded-full"
                      :style="{width: `${(stats.delayed / stats.total) * 100}%`}"
                    />
                  </div>
                  <span class="text-sm">{{ stats.delayed }} demorados</span>
                </div>
                <div class="flex gap-2 items-center">
                  <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-full bg-blue-500 rounded-full"
                      :style="{width: `${(stats.justified / stats.total) * 100}%`}"
                    />
                  </div>
                  <span class="text-sm">{{ stats.justified }} justificados</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Records Table -->
        <div>
          <h4 class="font-semibold mb-3">Registros</h4>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Fecha</th>
                  <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Clase</th>
                  <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Alumno</th>
                  <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Estado</th>
                  <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="record in reportData.records"
                  :key="`${record.date}-${record.student}`"
                  class="border-b dark:border-gray-700"
                >
                  <td class="px-4 py-2">{{ record.date }}</td>
                  <td class="px-4 py-2">{{ record.class }}</td>
                  <td class="px-4 py-2">{{ record.student }}</td>
                  <td class="px-4 py-2">
                    <span
                      class="px-2 py-1 text-sm rounded-full"
                      :class="{
                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200':
                          record.status === 'Presente',
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200':
                          record.status === 'Ausente',
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200':
                          record.status === 'Demorado',
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200':
                          record.status === 'Justificado',
                      }"
                    >
                      {{ record.status }}
                    </span>
                  </td>
                  <td class="px-4 py-2">{{ record.comment }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Teacher Attendance Report -->
      <div v-else-if="selectedReport === 'attendance-teacher'" class="space-y-6">
        <div v-for="teacher in reportData.teachers" :key="teacher.teacherId" class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-lg font-semibold">{{ teacher.teacherName }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ teacher.totalClasses }} clases
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-primary-600">
                {{ Math.round(teacher.averageAttendance) }}%
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">asistencia promedio</p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="class_ in teacher.classes"
              :key="class_.className"
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-medium">{{ class_.className }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ class_.total }} registros
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-bold">{{ Math.round(class_.attendanceRate) }}%</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ class_.present }} presentes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Student Attendance Report -->
      <div v-else-if="selectedReport === 'attendance-student'" class="space-y-6">
        <div v-for="student in reportData.students" :key="student.studentId" class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-lg font-semibold">{{ student.studentName }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ student.class }}
              </p>
            </div>
            <div class="text-right">
              <p
                class="text-2xl font-bold"
                :class="{
                  'text-green-600': student.attendanceRate >= 90,
                  'text-yellow-600': student.attendanceRate >= 75 && student.attendanceRate < 90,
                  'text-red-600': student.attendanceRate < 75,
                }"
              >
                {{ Math.round(student.attendanceRate) }}%
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">asistencia</p>
            </div>
          </div>

          <!-- Statistics -->
          <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">{{ student.present }}</p>
              <p class="text-sm text-gray-600">Presentes</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-red-600">{{ student.absent }}</p>
              <p class="text-sm text-gray-600">Ausentes</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-yellow-600">{{ student.delayed }}</p>
              <p class="text-sm text-gray-600">Demorados</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">{{ student.justified }}</p>
              <p class="text-sm text-gray-600">Justificados</p>
            </div>
          </div>

          <!-- Records -->
          <div class="space-y-2">
            <div
              v-for="record in student.records"
              :key="`${record.date}-${record.status}`"
              class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span>{{ record.date }}</span>
              <span
                class="px-2 py-1 text-sm rounded-full"
                :class="{
                  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200':
                    record.status === 'Presente',
                  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200':
                    record.status === 'Ausente',
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200':
                    record.status === 'Demorado',
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200':
                    record.status === 'Justificado',
                }"
              >
                {{ record.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Teachers Metrics Report -->
      <div v-else-if="selectedReport === 'teachers-metrics'" class="space-y-6">
        <div v-for="teacher in reportData.teachers" :key="teacher.teacherId" class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-lg font-semibold">{{ teacher.teacherName }}</h4>
              <div class="flex gap-2 mt-1">
                <span
                  v-for="specialty in teacher.specialties"
                  :key="specialty"
                  class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                  {{ specialty }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-primary-600">
                {{ Math.round(teacher.attendanceRate) }}%
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">asistencia promedio</p>
            </div>
          </div>

          <!-- Metrics -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-2xl font-bold">{{ teacher.totalClasses }}</p>
              <p class="text-sm text-gray-600">Clases</p>
            </div>
            <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-2xl font-bold">{{ teacher.totalStudents }}</p>
              <p class="text-sm text-gray-600">Alumnos</p>
            </div>
            <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-2xl font-bold">{{ teacher.certifications.length }}</p>
              <p class="text-sm text-gray-600">Certificaciones</p>
            </div>
          </div>

          <!-- Experience -->
          <div v-if="teacher.experience.length" class="mb-4">
            <h5 class="font-medium mb-2">Experiencia</h5>
            <div class="space-y-2">
              <div
                v-for="exp in teacher.experience"
                :key="exp.institution"
                class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <p class="font-medium">{{ exp.institution }}</p>
                <p class="text-sm text-gray-600">{{ exp.role }}</p>
                <p class="text-sm text-gray-600">{{ exp.startDate }} - {{ exp.endDate }}</p>
              </div>
            </div>
          </div>

          <!-- Certifications -->
          <div v-if="teacher.certifications.length">
            <h5 class="font-medium mb-2">Certificaciones</h5>
            <div class="space-y-2">
              <div
                v-for="cert in teacher.certifications"
                :key="cert.title"
                class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <p class="font-medium">{{ cert.title }}</p>
                <p class="text-sm text-gray-600">{{ cert.institution }} - {{ cert.year }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Attendance Report -->
      <div v-else-if="selectedReport === 'students-attendance'" class="space-y-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Alumno</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Instrumento</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Nivel</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Clase</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Asistencia</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Última Asistencia</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in reportData.students"
                :key="student.studentId"
                class="border-b dark:border-gray-700"
              >
                <td class="px-4 py-2">{{ student.studentName }}</td>
                <td class="px-4 py-2">{{ student.instrument }}</td>
                <td class="px-4 py-2">{{ student.level }}</td>
                <td class="px-4 py-2">{{ student.class }}</td>
                <td class="px-4 py-2">
                  <span
                    class="px-2 py-1 text-sm rounded-full"
                    :class="{
                      'bg-green-100 text-green-800': student.attendanceRate >= 90,
                      'bg-yellow-100 text-yellow-800':
                        student.attendanceRate >= 75 && student.attendanceRate < 90,
                      'bg-red-100 text-red-800': student.attendanceRate < 75,
                    }"
                  >
                    {{ Math.round(student.attendanceRate) }}%
                  </span>
                </td>
                <td class="px-4 py-2">{{ student.lastAttendance }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Classes Enrollment Report -->
      <div v-else-if="selectedReport === 'classes-enrollment'" class="space-y-6">
        <div v-for="class_ in reportData.classes" :key="class_.className" class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-lg font-semibold">{{ class_.className }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ class_.teacherName }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold">{{ class_.totalStudents }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">alumnos</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-sm text-gray-600">Nivel</p>
              <p class="font-medium">{{ class_.level }}</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-sm text-gray-600">Horario</p>
              <p class="font-medium">{{ class_.schedule }}</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-sm text-gray-600">Contenidos</p>
              <p class="font-medium">{{ class_.contents }}</p>
            </div>
          </div>

          <!-- Students List -->
          <div>
            <h5 class="font-medium mb-2">Alumnos Inscritos</h5>
            <div class="space-y-2">
              <div
                v-for="student in class_.students"
                :key="student.id"
                class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p class="font-medium">{{ student.name }}</p>
                  <p class="text-sm text-gray-600">{{ student.instrument }}</p>
                </div>
                <p class="text-sm text-gray-600">
                  Inscrito: {{ format(parseISO(student.enrollmentDate), "PP", {locale: es}) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Academic Content Report -->
      <div v-else-if="selectedReport === 'academic-content'" class="space-y-6">
        <div v-for="content in reportData.contents" :key="content.title" class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-lg font-semibold">{{ content.title }}</h4>
              <div class="flex gap-2 mt-1">
                <span
                  class="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ content.class }}
                </span>
                <span
                  class="px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                >
                  {{ content.level }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold">{{ content.themes }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">temas</p>
            </div>
          </div>

          <!-- Content Details -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h5 class="font-medium mb-2">Objetivos</h5>
              <ul class="list-disc list-inside space-y-1">
                <li
                  v-for="objective in content.objectives"
                  :key="objective"
                  class="text-sm text-gray-600"
                >
                  {{ objective }}
                </li>
              </ul>
            </div>
            <div>
              <h5 class="font-medium mb-2">Prerequisitos</h5>
              <ul class="list-disc list-inside space-y-1">
                <li
                  v-for="prerequisite in content.prerequisites"
                  :key="prerequisite"
                  class="text-sm text-gray-600"
                >
                  {{ prerequisite }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Materials -->
          <div v-if="content.materials.length">
            <h5 class="font-medium mb-2">Materiales</h5>
            <div class="grid grid-cols-2 gap-4">
              <div
                v-for="material in content.materials"
                :key="material.url"
                class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <p class="font-medium">{{ material.title }}</p>
                <p class="text-sm text-gray-600">{{ material.description }}</p>
                <a
                  :href="material.url"
                  target="_blank"
                  class="text-sm text-blue-600 hover:underline"
                >
                  Ver material
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Indicators Report -->
      <div v-else-if="selectedReport === 'performance-indicators'" class="space-y-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Contenido</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Tema</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Indicador</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Descripción</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Peso</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="indicator in reportData.indicators"
                :key="`${indicator.content}-${indicator.indicator}`"
                class="border-b dark:border-gray-700"
              >
                <td class="px-4 py-2">{{ indicator.content }}</td>
                <td class="px-4 py-2">{{ indicator.theme }}</td>
                <td class="px-4 py-2">{{ indicator.indicator }}</td>
                <td class="px-4 py-2">{{ indicator.description }}</td>
                <td class="px-4 py-2">
                  <span
                    class="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    {{ indicator.weight }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Student Schedule Report -->
      <div v-else-if="selectedReport === 'schedule-student'" class="space-y-6">
        <div v-if="reportData.error" class="text-red-600">
          {{ reportData.error }}
        </div>
        <div v-else>
          <div class="mb-6">
            <h4 class="text-lg font-semibold">{{ reportData.student.name }}</h4>
            <div class="flex gap-2 mt-1">
              <span
                class="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
              >
                {{ reportData.student.instrument }}
              </span>
              <span
                class="px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
              >
                {{ reportData.student.level }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-7 gap-4">
            <div
              v-for="day in [
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
                'Domingo',
              ]"
              :key="day"
              class="space-y-2"
            >
              <h5 class="font-medium text-center bg-gray-50 dark:bg-gray-800 py-2 rounded-lg">
                {{ day }}
              </h5>
              <div
                v-for="class_ in reportData.schedule.filter((s) => s.day === day)"
                :key="class_.className"
                class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
              >
                <p class="font-medium">{{ class_.className }}</p>
                <p class="text-gray-600">{{ class_.time }}</p>
                <p class="text-gray-600">{{ class_.teacherName }}</p>
                <p class="text-gray-600">{{ class_.classroom }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Teacher Schedule Report -->
      <div v-else-if="selectedReport === 'schedule-teacher'" class="space-y-6">
        <div v-if="reportData.error" class="text-red-600">
          {{ reportData.error }}
        </div>
        <div v-else>
          <div class="mb-6">
            <h4 class="text-lg font-semibold">{{ reportData.teacher.name }}</h4>
            <div class="flex gap-2 mt-1">
              <span
                v-for="specialty in reportData.teacher.specialties"
                :key="specialty"
                class="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
              >
                {{ specialty }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-7 gap-4">
            <div
              v-for="day in [
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
                'Domingo',
              ]"
              :key="day"
              class="space-y-2"
            >
              <h5 class="font-medium text-center bg-gray-50 dark:bg-gray-800 py-2 rounded-lg">
                {{ day }}
              </h5>
              <div
                v-for="class_ in reportData.schedule.filter((s) => s.day === day)"
                :key="class_.className"
                class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
              >
                <p class="font-medium">{{ class_.className }}</p>
                <p class="text-gray-600">{{ class_.time }}</p>
                <p class="text-gray-600">{{ class_.students }} alumnos</p>
                <p class="text-gray-600">{{ class_.level }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Class Schedule Report -->
      <div v-else-if="selectedReport === 'schedule-class'" class="space-y-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Clase</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Día</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Hora</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Maestro</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Alumnos</th>
                <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Nivel</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="schedule in reportData.schedules"
                :key="`${schedule.className}-${schedule.day}-${schedule.time}`"
                class="border-b dark:border-gray-700"
              >
                <td class="px-4 py-2">{{ schedule.className }}</td>
                <td class="px-4 py-2">{{ schedule.day }}</td>
                <td class="px-4 py-2">{{ schedule.time }}</td>
                <td class="px-4 py-2">{{ schedule.teacherName }}</td>
                <td class="px-4 py-2">{{ schedule.students }}</td>
                <td class="px-4 py-2">{{ schedule.level }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, parseISO, eachMonthOfInterval, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
// Reemplazar XLSX por ExcelJS (solución segura)
import ExcelJS from 'exceljs';
import { Line, Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useStudentsStore } from '../../Students/store/students';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useClassesStore } from '../../Classes/store/classes';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useContentsStore } from '../../Contents/store/contents';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const studentsStore = useStudentsStore();
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const attendanceStore = useAttendanceStore();
const contentsStore = useContentsStore();

// Estado del generador
const selectedReport = ref('');
const selectedFormat = ref<'pdf' | 'excel'>('pdf');
const dateRange = ref({
  startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
});
const customTitle = ref('');
const includeCharts = ref(true);
const selectedFilters = ref<string[]>([]);
const selectedGroups = ref<string[]>([]);
const selectedInstruments = ref<string[]>([]);
const selectedTeachers = ref<string[]>([]);
const isGenerating = ref(false);
const isConfiguring = ref(false);
const reportGenerated = ref(false);
const reportUrl = ref('');
const error = ref('');
const showPreview = ref(false);

// Opciones avanzadas para la personalización de informes
const showAdvancedOptions = ref(false);
const customColumns = ref<string[]>([]);
const sortOrder = ref<'asc' | 'desc'>('asc');
const includeAggregates = ref(true);
const selectedColorScheme = ref('default');
const includeHeader = ref(true);
const includeFooter = ref(true);
const headerLogo = ref(null);
const footerText = ref(
  'Academia de Música - Generado el ' + format(new Date(), 'PPP', { locale: es }),
);
const pageOrientation = ref<'portrait' | 'landscape'>('portrait');

// Lista de informes disponibles
const availableReports = [
  { id: 'students', name: 'Alumnos', icon: 'user-group' },
  { id: 'teachers', name: 'Profesores', icon: 'academic-cap' },
  { id: 'attendance', name: 'Asistencia', icon: 'clipboard-document-check' },
  { id: 'classes', name: 'Clases', icon: 'bookmark-square' },
  { id: 'progress', name: 'Progreso Estudiantil', icon: 'chart-bar' },
  { id: 'instruments', name: 'Distribución por Instrumento', icon: 'musical-note' },
  { id: 'monthly', name: 'Rendimiento Mensual', icon: 'calendar' },
  { id: 'custom', name: 'Informe Personalizado', icon: 'adjustments' },
];

// Opciones de color
const colorSchemes = [
  { id: 'default', name: 'Predeterminado', primary: '#0ea5e9', secondary: '#6366f1' },
  { id: 'green', name: 'Verde Naturaleza', primary: '#10b981', secondary: '#059669' },
  { id: 'purple', name: 'Púrpura Real', primary: '#8b5cf6', secondary: '#7c3aed' },
  { id: 'red', name: 'Rojo Intenso', primary: '#ef4444', secondary: '#dc2626' },
  { id: 'amber', name: 'Ámbar Cálido', primary: '#f59e0b', secondary: '#d97706' },
];

// Columnas disponibles por tipo de informe
const availableColumns = computed(() => {
  const columns: Record<string, {id: string; name: string; selected: boolean}[]> = {
    students: [
      { id: 'nombre', name: 'Nombre', selected: true },
      { id: 'apellido', name: 'Apellido', selected: true },
      { id: 'edad', name: 'Edad', selected: true },
      { id: 'instrumento', name: 'Instrumento', selected: true },
      { id: 'clase', name: 'Clase', selected: true },
      { id: 'email', name: 'Email', selected: false },
      { id: 'tlf', name: 'Teléfono', selected: false },
      { id: 'padre', name: 'Padre', selected: false },
      { id: 'madre', name: 'Madre', selected: false },
      { id: 'tlf_padre', name: 'Teléfono Padre', selected: false },
      { id: 'tlf_madre', name: 'Teléfono Madre', selected: false },
      { id: 'fecInscripcion', name: 'Fecha Inscripción', selected: true },
    ],
    teachers: [
      // ... otras columnas para profesores
    ],
    attendance: [
      // ... otras columnas para asistencia
    ],
    // ... más tipos de informes
  };

  return columns[selectedReport.value] || [];
});

// Observar cambios en el informe seleccionado
watch(selectedReport, (newValue) => {
  if (newValue) {
    // Restablecer selecciones cuando cambie el tipo de informe
    selectedFilters.value = [];
    customColumns.value = availableColumns.value.filter((col) => col.selected).map((col) => col.id);

    isConfiguring.value = true;
    showAdvancedOptions.value = false;
  }
});

// Método para aplicar filtros personalizados
const applyCustomFilters = () => {
  // Lógica para aplicar filtros personalizados
  isConfiguring.value = false;
  // Mostrar vista previa
  generatePreview();
};

// Método para generar vista previa
const generatePreview = () => {
  showPreview.value = true;
  // Implementar lógica de vista previa
};

// Función mejorada para generar informes
const generateReport = async () => {
  isGenerating.value = true;
  error.value = '';

  try {
    // Determinar qué datos incluir según el tipo de informe
    let reportData: any[] = [];
    const title =
      customTitle.value ||
      `Informe de ${availableReports.find((r) => r.id === selectedReport.value)?.name}`;

    switch (selectedReport.value) {
    case 'students':
      reportData = await getStudentsReportData();
      break;
    case 'teachers':
      reportData = await getTeachersReportData();
      break;
    case 'attendance':
      reportData = await getAttendanceReportData();
      break;
    case 'progress':
      reportData = await getProgressReportData();
      break;
      // Otros casos...
    default:
      throw new Error('Tipo de informe no válido');
    }

    // Filtrar columnas si es necesario
    if (customColumns.value.length > 0) {
      reportData = reportData.map((item) => {
        const filteredItem: Record<string, any> = {};
        customColumns.value.forEach((col) => {
          if (item[col] !== undefined) {
            filteredItem[col] = item[col];
          }
        });
        return filteredItem;
      });
    }

    // Generación del informe según el formato
    if (selectedFormat.value === 'pdf') {
      await generatePDFReport(reportData, title);
    } else {
      await generateExcelReport(reportData, title);
    }

    reportGenerated.value = true;
  } catch (err: any) {
    console.error('Error al generar el informe:', err);
    error.value = err.message || 'Error al generar el informe';
  } finally {
    isGenerating.value = false;
  }
};

// Funciones para obtener datos específicos de informe (implementaciones)
const getStudentsReportData = async () => {
  if (studentsStore.students.length === 0) {
    await studentsStore.fetchStudents();
  }

  let students = [...studentsStore.students];

  // Aplicar filtros si están seleccionados
  if (selectedInstruments.value.length > 0) {
    students = students.filter((student) => selectedInstruments.value.includes(student.instrumento));
  }

  if (selectedGroups.value.length > 0) {
    students = students.filter((student) =>
      student.grupo.some((g) => selectedGroups.value.includes(g) && g !== ''),
    );
  }

  // Mapear a formato de informe
  return students.map((student) => ({
    nombre: student.nombre,
    apellido: student.apellido,
    edad: student.edad,
    instrumento: student.instrumento,
    clase: student.clase,
    email: student.email,
    tlf: student.tlf,
    padre: student.padre || '',
    madre: student.madre || '',
    tlf_padre: student.tlf_padre || '',
    tlf_madre: student.tlf_madre || '',
    fecInscripcion: student.fecInscripcion,
  }));
};

// ... otras funciones para obtener datos específicos

// Generar informe PDF
const generatePDFReport = async (data: any[], title: string) => {
  // Implementación de generación de PDF con jsPDF
  const doc = new jsPDF({
    orientation: pageOrientation.value,
    unit: 'mm',
    format: 'a4',
  });

  // Añadir título
  const textColor =
    colorSchemes.find((cs) => cs.id === selectedColorScheme.value)?.primary || '#0ea5e9';
  doc.setTextColor(textColor);
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Añadir fecha
  doc.setFontSize(10);
  doc.setTextColor('#666666');
  doc.text(`Generado: ${format(new Date(), 'PPP', { locale: es })}`, 14, 30);

  // Configurar tablas y datos
  if (data.length > 0) {
    const columns = Object.keys(data[0]).map((key) => ({
      header: key.charAt(0).toUpperCase() + key.slice(1),
      dataKey: key,
    }));

    // @ts-ignore - tipo para autoTable
    doc.autoTable({
      startY: 40,
      head: [columns.map((col) => col.header)],
      body: data.map((row) => columns.map((col) => row[col.dataKey] || '')),
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: textColor,
        textColor: '#ffffff',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: '#f8fafc',
      },
    });
  } else {
    doc.setTextColor('#666666');
    doc.text('No hay datos disponibles para este informe', 14, 40);
  }

  // Añadir pie de página si está habilitado
  if (includeFooter.value) {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#666666');
      doc.text(footerText.value, 14, doc.internal.pageSize.height - 10);
    }
  }

  // Guardar/descargar el PDF
  const pdfOutput = doc.output('datauristring');
  reportUrl.value = pdfOutput;

  // Si no estamos en vista previa, descargar automáticamente
  if (!showPreview.value) {
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
};

// Generar informe Excel (reemplazando XLSX con ExcelJS)
const generateExcelReport = async (data: any[], title: string) => {
  // Crear libro de trabajo con ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Music Academy App';
  workbook.lastModifiedBy = 'Music Academy App';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Crear hoja con nombre limitado a 31 caracteres (límite de Excel)
  const worksheet = workbook.addWorksheet(title.substring(0, 31));

  if (data.length > 0) {
    // Añadir encabezados
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Dar formato a los encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2980B9' }, // Azul
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Añadir filas de datos
    data.forEach((item) => {
      const row = [];
      headers.forEach((header) => {
        row.push(item[header] || '');
      });
      worksheet.addRow(row);
    });

    // Autoajustar ancho de columnas
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 10;
        maxLength = Math.max(maxLength, cellLength);
      });
      column.width = Math.min(maxLength + 2, 30); // Limitar ancho máximo
    });
  }

  // Guardar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);

  // Crear enlace de descarga
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

  // Si no estamos en vista previa, descargar automáticamente
  if (!showPreview.value) {
    anchor.click();
  } else {
    reportUrl.value = url;
  }

  // Liberar recursos
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

// Métodos auxiliares para la interfaz de usuario
const resetForm = () => {
  selectedReport.value = '';
  selectedFormat.value = 'pdf';
  customTitle.value = '';
  includeCharts.value = true;
  selectedFilters.value = [];
  isConfiguring.value = false;
  reportGenerated.value = false;
  showPreview.value = false;
  reportUrl.value = '';
  error.value = '';
};

const startOver = () => {
  resetForm();
  showAdvancedOptions.value = false;
};

// Cargar datos al montar el componente
onMounted(async () => {
  try {
    await Promise.all([
      studentsStore.fetchStudents(),
      teachersStore.fetchTeachers(),
      classesStore.fetchClasses(),
      contentsStore.fetchContents(),
    ]);
  } catch (err) {
    console.error('Error al cargar datos iniciales:', err);
  }
});
</script>
