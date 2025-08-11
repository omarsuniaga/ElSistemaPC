<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Justificar Ausencia</h3>
        <button @click="$emit('close')" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="student" class="student-info">
          <div class="student-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="student-details">
            <h4>{{ student.nombre }} {{ student.apellido }}</h4>
            <p class="student-id">ID: {{ student.id }}</p>
          </div>
        </div>

        <div class="form-group">
          <label for="justification-reason">Motivo de la justificación *</label>
          <textarea
            id="justification-reason"
            v-model="localJustification"
            placeholder="Describe el motivo de la ausencia (enfermedad, emergencia familiar, etc.)"
            rows="4"
            class="form-textarea"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label>Documentos adjuntos (opcional)</label>
          <div class="file-upload-area">
            <input
              type="file"
              id="justification-files"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              @change="handleFileUpload"
              class="file-input"
            />
            <label for="justification-files" class="file-upload-label">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Seleccionar archivos</span>
            </label>
          </div>
          
          <div v-if="attachedFiles.length > 0" class="attached-files">
            <h5>Archivos adjuntos:</h5>
            <div v-for="(file, index) in attachedFiles" :key="index" class="file-item">
              <i class="fas fa-file"></i>
              <span>{{ file.name }}</span>
              <button @click="removeFile(index)" class="remove-file-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">
          Cancelar
        </button>
        <button 
          @click="handleSave" 
          class="btn btn-primary"
          :disabled="!localJustification.trim()"
        >
          Guardar Justificación
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  visible: boolean
  student: any
  justification?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'save', justification: string): void
}

const props = withDefaults(defineProps<Props>(), {
  justification: ''
})

const emit = defineEmits<Emits>()

const localJustification = ref('')
const attachedFiles = ref<File[]>([])

// Watch for prop changes
watch(() => props.justification, (newValue) => {
  localJustification.value = newValue || ''
}, { immediate: true })

watch(() => props.visible, (newValue) => {
  if (newValue) {
    localJustification.value = props.justification || ''
    attachedFiles.value = []
  }
})

const handleOverlayClick = () => {
  emit('close')
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    attachedFiles.value = Array.from(target.files)
  }
}

const removeFile = (index: number) => {
  attachedFiles.value.splice(index, 1)
}

const handleSave = () => {
  if (localJustification.value.trim()) {
    emit('save', localJustification.value.trim())
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.25rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.modal-body {
  padding: 1.5rem;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.student-avatar {
  width: 50px;
  height: 50px;
  background-color: #3498db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.student-details h4 {
  margin: 0 0 0.25rem 0;
  color: #495057;
}

.student-id {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.file-upload-area {
  margin-bottom: 1rem;
}

.file-input {
  display: none;
}

.file-upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #6c757d;
}

.file-upload-label:hover {
  background-color: #e9ecef;
  border-color: #3498db;
  color: #3498db;
}

.attached-files {
  margin-top: 1rem;
}

.attached-files h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.file-item i {
  color: #6c757d;
}

.file-item span {
  flex: 1;
  font-size: 0.9rem;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-file-btn:hover {
  background-color: #f5c6cb;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .student-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>
