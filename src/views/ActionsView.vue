<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Control de Carga</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Load Control -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Control de Carga</h3>
        
        <!-- Current Status -->
        <div class="mb-6 p-4 rounded-lg" :class="statusBgClass">
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

        <!-- Toggle Load Off -->
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
              {{ loading ? 'Cancelando...' : 'Cancelar Apagado' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        
        <div class="space-y-3">
          <button
            @click="quickAction(0, 5, 0)"
            class="w-full text-left px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p class="font-medium">Apagar 5 minutos</p>
            <p class="text-sm text-gray-600">Apagado corto para mantenimiento</p>
          </button>
          
          <button
            @click="quickAction(0, 30, 0)"
            class="w-full text-left px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p class="font-medium">Apagar 30 minutos</p>
            <p class="text-sm text-gray-600">Media hora sin carga</p>
          </button>
          
          <button
            @click="quickAction(1, 0, 0)"
            class="w-full text-left px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p class="font-medium">Apagar 1 hora</p>
            <p class="text-sm text-gray-600">Apagado extendido</p>
          </button>
          
          <button
            @click="quickAction(2, 0, 0)"
            class="w-full text-left px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <p class="font-medium">Apagar 2 horas</p>
            <p class="text-sm text-gray-600">Apagado prolongado</p>
          </button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <transition name="fade">
      <div v-if="message" class="fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg" :class="messageClass">
        <p>{{ message }}</p>
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
    const response = await api.getActionsStatus()
    actionsStatus.value = response
  } catch (error) {
    console.error('Error loading status:', error)
  }
}

async function toggleLoad() {
  if (!isValidDuration.value) return
  
  loading.value = true
  
  try {
    await api.toggleLoad(hours.value, minutes.value, seconds.value)
    showMessage('Carga apagada correctamente', 'success')
    await loadStatus()
    
    // Resetear inputs
    hours.value = 0
    minutes.value = 0
    seconds.value = 0
  } catch (error) {
    showMessage(error.response?.data?.detail || 'Error al apagar carga', 'error')
  } finally {
    loading.value = false
  }
}

async function cancelOff() {
  loading.value = true
  
  try {
    await api.cancelTemporaryOff()
    showMessage('Apagado cancelado', 'success')
    await loadStatus()
  } catch (error) {
    showMessage(error.response?.data?.detail || 'Error al cancelar', 'error')
  } finally {
    loading.value = false
  }
}

function quickAction(h, m, s) {
  hours.value = h
  minutes.value = m
  seconds.value = s
  toggleLoad()
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

// Lifecycle
onMounted(() => {
  loadStatus()
  
  // Actualizar estado cada 2 segundos
  statusInterval = setInterval(loadStatus, 2000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>
