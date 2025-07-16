/**
 * 📊 PERFORMANCE ANALYZER - TEACHER ATTENDANCE DASHBOARD
 * Herramienta para medir y optimizar el rendimiento del dashboard
 */

class DashboardPerformanceAnalyzer {
  constructor() {
    this.metrics = {
      loadTimes: {},
      renderTimes: {},
      memoryUsage: {},
      cacheStats: {},
      networkRequests: [],
    };
    
    this.observers = new Map();
    this.startTime = performance.now();
  }

  /**
   * 🚀 Inicializar análisis de rendimiento
   */
  startAnalysis() {
    console.group('📊 Dashboard Performance Analysis Started');
    
    // Medir tiempo de carga inicial
    this.measureInitialLoad();
    
    // Observar cambios de vista
    this.observeViewChanges();
    
    // Monitorear uso de memoria
    this.startMemoryMonitoring();
    
    // Analizar requests de red
    this.analyzeNetworkRequests();
    
    // Medir cache efficiency
    this.analyzeCachePerformance();
    
    console.log('🎯 Performance monitoring active');
    console.groupEnd();
  }

  /**
   * ⏱️ Medir tiempo de carga inicial del dashboard
   */
  measureInitialLoad() {
    const startTime = performance.now();
    
    // Observar cuando el DOM esté listo
    const domObserver = new MutationObserver((mutations, observer) => {
      const dashboard = document.querySelector('[data-testid="teacher-dashboard"]') || 
                      document.querySelector('.teacher-dashboard') ||
                      document.querySelector('main');
      
      if (dashboard) {
        const domReadyTime = performance.now() - startTime;
        this.metrics.loadTimes.domReady = domReadyTime;
        
        // Observar cuando el contenido esté cargado
        setTimeout(() => {
          const calendar = document.querySelector('[data-testid="attendance-calendar"]') ||
                          document.querySelector('.calendar');
          const sidebar = document.querySelector('aside') || 
                         document.querySelector('.sidebar');
          
          if (calendar && sidebar) {
            const contentLoadedTime = performance.now() - startTime;
            this.metrics.loadTimes.contentLoaded = contentLoadedTime;
            this.logLoadTimes();
          }
        }, 100);
        
        observer.disconnect();
      }
    });
    
    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * 👁️ Observar cambios de vista
   */
  observeViewChanges() {
    const viewButtons = document.querySelectorAll('[data-view]');
    
    viewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const viewName = e.target.dataset.view;
        const startTime = performance.now();
        
        // Observar cuando la nueva vista esté renderizada
        requestAnimationFrame(() => {
          const renderTime = performance.now() - startTime;
          this.metrics.renderTimes[viewName] = renderTime;
          
          console.log(`🔄 View Change: ${viewName} - ${renderTime.toFixed(2)}ms`);
        });
      });
    });
  }

  /**
   * 💾 Monitorear uso de memoria
   */
  startMemoryMonitoring() {
    if ('memory' in performance) {
      const measureMemory = () => {
        const memory = performance.memory;
        const timestamp = Date.now();
        
        this.metrics.memoryUsage[timestamp] = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          allocated: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        };
      };
      
      // Medir cada 5 segundos
      setInterval(measureMemory, 5000);
      measureMemory(); // Medición inicial
    }
  }

  /**
   * 🌐 Analizar requests de red
   */
  analyzeNetworkRequests() {
    // Interceptar fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.metrics.networkRequests.push({
          url: url.toString(),
          duration: endTime - startTime,
          status: response.status,
          success: response.ok,
          timestamp: Date.now(),
        });
        
        // Log slow requests (>1s)
        if (endTime - startTime > 1000) {
          console.warn(`🐌 Slow Request: ${url} - ${(endTime - startTime).toFixed(2)}ms`);
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.metrics.networkRequests.push({
          url: url.toString(),
          duration: endTime - startTime,
          status: 'error',
          success: false,
          error: error.message,
          timestamp: Date.now(),
        });
        
        throw error;
      }
    };
  }

  /**
   * 🧠 Analizar eficiencia del cache
   */
  analyzeCachePerformance() {
    // Hook into Vue app if available
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      // Monitor cache hits/misses through Vue DevTools if available
      console.log('🔧 Vue DevTools detected - Enhanced cache monitoring available');
    }
    
    // Monitor localStorage cache if used
    if (typeof Storage !== 'undefined') {
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;
      
      let cacheHits = 0;
      let cacheMisses = 0;
      
      localStorage.setItem = function(key, value) {
        if (key.includes('attendance') || key.includes('cache')) {
          console.log(`💾 Cache Set: ${key}`);
        }
        return originalSetItem.apply(this, arguments);
      };
      
      localStorage.getItem = function(key) {
        const result = originalGetItem.apply(this, arguments);
        
        if (key.includes('attendance') || key.includes('cache')) {
          if (result) {
            cacheHits++;
            console.log(`✅ Cache Hit: ${key}`);
          } else {
            cacheMisses++;
            console.log(`❌ Cache Miss: ${key}`);
          }
          
          this.metrics.cacheStats = {
            hits: cacheHits,
            misses: cacheMisses,
            ratio: cacheHits / (cacheHits + cacheMisses) || 0,
          };
        }
        
        return result;
      }.bind(this);
    }
  }

  /**
   * 📋 Generar reporte de rendimiento
   */
  generateReport() {
    console.group('📊 DASHBOARD PERFORMANCE REPORT');
    
    // Load Times
    console.group('⏱️ Load Times');
    Object.entries(this.metrics.loadTimes).forEach(([key, time]) => {
      const status = time < 1000 ? '✅' : time < 2000 ? '⚠️' : '🚨';
      console.log(`${status} ${key}: ${time.toFixed(2)}ms`);
    });
    console.groupEnd();
    
    // Render Times
    console.group('🔄 View Transition Times');
    Object.entries(this.metrics.renderTimes).forEach(([view, time]) => {
      const status = time < 300 ? '✅' : time < 600 ? '⚠️' : '🚨';
      console.log(`${status} ${view}: ${time.toFixed(2)}ms`);
    });
    console.groupEnd();
    
    // Memory Usage
    console.group('💾 Memory Usage');
    const memoryEntries = Object.entries(this.metrics.memoryUsage);
    if (memoryEntries.length > 0) {
      const latest = memoryEntries[memoryEntries.length - 1][1];
      const status = latest.used < 20 ? '✅' : latest.used < 40 ? '⚠️' : '🚨';
      console.log(`${status} Current Usage: ${latest.used}MB / ${latest.allocated}MB`);
      console.log(`📊 Heap Limit: ${latest.limit}MB`);
    }
    console.groupEnd();
    
    // Network Requests
    console.group('🌐 Network Performance');
    const requests = this.metrics.networkRequests;
    const avgDuration = requests.reduce((sum, req) => sum + req.duration, 0) / requests.length || 0;
    const slowRequests = requests.filter(req => req.duration > 1000).length;
    
    console.log(`📈 Total Requests: ${requests.length}`);
    console.log(`⚡ Average Duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`🐌 Slow Requests (>1s): ${slowRequests}`);
    console.groupEnd();
    
    // Cache Stats
    console.group('🧠 Cache Performance');
    const cache = this.metrics.cacheStats;
    if (cache.hits || cache.misses) {
      const status = cache.ratio > 0.8 ? '✅' : cache.ratio > 0.6 ? '⚠️' : '🚨';
      console.log(`${status} Hit Ratio: ${(cache.ratio * 100).toFixed(1)}%`);
      console.log(`✅ Hits: ${cache.hits}`);
      console.log(`❌ Misses: ${cache.misses}`);
    }
    console.groupEnd();
    
    console.groupEnd();
    
    return this.metrics;
  }

  /**
   * 🎯 Obtener recomendaciones basadas en métricas
   */
  getRecommendations() {
    const recommendations = [];
    
    // Load time recommendations
    if (this.metrics.loadTimes.contentLoaded > 2000) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Slow initial load',
        solution: 'Implement parallel loading and lazy loading',
        impact: '60% faster initial load',
      });
    }
    
    // View transition recommendations
    const avgRenderTime = Object.values(this.metrics.renderTimes)
      .reduce((sum, time) => sum + time, 0) / Object.values(this.metrics.renderTimes).length || 0;
    
    if (avgRenderTime > 500) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Slow view transitions',
        solution: 'Optimize computed properties and implement view caching',
        impact: '50% faster view changes',
      });
    }
    
    // Memory recommendations
    const memoryEntries = Object.entries(this.metrics.memoryUsage);
    if (memoryEntries.length > 0) {
      const latest = memoryEntries[memoryEntries.length - 1][1];
      if (latest.used > 30) {
        recommendations.push({
          priority: 'MEDIUM',
          issue: 'High memory usage',
          solution: 'Implement cleanup routines and use shallowRef for large objects',
          impact: '40% less memory usage',
        });
      }
    }
    
    // Cache recommendations
    if (this.metrics.cacheStats.ratio < 0.7) {
      recommendations.push({
        priority: 'LOW',
        issue: 'Low cache hit ratio',
        solution: 'Optimize cache keys and increase TTL for stable data',
        impact: '20% better performance',
      });
    }
    
    return recommendations;
  }

  /**
   * 📊 Log de tiempos de carga
   */
  logLoadTimes() {
    console.group('⏱️ Load Time Analysis');
    
    const { domReady, contentLoaded } = this.metrics.loadTimes;
    
    console.log(`🏗️ DOM Ready: ${domReady?.toFixed(2)}ms`);
    console.log(`📦 Content Loaded: ${contentLoaded?.toFixed(2)}ms`);
    
    if (contentLoaded) {
      if (contentLoaded < 1000) {
        console.log('✅ Excellent load time!');
      } else if (contentLoaded < 2000) {
        console.log('⚠️ Good load time, room for improvement');
      } else {
        console.log('🚨 Slow load time, optimization needed');
      }
    }
    
    console.groupEnd();
  }

  /**
   * 🔄 Auto-generar reporte cada 30 segundos
   */
  startAutoReporting(interval = 30000) {
    setInterval(() => {
      console.clear();
      this.generateReport();
      
      const recommendations = this.getRecommendations();
      if (recommendations.length > 0) {
        console.group('💡 OPTIMIZATION RECOMMENDATIONS');
        recommendations.forEach(rec => {
          console.log(`${rec.priority === 'HIGH' ? '🚨' : rec.priority === 'MEDIUM' ? '⚠️' : '💡'} ${rec.issue}`);
          console.log(`   Solution: ${rec.solution}`);
          console.log(`   Impact: ${rec.impact}`);
        });
        console.groupEnd();
      }
    }, interval);
  }
}

// 🚀 Auto-inicialización si estamos en el dashboard
if (typeof window !== 'undefined') {
  window.DashboardPerformanceAnalyzer = DashboardPerformanceAnalyzer;
  
  // Auto-start si detectamos que estamos en el dashboard
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.href.includes('attendance') || 
          window.location.href.includes('dashboard')) {
        console.log('🚀 Starting Dashboard Performance Analysis...');
        window.performanceAnalyzer = new DashboardPerformanceAnalyzer();
        window.performanceAnalyzer.startAnalysis();
        
        // Auto-reporte cada 30 segundos en desarrollo
        if (process.env.NODE_ENV === 'development') {
          window.performanceAnalyzer.startAutoReporting(30000);
        }
      }
    });
  }
}

// 📋 Funciones de utilidad para testing manual
if (typeof window !== 'undefined') {
  window.testDashboardPerformance = () => {
    if (window.performanceAnalyzer) {
      return window.performanceAnalyzer.generateReport();
    } else {
      console.warn('Performance analyzer not initialized');
    }
  };
  
  window.getDashboardRecommendations = () => {
    if (window.performanceAnalyzer) {
      const recs = window.performanceAnalyzer.getRecommendations();
      console.table(recs);
      return recs;
    } else {
      console.warn('Performance analyzer not initialized');
    }
  };
}

export { DashboardPerformanceAnalyzer };
