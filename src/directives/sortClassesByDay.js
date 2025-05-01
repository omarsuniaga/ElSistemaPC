import { nextTick } from 'vue';

export default {
  mounted(el, binding) {
    const sortCards = () => {
      const cards = Array.from(el.children);
      
      // Sort cards by their exposed sorting value
      cards.sort((a, b) => {
        const instanceA = a.__vueParentComponent.ctx;
        const instanceB = b.__vueParentComponent.ctx;
        
        if (instanceA && instanceB && 
            typeof instanceA.getSortValue === 'function' && 
            typeof instanceB.getSortValue === 'function') {
          return instanceA.getSortValue() - instanceB.getSortValue();
        }
        return 0;
      });
      
      // Rearrange DOM elements
      cards.forEach(card => {
        el.appendChild(card);
      });
    };
    
    // Wait for all cards to be properly rendered
    nextTick(() => {
      sortCards();
    });
  }
};
