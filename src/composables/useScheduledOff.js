import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'

export function useScheduledOff() {
  // Estado reactivo
  const enabled = ref(false)
  const startTime = ref('00:00')
  const endTime = ref('06:00')
  const cancelled = ref(false)
  const currentTime = ref(new Date())
  const isActivelyControlling = ref(false)
  const lastActionTime = ref(null)

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
    lastActionTime: 'scheduledOff_lastActionTime'
  }

  // Computed properties
  const isInScheduledRange = computed(() => {
    if (!enabled.value || cancelled.value) return false

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
    if (!enabled.value || cancelled.value) return null

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
    if (!enabled.value || cancelled.value) return 'text-gray-600'
    if (isInScheduledRange.value && isActivelyControlling.value) return 'text-red-600'
    if (isInScheduledRange.value) return 'text-orange-600'
    return 'text-blue-600'
  })

  // Funciones principales
  async function checkAndControlLoad() {
    if (!enabled.value || cancelled.value) return

    try {
      // Obtener estado actual de la carga
      const status = await api.getActionsStatus()
      const isLoadOn = status.load_control_state
      const hasTemporaryOff = status.temporary_load_off

      if (isInScheduledRange.value) {
        // Deberíamos estar apagados
        if (isLoadOn && !hasTemporaryOff) {
          console.log('🔴 Ejecutando apagado programado...')
          await api.toggleLoad(0, 0, 1) // Apagar por 1 segundo para activar apagado
          isActivelyControlling.value = true
          lastActionTime.value = new Date().toISOString()
          saveToStorage()
        }
      } else {
        // Deberíamos estar encendidos
        if (!isLoadOn && isActivelyControlling.value) {
          console.log('🟢 Reactivando carga después de apagado programado...')
          await api.toggleLoad(0, 0, 1) // Reactivar
          isActivelyControlling.value = false
          lastActionTime.value = new Date().toISOString()
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
    startTime.value = start
    endTime.value = end
    saveToStorage()
  }

  function toggleEnabled() {
    enabled.value = !enabled.value
    if (enabled.value) {
      cancelled.value = false
    } else {
      isActivelyControlling.value = false
    }
    saveToStorage()
  }

  function cancelSchedule() {
    cancelled.value = true
    isActivelyControlling.value = false
    saveToStorage()
  }

  function reactivateSchedule() {
    cancelled.value = false
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
    localStorage.setItem(STORAGE_KEYS.enabled, enabled.value.toString())
    localStorage.setItem(STORAGE_KEYS.startTime, startTime.value)
    localStorage.setItem(STORAGE_KEYS.endTime, endTime.value)
    localStorage.setItem(STORAGE_KEYS.cancelled, cancelled.value.toString())
    localStorage.setItem(STORAGE_KEYS.isActivelyControlling, isActivelyControlling.value.toString())
    if (lastActionTime.value) {
      localStorage.setItem(STORAGE_KEYS.lastActionTime, lastActionTime.value)
    }
  }

  function loadFromStorage() {
    enabled.value = localStorage.getItem(STORAGE_KEYS.enabled) === 'true'
    startTime.value = localStorage.getItem(STORAGE_KEYS.startTime) || '00:00'
    endTime.value = localStorage.getItem(STORAGE_KEYS.endTime) || '06:00'
    cancelled.value = localStorage.getItem(STORAGE_KEYS.cancelled) === 'true'
    isActivelyControlling.value = localStorage.getItem(STORAGE_KEYS.isActivelyControlling) === 'true'
    
    const storedLastAction = localStorage.getItem(STORAGE_KEYS.lastActionTime)
    if (storedLastAction) {
      lastActionTime.value = storedLastAction
    }
  }

  // Lifecycle
  function startScheduler() {
    loadFromStorage()
    
    // Verificar cada minuto
    checkInterval = setInterval(checkAndControlLoad, 60000)
    
    // Actualizar tiempo cada segundo para UI
    timeUpdateInterval = setInterval(updateCurrentTime, 1000)
    
    // Verificar inmediatamente
    checkAndControlLoad()
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