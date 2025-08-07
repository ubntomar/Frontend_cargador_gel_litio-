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

    <!-- Advertencia sobre compatibilidad API -->
    <div class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-yellow-400">⚠️</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">Nota sobre Compatibilidad</h3>
          <div class="mt-2 text-sm text-yellow-700">
            <p>Algunos endpoints de control pueden no estar disponibles en la nueva versión de la API. 
            Esta funcionalidad está adaptada para usar los datos disponibles del endpoint principal <code>/data/</code>.</p>
          </div>
        </div>
      </div>
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
              class="w-4 h-4 rounded-full transition-colors"
              :class="actionsStatus?.load_control_state ? 'bg-green-500' : 'bg-gray-400'"
            ></div>
          </div>
        </div>

        <!-- Debug Info -->
        <div v-if="showDebugInfo" class="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <h4 class="text-xs font-semibold text-yellow-800 mb-2">🐛 DEBUG INFO</h4>
          <div class="text-xs text-yellow-700 space-y-1">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="font-semibold">Manual Control:</p>
                <p><strong>Hours:</strong> {{ hours }}</p>
                <p><strong>Minutes:</strong> {{ minutes }}</p>
                <p><strong>Seconds:</strong> {{ seconds }}</p>
                <p><strong>Valid Duration:</strong> {{ isValidDuration ? 'YES' : 'NO' }}</p>
                <p><strong>Loading:</strong> {{ loading ? 'YES' : 'NO' }}</p>
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
            v-if="actionsStatus?.temporary_load_off"
            @click="quickReactivate"
            class="text-left px-4 py-3 rounded-lg border-2 border-green-300 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <p class="font-medium text-green-800">🔌 Reactivar Carga</p>
            <p class="text-sm text-green-600">Conectar carga inmediatamente</p>
          </button>
        </div>
      </div>

      <!-- Schedule Daily (Tareas Programadas) -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Apagado Programado Diario</h3>
          
          <!-- Enable/Disable Toggle -->
          <button
            @click="toggleSchedule"
            :disabled="scheduleLoading"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            :class="scheduleStatus?.enabled ? 'bg-blue-600' : 'bg-gray-200'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="scheduleStatus?.enabled ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>

        <!-- Schedule Status -->
        <div v-if="scheduleStatus" class="space-y-4">
          <!-- Current Status -->
          <div v-if="scheduleStatus.enabled" class="p-3 rounded-lg" 
               :class="scheduleStatus.is_active ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium" :class="scheduleStatus.is_active ? 'text-orange-800' : 'text-gray-800'">
                  {{ scheduleStatus.is_active ? '⏰ Apagado programado ACTIVO' : '📅 Programado para ejecutarse' }}
                </p>
                <p class="text-sm mt-1">
                  <span v-if="scheduleStatus.is_active">
                    Terminará a las {{ scheduleStatus.startup_time }}
                  </span>
                  <span v-else-if="scheduleStatus.next_shutdown">
                    Próxima ejecución: {{ formatNextExecution(scheduleStatus.next_shutdown) }}
                  </span>
                </p>
              </div>
              <div v-if="scheduleStatus.is_active" class="text-right">
                <p class="text-sm text-gray-600">Tiempo restante</p>
                <p class="font-mono text-lg font-bold text-orange-700">{{ remainingScheduleTime }}</p>
              </div>
            </div>
          </div>

          <!-- Configuration -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Start Time -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hora de Inicio</label>
              <div class="flex space-x-2">
                <select v-model="scheduleHour" class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option v-for="h in 12" :key="h" :value="h">{{ String(h).padStart(2, '0') }}</option>
                </select>
                <span class="text-gray-500 self-center">:</span>
                <select v-model="scheduleMinute" class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option v-for="m in 60" :key="m-1" :value="m-1">{{ String(m-1).padStart(2, '0') }}</option>
                </select>
                <select v-model="scheduleAmPm" class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <!-- Duration -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Duración</label>
              <div class="flex space-x-2">
                <div class="flex-1">
                  <select v-model="scheduleDurationHours" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option v-for="h in 9" :key="h-1" :value="h-1">{{ h-1 }}h</option>
                  </select>
                </div>
                <div class="flex-1">
                  <select v-model="scheduleDurationMinutes" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option v-for="m in 60" :key="m-1" :value="m-1">{{ m-1 }}m</option>
                  </select>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">Máximo 8 horas</p>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex space-x-3">
            <button
              @click="saveScheduleConfig"
              :disabled="scheduleLoading"
              class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ scheduleLoading ? 'Guardando...' : 'Guardar Configuración' }}
            </button>
            
            <button
              v-if="scheduleStatus.manual_override_active"
              @click="clearOverride"
              :disabled="scheduleLoading"
              class="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Limpiar Override
            </button>
          </div>

          <!-- Help Text -->
          <div class="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <p>• El apagado programado se ejecuta diariamente a la hora configurada</p>
            <p>• Los comandos manuales anulan el schedule hasta el día siguiente</p>
            <p>• La carga se reactivará automáticamente al finalizar el período programado</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <transition name="fade">
      <div v-if="message" class="fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-xl z-50 max-w-sm" :class="messageClass">
        <div class="flex items-center space-x-2">
          <span v-if="messageType === 'success'" class="text-green-600">✅</span>
          <span v-else-if="messageType === 'error'" class="text-red-600">❌</span>
          <span v-else class="text-blue-600">ℹ️</span>
          <p class="font-medium">{{ message }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'

// Estado local
const hours = ref(0)
const minutes = ref(0) 
const seconds = ref(0)
const loading = ref(false)
const message = ref('')
const messageType = ref('success')
const actionsStatus = ref(null)
const showDebugInfo = ref(false)
const lastStatusUpdate = ref('')

// Schedule state
const scheduleStatus = ref(null)
const scheduleLoading = ref(false)
const scheduleHour = ref(12)
const scheduleMinute = ref(0)
const scheduleAmPm = ref('AM')
const scheduleDurationHours = ref(6)
const scheduleDurationMinutes = ref(0)
const remainingScheduleTime = ref('--:--:--')

let statusInterval = null
let scheduleInterval = null
let scheduleCountdownInterval = null

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
  const baseClasses = 'border-2'
  switch (messageType.value) {
    case 'success':
      return `${baseClasses} bg-green-100 border-green-400 text-green-800`
    case 'error':
      return `${baseClasses} bg-red-100 border-red-400 text-red-800`
    default:
      return `${baseClasses} bg-blue-100 border-blue-400 text-blue-800`
  }
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
    
    const response = await api.toggleLoad(hours.value, minutes.value, seconds.value)
    
    console.log(`✅ [MANUAL] Comando enviado exitosamente:`, {
      response,
      timestamp: new Date().toISOString()
    })
    
    showMessage(`⏱️ Carga apagada por ${hours.value}h ${minutes.value}m ${seconds.value}s`, 'success')
    await loadStatus()
    
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
    
    const response = await api.toggleLoad(0, 0, 1)
    
    console.log(`✅ [MANUAL] Reactivación enviada exitosamente:`, {
      response,
      timestamp: new Date().toISOString()
    })
    
    showMessage('🔌 Carga reactivada inmediatamente', 'success')
    await loadStatus()
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
    
    const response = await api.toggleLoad(0, 0, 1)
    
    console.log(`✅ [QUICK] Reactivación rápida exitosa:`, {
      response,
      timestamp: new Date().toISOString()
    })
    
    showMessage('🚀 ¡Carga reactivada instantáneamente!', 'success')
    await loadStatus()
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

function showMessage(msg, type = 'success') {
  message.value = msg
  messageType.value = type
  
  setTimeout(() => {
    message.value = ''
  }, 4000)
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  return `${h}h ${m}m ${s}s`
}

// Schedule Methods
async function loadScheduleStatus() {
  try {
    const response = await api.getScheduleStatus()
    scheduleStatus.value = response
    
    // Parse current configuration para la nueva API
    if (response.shutdown_time) {
      const [hours, minutes] = response.shutdown_time.split(':').map(Number)
      if (hours === 0) {
        scheduleHour.value = 12
        scheduleAmPm.value = 'AM'
      } else if (hours === 12) {
        scheduleHour.value = 12
        scheduleAmPm.value = 'PM'
      } else if (hours > 12) {
        scheduleHour.value = hours - 12
        scheduleAmPm.value = 'PM'
      } else {
        scheduleHour.value = hours
        scheduleAmPm.value = 'AM'
      }
      scheduleMinute.value = minutes
    }
    
    // La nueva API maneja startup_time en lugar de duration
    if (response.startup_time) {
      const shutdownTime = response.shutdown_time ? response.shutdown_time.split(':').map(Number) : [22, 0]
      const startupTime = response.startup_time.split(':').map(Number)
      
      // Calcular duración basada en shutdown y startup time
      let shutdownMinutes = shutdownTime[0] * 60 + shutdownTime[1]
      let startupMinutes = startupTime[0] * 60 + startupTime[1]
      
      // Si startup es al día siguiente
      if (startupMinutes < shutdownMinutes) {
        startupMinutes += 24 * 60
      }
      
      const durationMinutes = startupMinutes - shutdownMinutes
      scheduleDurationHours.value = Math.floor(durationMinutes / 60)
      scheduleDurationMinutes.value = durationMinutes % 60
    }
    
    // Update countdown
    updateScheduleCountdown()
  } catch (error) {
    console.error('Error loading schedule status:', error)
  }
}

function updateScheduleCountdown() {
  if (!scheduleStatus.value?.is_active || !scheduleStatus.value?.startup_time) {
    remainingScheduleTime.value = '--:--:--'
    return
  }
  
  // Calculate remaining time usando startup_time de la nueva API
  const now = new Date()
  const [endHours, endMinutes] = scheduleStatus.value.startup_time.split(':').map(Number)
  const endTime = new Date()
  endTime.setHours(endHours, endMinutes, 0, 0)
  
  // If end time is before current time, it means it ends tomorrow
  if (endTime < now) {
    endTime.setDate(endTime.getDate() + 1)
  }
  
  const remainingMs = endTime - now
  if (remainingMs > 0) {
    const hours = Math.floor(remainingMs / (1000 * 60 * 60))
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
    remainingScheduleTime.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  } else {
    remainingScheduleTime.value = '00:00:00'
  }
}

async function toggleSchedule() {
  scheduleLoading.value = true
  
  try {
    const newEnabled = !scheduleStatus.value?.enabled
    
    // Usar la nueva API que requiere configurar enabled/disabled
    await api.configureSchedule(newEnabled, 
      scheduleStatus.value?.shutdown_time || '22:00', 
      0) // durationSeconds no se usa en la nueva API
    
    if (newEnabled) {
      showMessage('📅 Apagado programado habilitado', 'success')
    } else {
      showMessage('📅 Apagado programado deshabilitado', 'success')
    }
    
    await loadScheduleStatus()
  } catch (error) {
    showMessage(error.response?.data?.detail || 'Error al cambiar estado del schedule', 'error')
  } finally {
    scheduleLoading.value = false
  }
}

async function saveScheduleConfig() {
  scheduleLoading.value = true
  
  try {
    // Convert 12h to 24h format
    let hour24 = scheduleHour.value
    if (scheduleAmPm.value === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (scheduleAmPm.value === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    
    const shutdownTime = `${String(hour24).padStart(2, '0')}:${String(scheduleMinute.value).padStart(2, '0')}`
    
    // Calcular startup time basado en la duración
    const totalDurationMinutes = (scheduleDurationHours.value * 60) + scheduleDurationMinutes.value
    
    // Validate duration
    if (totalDurationMinutes < 1) {
      showMessage('La duración debe ser al menos 1 minuto', 'error')
      return
    }
    
    if (totalDurationMinutes > 480) { // 8 hours
      showMessage('La duración máxima es 8 horas', 'error')
      return
    }
    
    // Calcular startup time
    const shutdownMinutes = hour24 * 60 + scheduleMinute.value
    const startupMinutes = shutdownMinutes + totalDurationMinutes
    const startupHour = Math.floor(startupMinutes / 60) % 24
    const startupMinute = startupMinutes % 60
    const startupTime = `${String(startupHour).padStart(2, '0')}:${String(startupMinute).padStart(2, '0')}`
    
    // Usar la nueva API con shutdown_time y startup_time
    await api.configureSchedule(scheduleStatus.value?.enabled || false, shutdownTime, startupTime)
    showMessage('⏰ Configuración guardada correctamente', 'success')
    
    await loadScheduleStatus()
  } catch (error) {
    showMessage(error.response?.data?.detail || 'Error al guardar configuración', 'error')
  } finally {
    scheduleLoading.value = false
  }
}

async function clearOverride() {
  scheduleLoading.value = true
  
  try {
    await api.clearScheduleOverride()
    showMessage('🔄 Override manual limpiado', 'success')
    
    await loadScheduleStatus()
    await loadStatus()
  } catch (error) {
    showMessage(error.response?.data?.detail || 'Error al limpiar override', 'error')
  } finally {
    scheduleLoading.value = false
  }
}

function formatNextExecution(dateTimeStr) {
  try {
    const date = new Date(dateTimeStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return `Hoy a las ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Mañana a las ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleString('es', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  } catch {
    return dateTimeStr
  }
}

// Lifecycle
onMounted(() => {
  console.log(`🚀 [ACTIONS VIEW] Componente montado - Iniciando carga de estado`)
  
  loadStatus()
  loadScheduleStatus()
  
  // Actualizar estado cada 9 segundos
  statusInterval = setInterval(() => {
    console.log(`🔄 [ACTIONS VIEW] Actualizando estado automáticamente`)
    loadStatus()
  }, 9000)
  
  // Actualizar schedule cada 15 segundos
  scheduleInterval = setInterval(() => {
    loadScheduleStatus()
  }, 15000)
  
  // Actualizar countdown cada segundo
  scheduleCountdownInterval = setInterval(() => {
    updateScheduleCountdown()
  }, 1000)
  
  console.log(`✅ [ACTIONS VIEW] Polling configurado`)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
  if (scheduleInterval) {
    clearInterval(scheduleInterval)
  }
  if (scheduleCountdownInterval) {
    clearInterval(scheduleCountdownInterval)
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

/* Mejora para los selectores */
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>