import axios from 'axios'

// Configuración desde variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true'

// Log de configuración en modo debug
if (DEBUG_MODE) {
  console.log('🔧 API Configuration:', {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    debugMode: DEBUG_MODE
  })
}

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Interceptor para request - sanitizar datos antes de enviar
apiClient.interceptors.request.use(
  config => {
    if (DEBUG_MODE) {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.url)
    }
    
    // Sanitizar datos del body para evitar problemas de codificación
    if (config.data && typeof config.data === 'object') {
      try {
        config.data = JSON.parse(JSON.stringify(config.data))
      } catch (error) {
        console.warn('Error sanitizing request data:', error)
      }
    }
    
    return config
  },
  error => {
    if (DEBUG_MODE) {
      console.error('❌ API Request Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  response => {
    if (DEBUG_MODE) {
      console.log('📡 API Response:', response.config.url, response.status)
    }
    return response
  },
  error => {
    if (DEBUG_MODE) {
      console.error('❌ API Error:', error.config?.url, error.message)
    }
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Servicios de la API
export const api = {
  // Datos
  async getAllData() {
    const response = await apiClient.get('/data/')
    return response.data
  },

  async getParameter(parameter) {
    const response = await apiClient.get(`/data/`)
    // Extraer el parámetro específico de la respuesta completa
    return response.data[parameter]
  },

  // Configuración
  async getConfigurableParameters() {
    const response = await apiClient.get('/data/')
    return response.data
  },

  async setParameter(parameter, value) {
    const response = await apiClient.post('/config/parameter', { 
      parameter, 
      value 
    })
    return response.data
  },

  async validateParameter(parameter, value) {
    const response = await apiClient.post('/config/custom/configurations/validate', { 
      [parameter]: value 
    })
    return response.data
  },

  // Acciones
  async toggleLoad(hours, minutes, seconds) {
    // NOTA: Según la documentación, este endpoint puede no existir
    // Verificar si está disponible en la nueva API
    try {
      const response = await apiClient.post('/actions/toggle_load', {
        hours,
        minutes,
        seconds
      })
      return response.data
    } catch (error) {
      console.warn('Endpoint /actions/toggle_load no disponible en la nueva API')
      throw error
    }
  },

  async getActionsStatus() {
    // Usar el endpoint de datos general que incluye información de estado
    const response = await apiClient.get('/data/')
    return {
      load_control_state: response.data.loadControlState,
      temporary_load_off: response.data.temporaryLoadOff,
      load_off_remaining_seconds: response.data.loadOffRemainingSeconds,
      load_off_duration: response.data.loadOffDuration
    }
  },

  // Estado
  async getConnectionStatus() {
    const response = await apiClient.get('/health')
    return response.data
  },

  async getHealthCheck() {
    const response = await apiClient.get('/health')
    return response.data
  },

  // Schedule (Tareas Programadas)
  async getScheduleStatus() {
    const response = await apiClient.get('/schedule')
    return response.data
  },

  async configureSchedule(enabled, shutdownTime, startupTime) {
    const response = await apiClient.post('/schedule/set', {
      enabled,
      shutdown_time: shutdownTime,
      startup_time: startupTime || shutdownTime
    })
    return response.data
  },

  async enableSchedule() {
    const response = await apiClient.post('/schedule/set', {
      enabled: true
    })
    return response.data
  },

  async disableSchedule() {
    const response = await apiClient.post('/schedule/set', {
      enabled: false
    })
    return response.data
  },

  async clearScheduleOverride() {
    const response = await apiClient.post('/schedule/set', {
      enabled: false
    })
    return response.data
  },

  async getScheduleInfo() {
    const response = await apiClient.get('/schedule')
    return response.data
  },

  // Configuraciones personalizadas
  async saveConfigurationFile(name, configData) {
    const response = await apiClient.post(`/config/custom/config/${name}`, configData)
    return response.data
  },

  async loadConfigurationFile() {
    const response = await apiClient.get('/config/custom/configurations')
    return response.data
  },

  async deleteConfiguration(name) {
    const response = await apiClient.delete(`/config/custom/config/${name}`)
    return response.data
  },

  async applyConfiguration(name) {
    const response = await apiClient.post(`/config/custom/config/${name}/apply`)
    return response.data
  },

  async getConfiguration(name) {
    const response = await apiClient.get(`/config/custom/config/${name}`)
    return response.data
  },

  async exportConfigurations() {
    const response = await apiClient.get('/config/custom/configurations/export')
    return response.data
  },

  async getConfigurationInfo() {
    const response = await apiClient.get('/config/custom/configurations/info')
    return response.data
  },

  async validateConfiguration(configData) {
    const response = await apiClient.post('/config/custom/configurations/validate', configData)
    return response.data
  },

  // Nuevos métodos según la documentación actualizada
  async searchConfigurations(searchTerm) {
    const params = searchTerm ? { search: searchTerm } : {}
    const response = await apiClient.get('/config/custom/configurations', { params })
    return response.data
  },

  async importConfigurations(configData) {
    // Método para importar configuraciones (si está disponible en la API)
    const response = await apiClient.post('/config/custom/configurations/import', configData)
    return response.data
  }
}

export default api