import { ref, computed } from 'vue'
import Chart from 'chart.js/auto'
import { format, parseISO, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Composable para manejar las gráficas del informe de asistencia
 */
export function useAttendanceCharts() {
  // Referencias para gráficas
  const chartDates = ref<HTMLCanvasElement | null>(null)
  const chartWeekday = ref<HTMLCanvasElement | null>(null)
  let chart1: any, chart2: any

  // Modo oscuro
  const isDarkMode = computed(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Preparar datos para las gráficas
  const prepareChartData = (classReports: any[]) => {
    // Recopilar fechas relevantes
    const relevantDates = new Set<string>()
    
    classReports.forEach(classData => {
      if (classData.relevantDates && Array.isArray(classData.relevantDates)) {
        classData.relevantDates
          .filter(date => date && typeof date === 'string')
          .forEach(date => {
            try {
              const parsedDate = parseISO(date)
              if (!isNaN(parsedDate.getTime())) {
                relevantDates.add(date)
              }
            } catch (err) {
              console.warn(`Error adding date ${date}:`, err)
            }
          })
      }
    })

    const sortedRelevantDates = Array.from(relevantDates).sort()
    const limitedDates = sortedRelevantDates.length > 15 
      ? [
          ...sortedRelevantDates.slice(0, 7), 
          ...sortedRelevantDates.slice(sortedRelevantDates.length - 8)
        ]
      : sortedRelevantDates

    // Datos por fecha
    const attendanceByDate = limitedDates.map(date => {
      let presentes = 0, ausentes = 0, tardes = 0, justificados = 0, total = 0
      
      classReports.forEach(classData => {
        classData.students.forEach((student: any) => {
          if (student.attendance[date]) {
            const status = student.attendance[date]
            if (status === 'P') presentes++
            else if (status === 'A') ausentes++
            else if (status === 'T') tardes++
            else if (status === 'J') justificados++
            
            if (status !== '-') total++
          }
        })
      })
      
      return { 
        date, 
        presentes, 
        ausentes, 
        tardes, 
        justificados,
        presentesPct: total > 0 ? (presentes / total) * 100 : 0,
        ausentesPct: total > 0 ? (ausentes / total) * 100 : 0,
        tardesPct: total > 0 ? (tardes / total) * 100 : 0,
        justificadosPct: total > 0 ? (justificados / total) * 100 : 0
      }
    })

    // Datos por día de la semana
    const attendanceByWeekday = [0, 0, 0, 0, 0, 0, 0]
    const totalByWeekday = [0, 0, 0, 0, 0, 0, 0]

    for (const classData of classReports) {
      for (const date of classData.relevantDates || []) {
        if (!date) continue
        
        try {
          const parsedDate = parseISO(date)
          if (isNaN(parsedDate.getTime())) continue
          
          const dayOfWeek = getDay(parsedDate)
          
          for (const student of classData.students) {
            const status = student.attendance[date]
            if (status === 'P' || status === 'J') {
              attendanceByWeekday[dayOfWeek]++
            }
            if (status !== '-') {
              totalByWeekday[dayOfWeek]++
            }
          }
        } catch (err) {
          console.warn(`Error processing date ${date}:`, err)
          continue
        }
      }
    }

    const avgByWeekday = attendanceByWeekday.map((count, dayIndex) => ({
      day: dayIndex,
      avgPct: totalByWeekday[dayIndex] > 0 ? (count / totalByWeekday[dayIndex]) * 100 : 0,
      hasData: totalByWeekday[dayIndex] > 0
    })).filter(item => item.hasData)

    return { attendanceByDate, avgByWeekday }
  }

  // Formatear fecha corta para gráficas
  const formatDateShort = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      return format(date, 'd MMM', { locale: es })
    } catch (e) {
      return dateStr
    }
  }

  // Dibujar gráficas
  const drawCharts = (classReports: any[]) => {
    try {
      const chartData = prepareChartData(classReports)
      
      // Limpiar gráficos anteriores
      if (chart1) chart1.destroy()
      if (chart2) chart2.destroy()

      if (chartData.attendanceByDate.length === 0) {
        console.log("No hay datos suficientes para generar gráficos")
        return
      }

      const darkMode = isDarkMode.value
      const textColor = darkMode ? '#e5e7eb' : '#374151'
      const gridColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

      // Gráfica de barras por fecha
      if (chartDates.value) {
        chart1 = new Chart(chartDates.value, {
          type: 'bar',
          data: {
            labels: chartData.attendanceByDate.map(d => formatDateShort(d.date)),
            datasets: [
              {
                label: 'Presentes',
                data: chartData.attendanceByDate.map(d => d.presentesPct),
                backgroundColor: '#10b981'
              },
              {
                label: 'Ausentes',
                data: chartData.attendanceByDate.map(d => d.ausentesPct),
                backgroundColor: '#ef4444'
              },
              {
                label: 'Tardes',
                data: chartData.attendanceByDate.map(d => d.tardesPct),
                backgroundColor: '#f59e0b'
              },
              {
                label: 'Justificados',
                data: chartData.attendanceByDate.map(d => d.justificadosPct),
                backgroundColor: '#3b82f6'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { color: textColor }
              },
              tooltip: {
                callbacks: {
                  label: function(context: any) {
                    const value = context.raw as number
                    const dataIndex = context.dataIndex
                    const datasetIndex = context.datasetIndex
                    const record = chartData.attendanceByDate[dataIndex]
                    
                    let absoluteValue = 0
                    if (datasetIndex === 0) absoluteValue = record.presentes
                    else if (datasetIndex === 1) absoluteValue = record.ausentes
                    else if (datasetIndex === 2) absoluteValue = record.tardes
                    else if (datasetIndex === 3) absoluteValue = record.justificados
                    
                    return `${context.dataset.label}: ${absoluteValue} (${value.toFixed(1)}%)`
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: { 
                  color: textColor,
                  autoSkip: true,
                  maxRotation: 45,
                  minRotation: 45
                },
                grid: { color: gridColor }
              },
              y: {
                ticks: { color: textColor },
                grid: { color: gridColor },
                stacked: true,
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Porcentaje (%)',
                  color: textColor
                }
              }
            }
          }
        })
      }

      // Gráfica por día de la semana
      if (chartWeekday.value && chartData.avgByWeekday.length > 0) {
        chart2 = new Chart(chartWeekday.value, {
          type: 'bar',
          data: {
            labels: chartData.avgByWeekday.map(w => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][w.day]),
            datasets: [{
              label: '% asistencia promedio',
              data: chartData.avgByWeekday.map(w => w.avgPct),
              backgroundColor: darkMode ? '#60a5fa' : '#3b82f6',
              borderColor: darkMode ? '#3b82f6' : '#2563eb',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { color: textColor }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw as number
                    return `Asistencia: ${value.toFixed(1)}%`
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: { color: textColor },
                grid: { color: gridColor }
              },
              y: {
                ticks: { color: textColor },
                grid: { color: gridColor },
                beginAtZero: true,
                suggestedMax: 100,
                title: {
                  display: true,
                  text: 'Porcentaje de Asistencia',
                  color: textColor
                }
              }
            }
          }
        })
      }
    } catch (error) {
      console.error("Error al dibujar gráficas:", error)
    }
  }

  // Cleanup
  const destroyCharts = () => {
    if (chart1) chart1.destroy()
    if (chart2) chart2.destroy()
  }

  return {
    chartDates,
    chartWeekday,
    drawCharts,
    destroyCharts,
    prepareChartData
  }
}
