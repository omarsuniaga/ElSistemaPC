import { defineStore } from 'pinia';

interface InstrumentState {
  instruments: string[]
  instrumentsByFamily: Record<string, string[]>
  isLoading: boolean
  error: string | null
}

export const useInstrumentoStore = defineStore('instrumento', {
  state: (): InstrumentState => ({
    instruments: [],
    instrumentsByFamily: {
      'cuerdas': ['Violín', 'Viola', 'Violonchelo', 'Contrabajo', 'Guitarra', 'Arpa'],
      'viento madera': ['Flauta', 'Clarinete', 'Oboe', 'Fagot', 'Saxofón'],
      'viento metal': ['Trompeta', 'Trombón', 'Trompa', 'Tuba'],
      'percusión': ['Piano', 'Batería', 'Xilófono', 'Timbales', 'Marimba'],
    },
    isLoading: false,
    error: null
  }),

  actions: {
    async fetchInstrumentos() {
      this.isLoading = true
      try {
        // Create full instruments list from instrumentsByFamily
        this.instruments = Object.values(this.instrumentsByFamily)
          .flat()
          .sort((a, b) => a.localeCompare(b))
      } catch (error) {
        console.error('Error fetching instruments:', error)
        this.error = 'Error al cargar los instrumentos'
      } finally {
        this.isLoading = false
      }
    }
  }
})
