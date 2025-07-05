/**
 * Script de debug para verificar el funcionamiento del modal de clases
 * Ejecutar en la consola del navegador cuando estés en el dashboard
 */

// Función para verificar el estado actual del dashboard
function debugDashboardState() {
  console.log("🔍 [DEBUG] Verificando estado del dashboard...");
  
  // Verificar si Vue está disponible
  if (typeof window.Vue !== 'undefined') {
    console.log("✅ Vue está disponible");
  } else {
    console.log("❌ Vue no está disponible");
  }
  
  // Verificar elementos del DOM
  const calendarElement = document.querySelector('[data-testid="attendance-calendar"]') || 
                          document.querySelector('.attendance-calendar') ||
                          document.querySelector('[class*="calendar"]');
  
  if (calendarElement) {
    console.log("✅ Elemento del calendario encontrado:", calendarElement);
  } else {
    console.log("❌ Elemento del calendario no encontrado");
  }
  
  // Verificar si hay días clickeables
  const dayElements = document.querySelectorAll('[class*="day"], [data-date], button[class*="calendar"]');
  console.log(`📅 Elementos de días encontrados: ${dayElements.length}`);
  
  if (dayElements.length > 0) {
    console.log("✅ Primeros 3 elementos de días:", Array.from(dayElements).slice(0, 3));
    
    // Agregar event listeners para debug
    dayElements.forEach((day, index) => {
      if (index < 5) { // Solo los primeros 5 para no saturar
        day.addEventListener('click', function(e) {
          console.log(`🖱️ [DEBUG] Día clickeado:`, {
            element: this,
            dataset: this.dataset,
            textContent: this.textContent,
            className: this.className
          });
        });
      }
    });
  }
  
  // Verificar si hay modales en el DOM
  const modalElements = document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="overlay"]');
  console.log(`🎭 Elementos de modal encontrados: ${modalElements.length}`);
  
  // Verificar funciones globales de debug
  if (typeof window.debugClassData === 'function') {
    console.log("✅ Función debugClassData disponible");
    window.debugClassData();
  } else {
    console.log("❌ Función debugClassData no disponible");
  }
}

// Función para simular click en una fecha
function simulateCalendarClick(dateString) {
  console.log(`🎯 [DEBUG] Intentando simular click en fecha: ${dateString}`);
  
  // Buscar elemento con la fecha
  const dayElements = document.querySelectorAll('*');
  let targetElement = null;
  
  for (let el of dayElements) {
    if (el.textContent && el.textContent.trim() === dateString) {
      if (el.tagName === 'BUTTON' || el.onclick || el.classList.contains('cursor-pointer')) {
        targetElement = el;
        break;
      }
    }
    
    // También buscar por data attributes
    if (el.dataset && el.dataset.date === dateString) {
      targetElement = el;
      break;
    }
  }
  
  if (targetElement) {
    console.log("✅ Elemento objetivo encontrado:", targetElement);
    targetElement.click();
  } else {
    console.log("❌ No se encontró elemento clickeable para la fecha");
  }
}

// Función para verificar datos de clases
function debugClassesData() {
  console.log("📚 [DEBUG] Verificando datos de clases...");
  
  // Verificar localStorage/sessionStorage
  const storageKeys = Object.keys(localStorage).filter(key => 
    key.includes('class') || key.includes('attendance') || key.includes('teacher')
  );
  
  console.log("🗄️ Keys relevantes en localStorage:", storageKeys);
  
  storageKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`📋 ${key}:`, data);
    } catch (e) {
      console.log(`📋 ${key}:`, localStorage.getItem(key));
    }
  });
}

// Ejecutar todas las verificaciones
console.log("🚀 [DEBUG] Iniciando verificaciones del calendario...");
debugDashboardState();
debugClassesData();

// Exponer funciones globalmente para uso manual
window.debugDashboardState = debugDashboardState;
window.simulateCalendarClick = simulateCalendarClick;
window.debugClassesData = debugClassesData;

console.log(`
📖 [DEBUG] Funciones disponibles:
- debugDashboardState() - Verificar estado del dashboard
- simulateCalendarClick('5') - Simular click en día 5
- debugClassesData() - Verificar datos de clases
`);
