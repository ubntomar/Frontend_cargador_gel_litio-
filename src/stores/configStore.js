import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useConfigStore = defineStore('config', () => {
  const configurableParameters = ref({})
  const savedConfigurations = ref({})
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

  // Funciones para manejo de configuraciones personalizadas
  async function saveConfiguration(name, config) {
    try {
      const configurations = await loadSavedConfigurations()
      configurations[name] = {
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const configString = JSON.stringify(configurations, null, 2)
      await api.saveConfigurationFile(configString)
      savedConfigurations.value = configurations
      return true
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function loadSavedConfigurations() {
    try {
      const response = await api.loadConfigurationFile()
      if (response && response.configurations) {
        savedConfigurations.value = response.configurations
        return response.configurations
      }
      return {}
    } catch (err) {
      console.log('No se encontró archivo de configuraciones existente, creando uno nuevo')
      savedConfigurations.value = {}
      return {}
    }
  }

  async function deleteConfiguration(name) {
    try {
      const configurations = await loadSavedConfigurations()
      delete configurations[name]
      
      const configString = JSON.stringify(configurations, null, 2)
      await api.saveConfigurationFile(configString)
      savedConfigurations.value = configurations
      return true
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function applyConfiguration(config) {
    loading.value = true
    error.value = null

    try {
      const promises = []
      for (const [parameter, value] of Object.entries(config)) {
        if (parameter !== 'createdAt' && parameter !== 'updatedAt') {
          promises.push(api.setParameter(parameter, value))
        }
      }
      await Promise.all(promises)
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function getCurrentConfiguration() {
    const currentConfig = {}
    const params = configurableParameters.value
    
    // Lista de todos los parámetros configurables
    const configurableParams = [
      'batteryCapacity',
      'isLithium',
      'thresholdPercentage',
      'maxAllowedCurrent',
      'bulkVoltage',
      'absorptionVoltage',
      'floatVoltage',
      'useFuenteDC',
      'fuenteDC_Amps',
      'factorDivider'
    ]
    
    configurableParams.forEach(param => {
      if (params[param] && params[param].current_value !== undefined) {
        currentConfig[param] = params[param].current_value
      }
    })
    
    return currentConfig
  }

  return {
    configurableParameters,
    savedConfigurations,
    loading,
    error,
    loadConfigurableParameters,
    updateParameter,
    saveConfiguration,
    loadSavedConfigurations,
    deleteConfiguration,
    applyConfiguration,
    getCurrentConfiguration
  }
})
