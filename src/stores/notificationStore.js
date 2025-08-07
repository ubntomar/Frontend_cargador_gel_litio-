import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', () => {
  // Estado
  const notifications = ref([])
  const currentNotification = ref(null)
  
  // Generar ID único para notificaciones (usar solo caracteres seguros)
  function generateId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11)
  }
  
  // Función para sanitizar strings y evitar problemas con caracteres especiales
  function sanitizeString(str) {
    if (typeof str !== 'string') return str
    try {
      // Normalizar y remover caracteres problemáticos
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    } catch (error) {
      console.warn('Error sanitizing string:', str, error)
      // Fallback: reemplazar caracteres problemáticos comunes
      return str.replace(/[^\x00-\x7F]/g, '').trim()
    }
  }
  
  // Función para agregar notificación
  function addNotification(notification) {
    const id = generateId()
    const newNotification = {
      id,
      visible: true,
      autoClose: true,
      duration: 5000,
      ...notification,
      // Sanitizar strings para evitar problemas de codificación
      title: sanitizeString(notification.title || ''),
      message: sanitizeString(notification.message || '')
    }
    
    // Si hay una notificación actual, la reemplazamos
    if (currentNotification.value) {
      currentNotification.value = newNotification
    } else {
      currentNotification.value = newNotification
    }
    
    // Agregar a la lista de notificaciones
    notifications.value.push(newNotification)
    
    return id
  }
  
  // Función para cerrar notificación
  function closeNotification(id) {
    if (currentNotification.value && currentNotification.value.id === id) {
      currentNotification.value.visible = false
      
      // Limpiar después de la animación
      setTimeout(() => {
        currentNotification.value = null
      }, 300)
    }
    
    // Remover de la lista
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  // Función para cerrar todas las notificaciones
  function clearAll() {
    if (currentNotification.value) {
      currentNotification.value.visible = false
    }
    currentNotification.value = null
    notifications.value = []
  }
  
  // Métodos de conveniencia
  function success(title, message, options = {}) {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }
  
  function error(title, message, options = {}) {
    return addNotification({
      type: 'error',
      title,
      message,
      autoClose: false, // Los errores no se cierran automáticamente
      ...options
    })
  }
  
  function warning(title, message, options = {}) {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 7000, // Advertencias duran más
      ...options
    })
  }
  
  function info(title, message, options = {}) {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }
  
  function loading(title, message, options = {}) {
    return addNotification({
      type: 'loading',
      title,
      message,
      autoClose: false, // Loading no se cierra automáticamente
      ...options
    })
  }
  
  // Función especial para operaciones de configuración
  function configurationOperation(parameterName, operation = 'saving') {
    // Sanitizar el nombre del parámetro
    const safeName = sanitizeString(parameterName || 'Parámetro')
    
    const operations = {
      saving: {
        type: 'loading',
        title: `Configurando ${safeName}`,
        message: 'Enviando al ESP32... (hasta 15s)',
        showProgress: false
      },
      success: {
        type: 'success',
        title: `${safeName} configurado`,
        message: 'Parámetro aplicado exitosamente',
        duration: 3000
      },
      timeout: {
        type: 'warning',
        title: `Timeout configurando ${safeName}`,
        message: 'El ESP32 puede estar ocupado. Intenta nuevamente en unos segundos.',
        duration: 8000
      },
      lock: {
        type: 'warning',
        title: `ESP32 ocupado`,
        message: `No se pudo configurar ${safeName}. Otro parámetro se está configurando.`,
        duration: 6000
      },
      error: {
        type: 'error',
        title: `Error configurando ${safeName}`,
        message: 'Verifica la conexión y el valor ingresado',
        autoClose: false
      }
    }
    
    const config = operations[operation] || operations.error
    return addNotification(config)
  }
  
  return {
    // Estado
    notifications,
    currentNotification,
    
    // Métodos principales
    addNotification,
    closeNotification,
    clearAll,
    
    // Métodos de conveniencia
    success,
    error,
    warning,
    info,
    loading,
    
    // Métodos especializados
    configurationOperation
  }
})
