import {defineStore} from "pinia"

interface Instrument {
  id: string
  name: string
  category: string
}

export const useInstrumentsStore = defineStore("instruments", {
  state: () => ({
    instruments: [
      {id: "1", name: "Piano", category: "Teclado"},
      {id: "2", name: "Guitarra", category: "Cuerda"},
      {id: "3", name: "Violín", category: "Cuerda"},
      {id: "4", name: "Flauta", category: "Viento"},
      {id: "5", name: "Batería", category: "Percusión"},
      {id: "6", name: "Canto", category: "Voz"},
      {id: "7", name: "Saxofón", category: "Viento"},
      {id: "8", name: "Trompeta", category: "Viento"},
      {id: "9", name: "Bajo", category: "Cuerda"},
      {id: "10", name: "Violonchelo", category: "Cuerda"},
      {id: "11", name: "Clarinete", category: "Viento"},
      {id: "12", name: "Arpa", category: "Cuerda"},
    ] as Instrument[],
  }),

  getters: {
    getInstrumentsByCategory: (state) => {
      return (category: string) =>
        state.instruments.filter((instrument) => instrument.category === category)
    },

    getAllCategories: (state) => {
      return [...new Set(state.instruments.map((instrument) => instrument.category))]
    },
  },
})
