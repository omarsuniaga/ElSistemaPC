<template>
  <div class="attendance-list-test">
    <h1>Test AttendanceList Component</h1>
    
    <div class="test-controls">
      <div class="form-group">
        <label>Class ID:</label>
        <input v-model="testClassId" type="text" placeholder="Enter class ID">
      </div>
      <div class="form-group">
        <label>Date:</label>
        <input v-model="testDate" type="date">
      </div>
      <button @click="loadComponent" :disabled="!testClassId || !testDate">
        Load AttendanceList
      </button>
    </div>

    <div v-if="showComponent" class="component-container">
      <AttendanceList 
        :classId="testClassId" 
        :date="testDate" 
      />
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AttendanceList from '../components/AttendanceList.vue'

const testClassId = ref('')
const testDate = ref(new Date().toISOString().split('T')[0])
const showComponent = ref(false)
const error = ref('')

const loadComponent = () => {
  try {
    error.value = ''
    showComponent.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error loading component'
  }
}
</script>

<style scoped>
.attendance-list-test {
  padding: 20px;
}

.test-controls {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.component-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}
</style>
