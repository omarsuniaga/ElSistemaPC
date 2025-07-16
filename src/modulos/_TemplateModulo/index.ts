// 📦 Exportaciones principales del módulo
// Este archivo centraliza todas las exportaciones para facilitar imports

// Componentes
export { default as MainComponent } from './components/MainComponent.vue';
export { default as ListComponent } from './components/ListComponent.vue';
export * from './components';

// Views
export { default as MainView } from './views/MainView.vue';
export * from './views';

// Store
export { useTemplateStore } from './store/templateStore';
export * from './store';

// Services
export { templateService } from './services/templateService';
export * from './services';

// Composables
export { useTemplate } from './composables/useTemplate';
export * from './composables';

// Types
export * from './types';

// Router
export { templateRoutes } from './router';
