<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
    
    <!-- Loading State -->
    <div v-if="loading && !data" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      <p class="font-semibold">Error al cargar datos</p>
      <p class="text-sm">{{ error }}</p>
    </div>

    <!-- Data Display -->
    <div v-else-if="data" class="space-y-6">
      <!-- Métricas principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Fuente de Energía -->
        <MetricCard
          :title="energySourceType"
          :value="data.useFuenteDC ? data.fuenteDC_Amps : data.voltagePanel"
          :unit="data.useFuenteDC ? 'A' : 'V'"
          :subtitle="`${data.panelToBatteryCurrent.toFixed(1)} mA`"
          :icon-bg-class="data.useFuenteDC ? 'bg-blue-100' : 'bg-yellow-100'"
          :icon-class="data.useFuenteDC ? 'text-blue-600' : 'text-yellow-600'"
        />
        
        <MetricCard
          title="Batería"
          :value="data.voltageBatterySensor2"
          unit="V"
          :subtitle="`SOC: ${batteryPercentage.toFixed(1)}%`"
          :show-progress="true"
          :progress="batteryPercentage"
          :progress-class="batteryPercentage > 50 ? 'bg-green-600' : 'bg-orange-600'"
        />
        
        <MetricCard
          title="Corriente de Carga"
          :value="data.panelToBatteryCurrent"
          unit="mA"
          :subtitle="data.chargeState !== 'ERROR' ? 'Cargando' : 'Error'"
          :icon-bg-class="data.chargeState !== 'ERROR' ? 'bg-green-100' : 'bg-red-100'"
          :icon-class="data.chargeState !== 'ERROR' ? 'text-green-600' : 'text-red-600'"
        />
        
        <MetricCard
          title="Temperatura"
          :value="data.temperature"
          unit="°C"
          :subtitle="data.temperature > 50 ? 'Alta' : 'Normal'"
          :icon-bg-class="data.temperature > 50 ? 'bg-red-100' : 'bg-blue-100'"
          :icon-class="data.temperature > 50 ? 'text-red-600' : 'text-blue-600'"
        />
      </div>

      <!-- Información de configuración de carga -->
      <div v-if="data.chargeState !== 'ERROR'" class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-4">
          🔋 Estado de Carga: {{ data.chargeState.replace('_', ' ') }}
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-gray-600">Voltaje BULK</p>
            <p class="text-xl font-semibold text-blue-900">{{ data.bulkVoltage }} V</p>
          </div>
          
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-gray-600">Voltaje Absorción</p>
            <p class="text-xl font-semibold text-yellow-900">{{ data.absorptionVoltage }} V</p>
          </div>
          
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-gray-600">Voltaje Flotación</p>
            <p class="text-xl font-semibold text-green-900">{{ data.floatVoltage }} V</p>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Battery Status -->
        <BatteryStatus />

        <!-- Power Flow -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Flujo de Energía</h3>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Generación {{ energySourceType }}</span>
              <span class="font-semibold text-green-600">
                {{ chargingPower.toFixed(2) }} W
              </span>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Balance Neto</span>
              <span 
                class="font-semibold"
                :class="netPower >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ netPower >= 0 ? '+' : '' }}{{ netPower.toFixed(2) }} W
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Capacidad de Batería</p>
          <p class="text-xl font-semibold">{{ data.batteryCapacity }} Ah</p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Umbral de Corriente</p>
          <p class="text-xl font-semibold">{{ data.thresholdPercentage }} %</p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Corriente Máxima</p>
          <p class="text-xl font-semibold">{{ data.maxAllowedCurrent }} mA</p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Factor Divisor</p>
          <p class="text-xl font-semibold">{{ data.factorDivider }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import MetricCard from '@/components/MetricCard.vue'
import BatteryStatus from '@/components/BatteryStatus.vue'

const dataStore = useDataStore()

const data = computed(() => dataStore.data)
const loading = computed(() => dataStore.loading)
const error = computed(() => dataStore.error)
const batteryPercentage = computed(() => dataStore.batteryPercentage)
const chargingPower = computed(() => dataStore.chargingPower)
const loadPower = computed(() => dataStore.loadPower)

const netPower = computed(() => {
  return chargingPower.value - loadPower.value
})

// Determinar tipo de fuente activa
const energySourceType = computed(() => {
  if (!data.value) return 'Desconocido'
  return data.value.useFuenteDC ? 'Fuente DC' : 'Paneles Solares'
})
</script>
