<template>
  <div class="group-selector">
    <h2>Selecciona un Grupo</h2>
    <div v-if="loading" class="loading">Cargando grupos...</div>
    <div v-else class="group-list">
      <div v-for="group in groups" :key="group.id" class="group-card" @click="selectGroup(group)">
        {{ group.name }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      groups: [],
      loading: true,
    };
  },
  async created() {
    await this.fetchGroups();
  },
  methods: {
    async fetchGroups() {
      try {
        const querySnapshot = await firestore.collection('groups').get();
        this.groups = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        this.loading = false;
      }
    },
    selectGroup(group) {
      this.$store.commit('setSelectedGroup', group);
      this.$emit('group-selected', group);
    },
  },
};
</script>

<style scoped>
.group-selector {
  padding: 20px;
}
.loading {
  text-align: center;
}
.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.group-card {
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.group-card:hover {
  transform: scale(1.05);
}
</style>
