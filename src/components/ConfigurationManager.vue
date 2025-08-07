<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Configuraciones Personalizadas</h3>
    
    <!-- Guardar Configuración Actual -->
    <div class="mb-6 p-4 bg-blue-50 rounded-lg">
      <h4 class="font-medium text-gray-900 mb-3">Guardar Configuración Actual</h4>
      <div class="flex gap-3">
        <input
          v-model="newConfigName"
          type="text"
          placeholder="Nombre de la configuración (ej: Batería Litio 100Ah)"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @keyup.enter="saveCurrentConfiguration"
        />
        <button
          @click="saveCurrentConfiguration"
          :disabled="!newConfigName.trim() || saving"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
        >
          <!-- Spinner SVG para guardar -->
          <svg 
            v-if="saving" 
            class="animate-spin h-4 w-4 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              class="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              stroke-width="4"
            ></circle>
            <path 
              class="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span v-if="saving">Guardando...</span>
          <span v-else">💾 Guardar</span>
        </button>
      </div>
    </div>

    <!-- Lista de Configuraciones Guardadas -->
    <div v-if="Object.keys(savedConfigs).length > 0">
      <div class="flex justify-between items-center mb-3">
        <button
          @click="toggleConfigurationsExpanded"
          class="flex items-center gap-2 font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200"
        >
          <!-- Icono de expansión/colapso -->
          <svg 
            class="w-5 h-5 transition-transform duration-200"
            :class="{ 'rotate-90': configurationsExpanded }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
          <span>Configuraciones Guardadas ({{ Object.keys(savedConfigs).length }})</span>
        </button>
        
        <!-- Campo de búsqueda - solo visible cuando está expandido -->
        <div v-if="configurationsExpanded" class="flex items-center gap-2">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar configuraciones..."
            class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @input="onSearch"
          />
          <button
            v-if="searchTerm"
            @click="clearSearch"
            class="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
          >
            ✕
          </button>
        </div>
      </div>
      
      <!-- Preview colapsado - muestra solo nombres -->
      <div 
        v-if="!configurationsExpanded" 
        class="bg-gray-50 rounded-lg p-3 text-sm text-gray-600"
      >
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="(config, name) in Object.entries(savedConfigs).slice(0, 3)" 
            :key="name"
            class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
          >
            📁 {{ name }}
          </span>
          <span 
            v-if="Object.keys(savedConfigs).length > 3"
            class="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs"
          >
            +{{ Object.keys(savedConfigs).length - 3 }} más
          </span>
        </div>
        <p class="mt-2 text-xs text-gray-500">
          Haz clic arriba para expandir y gestionar las configuraciones
        </p>
      </div>
      
      <!-- Contenedor colapsable con scroll -->
      <div 
        v-if="configurationsExpanded"
        class="transition-all duration-300 ease-in-out"
        :class="{ 
          'max-h-96 overflow-y-auto border border-gray-200 rounded-lg': Object.keys(savedConfigs).length > 5,
          'max-h-none': Object.keys(savedConfigs).length <= 5
        }"
      >
        <!-- Indicador de scroll superior -->
        <div 
          v-if="Object.keys(savedConfigs).length > 5"
          class="sticky top-0 bg-gradient-to-b from-blue-50 to-transparent text-center py-2 text-xs text-blue-600 font-medium z-10"
        >
          📋 {{ Object.keys(savedConfigs).length }} configuraciones - Desplázate para ver todas
        </div>
        
        <div 
          class="space-y-3"
          :class="{ 'px-3 pb-3': Object.keys(savedConfigs).length > 5, 'pr-2': Object.keys(savedConfigs).length <= 5 }"
        >
        <div
          v-for="(config, name) in savedConfigs"
          :key="name"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h5 class="font-medium text-gray-900 mb-1">{{ name }}</h5>
              <p class="text-sm text-gray-500 mb-2">
                Creada: {{ formatDate(config.createdAt) }}
                <span v-if="config.updatedAt !== config.createdAt">
                  • Actualizada: {{ formatDate(config.updatedAt) }}
                </span>
              </p>
              <div class="text-xs text-gray-600">
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <span v-if="config.batteryCapacity">Capacidad: {{ config.batteryCapacity }} Ah</span>
                  <span v-if="config.isLithium !== undefined">
                    Tipo: {{ config.isLithium ? 'Litio' : 'GEL/AGM' }}
                  </span>
                  <span v-if="config.bulkVoltage">BULK: {{ config.bulkVoltage }} V</span>
                  <span v-if="config.absorptionVoltage">Absorción: {{ config.absorptionVoltage }} V</span>
                  <span v-if="config.floatVoltage">Flotación: {{ config.floatVoltage }} V</span>
                  <span v-if="config.maxAllowedCurrent">Max: {{ config.maxAllowedCurrent }} mA</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2 ml-4">
              <button
                @click="applyConfiguration(name, config)"
                :disabled="applying === name"
                class="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-all duration-200"
              >
                <!-- Spinner SVG mejorado -->
                <svg 
                  v-if="applying === name" 
                  class="animate-spin h-4 w-4 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    class="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    stroke-width="4"
                  ></circle>
                  <path 
                    class="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span v-if="applying === name">Aplicando... (hasta 30s)</span>
                <span v-else>🚀 Aplicar</span>
              </button>
              <button
                @click="updateConfiguration(name)"
                class="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Actualizar
              </button>
              <button
                @click="confirmDelete(name)"
                class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-8 text-gray-500">
      <p>No hay configuraciones guardadas</p>
      <p class="text-sm mt-1">Guarda tu primera configuración personalizada arriba</p>
    </div>

    <!-- Importar/Exportar -->
    <div class="mt-6 pt-6 border-t border-gray-200">
      <h4 class="font-medium text-gray-900 mb-3">Importar/Exportar Configuraciones</h4>
      <div class="flex gap-3">
        <button
          @click="exportConfigurations"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Exportar a JSON
        </button>
        <label class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer">
          Importar JSON
          <input
            type="file"
            accept=".json"
            class="hidden"
            @change="importConfigurations"
          />
        </label>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
        <p class="text-gray-600 mb-6">
          ¿Estás seguro de que quieres eliminar la configuración "{{ configToDelete }}"?
          Esta acción no se puede deshacer.
        </p>
        <div class="flex gap-3 justify-end">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            @click="deleteConfiguration"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'

const emit = defineEmits(['configurationApplied'])

const configStore = useConfigStore()

const newConfigName = ref('')
const saving = ref(false)
const applying = ref(null)
const showDeleteModal = ref(false)
const configToDelete = ref('')
const searchTerm = ref('')
const filteredConfigs = ref({})
const configurationsExpanded = ref(false) // Por defecto colapsado

const savedConfigs = computed(() => {
  if (!searchTerm.value) {
    return configStore.savedConfigurations
  }
  return filteredConfigs.value
})

onMounted(async () => {
  await configStore.loadSavedConfigurations()
})

// Función de búsqueda
async function onSearch() {
  if (!searchTerm.value.trim()) {
    await configStore.loadSavedConfigurations()
    return
  }

  try {
    // Usar la nueva API de búsqueda si está disponible
    const result = await configStore.searchConfigurations?.(searchTerm.value)
    if (result && result.configurations) {
      filteredConfigs.value = result.configurations
    } else {
      // Fallback: filtrar localmente
      const allConfigs = configStore.savedConfigurations
      const filtered = {}
      for (const [name, config] of Object.entries(allConfigs)) {
        if (name.toLowerCase().includes(searchTerm.value.toLowerCase())) {
          filtered[name] = config
        }
      }
      filteredConfigs.value = filtered
    }
  } catch (error) {
    console.warn('Búsqueda avanzada no disponible, usando filtro local')
    // Filtrar localmente como fallback
    const allConfigs = configStore.savedConfigurations
    const filtered = {}
    for (const [name, config] of Object.entries(allConfigs)) {
      if (name.toLowerCase().includes(searchTerm.value.toLowerCase())) {
        filtered[name] = config
      }
    }
    filteredConfigs.value = filtered
  }
}

function clearSearch() {
  searchTerm.value = ''
  filteredConfigs.value = {}
}

function toggleConfigurationsExpanded() {
  configurationsExpanded.value = !configurationsExpanded.value
}

async function saveCurrentConfiguration() {
  if (!newConfigName.value.trim()) return

  saving.value = true
  try {
    const currentConfig = configStore.getCurrentConfiguration()
    
    // Validar configuración antes de guardar usando la nueva API
    try {
      await configStore.validateConfiguration(currentConfig)
    } catch (validationError) {
      emit('configurationApplied', 'Error de validación: ' + validationError.message)
      return
    }
    
    await configStore.saveConfiguration(newConfigName.value.trim(), currentConfig)
    newConfigName.value = ''
    emit('configurationApplied', 'Configuración guardada exitosamente')
  } catch (error) {
    console.error('Error al guardar configuración:', error)
    emit('configurationApplied', 'Error al guardar la configuración')
  } finally {
    saving.value = false
  }
}

async function applyConfiguration(name, config) {
  applying.value = name
  try {
    // Usar la nueva API que aplica configuraciones por nombre
    await configStore.applyConfiguration(config, name)
    emit('configurationApplied', `Configuración "${name}" aplicada exitosamente`)
  } catch (error) {
    console.error('Error al aplicar configuración:', error)
    emit('configurationApplied', 'Error al aplicar la configuración')
  } finally {
    applying.value = null
  }
}

async function updateConfiguration(name) {
  saving.value = true
  try {
    const currentConfig = configStore.getCurrentConfiguration()
    const existingConfig = savedConfigs.value[name]
    const updatedConfig = {
      ...currentConfig,
      createdAt: existingConfig.createdAt,
      updatedAt: new Date().toISOString()
    }
    await configStore.saveConfiguration(name, updatedConfig)
    emit('configurationApplied', `Configuración "${name}" actualizada exitosamente`)
  } catch (error) {
    console.error('Error al actualizar configuración:', error)
    emit('configurationApplied', 'Error al actualizar la configuración')
  } finally {
    saving.value = false
  }
}

function confirmDelete(name) {
  configToDelete.value = name
  showDeleteModal.value = true
}

async function deleteConfiguration() {
  try {
    await configStore.deleteConfiguration(configToDelete.value)
    emit('configurationApplied', `Configuración "${configToDelete.value}" eliminada exitosamente`)
  } catch (error) {
    console.error('Error al eliminar configuración:', error)
    emit('configurationApplied', 'Error al eliminar la configuración')
  } finally {
    showDeleteModal.value = false
    configToDelete.value = ''
  }
}

async function exportConfigurations() {
  try {
    // Usar la nueva API de exportación
    const exportData = await configStore.exportConfigurations()
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `configuraciones_cargador_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    emit('configurationApplied', 'Configuraciones exportadas exitosamente')
  } catch (error) {
    console.error('Error al exportar configuraciones:', error)
    // Fallback al método anterior si la nueva API no está disponible
    const dataStr = JSON.stringify(savedConfigs.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `configuraciones_cargador_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    emit('configurationApplied', 'Configuraciones exportadas (modo legacy)')
  }
}

function importConfigurations(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const importedConfigs = JSON.parse(e.target.result)
      
      // Validar estructura
      if (typeof importedConfigs !== 'object') {
        throw new Error('Formato de archivo inválido')
      }

      // Importar configuraciones
      for (const [name, config] of Object.entries(importedConfigs)) {
        await configStore.saveConfiguration(name, config)
      }
      
      emit('configurationApplied', 'Configuraciones importadas exitosamente')
    } catch (error) {
      console.error('Error al importar configuraciones:', error)
      emit('configurationApplied', 'Error al importar las configuraciones')
    }
  }
  reader.readAsText(file)
  
  // Limpiar el input
  event.target.value = ''
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
/* Scroll personalizado para la lista de configuraciones */
.max-h-96::-webkit-scrollbar {
  width: 8px;
}

.max-h-96::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
  margin: 8px 0;
}

.max-h-96::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.max-h-96::-webkit-scrollbar-thumb:active {
  background: #64748b;
}

/* Animación suave para el icono de expansión */
.rotate-90 {
  transform: rotate(90deg);
}

/* Sombra sutil para el contenedor con scroll */
.max-h-96 {
  box-shadow: 
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.1);
  background: #fafafa;
}

/* Efecto hover para el botón de expansión */
.flex.items-center.gap-2:hover {
  transform: translateX(2px);
}

/* Gradiente para indicar scroll disponible */
.max-h-96::after {
  content: '';
  position: sticky;
  bottom: 0;
  display: block;
  height: 20px;
  background: linear-gradient(transparent, rgba(249, 250, 251, 0.8));
  pointer-events: none;
  margin-top: -20px;
}
</style>
