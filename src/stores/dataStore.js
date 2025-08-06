import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useDataStore = defineStore('data', () => {
  // Estado
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const connected = ref(false)
  const lastUpdate = ref(null)
  
  // Polling
  let pollingInterval = null
  const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL) || 3000

  // Getters computados
  const batteryPercentage = computed(() => {
    if (!data.value) return 0
    return data.value.estimatedSOC || 0
  })

  const chargingPower = computed(() => {
    if (!data.value) return 0
    return (data.value.voltagePanel * data.value.panelToBatteryCurrent) / 1000
  })

  const loadPower = computed(() => {
    if (!data.value) return 0
    return (data.value.voltageBatterySensor2 * data.value.batteryToLoadCurrent) / 1000
  })

  // Acciones
  async function fetchData() {
    loading.value = true
    error.value = null

    try {
      const response = await api.getAllData()
      data.value = response
      connected.value = response.connected || true
      lastUpdate.value = new Date()
    } catch (err) {
      error.value = err.message
      connected.value = false
    } finally {
      loading.value = false
    }
  }

  function startPolling() {
    // Obtener datos inmediatamente
    fetchData()
    
    // Configurar polling
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    
    pollingInterval = setInterval(() => {
      fetchData()
    }, POLLING_INTERVAL)
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  // Cleanup al destruir
  function $reset() {
    stopPolling()
    data.value = null
    loading.value = false
    error.value = null
    connected.value = false
    lastUpdate.value = null
  }

  return {
    // Estado
    data,
    loading,
    error,
    connected,
    lastUpdate,
    
    // Computados
    batteryPercentage,
    chargingPower,
    loadPower,
    
    // Acciones
    fetchData,
    startPolling,
    stopPolling,
    $reset
  }
})
