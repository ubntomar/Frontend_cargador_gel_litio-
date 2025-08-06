<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Estado de Batería</h3>
    
    <div class="space-y-4">
      <!-- Indicador visual de batería -->
      <div class="relative">
        <div class="w-full h-20 border-4 border-gray-300 rounded-lg relative overflow-hidden">
          <div 
            class="absolute inset-0 transition-all duration-500"
            :class="batteryColorClass"
            :style="{ width: `${batteryPercentage}%` }"
          ></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-2xl font-bold text-gray-800">
              {{ batteryPercentage.toFixed(1) }}%
            </span>
          </div>
        </div>
        <div class="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-gray-300 rounded-r"></div>
      </div>

      <!-- Información detallada -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-gray-600">Voltaje</p>
          <p class="font-semibold">{{ voltage.toFixed(2) }} V</p>
        </div>
        <div>
          <p class="text-gray-600">Corriente</p>
          <p class="font-semibold">{{ current.toFixed(2) }} A</p>
        </div>
        <div>
          <p class="text-gray-600">Capacidad</p>
          <p class="font-semibold">{{ capacity }} Ah</p>
        </div>
        <div>
          <p class="text-gray-600">Tipo</p>
          <p class="font-semibold">{{ batteryType }}</p>
        </div>
      </div>

      <!-- Estado de carga -->
      <div class="pt-2 border-t">
        <p class="text-gray-600 text-sm">Estado de Carga</p>
        <p class="font-semibold">
          <span 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="chargeStateClass"
          >
            {{ chargeStateText }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const dataStore = useDataStore()

const batteryPercentage = computed(() => dataStore.batteryPercentage)
const voltage = computed(() => dataStore.data?.voltageBatterySensor2 || 0)
const current = computed(() => (dataStore.data?.panelToBatteryCurrent || 0))
const capacity = computed(() => dataStore.data?.batteryCapacity || 0)
const batteryType = computed(() => dataStore.data?.isLithium ? 'Litio' : 'GEL/AGM')
const chargeState = computed(() => dataStore.data?.chargeState || 'UNKNOWN')

const batteryColorClass = computed(() => {
  const percentage = batteryPercentage.value
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  if (percentage >= 20) return 'bg-orange-500'
  return 'bg-red-500'
})

const chargeStateText = computed(() => {
  const states = {
    'BULK_CHARGE': 'Carga Bulk',
    'ABSORPTION_CHARGE': 'Absorción',
    'FLOAT_CHARGE': 'Flotación',
    'ERROR': 'Error'
  }
  return states[chargeState.value] || 'Desconocido'
})

const chargeStateClass = computed(() => {
  const classes = {
    'BULK_CHARGE': 'bg-blue-100 text-blue-800',
    'ABSORPTION_CHARGE': 'bg-yellow-100 text-yellow-800',
    'FLOAT_CHARGE': 'bg-green-100 text-green-800',
    'ERROR': 'bg-red-100 text-red-800'
  }
  return classes[chargeState.value] || 'bg-gray-100 text-gray-800'
})
</script>
