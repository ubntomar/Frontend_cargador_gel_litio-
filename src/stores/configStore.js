import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useConfigStore = defineStore('config', () => {
  const configurableParameters = ref({})
  const loading = ref(false)
  const error = ref(null)

  async function loadConfigurableParameters() {
    loading.value = true
    error.value = null

    try {
      const response = await api.getConfigurableParameters()
      configurableParameters.value = response.parameter_info || {}
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function updateParameter(parameter, value) {
    loading.value = true
    error.value = null

    try {
      const response = await api.setParameter(parameter, value)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    configurableParameters,
    loading,
    error,
    loadConfigurableParameters,
    updateParameter
  }
})
