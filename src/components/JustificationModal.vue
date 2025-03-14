<template>
  <div v-if="show" class="modal">
    <div class="modal-content">
      <span class="close" @click="closeModal">&times;</span>
      <h2>Justificación</h2>
      <textarea v-model="justification" placeholder="Ingresa tu justificación"></textarea>
      <input type="file" @change="handleFileUpload" />
      <button @click="submitJustification">Enviar</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    show: Boolean,
    student: Object,
    class: Object,
    date: String,
    attendanceStatus: String
  },
  data() {
    return {
      justification: ''
    };
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    handleFileUpload(event) {
      // Lógica para manejar la subida de archivos
    },
    submitJustification() {
      // Lógica para enviar la justificación
    }
  }
};
</script>

<style scoped>
/* Estilos específicos para el componente */
</style>
