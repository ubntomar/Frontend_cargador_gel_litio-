<template>
  <div class="flex items-center space-x-2">
    <div 
      class="w-3 h-3 rounded-full animate-pulse"
      :class="statusColor"
    ></div>
    <span class="text-sm">
      {{ statusText }}
    </span>
    <span v-if="lastUpdate" class="text-xs opacity-75">
      ({{ formatTime }})
    </span>
    <span v-if="apiVersion" class="text-xs opacity-60 ml-2">
      API: {{ apiVersion }}
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import api from '@/services/api'

const dataStore = useDataStore()
const healthData = ref(null)

const connected = computed(() => dataStore.connected)
const lastUpdate = computed(() => dataStore.lastUpdate)

const statusColor = computed(() => {
  if (healthData.value?.esp32_connection?.connected && connected.value) {
    return 'bg-green-400'
  } else if (healthData.value?.status === 'healthy' && !healthData.value?.esp32_connection?.connected) {
    return 'bg-yellow-400'
  } else {
    return 'bg-red-400'
  }
})

const statusText = computed(() => {
  if (!healthData.value) return connected.value ? 'Conectado' : 'Desconectado'
  
  if (healthData.value.esp32_connection?.connected && connected.value) {
    return 'ESP32 Conectado'
  } else if (healthData.value.status === 'healthy' && !healthData.value.esp32_connection?.connected) {
    return 'API OK - ESP32 Desconectado'
  } else {
    return 'Sin conexión'
  }
})

const apiVersion = computed(() => healthData.value?.version)

const formatTime = computed(() => {
  if (!lastUpdate.value) return ''
  return lastUpdate.value.toLocaleTimeString()
})

// Verificar estado de salud del API cada 30 segundos
onMounted(() => {
  checkHealth()
  setInterval(checkHealth, 30000)
})

async function checkHealth() {
  try {
    healthData.value = await api.getHealthCheck()
  } catch (error) {
    healthData.value = null
  }
}
</script>
