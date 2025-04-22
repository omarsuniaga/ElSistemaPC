<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentsStore } from "../store/students"
import ConfirmModal from '../components/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const studentsStore = useStudentsStore()

const studentId = String(route.params.id)
const student = computed(() => studentsStore.students.find(s => s.id.toString() === studentId))

const handleConfirm = () => {
  studentsStore.deleteStudent(String(studentId))
  router.push('/students')
}

const handleCancel = () => {
  router.push(`/students/${studentId}`)
}
</script>

<template>
  <ConfirmModal
    :is-open="true"
    title="Eliminar Alumno"
    :message="`¿Estás seguro que deseas eliminar al alumno ${student?.nombre} ${student?.apellido}? Esta acción no se puede deshacer.`"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>