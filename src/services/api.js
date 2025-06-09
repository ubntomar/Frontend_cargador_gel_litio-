import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.8.100:8000'

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  response => response,
  error => {
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

  async cancelTemporaryOff() {
    const response = await apiClient.post('/actions/cancel_temp_off')
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
  }
}

export default api
