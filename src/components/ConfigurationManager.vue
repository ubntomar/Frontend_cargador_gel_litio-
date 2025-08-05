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
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="saving" class="animate-spin mr-2">⏳</span>
          Guardar
        </button>
      </div>
    </div>

    <!-- Lista de Configuraciones Guardadas -->
    <div v-if="Object.keys(savedConfigs).length > 0">
      <h4 class="font-medium text-gray-900 mb-3">Configuraciones Guardadas</h4>
      <div class="space-y-3">
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
                class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                <span v-if="applying === name" class="animate-spin mr-1">⏳</span>
                Aplicar
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

const savedConfigs = computed(() => configStore.savedConfigurations)

onMounted(async () => {
  await configStore.loadSavedConfigurations()
})

async function saveCurrentConfiguration() {
  if (!newConfigName.value.trim()) return

  saving.value = true
  try {
    const currentConfig = configStore.getCurrentConfiguration()
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
    await configStore.applyConfiguration(config)
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

function exportConfigurations() {
  const dataStr = JSON.stringify(savedConfigs.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `configuraciones_cargador_${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
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
