<template>
  <div class="date-range-selector">
    <div class="period-tabs">
      <div class="tab-group">
        <button
          v-for="option in periodOptions"
          :key="option.value"
          :class="['tab-button', { active: selectedPeriod === option.value }]"
          @click="$emit('period-changed', option.value)"
        >
          <i :class="option.icon"></i>
          <span>{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- Custom date range inputs -->
    <div v-if="selectedPeriod === 'custom'" class="custom-range-inputs">
      <div class="date-input-group">
        <label for="start-date">Fecha inicio:</label>
        <input
          id="start-date"
          type="date"
          :value="customDateRange.start"
          @input="updateStartDate($event.target.value)"
          class="date-input"
        >
      </div>
      
      <div class="date-input-group">
        <label for="end-date">Fecha fin:</label>
        <input
          id="end-date"
          type="date"
          :value="customDateRange.end"
          @input="updateEndDate($event.target.value)"
          class="date-input"
        >
      </div>
      
      <button 
        @click="applyCustomRange"
        :disabled="!isCustomRangeValid"
        class="apply-range-btn"
      >
        <i class="fas fa-check"></i>
        Aplicar
      </button>
    </div>

    <!-- Current range display -->
    <div class="current-range-display">
      <div class="range-info">
        <i class="fas fa-calendar-alt"></i>
        <span class="period-text">{{ selectedPeriodText }}</span>
        <span v-if="dateRangeText" class="date-text">{{ dateRangeText }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default {
  name: 'DateRangeSelector',
  props: {
    selectedPeriod: {
      type: String,
      required: true
    },
    customDateRange: {
      type: Object,
      required: true
    },
    selectedPeriodText: {
      type: String,
      required: true
    },
    actualDateRange: {
      type: Object,
      required: true
    }
  },
  emits: ['period-changed', 'custom-range-updated'],
  setup(props, { emit }) {
    const periodOptions = [
      { value: 'today', label: 'Hoy', icon: 'fas fa-clock' },
      { value: 'this_week', label: 'Esta semana', icon: 'fas fa-calendar-week' },
      { value: 'this_month', label: 'Este mes', icon: 'fas fa-calendar' },
      { value: 'last_week', label: 'Semana pasada', icon: 'fas fa-step-backward' },
      { value: 'last_month', label: 'Mes pasado', icon: 'fas fa-history' },
      { value: 'custom', label: 'Personalizado', icon: 'fas fa-cog' }
    ]

    const isCustomRangeValid = computed(() => {
      return props.customDateRange.start && 
             props.customDateRange.end && 
             new Date(props.customDateRange.start) <= new Date(props.customDateRange.end)
    })

    const dateRangeText = computed(() => {
      const { start, end } = props.actualDateRange
      if (!start || !end) return ''

      try {
        const startDate = parseISO(start)
        const endDate = parseISO(end)
        
        if (start === end) {
          return format(startDate, 'dd \'de\' MMMM, yyyy', { locale: es })
        } else {
          return `${format(startDate, 'dd MMM', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`
        }
      } catch (error) {
        console.error('Error formatting dates:', error)
        return `${start} - ${end}`
      }
    })

    const updateStartDate = (value) => {
      emit('custom-range-updated', {
        ...props.customDateRange,
        start: value
      })
    }

    const updateEndDate = (value) => {
      emit('custom-range-updated', {
        ...props.customDateRange,
        end: value
      })
    }

    const applyCustomRange = () => {
      if (isCustomRangeValid.value) {
        emit('period-changed', 'custom')
      }
    }

    return {
      periodOptions,
      isCustomRangeValid,
      dateRangeText,
      updateStartDate,
      updateEndDate,
      applyCustomRange
    }
  }
}
</script>

<style scoped>
.date-range-selector {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.period-tabs {
  margin-bottom: 15px;
}

.tab-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e1e5e9;
  background: white;
  color: #6c757d;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tab-button:hover {
  border-color: #0d6efd;
  color: #0d6efd;
  background: #f8f9ff;
}

.tab-button.active {
  border-color: #0d6efd;
  background: #0d6efd;
  color: white;
}

.custom-range-inputs {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.date-input-group label {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  min-width: 140px;
}

.date-input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
}

.apply-range-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.apply-range-btn:hover:not(:disabled) {
  background: #218838;
}

.apply-range-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.current-range-display {
  border-top: 1px solid #e9ecef;
  padding-top: 15px;
}

.range-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #495057;
}

.range-info i {
  color: #0d6efd;
  font-size: 16px;
}

.period-text {
  font-weight: 600;
  color: #212529;
}

.date-text {
  color: #6c757d;
  font-size: 14px;
}

@media (max-width: 768px) {
  .tab-group {
    justify-content: center;
  }
  
  .tab-button {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .custom-range-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-input {
    min-width: 100%;
  }
}
</style>
