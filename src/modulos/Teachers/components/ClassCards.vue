<template>
  <div class="class-cards-container">
    <div v-for="classItem in classes" :key="classItem.id" class="class-card">
      <h3>{{ classItem.name }}</h3>
      <p>{{ classItem.schedule }}</p>
      <p>{{ classItem.teacher }}</p>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ClassCards',
  props: {
    classes: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped>
.class-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.class-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>