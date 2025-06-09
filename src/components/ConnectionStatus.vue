<template>
  <div class="flex items-center space-x-2">
    <div 
      class="w-3 h-3 rounded-full animate-pulse"
      :class="connected ? 'bg-green-400' : 'bg-red-400'"
    ></div>
    <span class="text-sm">
      {{ connected ? 'Conectado' : 'Desconectado' }}
    </span>
    <span v-if="lastUpdate" class="text-xs opacity-75">
      ({{ formatTime }})
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const dataStore = useDataStore()

const connected = computed(() => dataStore.connected)
const lastUpdate = computed(() => dataStore.lastUpdate)

const formatTime = computed(() => {
  if (!lastUpdate.value) return ''
  return lastUpdate.value.toLocaleTimeString()
})
</script>
