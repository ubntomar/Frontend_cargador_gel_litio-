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