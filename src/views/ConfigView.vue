<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Configuración</h2>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Configuration Sections -->
    <div v-else class="space-y-6">
      <!-- Battery Configuration -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Configuración de Batería</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParameterInput
            parameter="batteryCapacity"
            label="Capacidad de Batería"
            type="float"
            :min="1"
            :max="1000"
            unit="Ah"
            hint="Capacidad nominal de tu batería"
            @saved="onParameterSaved"
          />
          
          <ParameterInput
            parameter="isLithium"
            label="Tipo de Batería"
            type="bool"
            hint="Activa si es batería de Litio, desactiva para GEL/AGM"
            @saved="onParameterSaved"
          />
          
          <ParameterInput
            parameter="thresholdPercentage"
            label="Umbral de Corriente"
            type="float"
            :min="0.1"
            :max="5.0"
            unit="%"
            hint="Porcentaje para cambio de etapa de carga"
            @saved="onParameterSaved"
          />
          
          <ParameterInput
            parameter="maxAllowedCurrent"
            label="Corriente Máxima"
            type="float"
            :min="1000"
            :max="15000"
            unit="mA"
            hint="Límite de corriente de carga"
            @saved="onParameterSaved"
          />
        </div>
      </div>

      <!-- Voltage Configuration -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Voltajes de Carga</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ParameterInput
            parameter="bulkVoltage"
            label="Voltaje BULK"
            type="float"
            :min="12.0"
            :max="15.0"
            unit="V"
            hint="Voltaje para etapa BULK"
            @saved="onParameterSaved"
          />
          
          <ParameterInput
            parameter="absorptionVoltage"
            label="Voltaje Absorción"
            type="float"
            :min="12.0"
            :max="15.0"
            unit="V"
            hint="Voltaje para etapa de absorción"
            @saved="onParameterSaved"
          />
          
          <ParameterInput
            parameter="floatVoltage"
            label="Voltaje Flotación"
            type="float"
            :min="12.0"
            :max="15.0"
            unit="V"
            hint="Voltaje para etapa de flotación"
            @saved="onParameterSaved"
          />
        </div>
      </div>

      <!-- DC Source Configuration -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Fuente DC</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParameterInput
            parameter="useFuenteDC"
            label="Usar Fuente DC"
            type="bool"
            hint="Activar si usas fuente DC además del panel solar"
            @saved="onParameterSaved"
          />
          
          <ParameterInput
            parameter="fuenteDC_Amps"
            label="Corriente Fuente DC"
            type="float"
            :min="0"
            :max="50"
            unit="A"
            hint="Corriente de la fuente DC"
            :disabled="!dataStore.data?.useFuenteDC"
            @saved="onParameterSaved"
          />
        </div>
      </div>

      <!-- Advanced Configuration -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Configuración Avanzada</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParameterInput
            parameter="factorDivider"
            label="Factor Divisor"
            type="int"
            :min="1"
            :max="10"
            hint="Factor para cálculos internos"
            @saved="onParameterSaved"
          />
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <transition name="fade">
      <div v-if="showSuccess" class="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
        <p class="font-semibold">¡Configuración guardada!</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useDataStore } from '@/stores/dataStore'
import ParameterInput from '@/components/ParameterInput.vue'

const configStore = useConfigStore()
const dataStore = useDataStore()

const loading = ref(false)
const showSuccess = ref(false)

onMounted(async () => {
  loading.value = true
  await configStore.loadConfigurableParameters()
  loading.value = false
})

function onParameterSaved() {
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}
</script>
