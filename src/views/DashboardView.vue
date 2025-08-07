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

      <!-- Nueva sección: Información del Sistema -->
      <div v-if="data" class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Estado de Conexión</p>
            <p class="text-xl font-semibold" :class="data.connected ? 'text-green-600' : 'text-red-600'">
              {{ data.connected ? '🟢 Conectado' : '🔴 Desconectado' }}
            </p>
          </div>

          <div v-if="data.firmware_version" class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Versión Firmware</p>
            <p class="text-xl font-semibold">{{ data.firmware_version }}</p>
          </div>

          <div v-if="data.uptime" class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Tiempo Encendido</p>
            <p class="text-xl font-semibold">{{ formatUptime(data.uptime) }}</p>
          </div>

          <div v-if="data.last_update" class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Última Actualización</p>
            <p class="text-sm font-semibold">{{ formatLastUpdate(data.last_update) }}</p>
          </div>
        </div>

        <!-- Información adicional de carga -->
        <div v-if="data.accumulatedAh || data.netCurrent" class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-if="data.accumulatedAh" class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Ah Acumulados</p>
            <p class="text-xl font-semibold text-blue-600">{{ data.accumulatedAh.toFixed(2) }} Ah</p>
          </div>

          <div v-if="data.netCurrent" class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Corriente Neta</p>
            <p class="text-xl font-semibold" :class="data.netCurrent >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ data.netCurrent.toFixed(1) }} mA
            </p>
          </div>

          <div v-if="data.currentBulkHours" class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Horas BULK Actuales</p>
            <p class="text-xl font-semibold">{{ data.currentBulkHours.toFixed(1) }} h</p>
          </div>
        </div>

        <!-- Nota personalizada del sistema -->
        <div v-if="data.notaPersonalizada" class="mt-4 bg-blue-100 rounded-lg p-4">
          <p class="text-sm text-blue-800 font-medium">💡 Nota del Sistema:</p>
          <p class="text-blue-700">{{ data.notaPersonalizada }}</p>
        </div>
      </div>

      <!-- Resumen de Configuración de Carga -->
      <div class="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-xl shadow-lg p-6 border border-blue-200">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">⚡ Resumen de Configuración de Carga</h3>
            <p class="text-gray-600">Cómo está configurado tu sistema para cargar la batería de manera óptima</p>
          </div>
        </div>

        <!-- Información de la batería configurada -->
        <div class="bg-white rounded-lg p-5 mb-6 border border-blue-100">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">🔋</span>
            <h4 class="text-lg font-semibold text-gray-900">Batería Configurada</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600">Capacidad</p>
              <p class="text-xl font-bold text-blue-600">{{ data.batteryCapacity }} Ah</p>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600">Tecnología</p>
              <p class="text-xl font-bold" :class="data.isLithium ? 'text-purple-600' : 'text-green-600'">
                {{ data.isLithium ? '🔋 Litio' : '🟢 GEL/AGM' }}
              </p>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600">Corriente Máxima</p>
              <p class="text-xl font-bold text-red-600">{{ data.maxAllowedCurrent }} mA</p>
            </div>
          </div>
        </div>

        <!-- Explicación de las etapas de carga -->
        <div class="space-y-4">
          <!-- Etapa BULK -->
          <div class="bg-white rounded-lg p-5 border-l-4 border-blue-500">
            <div class="flex items-center gap-3 mb-3">
              <span class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <h5 class="text-lg font-semibold text-blue-700">📈 Etapa BULK (Carga Rápida)</h5>
            </div>
            <div class="text-gray-700 leading-relaxed">
              <p class="mb-2">
                <strong>Voltaje objetivo:</strong> <span class="text-blue-600 font-semibold">{{ data.bulkVoltage }} V</span>
              </p>
              <p>
                En la etapa BULK, el sistema carga a máxima corriente (hasta {{ data.maxAllowedCurrent }} mA) 
                hasta alcanzar el voltaje objetivo de <strong class="text-blue-600">{{ data.bulkVoltage }} V</strong>. 
                Cuando la batería llegue a este voltaje, el sistema pasará automáticamente a la etapa de Absorción.
                {{ data.useFuenteDC ? `Con fuente DC, también hay límite de tiempo máximo.` : '' }}
              </p>
            </div>
          </div>

          <!-- Etapa ABSORPTION -->
          <div class="bg-white rounded-lg p-5 border-l-4 border-yellow-500">
            <div class="flex items-center gap-3 mb-3">
              <span class="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <h5 class="text-lg font-semibold text-yellow-700">⏱️ Etapa ABSORCIÓN (Carga Completa)</h5>
            </div>
            <div class="text-gray-700 leading-relaxed">
              <p class="mb-2">
                <strong>Voltaje mantenido:</strong> <span class="text-yellow-600 font-semibold">{{ data.absorptionVoltage }} V</span>
              </p>
              <p>
                Durante la absorción, mantenemos {{ data.absorptionVoltage }}V constante mientras 
                la corriente disminuye gradualmente. Cuando la corriente <strong>neta</strong> 
                (carga - consumo) caiga por debajo de 
                <strong class="text-yellow-600">{{ calculateThresholdCurrent }} mA</strong> 
                ({{ data.thresholdPercentage }}% de {{ data.batteryCapacity }}Ah × 10), 
                pasaremos a la etapa de Flotación.
              </p>
            </div>
          </div>

          <!-- Etapa FLOAT -->
          <div class="bg-white rounded-lg p-5 border-l-4 border-green-500">
            <div class="flex items-center gap-3 mb-3">
              <span class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <h5 class="text-lg font-semibold text-green-700">🌊 Etapa FLOTACIÓN (Mantenimiento)</h5>
            </div>
            <div class="text-gray-700 leading-relaxed">
              <p class="mb-2">
                <strong>Voltaje de mantenimiento:</strong> <span class="text-green-600 font-semibold">{{ data.floatVoltage }} V</span>
              </p>
              <p>
                En flotación, mantenemos la batería a {{ data.floatVoltage }}V para evitar la autodescarga 
                sin sobrecargarla. El sistema regula automáticamente la corriente para mantener este voltaje.
                La corriente máxima permitida en esta etapa es de 
                <strong class="text-green-600">{{ calculateFloatThreshold }} mA</strong> 
                (límite de {{ calculateThresholdCurrent }} mA ÷ 5).
              </p>
            </div>
          </div>
        </div>

        <!-- Protecciones activas -->
        <div class="mt-6 bg-red-50 rounded-lg p-5 border border-red-200">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">🛡️</span>
            <h4 class="text-lg font-semibold text-red-800">Protecciones Activas</h4>
          </div>
          <div class="text-red-700">
            <p>
              • <strong>Corriente máxima limitada a:</strong> {{ data.maxAllowedCurrent }} mA<br>
              • <strong>Protección por temperatura:</strong> Monitoreo continuo a {{ data.temperature }}°C<br>
              • <strong>Tipo de batería:</strong> Perfiles optimizados para {{ data.isLithium ? 'Litio (LifePO4)' : 'GEL/AGM' }}<br>
              • <strong>Fuente de energía:</strong> {{ energySourceType }} {{ data.useFuenteDC ? `(${data.fuenteDC_Amps}A máx.)` : '(Solar)' }}
            </p>
          </div>
        </div>

        <!-- Estado actual del sistema -->
        <div class="mt-6 bg-gray-800 text-white rounded-lg p-5">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">📊</span>
            <h4 class="text-lg font-semibold">Estado Actual del Sistema</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-gray-300 text-sm">Etapa Actual</p>
              <p class="text-xl font-bold text-yellow-400">{{ data.chargeState.replace('_', ' ') }}</p>
            </div>
            <div class="text-center">
              <p class="text-gray-300 text-sm">Voltaje de Batería</p>
              <p class="text-xl font-bold text-blue-400">{{ data.voltageBatterySensor2 }} V</p>
            </div>
            <div class="text-center">
              <p class="text-gray-300 text-sm">Corriente Actual</p>
              <p class="text-xl font-bold text-green-400">{{ data.panelToBatteryCurrent }} mA</p>
            </div>
          </div>
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

// Cálculos para el resumen de configuración
const calculateThresholdCurrent = computed(() => {
  if (!data.value) return 0
  // Umbral = (Capacidad en Ah * 1000 mA/A) * (Porcentaje / 100)
  return Math.round((data.value.batteryCapacity * 1000) * (data.value.thresholdPercentage / 100))
})

const calculateFloatThreshold = computed(() => {
  if (!data.value) return 0
  // Umbral para pasar a flotación = umbral de absorción / factorDivider (5)
  // Según ESP32: currentLimitIntoFloatStage = absorptionCurrentThreshold_mA / factorDivider
  return Math.round(calculateThresholdCurrent.value / 5)
})

const calculateMaintenanceCurrent = computed(() => {
  if (!data.value) return 0
  // Corriente de mantenimiento típica = 0.5-2% de la capacidad
  return Math.round((data.value.batteryCapacity * 1000) * 0.01) // 1% como ejemplo
})

// Función para formatear el uptime
const formatUptime = (uptimeSeconds) => {
  const hours = Math.floor(uptimeSeconds / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes}m`
}

// Función para formatear la última actualización
const formatLastUpdate = (lastUpdate) => {
  const date = new Date(lastUpdate)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>
