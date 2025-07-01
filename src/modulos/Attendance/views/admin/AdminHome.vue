<script setup lang="ts">
/* ------------------------------------------------------------------
 * Attendance Admin Home – nueva vista compacta
 * ------------------------------------------------------------------
 * 1. Orquesta header, calendario, list y modales usando composables limpios.
 * 2. Solo importa componentes UI puros; la lógica está en composables.
 * ------------------------------------------------------------------ */
import {onMounted} from "vue"

import AttendanceHeader from "../../components/AttendanceHeader.vue"
import AttendanceList from "../../components/AttendanceList.vue"
import Calendar from "@/components/Calendar.vue"

import {useAttendanceState} from "../../composables/useAttendanceState"
import {useModal} from "../../composables/useModal"
import {useToast} from "../../composables/useToast"

/* ---------- state global para admin ---------- */
const state = useAttendanceState("admin")
const modal = useModal()
const toast = useToast()

onMounted(() => state.init())

/* ---------- handlers ---------- */
function handleSaved() {
  toast.success("Asistencia guardada")
}
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <AttendanceHeader
      :selected-date="state.selectedDate.value"
      :selected-class="state.selectedClass.value"
      :view="state.view.value"
      :show-analytics="false"
      role="Director"
      @analytics="modal.open('analytics')"
      @report="modal.open('report')"
      @export="modal.open('export')"
      @emergency="modal.open('emergency')"
      @change-view="state.view = $event"
    />

    <!-- Body depending on view -->
    <Calendar
      v-if="state.view === 'calendar'"
      :selected-date="state.selectedDate"
      @select="
        state.setDate($event)
        state.view = 'class-select'
      "
      @change="state.setDate($event)"
      @close="state.view = 'calendar'"
      @create="modal.open('create')"
      @edit="modal.open('edit')"
      @delete="modal.open('delete')"
      @saved="handleSaved"
      @analytics="modal.open('analytics')"
      @report="modal.open('report')"
      @export="modal.open('export')"
      @emergency="modal.open('emergency')"
    />

    <div v-else-if="state.view === 'class-select'">
      <select
        v-model="state.selectedClass"
        class="border rounded p-2"
        @change="
          state.view = 'attendance-form'
          state.loadCurrent()
        "
        @close="state.view = 'calendar'"
        @create="modal.open('create')"
        @edit="modal.open('edit')"
        @delete="modal.open('delete')"
        @saved="handleSaved"
        @analytics="modal.open('analytics')"
      >
        <option disabled value="">Seleccione clase…</option>
        <option v-for="c in state.classOptions" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>
    </div>

    <AttendanceList
      v-else-if="state.view === 'attendance-form'"
      :selected-date="state.selectedDate"
      :selected-class="state.selectedClass"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
/* contenedor simple */
</style>
