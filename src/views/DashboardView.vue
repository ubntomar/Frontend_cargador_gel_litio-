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
      <!-- 🆕 MÉTRICAS CORREGIDAS: Mostrar fuente real -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Fuente de Energía (corregida) -->
        <MetricCard
          :title="energySourceType"
          :value="data.useFuenteDC ? data.fuenteDC_Amps : data.voltagePanel"
          :unit="data.useFuenteDC ? 'A' : 'V'"
          :subtitle="data.useFuenteDC ? `${data.panelToBatteryCurrent} mA` : `${data.panelToBatteryCurrent} mA`"
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

      <!-- 🆕 SECCIÓN AMIGABLE: Información BULK inteligente -->
      <div v-if="data.chargeState === 'BULK_CHARGE'" 
           class="rounded-lg shadow-lg p-6"
           :class="{
             'bg-blue-50 border-2 border-blue-200': bulkUserMessage.type === 'success',
             'bg-yellow-50 border-2 border-yellow-200': bulkUserMessage.type === 'warning',
             'bg-red-50 border-2 border-red-200': bulkUserMessage.type === 'error',
             'bg-gray-50 border-2 border-gray-200': bulkUserMessage.type === 'info'
           }">
        
        <!-- Header con tipo de fuente real -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <div class="w-3 h-3 rounded-full animate-pulse"
                 :class="{
                   'bg-blue-600': bulkUserMessage.type === 'success',
                   'bg-yellow-600': bulkUserMessage.type === 'warning', 
                   'bg-red-600': bulkUserMessage.type === 'error',
                   'bg-gray-600': bulkUserMessage.type === 'info'
                 }"></div>
            <h3 class="text-lg font-semibold"
                :class="{
                  'text-blue-900': bulkUserMessage.type === 'success',
                  'text-yellow-900': bulkUserMessage.type === 'warning',
                  'text-red-900': bulkUserMessage.type === 'error', 
                  'text-gray-900': bulkUserMessage.type === 'info'
                }">
              {{ bulkUserMessage.title }}
            </h3>
            <span class="text-xs px-2 py-1 rounded font-medium"
                  :class="{
                    'bg-blue-100 text-blue-700': bulkUserMessage.type === 'success',
                    'bg-yellow-100 text-yellow-700': bulkUserMessage.type === 'warning',
                    'bg-red-100 text-red-700': bulkUserMessage.type === 'error',
                    'bg-gray-100 text-gray-700': bulkUserMessage.type === 'info'
                  }">
              {{ energySourceType }}
            </span>
          </div>
          <span class="px-4 py-2 text-white text-sm font-medium rounded-full shadow"
                :class="{
                  'bg-blue-600': bulkUserMessage.type === 'success',
                  'bg-yellow-600': bulkUserMessage.type === 'warning',
                  'bg-red-600': bulkUserMessage.type === 'error',
                  'bg-gray-600': bulkUserMessage.type === 'info'
                }">
            Etapa BULK
          </span>
        </div>

        <!-- Mensaje contextual para el usuario -->
        <div class="mb-6 p-4 rounded-lg border"
             :class="{
               'bg-blue-100 border-blue-300': bulkUserMessage.type === 'success',
               'bg-yellow-100 border-yellow-300': bulkUserMessage.type === 'warning',
               'bg-red-100 border-red-300': bulkUserMessage.type === 'error',
               'bg-gray-100 border-gray-300': bulkUserMessage.type === 'info'
             }">
          <p class="text-sm font-medium"
             :class="{
               'text-blue-800': bulkUserMessage.type === 'success',
               'text-yellow-800': bulkUserMessage.type === 'warning',
               'text-red-800': bulkUserMessage.type === 'error',
               'text-gray-800': bulkUserMessage.type === 'info'
             }">
            {{ bulkUserMessage.message }}
          </p>
        </div>

        <!-- ✅ PROGRESO BULK (solo cuando tenemos datos válidos) -->
        <div v-if="bulkUserMessage.showProgress" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Barra de progreso -->
          <div class="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-blue-700">Progreso en BULK</p>
              <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {{ bulkProgressPercentage.toFixed(1) }}%
              </span>
            </div>
            
            <!-- Barra visual -->
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

          <!-- Información de fuente DC -->
          <div class="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div class="text-center">
              <p class="text-sm font-medium text-blue-700 mb-2">Configuración DC</p>
              <div class="mb-3">
                <p class="text-3xl font-bold text-blue-900 mb-1">
                  {{ data.fuenteDC_Amps }}A
                </p>
                <p class="text-sm text-blue-600">Corriente configurada</p>
              </div>
              
              <div class="pt-3 border-t border-blue-100 space-y-2">
                <div class="text-xs text-gray-600">
                  <p>Cálculo: {{ data.batteryCapacity }}Ah ÷ {{ data.fuenteDC_Amps }}A</p>
                  <p>= {{ (data.batteryCapacity / data.fuenteDC_Amps).toFixed(1) }} horas máx.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ⚠️ CASO: Paneles solares - Opción de habilitar DC -->
        <div v-else-if="bulkUserMessage.showDCOption" class="text-center">
          <div class="max-w-md mx-auto">
            <!-- Icono explicativo -->
            <div class="mb-4">
              <svg class="w-16 h-16 mx-auto text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L13.09 8.26L20 9L15 14L16.18 21L10 17.77L3.82 21L5 14L0 9L6.91 8.26L10 2Z"/>
              </svg>
            </div>

            <h4 class="text-lg font-semibold text-gray-900 mb-3">
              ☀️ Modo Paneles Solares Activo
            </h4>
            
            <p class="text-sm text-gray-600 mb-4">
              Los paneles solares generan energía variable según las condiciones climáticas, 
              por lo que no es posible calcular un tiempo exacto de BULK.
            </p>

            <!-- Estado actual -->
            <div class="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Corriente actual:</span>
                <span class="font-semibold" :class="hasActiveCurrent ? 'text-green-600' : 'text-gray-500'">
                  {{ data.panelToBatteryCurrent }} mA
                  <span class="text-xs">{{ hasActiveCurrent ? '(Activa)' : '(Baja)' }}</span>
                </span>
              </div>
            </div>

            <!-- Botón para ir a configuración -->
            <router-link 
              to="/config"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Habilitar Fuente DC
            </router-link>
            
            <p class="text-xs text-gray-500 mt-2">
              Con fuente DC podrás ver tiempo exacto en BULK
            </p>
          </div>
        </div>

        <!-- ❌ CASO: Otros estados (error, sin datos, etc.) -->
        <div v-else class="text-center py-4">
          <div class="max-w-sm mx-auto">
            <!-- Información del estado actual -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-600">Estado:</p>
                  <p class="font-semibold">{{ bulkDisplayState }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Corriente DC:</p>
                  <p class="font-semibold">{{ data.fuenteDC_Amps || 0 }}A</p>
                </div>
              </div>
              
              <!-- Botón de configuración si es necesario -->
              <div v-if="bulkDisplayState === 'dc_no_current'" class="mt-4">
                <router-link 
                  to="/config"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  → Configurar amperios de fuente DC
                </router-link>
              </div>
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
              <span class="text-gray-600">Generación {{ energySourceType }}</span>
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
          <p class="text-sm text-gray-600">Capacidad de Batería {{ data.batteryCapacity }} Ah se aplica % para determinar umbral absorción</p>
          <p class="text-xl font-semibold">{{ data.thresholdPercentage }} %</p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Corriente umbral (Depende de % capacidad batería) en Absorción (si se está por debajo pasa a Float)</p>
          <p class="text-xl font-semibold">{{ data.absorptionCurrentThreshold_mA }} mA</p>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Factor divisor para tomar el umbral absorción y calcular el umbral Float</p>
          <p class="text-xl font-semibold">{{ data.factorDivider }}</p>
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

// ========== COMPUTED MEJORADOS PARA GESTIÓN INTELIGENTE DE FUENTES ==========

// 🔍 Determinar tipo de fuente activa
const energySourceType = computed(() => {
  if (!data.value) return 'Desconocido'
  return data.value.useFuenteDC ? 'Fuente DC' : 'Paneles Solares'
})

// 🔍 Determinar si tenemos corriente real
const hasActiveCurrent = computed(() => {
  if (!data.value) return false
  return data.value.panelToBatteryCurrent > 10 // Más de 10mA consideramos activo
})

// 🔍 Estados de la interfaz BULK
const bulkDisplayState = computed(() => {
  if (!data.value || data.value.chargeState !== 'BULK_CHARGE') {
    return 'not_bulk'
  }
  
  const usingDC = data.value.useFuenteDC
  const hasDCCurrent = data.value.fuenteDC_Amps > 0
  const hasTimeData = data.value.maxBulkHours > 0 && data.value.currentBulkHours !== undefined
  
  if (usingDC && hasDCCurrent && hasTimeData) {
    return 'dc_with_data'      // ✅ DC configurado correctamente con datos
  } else if (usingDC && hasDCCurrent && !hasTimeData) {
    return 'dc_no_data'        // ⚠️ DC configurado pero sin datos de tiempo
  } else if (usingDC && !hasDCCurrent) {
    return 'dc_no_current'     // ⚠️ DC habilitado pero sin corriente configurada
  } else {
    return 'solar_mode'        // ℹ️ Modo paneles solares (sin tracking de tiempo)
  }
})

// 🔍 Progreso BULK (solo cuando tenemos datos válidos)
const bulkProgressPercentage = computed(() => {
  if (bulkDisplayState.value !== 'dc_with_data') return 0
  
  const current = data.value.currentBulkHours || 0
  const max = data.value.maxBulkHours || 1
  const percentage = (current / max) * 100
  
  return Math.min(100, Math.max(0, percentage))
})

const bulkTimeRemaining = computed(() => {
  if (bulkDisplayState.value !== 'dc_with_data') return 0
  
  const current = data.value.currentBulkHours || 0
  const max = data.value.maxBulkHours || 0
  
  return Math.max(0, max - current)
})

// 🔍 Información contextual para mostrar al usuario
const bulkUserMessage = computed(() => {
  const current = hasActiveCurrent.value
  const currentText = current ? 'hay corriente activa' : 'no hay corriente'
  
  switch (bulkDisplayState.value) {
    case 'dc_with_data':
      return {
        type: 'success',
        title: '⚡ Fuente DC Activa',
        message: `Tiempo BULK calculado basado en ${data.value?.fuenteDC_Amps}A configurados`,
        showProgress: true
      }
      
    case 'dc_no_data':
      return {
        type: 'warning', 
        title: '⚠️ Fuente DC - Calculando...',
        message: `DC configurado (${data.value?.fuenteDC_Amps}A) pero esperando datos de tiempo. ${currentText}.`,
        showProgress: false
      }
      
    case 'dc_no_current':
      return {
        type: 'error',
        title: '❌ Fuente DC sin configurar',
        message: `Fuente DC habilitada pero corriente = 0A. Configura los amperios de tu fuente.`,
        showProgress: false
      }
      
    case 'solar_mode':
      return {
        type: 'info',
        title: '☀️ Modo Paneles Solares',
        message: `Los paneles solares no permiten calcular tiempo BULK debido a la variabilidad. ${currentText}.`,
        showProgress: false,
        showDCOption: true
      }
      
    default:
      return {
        type: 'info',
        title: 'Estado desconocido',
        message: 'Verificando configuración...',
        showProgress: false
      }
  }
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