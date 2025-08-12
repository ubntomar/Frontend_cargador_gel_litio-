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
      const response = await api.getAllData()
      // Convertir los datos del ESP32 en formato de parámetros configurables usando los campos reales
      configurableParameters.value = {
        batteryCapacity: { current_value: response.batteryCapacity },
        isLithium: { current_value: response.isLithium },
        thresholdPercentage: { current_value: response.thresholdPercentage },
        maxAllowedCurrent: { current_value: response.maxAllowedCurrent },
        bulkVoltage: { current_value: response.bulkVoltage },
        absorptionVoltage: { current_value: response.absorptionVoltage },
        floatVoltage: { current_value: response.floatVoltage },
        useFuenteDC: { current_value: response.useFuenteDC },
        fuenteDC_Amps: { current_value: response.fuenteDC_Amps },
        factorDivider: { current_value: response.factorDivider }
      }
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
      
      // Actualizar el valor en el store si la respuesta fue exitosa
      if (response.success && configurableParameters.value[parameter]) {
        configurableParameters.value[parameter].current_value = value
      }
      
      return response
    } catch (err) {
      // Mejorar el manejo de errores específicos
      let errorMessage = err.message
      
      if (err.message.includes('timeout')) {
        errorMessage = `Timeout configurando ${parameter} en ESP32 (esperó 8.0s). El dispositivo puede estar ocupado con otra operación.`
      } else if (err.message.includes('lock')) {
        errorMessage = `ESP32 ocupado configurando otro parámetro. Esperó el lock por ${err.message.match(/\d+\.?\d*/)?.[0] || '8.0'}s.`
      } else if (err.response?.status === 422) {
        errorMessage = `Valor inválido para ${parameter}: ${err.response?.data?.detail || 'Verifica el rango permitido'}`
      }
      
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Funciones para manejo de configuraciones personalizadas
  async function saveConfiguration(name, config) {
    try {
      // Usar la nueva API para crear configuración
      const response = await api.saveConfigurationFile(name, config)
      
      // Recargar configuraciones para obtener la lista actualizada
      await loadSavedConfigurations()
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
      console.log('No se encontraron configuraciones existentes')
      savedConfigurations.value = {}
      return {}
    }
  }

  async function deleteConfiguration(name) {
    try {
      await api.deleteConfiguration(name)
      
      // Recargar configuraciones para obtener la lista actualizada
      await loadSavedConfigurations()
      return true
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function applyConfiguration(config, configName) {
    loading.value = true
    error.value = null

    try {
      // Si tenemos el nombre de la configuración, usar el endpoint de aplicar
      if (configName) {
        const response = await api.applyConfiguration(configName)
        return response
      } else {
        // Método alternativo: aplicar parámetro por parámetro
        const promises = []
        for (const [parameter, value] of Object.entries(config)) {
          if (parameter !== 'createdAt' && parameter !== 'updatedAt') {
            promises.push(api.setParameter(parameter, value))
          }
        }
        await Promise.all(promises)
        return { success: true }
      }
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

  // Nuevas funciones para aprovechar la API actualizada
  async function validateConfiguration(config) {
    try {
      const response = await api.validateConfiguration(config)
      return response
    } catch (err) {
      // Si la API responde con error de validación, mostrar el mensaje específico
      const apiMsg = err.response?.data?.msg
      error.value = apiMsg || err.message
      // Lanzar el error con el mensaje más útil
      throw new Error(apiMsg || err.message)
    }
  }

  async function exportConfigurations() {
    try {
      const response = await api.exportConfigurations()
      return response
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function getConfigurationInfo() {
    try {
      const response = await api.getConfigurationInfo()
      return response
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function searchConfigurations(searchTerm) {
    try {
      const response = await api.searchConfigurations(searchTerm)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    }
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
    getCurrentConfiguration,
    validateConfiguration,
    exportConfigurations,
    getConfigurationInfo,
    searchConfigurations
  }
})
