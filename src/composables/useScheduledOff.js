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
    if (!isInitialized.value) return 'Inicializando...'
    if (!enabled.value) return 'Apagado programado deshabilitado'
    if (cancelled.value) return 'Programación cancelada por acción manual'
    
    const timeInfo = timeUntilNextChange.value
    if (!timeInfo) return 'Calculando...'

    if (isInScheduledRange.value) {
      if (isActivelyControlling.value) {
        return `🔴 Apagado programado ACTIVO - Reactivación en ${timeInfo.hours}h ${timeInfo.minutes}m`
      } else {
        return `⚠️ En rango programado pero no controlando - Reactivación en ${timeInfo.hours}h ${timeInfo.minutes}m`
      }
    } else {
      return `⏰ Próximo apagado programado en ${timeInfo.hours}h ${timeInfo.minutes}m`
    }
  })

  const statusClass = computed(() => {
    if (!isInitialized.value || !enabled.value || cancelled.value) return 'text-gray-600'
    if (isInScheduledRange.value && isActivelyControlling.value) return 'text-red-600'
    if (isInScheduledRange.value) return 'text-orange-600'
    return 'text-blue-600'
  })

  // Funciones principales
  async function checkAndControlLoad() {
    if (!isInitialized.value || !enabled.value || cancelled.value) return

    try {
      // Obtener estado actual de la carga
      const status = await api.getActionsStatus()
      const isLoadOn = status.load_control_state
      const hasTemporaryOff = status.temporary_load_off

      if (isInScheduledRange.value) {
        // Estamos en rango programado - deberíamos estar apagados
        if (isLoadOn && !hasTemporaryOff && !isActivelyControlling.value) {
          // Calcular duración hasta el final del rango
          const duration = calculateDurationUntilEnd()
          
          // Crear identificador único para este periodo
          const endTimeKey = `${duration.totalMinutes}_${Date.now()}`
          
          // Solo enviar comando si no lo hemos enviado ya para este periodo
          if (lastCalculatedEnd.value !== endTimeKey) {
            console.log(`🔴 Ejecutando apagado programado por ${duration.hours}h ${duration.minutes}m...`)
            
            await api.toggleLoad(duration.hours, duration.minutes, 0)
            
            isActivelyControlling.value = true
            lastActionTime.value = new Date().toISOString()
            lastCalculatedEnd.value = endTimeKey
            saveToStorage()
            
            console.log(`✅ Carga apagada hasta las ${endTime.value}`)
          }
        }
      } else {
        // Estamos fuera del rango programado
        if (isActivelyControlling.value) {
          // El apagado programado debería haber terminado automáticamente
          console.log('🟢 Fin del apagado programado - La carga debería reactivarse automáticamente')
          isActivelyControlling.value = false
          lastActionTime.value = new Date().toISOString()
          lastCalculatedEnd.value = null
          saveToStorage()
        }
      }
    } catch (error) {
      console.error('Error en control programado:', error)
    }
  }

  function updateCurrentTime() {
    currentTime.value = new Date()
  }

  // Configuración
  function setSchedule(start, end) {
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
    
    saveToStorage()
  }

  function toggleEnabled() {
    enabled.value = !enabled.value
    if (enabled.value) {
      cancelled.value = false
    } else {
      isActivelyControlling.value = false
      lastCalculatedEnd.value = null
    }
    saveToStorage()
  }

  function cancelSchedule() {
    cancelled.value = true
    isActivelyControlling.value = false
    lastCalculatedEnd.value = null
    saveToStorage()
  }

  function reactivateSchedule() {
    cancelled.value = false
    lastCalculatedEnd.value = null
    saveToStorage()
  }

  // Override manual - llamar cuando se hace una acción manual
  function handleManualOverride() {
    if (enabled.value && isInScheduledRange.value && isActivelyControlling.value) {
      console.log('🔧 Acción manual detectada - Cancelando programación')
      cancelSchedule()
    }
  }

  // Persistencia
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.enabled, enabled.value.toString())
      localStorage.setItem(STORAGE_KEYS.startTime, startTime.value)
      localStorage.setItem(STORAGE_KEYS.endTime, endTime.value)
      localStorage.setItem(STORAGE_KEYS.cancelled, cancelled.value.toString())
      localStorage.setItem(STORAGE_KEYS.isActivelyControlling, isActivelyControlling.value.toString())
      
      if (lastActionTime.value) {
        localStorage.setItem(STORAGE_KEYS.lastActionTime, lastActionTime.value)
      }
      if (lastCalculatedEnd.value) {
        localStorage.setItem(STORAGE_KEYS.lastCalculatedEnd, lastCalculatedEnd.value)
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  function loadFromStorage() {
    try {
      enabled.value = localStorage.getItem(STORAGE_KEYS.enabled) === 'true'
      
      const storedStartTime = localStorage.getItem(STORAGE_KEYS.startTime)
      if (storedStartTime && storedStartTime.includes(':')) {
        startTime.value = storedStartTime
      }
      
      const storedEndTime = localStorage.getItem(STORAGE_KEYS.endTime)
      if (storedEndTime && storedEndTime.includes(':')) {
        endTime.value = storedEndTime
      }
      
      cancelled.value = localStorage.getItem(STORAGE_KEYS.cancelled) === 'true'
      isActivelyControlling.value = localStorage.getItem(STORAGE_KEYS.isActivelyControlling) === 'true'
      
      const storedLastAction = localStorage.getItem(STORAGE_KEYS.lastActionTime)
      if (storedLastAction) {
        lastActionTime.value = storedLastAction
      }
      
      const storedLastEnd = localStorage.getItem(STORAGE_KEYS.lastCalculatedEnd)
      if (storedLastEnd) {
        lastCalculatedEnd.value = storedLastEnd
      }
      
      isInitialized.value = true
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      // Establecer valores por defecto seguros
      enabled.value = false
      startTime.value = '00:00'
      endTime.value = '06:00'
      cancelled.value = false
      isActivelyControlling.value = false
      lastCalculatedEnd.value = null
      isInitialized.value = true
    }
  }

  // Lifecycle
  function startScheduler() {
    loadFromStorage()
    
    // Verificar cada minuto
    checkInterval = setInterval(checkAndControlLoad, 60000)
    
    // Actualizar tiempo cada segundo para UI
    timeUpdateInterval = setInterval(updateCurrentTime, 1000)
    
    // Verificar inmediatamente después de un pequeño delay
    setTimeout(checkAndControlLoad, 1000)
  }

  function stopScheduler() {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
      timeUpdateInterval = null
    }
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