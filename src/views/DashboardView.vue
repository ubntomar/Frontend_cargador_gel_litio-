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
      <!-- Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Panel Solar"
          :value="data.voltagePanel"
          unit="V"
          :subtitle="`${(data.panelToBatteryCurrent )} mA`"
          :icon-bg-class="'bg-yellow-100'"
          :icon-class="'text-yellow-600'"
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
          title="Carga"
          :value="data.batteryToLoadCurrent / 1000"
          unit="A"
          :subtitle="data.loadControlState ? 'Encendida' : 'Apagada'"
          :icon-bg-class="data.loadControlState ? 'bg-green-100' : 'bg-gray-100'"
          :icon-class="data.loadControlState ? 'text-green-600' : 'text-gray-600'"
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

      <!-- 🆕 NUEVA SECCIÓN: Información BULK -->
      <div v-if="data.chargeState === 'BULK_CHARGE'" class="bg-blue-50 border-2 border-blue-200 rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <div class="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <h3 class="text-lg font-semibold text-blue-900">⚡ Etapa BULK Activa</h3>
          </div>
          <span class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full shadow">
            En progreso
          </span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Progreso BULK -->
          <div class="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-blue-700">Progreso en BULK</p>
              <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {{ bulkProgressPercentage.toFixed(1) }}%
              </span>
            </div>
            
            <!-- Barra de progreso -->
            <div class="w-full bg-blue-200 rounded-full h-4 mb-3 overflow-hidden">
              <div 
                class="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out relative"
                :style="{ width: `${Math.min(100, bulkProgressPercentage)}%` }"
              >
                <div class="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <!-- Tiempos -->
            <div class="flex justify-between items-center">
              <div class="text-center">
                <p class="text-lg font-bold text-blue-900">{{ (data.currentBulkHours || 0).toFixed(1) }}h</p>
                <p class="text-xs text-blue-600">Transcurridas</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-bold text-gray-700">{{ (data.maxBulkHours || 0).toFixed(1) }}h</p>
                <p class="text-xs text-gray-600">Máximo</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-bold text-green-700">{{ bulkTimeRemaining.toFixed(1) }}h</p>
                <p class="text-xs text-green-600">Restantes</p>
              </div>
            </div>
          </div>
          
          <!-- Absorción calculada -->
          <div class="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div class="text-center">
              <p class="text-sm font-medium text-blue-700 mb-2">Próxima Etapa: Absorción</p>
              <div class="mb-3">
                <p class="text-3xl font-bold text-blue-900 mb-1">
                  {{ (data.calculatedAbsorptionHours || 0).toFixed(1) }}h
                </p>
                <p class="text-sm text-blue-600">Duración estimada</p>
              </div>
              
              <!-- Información adicional -->
              <div class="pt-3 border-t border-blue-100 space-y-2">
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600">Umbral absorción:</span>
                  <span class="font-medium text-gray-800">{{ data.absorptionCurrentThreshold_mA }} mA</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600">Voltaje objetivo:</span>
                  <span class="font-medium text-gray-800">{{ data.absorptionVoltage }} V</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Información adicional en la parte inferior -->
        <div class="mt-4 pt-4 border-t border-blue-200">
          <div class="flex items-center justify-center space-x-6 text-xs text-blue-700">
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>La etapa BULK terminará al alcanzar {{ data.absorptionVoltage }}V o {{ data.maxBulkHours }}h máximo</span>
            </div>
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
              <span class="text-gray-600">Generación Solar</span>
              <span class="font-semibold text-green-600">
                {{ chargingPower.toFixed(2) }} W
              </span>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Consumo de Carga</span>
              <span class="font-semibold text-orange-600">
                {{ loadPower.toFixed(2) }} W
              </span>
            </div>
            
            <div class="pt-2 border-t">
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
      </div>

      <!-- Additional Info -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">PWM</p>
          <p class="text-xl font-semibold">{{ data.currentPWM }}/255</p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Capacidad de  Bateria {{ data.batteryCapacity }} Ah se aplica % para determinar umbral absorcion  </p>
          <p class="text-xl font-semibold">{{ data.thresholdPercentage }} %</p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Corriente umbral (Depende de % capacidad bateria) en Absorcion(si se esta por debajo pasa a Float) </p>
          <p class="text-xl font-semibold">{{ data.absorptionCurrentThreshold_mA }} mA</p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Factor divisor para tomar el umbral absorcion y calcular el umbral Float </p>
          <p class="text-xl font-semibold">{{ data.factorDivider }} </p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Corriente Máxima permitida en Float</p>
          <p class="text-xl font-semibold">{{ data.currentLimitIntoFloatStage }} mA</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Ah Acumulados</p>
          <p class="text-xl font-semibold">{{ data.accumulatedAh.toFixed(2) }} Ah</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Firmware</p>
          <p class="text-xl font-semibold">{{ data.firmware_version }}</p>
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

// 🆕 NUEVOS COMPUTED PARA BULK
const bulkProgressPercentage = computed(() => {
  if (!data.value?.currentBulkHours || !data.value?.maxBulkHours) return 0
  const percentage = (data.value.currentBulkHours / data.value.maxBulkHours) * 100
  return Math.min(100, Math.max(0, percentage))
})

const bulkTimeRemaining = computed(() => {
  if (!data.value?.currentBulkHours || !data.value?.maxBulkHours) return 0
  const remaining = data.value.maxBulkHours - data.value.currentBulkHours
  return Math.max(0, remaining)
})
</script>

<style scoped>
/* Animación para la barra de progreso BULK */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}
</style>