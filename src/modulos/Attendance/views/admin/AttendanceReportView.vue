<template>
  <div class="p-4">
    <!-- Botón para volver atrás -->
    <button 
      @click="$router.go(-1)" 
      class="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 text-gray-700"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>
      Volver
    </button>
    
    <!-- Contenido del reporte -->
    <div class="reporte-container">
      <div class="header">
        <h1>📊 Reporte Completo de Asistencias</h1>
        <h2>Omar Orquesta Infantil - Junio/Julio 2025</h2>
        <p>Período: 17/06 - 08/07/2025 | 11 Fechas de Clase</p>
      </div>

      <div class="summary">
        <h3>📈 Estadísticas Generales</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <strong>{{ estudiantesData.length }}</strong>
            <span>Estudiantes Total</span>
          </div>
          <div class="summary-item">
            <strong>11</strong>
            <span>Fechas de Clase</span>
          </div>
          <div class="summary-item">
            <strong>{{ promedioAsistencia }}%</strong>
            <span>Asistencia Promedio</span>
          </div>
          <div class="summary-item">
            <strong>{{ filteredEstudiantes.length }}</strong>
            <span>Estudiantes Mostrados</span>
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="filters">
          <input 
            v-model="searchTerm" 
            type="text" 
            class="filter-input" 
            placeholder="🔍 Buscar por nombre..."
            @input="applyFilters"
          >
          <select 
            v-model="asistenciaFilter" 
            class="filter-input"
            @change="applyFilters"
          >
            <option value="">📊 Todos los niveles</option>
            <option value="alta">🟢 Asistencia Alta (≥80%)</option>
            <option value="media">🟡 Asistencia Media (50-79%)</option>
            <option value="baja">🔴 Asistencia Baja (<50%)</option>
          </select>
          <button class="filter-button" @click="clearFilters">
            🗑️ Limpiar Filtros
          </button>
        </div>
        
        <div class="status-info">
          <span>{{ filterStatus }}</span>
          <span>Haz clic en las columnas para ordenar ↕️</span>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th 
                v-for="column in columns" 
                :key="column.key"
                :class="{ 'sortable': column.sortable }"
                @click="column.sortable ? sortTable(column.key) : null"
              >
                {{ column.label }}
                <span v-if="sortConfig.key === column.key" class="sort-icon">
                  {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(estudiante, index) in sortedEstudiantes" :key="estudiante.nombre">
              <td>{{ index + 1 }}</td>
              <td>{{ estudiante.nombre }}</td>
              <td>{{ estudiante.presente }}</td>
              <td>{{ estudiante.ausente }}</td>
              <td>{{ estudiante.tarde }}</td>
              <td>{{ estudiante.justificado }}</td>
              <td>{{ estudiante.retirado }}</td>
              <td>{{ estudiante.totalClases }}</td>
              <td :class="getAsistenciaClass(estudiante.porcentajeAsistencia)">
                {{ estudiante.porcentajeAsistencia }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Datos de ejemplo (reducidos para la demostración)
const estudiantesData = [
  {
    "nombre": "Aarón Di Lorenzo",
    "presente": 3,
    "ausente": 0,
    "tarde": 0,
    "justificado": 8,
    "retirado": 0,
    "totalClases": 11,
    "porcentajeAsistencia": 100
  },
  {
    "nombre": "Agostina Celeste Nardelli",
    "presente": 2,
    "ausente": 7,
    "tarde": 0,
    "justificado": 2,
    "retirado": 0,
    "totalClases": 11,
    "porcentajeAsistencia": 36.4
  }
  // ... más datos de estudiantes ...
];

// Estado reactivo
const searchTerm = ref('');
const asistenciaFilter = ref('');
const sortConfig = ref({
  key: 'nombre',
  direction: 'asc'
});

// Columnas de la tabla
const columns = [
  { key: 'nombre', label: 'Nombre Completo', sortable: true },
  { key: 'presente', label: 'Presente', sortable: true },
  { key: 'ausente', label: 'Ausente', sortable: true },
  { key: 'tarde', label: 'Tarde', sortable: true },
  { key: 'justificado', label: 'Justificado', sortable: true },
  { key: 'retirado', label: 'Retirado', sortable: true },
  { key: 'totalClases', label: 'Total Clases', sortable: true },
  { key: 'porcentajeAsistencia', label: '% Asistencia', sortable: true },
];

// Computed properties
const filteredEstudiantes = computed(() => {
  return estudiantesData.filter(estudiante => {
    const matchesSearch = estudiante.nombre.toLowerCase().includes(searchTerm.value.toLowerCase());
    
    let matchesFilter = true;
    if (asistenciaFilter.value === 'alta') {
      matchesFilter = estudiante.porcentajeAsistencia >= 80;
    } else if (asistenciaFilter.value === 'media') {
      matchesFilter = estudiante.porcentajeAsistencia >= 50 && estudiante.porcentajeAsistencia < 80;
    } else if (asistenciaFilter.value === 'baja') {
      matchesFilter = estudiante.porcentajeAsistencia < 50;
    }
    
    return matchesSearch && matchesFilter;
  });
});

const sortedEstudiantes = computed(() => {
  const sorted = [...filteredEstudiantes.value];
  
  return sorted.sort((a, b) => {
    let aValue = a[sortConfig.value.key];
    let bValue = b[sortConfig.value.key];
    
    // Manejar ordenación numérica para porcentajes
    if (sortConfig.value.key === 'porcentajeAsistencia') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    if (aValue < bValue) {
      return sortConfig.value.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.value.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
});

const promedioAsistencia = computed(() => {
  if (filteredEstudiantes.value.length === 0) return 0;
  const total = filteredEstudiantes.value.reduce((sum, estudiante) => {
    return sum + estudiante.porcentajeAsistencia;
  }, 0);
  return (total / filteredEstudiantes.value.length).toFixed(1);
});

const filterStatus = computed(() => {
  if (searchTerm.value || asistenciaFilter.value) {
    let status = `Mostrando ${filteredEstudiantes.value.length} de ${estudiantesData.length} estudiantes`;
    if (searchTerm.value) status += ` que coinciden con "${searchTerm.value}"`;
    if (asistenciaFilter.value) {
      const filterText = {
        'alta': 'con Asistencia Alta',
        'media': 'con Asistencia Media',
        'baja': 'con Asistencia Baja'
      }[asistenciaFilter.value];
      status += ` ${filterText}`;
    }
    return status;
  }
  return `Mostrando todos los estudiantes (${estudiantesData.length})`;
});

// Métodos
function getAsistenciaClass(porcentaje) {
  if (porcentaje >= 80) return 'asistencia-alta';
  if (porcentaje >= 50) return 'asistencia-media';
  return 'asistencia-baja';
}

function sortTable(key) {
  if (sortConfig.value.key === key) {
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortConfig.value.key = key;
    sortConfig.value.direction = 'asc';
  }
}

function applyFilters() {
  // Los filtros se aplican automáticamente a través de las computed properties
}

function clearFilters() {
  searchTerm.value = '';
  asistenciaFilter.value = '';
}
</script>

<style scoped>
/* Estilos del contenedor principal */
.reporte-container {
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* Estilos del encabezado */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.header h2 {
  margin: 5px 0 0;
  font-size: 18px;
  font-weight: 500;
}

.header p {
  margin: 5px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

/* Estilos del resumen */
.summary {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #4a5568;
  font-size: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.summary-item {
  background: #f8f9fc;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  border-left: 4px solid #667eea;
}

.summary-item strong {
  display: block;
  font-size: 24px;
  color: #4a5568;
  margin-bottom: 5px;
}

.summary-item span {
  font-size: 12px;
  color: #718096;
}

/* Controles de filtro */
.controls {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  flex: 1;
  min-width: 200px;
  outline: none;
  transition: border-color 0.2s;
}

.filter-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.filter-button {
  background-color: #e2e8f0;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;
}

.filter-button:hover {
  background-color: #cbd5e0;
}

.status-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #4a5568;
  margin-top: 5px;
}

/* Estilos de la tabla */
.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #4a5568;
  position: sticky;
  top: 0;
  z-index: 10;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background-color: #f1f5f9;
}

.sort-icon {
  margin-left: 5px;
  font-weight: bold;
}

tbody tr:hover {
  background-color: #f8fafc;
}

/* Clases de asistencia */
.asistencia-alta {
  color: #10b981;
  font-weight: 600;
}

.asistencia-media {
  color: #f59e0b;
  font-weight: 600;
}

.asistencia-baja {
  color: #ef4444;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 992px) {
  .filters {
    flex-direction: column;
  }
  
  .filter-input, .filter-button {
    width: 100%;
  }
  
  .status-info {
    flex-direction: column;
    gap: 5px;
  }
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 20px;
  }
  
  .header h2 {
    font-size: 16px;
  }
  
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  th, td {
    padding: 8px 10px;
    font-size: 13px;
  }
  
  .asistencia-alta,
  .asistencia-media,
  .asistencia-baja {
    font-weight: normal;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .header h1 {
    font-size: 18px;
  }
  
  .header h2 {
    font-size: 14px;
  }
  
  .header p {
    font-size: 12px;
  }
  
  th, td {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>
