// Instruments/store/instrumento.ts
import {defineStore} from "pinia"
import {
  getInstruments,
  getInstrumentById as getInstrumentByIdService,
  createInstrument,
  updateInstrument,
  deleteInstrument,
  getInstrumentsByFamily,
  getInstrumentFamilies,
} from "../service/instruments"
import type {Instrument} from "../types/instrumentsTypes"

export const useInstrumentoStore = defineStore("instrumento", {
  state: () => ({
    instruments: [] as Instrument[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null,
  }),

  getters: {
    getInstrumentByIdGetters: (state) => (id: string) => state.instruments.find((i) => i.id === id),

    getActiveInstruments: (state) => state.instruments.filter((i) => i.activo === true),

    getInstrumentsByFamily: (state) => (family: string) =>
      state.instruments.filter((i) => i.familia === family),
  },

  actions: {
    async fetchInstruments() {
      this.loading = true
      this.error = null

      try {
        const instruments = await getInstruments()
        this.instruments = instruments
        this.lastSync = new Date()
        return this.instruments
      } catch (error: any) {
        console.error("Error fetching instruments:", error)
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },

    async getInstrumentById(id: string) {
      try {
        // First check the cache
        const cached = this.instruments.find((i) => i.id === id)
        if (cached) return cached

        // If not in cache, fetch from service
        const instrument = await getInstrumentByIdService(id)

        // Update cache if instrument found
        if (instrument) {
          const index = this.instruments.findIndex((i) => i.id === id)
          if (index !== -1) {
            this.instruments[index] = instrument
          } else {
            this.instruments.push(instrument)
          }
        }

        return instrument
      } catch (error: any) {
        console.error(`Error getting instrument ${id}:`, error)
        this.error = error.message
        throw error
      }
    },

    async addInstrument(instrument: Omit<Instrument, "id">) {
      this.loading = true
      try {
        const newInstrument = await createInstrument(instrument)
        this.instruments.push(newInstrument)
        return newInstrument
      } catch (error: any) {
        console.error("Error adding instrument:", error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateInstrument(id: string, updates: Partial<Instrument>) {
      this.loading = true
      try {
        await updateInstrument(id, updates)
        const index = this.instruments.findIndex((i) => i.id === id)
        if (index !== -1) {
          this.instruments[index] = {...this.instruments[index], ...updates}
        }
        return this.instruments[index]
      } catch (error: any) {
        console.error("Error updating instrument:", error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteInstrument(id: string) {
      this.loading = true
      try {
        await deleteInstrument(id)
        this.instruments = this.instruments.filter((i) => i.id !== id)
      } catch (error: any) {
        console.error("Error deleting instrument:", error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getInstrumentsByFamilyAsync(family: string) {
      try {
        return await getInstrumentsByFamily(family)
      } catch (error: any) {
        console.error(`Error fetching instruments for family ${family}:`, error)
        this.error = error.message
        throw error
      }
    },

    async getInstrumentFamilies() {
      try {
        return await getInstrumentFamilies()
      } catch (error: any) {
        console.error("Error fetching instrument families:", error)
        this.error = error.message
        throw error
      }
    },
  },
})
