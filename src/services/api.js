import axios from 'axios'

// Configuración desde variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.13.180:8000'
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
    const response = await apiClient.get(`/data/${parameter}`)
    return response.data
  },

  // Configuración
  async getConfigurableParameters() {
    const response = await apiClient.get('/config/')
    return response.data
  },

  async setParameter(parameter, value) {
    const response = await apiClient.put(`/config/${parameter}`, { value })
    return response.data
  },

  async validateParameter(parameter, value) {
    const response = await apiClient.post('/config/validate', { parameter, value })
    return response.data
  },

  // Acciones
  async toggleLoad(hours, minutes, seconds) {
    const response = await apiClient.post('/actions/toggle_load', {
      hours,
      minutes,
      seconds
    })
    return response.data
  },

  async getActionsStatus() {
    const response = await apiClient.get('/actions/status')
    return response.data
  },

  // Estado
  async getConnectionStatus() {
    const response = await apiClient.get('/data/status/connection')
    return response.data
  },

  async getHealthCheck() {
    const response = await apiClient.get('/health')
    return response.data
  },

  // Schedule (Tareas Programadas)
  async getScheduleStatus() {
    const response = await apiClient.get('/schedule/')
    return response.data
  },

  async configureSchedule(enabled, startTime, durationSeconds) {
    const response = await apiClient.put('/schedule/config', {
      enabled,
      start_time: startTime,
      duration_seconds: durationSeconds
    })
    return response.data
  },

  async enableSchedule() {
    const response = await apiClient.post('/schedule/enable')
    return response.data
  },

  async disableSchedule() {
    const response = await apiClient.post('/schedule/disable')
    return response.data
  },

  async clearScheduleOverride() {
    const response = await apiClient.post('/schedule/clear_override')
    return response.data
  },

  async getScheduleInfo() {
    const response = await apiClient.get('/schedule/info')
    return response.data
  },

  // Configuraciones personalizadas
  async saveConfigurationFile(configData) {
    const response = await apiClient.post('/config/configurations', {
      data: configData
    })
    return response.data
  },

  async loadConfigurationFile() {
    const response = await apiClient.get('/config/configurations')
    return response.data
  }
}

export default api