import { defineStore } from 'pinia';
import { User } from 'firebase/auth';

// Definir interfaz para el estado de autenticación
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated
  },

  actions: {
    setUser(user: User | null) {
      this.user = user;
      this.isAuthenticated = !!user;
    },

    clearUser() {
      this.user = null;
      this.isAuthenticated = false;
    }
  }
});
