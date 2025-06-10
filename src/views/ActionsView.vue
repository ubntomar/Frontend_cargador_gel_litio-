<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Control de Carga</h2>
      
      <!-- Debug Toggle Button -->
      <button
        @click="showDebugInfo = !showDebugInfo"
        class="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
      >
        {{ showDebugInfo ? '🐛 Ocultar Debug' : '🔍 Mostrar Debug' }}
      </button>
    </div>

    <div class="space-y-6">
      <!-- Current Status -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Estado Actual</h3>
        
        <div class="mb-4 p-4 rounded-lg" :class="statusBgClass">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold" :class="statusTextClass">
                {{ statusText }}
              </p>
              <p v-if="actionsStatus?.temporary_load_off" class="text-sm mt-1">
                Tiempo restante: {{ formatTime(actionsStatus.load_off_remaining_seconds) }}
              </p>
            </div>
            <div 
              class="w-4 h-4 rounded-full"
              :class="actionsStatus?.load_control_state ? 'bg-green-500' : 'bg-gray-400'"
            ></div>
          </div>
        </div>

        <!-- Scheduled Off Status -->
        <div v-if="scheduledOff.enabled && !scheduledOff.cancelled" class="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p :class="scheduledOff.statusClass" class="text-sm font-medium">
            {{ scheduledOff.statusText }}
          </p>
        </div>

        <!-- Debug Info -->
        <div v-if="showDebugInfo" class="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <h4 class="text-xs font-semibold text-yellow-800 mb-2">🐛 DEBUG INFO</h4>
          <div class="text-xs text-yellow-700 space-y-1">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="font-semibold">Scheduled Off:</p>
                <p><strong>Initialized:</strong> {{ scheduledOff.isInitialized }}</p>
                <p><strong>Enabled:</strong> {{ scheduledOff.enabled }}</p>
                <p><strong>Cancelled:</strong> {{ scheduledOff.cancelled }}</p>
                <p><strong>In Range:</strong> {{ scheduledOff.isInScheduledRange }}</p>
                <p><strong>Controlling:</strong> {{ scheduledOff.isActivelyControlling }}</p>
                <p><strong>Schedule:</strong> {{ scheduledOff.startTime }} - {{ scheduledOff.endTime }}</p>
              </div>
              <div>
                <p class="font-semibold">API Status:</p>
                <p><strong>Load State:</strong> {{ actionsStatus?.load_control_state ? 'ON' : 'OFF' }}</p>
                <p><strong>Temp Off:</strong> {{ actionsStatus?.temporary_load_off ? 'YES' : 'NO' }}</p>
                <p><strong>Remaining:</strong> {{ actionsStatus?.load_off_remaining_seconds || 0 }}s</p>
                <p><strong>Current Time:</strong> {{ new Date().toLocaleTimeString() }}</p>
                <p><strong>Last Update:</strong> {{ lastStatusUpdate }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid de controles -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Manual Load Control -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Control Manual</h3>
          
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">Apagar Temporalmente</h4>
            
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Horas</label>
                <input
                  v-model.number="hours"
                  type="number"
                  min="0"
                  max="12"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Minutos</label>
                <input
                  v-model.number="minutes"
                  type="number"
                  min="0"
                  max="59"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Segundos</label>
                <input
                  v-model.number="seconds"
                  type="number"
                  min="0"
                  max="59"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="flex space-x-3">
              <button
                @click="toggleLoad"
                :disabled="loading || !isValidDuration"
                class="flex-1 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ loading ? 'Enviando...' : 'Apagar Carga' }}
              </button>
              
              <button
                v-if="actionsStatus?.temporary_load_off"
                @click="cancelOff"
                :disabled="loading"
                class="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ loading ? 'Reactivando...' : 'Reactivar Carga' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Scheduled Off Control -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Apagado Programado</h3>
          
          <div class="space-y-4">
            <!-- Enable/Disable Toggle -->
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Habilitar apagado programado</span>
              <button
                @click="toggleScheduledOff"
                type="button"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                :class="scheduledOff.enabled ? 'bg-blue-600' : 'bg-gray-200'"
                :aria-pressed="scheduledOff.enabled"
              >
                <span class="sr-only">Habilitar apagado programado</span>
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg"
                  :class="scheduledOff.enabled ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <!-- Time Configuration -->
            <div v-if="scheduledOff.enabled" class="space-y-4 pt-4 border-t">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Hora de inicio</label>
                  <input
                    v-model="scheduledOff.startTime"
                    type="time"
                    @change="updateSchedule"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700">Hora de fin</label>
                  <input
                    v-model="scheduledOff.endTime"
                    type="time"
                    @change="updateSchedule"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <!-- Schedule Info -->
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">
                  La carga se apagará automáticamente todos los días de 
                  <span class="font-semibold">{{ formatDisplayTime(scheduledOff.startTime) }}</span> a 
                  <span class="font-semibold">{{ formatDisplayTime(scheduledOff.endTime) }}</span>
                </p>
              </div>

              <!-- Cancel/Reactivate buttons -->
              <div v-if="scheduledOff.cancelled" class="flex space-x-3">
                <button
                  @click="scheduledOff.reactivateSchedule"
                  class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Reactivar Programación
                </button>
              </div>
              
              <div v-else-if="scheduledOff.enabled" class="flex space-x-3">
                <button
                  @click="scheduledOff.cancelSchedule"
                  class="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancelar Programación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            @click="quickAction(0, 5, 0)"
            class="text-left px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p class="font-medium">Apagar 5 minutos</p>
            <p class="text-sm text-gray-600">Apagado corto para mantenimiento</p>
          </button>
          
          <button
            @click="quickAction(0, 30, 0)"
            class="text-left px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p class="font-medium">Apagar 30 minutos</p>
            <p class="text-sm text-gray-600">Media hora sin carga</p>
          </button>
          
          <button
            @click="quickAction(1, 0, 0)"
            class="text-left px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p class="font-medium">Apagar 1 hora</p>
            <p class="text-sm text-gray-600">Apagado extendido</p>
          </button>
          
          <button
            @click="quickAction(2, 0, 0)"
            class="text-left px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p class="font-medium">Apagar 2 horas</p>
            <p class="text-sm text-gray-600">Apagado prolongado</p>
          </button>

          <!-- Reactivate button -->
          <button
            v-if="actionsStatus?.temporary_load_off || (scheduledOff.enabled && scheduledOff.isInScheduledRange)"
            @click="quickReactivate"
            class="text-left px-4 py-3 rounded-lg border-2 border-green-300 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <p class="font-medium text-green-800">🔌 Reactivar Carga</p>
            <p class="text-sm text-green-600">Conectar carga inmediatamente</p>
          </button>

          <!-- Override scheduled button -->
          <button
            v-if="scheduledOff.enabled && scheduledOff.isInScheduledRange && !scheduledOff.cancelled"
            @click="overrideScheduled"
            class="text-left px-4 py-3 rounded-lg border-2 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 transition-colors"
          >
            <p class="font-medium text-yellow-800">⚡ Override Programado</p>
            <p class="text-sm text-yellow-600">Anular apagado programado</p>
          </button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <transition name="fade">
      <div v-if="message" class="fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg z-50" :class="messageClass">
        <p>{{ message }}</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'
import { useScheduledOff } from '@/composables/useScheduledOff'

// Estado local
const hours = ref(0)
const minutes = ref(0) 
const seconds = ref(0)
const loading = ref(false)
const message = ref('')
const messageType = ref('success')
const actionsStatus = ref(null)
const showDebugInfo = ref(false) // Debug manual
const lastStatusUpdate = ref('')

// Scheduled Off composable
const scheduledOff = useScheduledOff()

let statusInterval = null

// Computed
const isValidDuration = computed(() => {
  const total = hours.value * 3600 + minutes.value * 60 + seconds.value
  return total >= 1 && total <= 43200 // 1 segundo a 12 horas
})

const statusText = computed(() => {
  if (actionsStatus.value?.temporary_load_off) {
    return 'Carga APAGADA temporalmente'
  }
  return actionsStatus.value?.load_control_state ? 'Carga ENCENDIDA' : 'Carga APAGADA'
})

const statusBgClass = computed(() => {
  if (actionsStatus.value?.temporary_load_off) {
    return 'bg-orange-50 border border-orange-200'
  }
  return actionsStatus.value?.load_control_state ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
})

const statusTextClass = computed(() => {
  if (actionsStatus.value?.temporary_load_off) {
    return 'text-orange-800'
  }
  return actionsStatus.value?.load_control_state ? 'text-green-800' : 'text-gray-800'
})

const messageClass = computed(() => {
  return messageType.value === 'success' 
    ? 'bg-green-100 border border-green-400 text-green-700'
    : 'bg-red-100 border border-red-400 text-red-700'
})

// Métodos
async function loadStatus() {
  try {
    console.log(`📊 [ACTIONS VIEW] Cargando estado de la API...`)
    
    const response = await api.getActionsStatus()
    actionsStatus.value = response
    lastStatusUpdate.value = new Date().toLocaleTimeString()
    
    console.log(`✅ [ACTIONS VIEW] Estado cargado:`, {
      loadControlState: response.load_control_state,
      temporaryLoadOff: response.temporary_load_off,
      remainingSeconds: response.load_off_remaining_seconds,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [ACTIONS VIEW] Error loading status:', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    })
  }
}

async function toggleLoad() {
  if (!isValidDuration.value) return
  
  loading.value = true
  
  try {
    console.log(`🔄 [MANUAL] Enviando comando de apagado temporal:`, {
      hours: hours.value,
      minutes: minutes.value,
      seconds: seconds.value,
      timestamp: new Date().toISOString()
    })
    
    // Apagar carga por la duración especificada
    const response = await api.toggleLoad(hours.value, minutes.value, seconds.value)
    
    console.log(`✅ [MANUAL] Comando enviado exitosamente:`, {
      response,
      timestamp: new Date().toISOString()
    })
    
    showMessage('Carga apagada correctamente', 'success')
    await loadStatus()
    
    // Notificar al scheduled off sobre acción manual
    scheduledOff.handleManualOverride()
    
    // Resetear inputs
    hours.value = 0
    minutes.value = 0
    seconds.value = 0
  } catch (error) {
    console.error(`❌ [MANUAL] Error al enviar comando:`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    })
    
    showMessage(error.response?.data?.detail || 'Error al apagar carga', 'error')
  } finally {
    loading.value = false
  }
}

async function cancelOff() {
  loading.value = true
  
  try {
    console.log(`🔄 [MANUAL] Enviando comando de reactivación:`, {
      command: 'toggleLoad(0, 0, 1)',
      reason: 'Cancelar apagado temporal',
      timestamp: new Date().toISOString()
    })
    
    // Forzar reactivación inmediata (1 segundo = encender después de 1s)
    const response = await api.toggleLoad(0, 0, 1)
    
    console.log(`✅ [MANUAL] Reactivación enviada exitosamente:`, {
      response,
      timestamp: new Date().toISOString()
    })
    
    showMessage('Carga reactivada correctamente', 'success')
    await loadStatus()
    
    // Notificar al scheduled off sobre acción manual
    scheduledOff.handleManualOverride()
  } catch (error) {
    console.error(`❌ [MANUAL] Error al reactivar:`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    })
    
    showMessage(error.response?.data?.detail || 'Error al reactivar carga', 'error')
  } finally {
    loading.value = false
  }
}

function quickAction(h, m, s) {
  console.log(`🎯 [QUICK] Acción rápida seleccionada:`, {
    hours: h,
    minutes: m,
    seconds: s,
    totalSeconds: h * 3600 + m * 60 + s,
    timestamp: new Date().toISOString()
  })
  
  // Configurar duración y ejecutar apagado temporal
  hours.value = h
  minutes.value = m
  seconds.value = s
  toggleLoad()
}

async function quickReactivate() {
  loading.value = true
  
  try {
    console.log(`🔄 [QUICK] Reactivación rápida:`, {
      command: 'toggleLoad(0, 0, 1)',
      timestamp: new Date().toISOString()
    })
    
    // Forzar reactivación inmediata (1 segundo = encender después de 1s)
    const response = await api.toggleLoad(0, 0, 1)
    
    console.log(`✅ [QUICK] Reactivación rápida exitosa:`, {
      response,
      timestamp: new Date().toISOString()
    })
    
    showMessage('¡Carga reactivada inmediatamente!', 'success')
    await loadStatus()
    
    // Notificar al scheduled off sobre acción manual
    scheduledOff.handleManualOverride()
  } catch (error) {
    console.error(`❌ [QUICK] Error en reactivación rápida:`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    })
    
    showMessage(error.response?.data?.detail || 'Error al reactivar', 'error')
  } finally {
    loading.value = false
  }
}

async function overrideScheduled() {
  loading.value = true
  
  try {
    console.log(`🔄 [OVERRIDE] Anulando apagado programado:`, {
      command: 'toggleLoad(0, 0, 1)',
      scheduledState: {
        enabled: scheduledOff.enabled,
        inRange: scheduledOff.isInScheduledRange,
        controlling: scheduledOff.isActivelyControlling
      },
      timestamp: new Date().toISOString()
    })
    
    // Forzar reactivación inmediata (1 segundo = encender después de 1s)
    const response = await api.toggleLoad(0, 0, 1)
    
    console.log(`✅ [OVERRIDE] Override exitoso:`, {
      response,
      timestamp: new Date().toISOString()
    })
    
    scheduledOff.handleManualOverride()
    showMessage('Apagado programado anulado y carga reactivada', 'success')
    await loadStatus()
  } catch (error) {
    console.error(`❌ [OVERRIDE] Error en override:`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    })
    
    showMessage(error.response?.data?.detail || 'Error al anular programación', 'error')
  } finally {
    loading.value = false
  }
}

function updateSchedule() {
  scheduledOff.setSchedule(scheduledOff.startTime, scheduledOff.endTime)
  showMessage('Horario programado actualizado', 'success')
}

function toggleScheduledOff() {
  console.log(`🎛️ [UI] Toggle programado clicked - Estado actual:`, {
    enabled: scheduledOff.enabled,
    timestamp: new Date().toISOString()
  })
  
  scheduledOff.toggleEnabled()
  
  const newState = scheduledOff.enabled ? 'habilitado' : 'deshabilitado'
  showMessage(`Apagado programado ${newState}`, 'success')
  
  console.log(`✅ [UI] Toggle completado - Nuevo estado: ${scheduledOff.enabled}`)
}

function showMessage(msg, type = 'success') {
  message.value = msg
  messageType.value = type
  
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  return `${h}h ${m}m ${s}s`
}

// Función corregida para formatear tiempo
function formatDisplayTime(timeString) {
  // Validar que timeString sea una cadena válida
  if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) {
    return '--:-- --'
  }
  
  try {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    
    return `${displayHour}:${minutes} ${ampm}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return '--:-- --'
  }
}

// Lifecycle
onMounted(() => {
  console.log(`🚀 [ACTIONS VIEW] Componente montado - Iniciando carga de estado`)
  
  loadStatus()
  
  // Actualizar estado cada 9 segundos
  statusInterval = setInterval(() => {
    console.log(`🔄 [ACTIONS VIEW] Actualizando estado automáticamente`)
    loadStatus()
  }, 9000)
  
  console.log(`✅ [ACTIONS VIEW] Polling configurado cada 9 segundos`)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>