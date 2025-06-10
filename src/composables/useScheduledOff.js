import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'

export function useScheduledOff() {
  // Estado reactivo con valores por defecto seguros
  const enabled = ref(false)
  const startTime = ref('00:00')
  const endTime = ref('06:00')
  const cancelled = ref(false)
  const currentTime = ref(new Date())
  const isActivelyControlling = ref(false)
  const lastActionTime = ref(null)
  const isInitialized = ref(false)
  const lastCalculatedEnd = ref(null) // Para evitar comandos duplicados

  // Timer para verificar cada minuto
  let checkInterval = null
  let timeUpdateInterval = null

  // Keys para localStorage
  const STORAGE_KEYS = {
    enabled: 'scheduledOff_enabled',
    startTime: 'scheduledOff_startTime',
    endTime: 'scheduledOff_endTime',
    cancelled: 'scheduledOff_cancelled',
    isActivelyControlling: 'scheduledOff_isActivelyControlling',
    lastActionTime: 'scheduledOff_lastActionTime',
    lastCalculatedEnd: 'scheduledOff_lastCalculatedEnd'
  }

  // Función para calcular duración hasta el final del rango
  function calculateDurationUntilEnd() {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    const [endHour, endMin] = endTime.value.split(':').map(Number)
    const [startHour, startMin] = startTime.value.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    let targetMinutes = endMinutes

    // Manejar rangos que cruzan medianoche
    if (startMinutes > endMinutes) {
      if (currentMinutes >= startMinutes) {
        targetMinutes = endMinutes + 24 * 60 // Mañana siguiente
      }
    }

    let diffMinutes = targetMinutes - currentMinutes
    if (diffMinutes <= 0) diffMinutes += 24 * 60

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    return { hours, minutes, totalMinutes: diffMinutes }
  }

  // Computed properties
  const isInScheduledRange = computed(() => {
    if (!isInitialized.value || !enabled.value || cancelled.value) return false

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = startTime.value.split(':').map(Number)
    const [endHour, endMin] = endTime.value.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    // Manejar rangos que cruzan medianoche (ej: 23:00 - 06:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }
  })

  const timeUntilNextChange = computed(() => {
    if (!isInitialized.value || !enabled.value || cancelled.value) return null

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = startTime.value.split(':').map(Number)
    const [endHour, endMin] = endTime.value.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    let targetMinutes
    let isUntilStart = false

    if (isInScheduledRange.value) {
      // Estamos en rango, calcular hasta el final
      if (startMinutes > endMinutes) {
        // Cruza medianoche
        if (currentMinutes >= startMinutes) {
          targetMinutes = endMinutes + 24 * 60 // Mañana siguiente
        } else {
          targetMinutes = endMinutes
        }
      } else {
        targetMinutes = endMinutes
      }
      isUntilStart = false
    } else {
      // Fuera de rango, calcular hasta el inicio
      if (startMinutes > endMinutes) {
        // Cruza medianoche
        if (currentMinutes < startMinutes && currentMinutes >= endMinutes) {
          targetMinutes = startMinutes
        } else {
          targetMinutes = startMinutes + 24 * 60 // Mañana siguiente
        }
      } else {
        if (currentMinutes < startMinutes) {
          targetMinutes = startMinutes
        } else {
          targetMinutes = startMinutes + 24 * 60 // Mañana siguiente
        }
      }
      isUntilStart = true
    }

    let diffMinutes = targetMinutes - currentMinutes
    if (diffMinutes < 0) diffMinutes += 24 * 60

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    return {
      hours,
      minutes,
      totalMinutes: diffMinutes,
      isUntilStart
    }
  })

  const statusText = computed(() => {
    if (!isInitialized.value) return 'Inicializando programación...'
    if (!enabled.value) return 'Apagado automático deshabilitado'
    if (cancelled.value) return 'Programación cancelada por acción manual'
    
    const timeInfo = timeUntilNextChange.value
    if (!timeInfo) return 'Calculando programación...'

    if (isInScheduledRange.value) {
      if (isActivelyControlling.value) {
        return `🔴 APAGADO AUTOMÁTICO ACTIVO - Reactivación automática en ${timeInfo.hours}h ${timeInfo.minutes}m`
      } else {
        return `⚠️ En horario programado pero no controlando - Verificando estado...`
      }
    } else {
      return `⏰ Próximo apagado automático en ${timeInfo.hours}h ${timeInfo.minutes}m (${startTime.value} - ${endTime.value})`
    }
  })

  const statusClass = computed(() => {
    if (!isInitialized.value || !enabled.value || cancelled.value) return 'text-gray-600'
    if (isInScheduledRange.value && isActivelyControlling.value) return 'text-red-600 font-semibold'
    if (isInScheduledRange.value) return 'text-orange-600'
    return 'text-blue-600'
  })

  // Función para enviar comando con reintentos y validación mejorada
  async function sendCommandWithRetry(hours, minutes, seconds, maxRetries = 3) {
    let lastError = null
    
    // Validación de entrada
    if (hours < 0 || minutes < 0 || seconds < 0) {
      throw new Error('Los valores de tiempo no pueden ser negativos')
    }
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    if (totalSeconds > 43200) { // Máximo 12 horas
      throw new Error('El tiempo máximo permitido es 12 horas')
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [SCHEDULED OFF] Intento ${attempt}/${maxRetries} - Enviando comando:`, {
          hours,
          minutes,
          seconds,
          totalSeconds,
          timestamp: new Date().toISOString()
        })
        
        const response = await api.toggleLoad(hours, minutes, seconds)
        
        console.log(`✅ [SCHEDULED OFF] Comando enviado exitosamente en intento ${attempt}:`, {
          response,
          timestamp: new Date().toISOString()
        })
        
        return response // Éxito, salir del loop
        
      } catch (error) {
        lastError = error
        
        console.error(`❌ [SCHEDULED OFF] Error en intento ${attempt}/${maxRetries}:`, {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
          timestamp: new Date().toISOString()
        })
        
        if (attempt < maxRetries) {
          const delay = attempt * 1000 // 1s, 2s, 3s
          console.log(`⏱️ [SCHEDULED OFF] Esperando ${delay}ms antes del siguiente intento...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    console.error(`💥 [SCHEDULED OFF] FALLO TOTAL después de ${maxRetries} intentos:`, {
      lastError: lastError.message,
      timestamp: new Date().toISOString()
    })
    
    throw lastError
  }

  // Funciones principales
  async function checkAndControlLoad() {
    if (!isInitialized.value || !enabled.value || cancelled.value) {
      console.log(`⏸️ [SCHEDULED OFF] Control deshabilitado:`, {
        initialized: isInitialized.value,
        enabled: enabled.value,
        cancelled: cancelled.value
      })
      return
    }

    try {
      console.log(`🔍 [SCHEDULED OFF] Verificando estado de la carga...`)
      
      // Obtener estado actual de la carga
      const status = await api.getActionsStatus()
      const isLoadOn = status.load_control_state
      const hasTemporaryOff = status.temporary_load_off

      console.log(`📊 [SCHEDULED OFF] Estado actual:`, {
        isLoadOn,
        hasTemporaryOff,
        isActivelyControlling: isActivelyControlling.value,
        isInScheduledRange: isInScheduledRange.value,
        currentTime: new Date().toLocaleTimeString(),
        scheduleRange: `${startTime.value} - ${endTime.value}`
      })

      if (isInScheduledRange.value) {
        // Estamos en rango programado - deberíamos estar apagados
        if (isLoadOn && !hasTemporaryOff && !isActivelyControlling.value) {
          // Calcular duración hasta el final del rango
          const duration = calculateDurationUntilEnd()
          
          // Validar que la duración sea válida
          if (duration.totalMinutes <= 0 || duration.totalMinutes > 720) { // Máximo 12 horas
            console.warn(`⚠️ [SCHEDULED OFF] Duración inválida calculada: ${duration.totalMinutes} minutos`)
            return
          }
          
          // Crear identificador único para este periodo
          const endTimeKey = `${duration.totalMinutes}_${Math.floor(Date.now() / 60000)}`
          
          // Solo enviar comando si no lo hemos enviado ya para este periodo
          if (lastCalculatedEnd.value !== endTimeKey) {
            console.log(`🔴 [SCHEDULED OFF] INICIANDO apagado programado:`, {
              duration: `${duration.hours}h ${duration.minutes}m`,
              totalMinutes: duration.totalMinutes,
              endTime: endTime.value,
              endTimeKey
            })
            
            try {
              await sendCommandWithRetry(duration.hours, duration.minutes, 0)
              
              isActivelyControlling.value = true
              lastActionTime.value = new Date().toISOString()
              lastCalculatedEnd.value = endTimeKey
              saveToStorage()
              
              console.log(`✅ [SCHEDULED OFF] Apagado programado ACTIVADO exitosamente hasta las ${endTime.value}`)
              
            } catch (error) {
              console.error(`💥 [SCHEDULED OFF] FALLO CRÍTICO al enviar comando de apagado:`, error)
              // No cambiar el estado si falló el comando
            }
          } else {
            console.log(`⏭️ [SCHEDULED OFF] Comando ya enviado para este periodo: ${endTimeKey}`)
          }
        } else {
          console.log(`ℹ️ [SCHEDULED OFF] En rango pero no se requiere acción:`, {
            reason: !isLoadOn ? 'Carga ya apagada' : 
                   hasTemporaryOff ? 'Apagado temporal activo' : 
                   'Ya controlando activamente'
          })
        }
      } else {
        // Estamos fuera del rango programado
        if (isActivelyControlling.value) {
          // El apagado programado debería haber terminado automáticamente
          console.log(`🟢 [SCHEDULED OFF] FIN del apagado programado - Carga reactivada automáticamente`)
          isActivelyControlling.value = false
          lastActionTime.value = new Date().toISOString()
          lastCalculatedEnd.value = null
          saveToStorage()
        }
      }
    } catch (error) {
      console.error(`❌ [SCHEDULED OFF] Error en checkAndControlLoad:`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    }
  }

  function updateCurrentTime() {
    currentTime.value = new Date()
  }

  // Configuración
  function setSchedule(start, end) {
    console.log(`⏰ [SCHEDULED OFF] Actualizando horario:`, {
      previousStart: startTime.value,
      previousEnd: endTime.value,
      newStart: start,
      newEnd: end
    })
    
    // Validar que los parámetros sean cadenas válidas
    if (typeof start === 'string' && start.includes(':')) {
      startTime.value = start
    }
    if (typeof end === 'string' && end.includes(':')) {
      endTime.value = end
    }
    
    // Reset control state cuando cambia el horario
    isActivelyControlling.value = false
    lastCalculatedEnd.value = null
    
    console.log(`✅ [SCHEDULED OFF] Horario actualizado: ${startTime.value} - ${endTime.value}`)
    
    saveToStorage()
  }

  function toggleEnabled() {
    const previousState = enabled.value
    enabled.value = !enabled.value
    
    console.log(`🔄 [SCHEDULED OFF] Toggle habilitado:`, {
      previousState,
      newState: enabled.value,
      timestamp: new Date().toISOString()
    })
    
    if (enabled.value) {
      // Al habilitar, limpiar cancelación
      cancelled.value = false
      console.log(`✅ [SCHEDULED OFF] Programación HABILITADA`)
    } else {
      // Al deshabilitar, limpiar estado de control
      isActivelyControlling.value = false
      lastCalculatedEnd.value = null
      console.log(`🔴 [SCHEDULED OFF] Programación DESHABILITADA`)
    }
    
    saveToStorage()
    
    // Forzar verificación inmediata después de cambio de estado
    setTimeout(() => {
      if (enabled.value) {
        checkAndControlLoad()
      }
    }, 1000)
  }

  function cancelSchedule() {
    console.log(`❌ [SCHEDULED OFF] Cancelando programación`)
    cancelled.value = true
    isActivelyControlling.value = false
    lastCalculatedEnd.value = null
    saveToStorage()
    console.log(`✅ [SCHEDULED OFF] Programación cancelada`)
  }

  function reactivateSchedule() {
    console.log(`🔄 [SCHEDULED OFF] Reactivando programación`)
    cancelled.value = false
    lastCalculatedEnd.value = null
    saveToStorage()
    
    // Verificar inmediatamente si debemos aplicar programación
    setTimeout(() => {
      checkAndControlLoad()
    }, 500)
    
    console.log(`✅ [SCHEDULED OFF] Programación reactivada`)
  }

  // Override manual - llamar cuando se hace una acción manual
  function handleManualOverride() {
    if (enabled.value && isInScheduledRange.value && isActivelyControlling.value) {
      console.log(`🔧 [SCHEDULED OFF] Acción manual detectada - Cancelando programación automática`)
      cancelSchedule()
    }
  }

  // Persistencia mejorada
  function saveToStorage() {
    try {
      const dataToSave = {
        enabled: enabled.value,
        startTime: startTime.value,
        endTime: endTime.value,
        cancelled: cancelled.value,
        isActivelyControlling: isActivelyControlling.value,
        lastActionTime: lastActionTime.value,
        lastCalculatedEnd: lastCalculatedEnd.value
      }
      
      console.log(`💾 [SCHEDULED OFF] Guardando en localStorage:`, dataToSave)
      
      Object.keys(STORAGE_KEYS).forEach(key => {
        const value = dataToSave[key]
        if (value !== null && value !== undefined) {
          localStorage.setItem(STORAGE_KEYS[key], String(value))
        } else {
          localStorage.removeItem(STORAGE_KEYS[key])
        }
      })
      
      console.log(`✅ [SCHEDULED OFF] Datos guardados exitosamente`)
    } catch (error) {
      console.error('❌ [SCHEDULED OFF] Error saving to localStorage:', error)
    }
  }

  function loadFromStorage() {
    try {
      console.log(`📖 [SCHEDULED OFF] Cargando configuración desde localStorage...`)
      
      const loadedData = {
        enabled: localStorage.getItem(STORAGE_KEYS.enabled),
        startTime: localStorage.getItem(STORAGE_KEYS.startTime),
        endTime: localStorage.getItem(STORAGE_KEYS.endTime),
        cancelled: localStorage.getItem(STORAGE_KEYS.cancelled),
        isActivelyControlling: localStorage.getItem(STORAGE_KEYS.isActivelyControlling),
        lastActionTime: localStorage.getItem(STORAGE_KEYS.lastActionTime),
        lastCalculatedEnd: localStorage.getItem(STORAGE_KEYS.lastCalculatedEnd)
      }
      
      console.log(`📋 [SCHEDULED OFF] Datos encontrados en localStorage:`, loadedData)
      
      // Cargar valores con validación
      enabled.value = loadedData.enabled === 'true'
      
      if (loadedData.startTime && loadedData.startTime.includes(':')) {
        startTime.value = loadedData.startTime
      }
      
      if (loadedData.endTime && loadedData.endTime.includes(':')) {
        endTime.value = loadedData.endTime
      }
      
      cancelled.value = loadedData.cancelled === 'true'
      isActivelyControlling.value = loadedData.isActivelyControlling === 'true'
      
      if (loadedData.lastActionTime) {
        lastActionTime.value = loadedData.lastActionTime
      }
      
      if (loadedData.lastCalculatedEnd) {
        lastCalculatedEnd.value = loadedData.lastCalculatedEnd
      }
      
      const finalState = {
        enabled: enabled.value,
        startTime: startTime.value,
        endTime: endTime.value,
        cancelled: cancelled.value,
        isActivelyControlling: isActivelyControlling.value
      }
      
      console.log(`✅ [SCHEDULED OFF] Configuración cargada:`, finalState)
      
      isInitialized.value = true
    } catch (error) {
      console.error('❌ [SCHEDULED OFF] Error loading from localStorage:', error)
      // Establecer valores por defecto seguros
      enabled.value = false
      startTime.value = '00:00'
      endTime.value = '06:00'
      cancelled.value = false
      isActivelyControlling.value = false
      lastCalculatedEnd.value = null
      isInitialized.value = true
      
      console.log(`🔄 [SCHEDULED OFF] Usando valores por defecto`)
    }
  }

  // Lifecycle
  function startScheduler() {
    console.log(`🚀 [SCHEDULED OFF] Iniciando programador automático...`)
    
    loadFromStorage()
    
    // Verificar cada minuto (60 segundos)
    checkInterval = setInterval(() => {
      console.log(`⏰ [SCHEDULED OFF] Verificación automática programada`)
      checkAndControlLoad()
    }, 60000)
    
    // Actualizar tiempo cada segundo para UI
    timeUpdateInterval = setInterval(updateCurrentTime, 1000)
    
    // Verificar inmediatamente después de un pequeño delay para permitir inicialización
    setTimeout(() => {
      console.log(`🔍 [SCHEDULED OFF] Verificación inicial`)
      checkAndControlLoad()
    }, 2000)
    
    console.log(`✅ [SCHEDULED OFF] Programador iniciado - Verificaciones cada 60 segundos`)
  }

  function stopScheduler() {
    console.log(`🛑 [SCHEDULED OFF] Deteniendo programador automático...`)
    
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
      timeUpdateInterval = null
    }
    
    console.log(`✅ [SCHEDULED OFF] Programador detenido`)
  }

  // Auto-iniciar en montaje
  onMounted(startScheduler)
  onUnmounted(stopScheduler)

  return {
    // Estado
    enabled,
    startTime,
    endTime,
    cancelled,
    currentTime,
    isActivelyControlling,
    isInitialized,
    
    // Computed
    isInScheduledRange,
    timeUntilNextChange,
    statusText,
    statusClass,
    
    // Métodos
    setSchedule,
    toggleEnabled,
    cancelSchedule,
    reactivateSchedule,
    handleManualOverride,
    startScheduler,
    stopScheduler
  }
}