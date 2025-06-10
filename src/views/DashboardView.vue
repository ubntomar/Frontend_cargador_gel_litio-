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
          :subtitle="`${(data.panelToBatteryCurrent / 1000).toFixed(2)} A`"
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
          <p class="text-sm text-gray-600">Capacidad de a Bateria {{ data.batteryCapacity }} se aplica % para determinar umbral absorcion  </p>
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
</script>
