<template>
  <div class="space-y-2 relative">
    <label :for="parameter" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    
    <!-- Boolean Input -->
    <div v-if="type === 'bool'" class="flex items-center">
      <button
        type="button"
        @click="toggleBoolean"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
        :class="localValue ? 'bg-blue-600' : 'bg-gray-200'"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
          :class="localValue ? 'translate-x-6' : 'translate-x-1'"
        />
      </button>
      <span class="ml-3 text-sm text-gray-600">
        {{ localValue ? 'Sí' : 'No' }}
      </span>
    </div>

    <!-- Number Input -->
    <div v-else class="relative">
      <input
        :id="parameter"
        v-model.number="localValue"
        :type="type === 'int' ? 'number' : 'number'"
        :step="type === 'int' ? '1' : '0.1'"
        :min="min"
        :max="max"
        :disabled="disabled || saving"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
        :class="{ 'pr-20': unit }"
      />
      <span v-if="unit" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
        {{ unit }}
      </span>
    </div>

    <!-- Hint / Error -->
    <p v-if="hint && !error" class="text-xs text-gray-500">{{ hint }}</p>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>

    <!-- Save Button -->
    <div v-if="hasChanges" class="flex space-x-2 mt-2">
      <button
        @click="save"
        :disabled="saving || !!error"
        class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
      >
        <!-- Spinner mejorado -->
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
        <span v-if="saving">Aplicando... (hasta 15s)</span>
        <span v-else>💾 Guardar</span>
      </button>
      <button
        @click="reset"
        :disabled="saving"
        class="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        ❌ Cancelar
      </button>
    </div>

    <!-- Loading overlay para el input cuando está guardando -->
    <div 
      v-if="saving" 
      class="absolute inset-0 bg-blue-50 bg-opacity-75 rounded-md flex items-center justify-center backdrop-blur-sm"
    >
      <div class="flex items-center space-x-2 text-blue-700">
        <svg 
          class="animate-spin h-5 w-5" 
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
        <span class="text-sm font-medium">Configurando ESP32...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useDataStore } from '@/stores/dataStore'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  parameter: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'float'
  },
  min: {
    type: Number,
    default: null
  },
  max: {
    type: Number,
    default: null
  },
  unit: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['saved', 'error'])

const configStore = useConfigStore()
const dataStore = useDataStore()
const notificationStore = useNotificationStore()

const localValue = ref(null)
const originalValue = ref(null)
const saving = ref(false)
const error = ref('')

// Obtener valor inicial
const currentValue = computed(() => {
  return dataStore.data?.[props.parameter]
})

// Detectar cambios
const hasChanges = computed(() => {
  return localValue.value !== originalValue.value
})

// Validar valor
watch(localValue, async (newValue) => {
  error.value = ''
  
  if (props.type !== 'bool') {
    if (props.min !== null && newValue < props.min) {
      error.value = `Valor mínimo: ${props.min}`
      return
    }
    if (props.max !== null && newValue > props.max) {
      error.value = `Valor máximo: ${props.max}`
      return
    }
  }

  // Validación básica del valor
  if (newValue !== originalValue.value && newValue !== null && newValue !== undefined) {
    // Por ahora, omitir la validación avanzada para evitar errores 422
    // La validación se hará en el momento de guardar el parámetro
    // TODO: Implementar validación avanzada cuando todos los parámetros estén disponibles
  }
})

// Inicializar valor
watch(currentValue, (newValue) => {
  if (newValue !== undefined && localValue.value === null) {
    localValue.value = newValue
    originalValue.value = newValue
  }
}, { immediate: true })

// Funciones
function toggleBoolean() {
  localValue.value = !localValue.value
}

async function save() {
  if (error.value) return
  
  saving.value = true
  error.value = '' // Limpiar errores anteriores
  
  // Sanitizar el label para evitar problemas con caracteres especiales
  const sanitizedLabel = props.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // Mostrar notificación de loading
  const notificationId = notificationStore.configurationOperation(sanitizedLabel, 'saving')
  
  try {
    await configStore.updateParameter(props.parameter, localValue.value)
    originalValue.value = localValue.value
    
    // Actualizar datos
    await dataStore.fetchData()
    
    // Cerrar notificación de loading y mostrar éxito
    notificationStore.closeNotification(notificationId)
    notificationStore.configurationOperation(sanitizedLabel, 'success')
    
    emit('saved', localValue.value)
  } catch (err) {
    console.error('Error al guardar parámetro:', err)
    
    // Cerrar notificación de loading
    notificationStore.closeNotification(notificationId)
    
    // Manejo específico de diferentes tipos de error
    if (err.message.includes('timeout')) {
      error.value = `⏰ Timeout al configurar ${props.parameter}. El ESP32 puede estar ocupado, intenta en unos segundos.`
      notificationStore.configurationOperation(sanitizedLabel, 'timeout')
    } else if (err.message.includes('lock')) {
      error.value = `🔒 ESP32 ocupado configurando otro parámetro. Espera unos segundos e intenta nuevamente.`
      notificationStore.configurationOperation(sanitizedLabel, 'lock')
    } else if (err.response?.status === 422) {
      error.value = `❌ Valor inválido para ${props.parameter}: ${err.response?.data?.detail || 'Verifica el rango permitido'}`
      notificationStore.error(`Valor inválido`, `${sanitizedLabel}: ${err.response?.data?.detail || 'Verifica el rango permitido'}`)
    } else if (err.response?.status === 500) {
      error.value = `🔧 Error interno del ESP32. Verifica la conexión y estado del dispositivo.`
      notificationStore.error(`Error ESP32`, `${sanitizedLabel}: Verifica la conexión y estado del dispositivo`)
    } else {
      error.value = err.response?.data?.detail || err.message || 'Error al guardar'
      notificationStore.configurationOperation(sanitizedLabel, 'error')
    }
    
    emit('error', err)
  } finally {
    saving.value = false
  }
}

function reset() {
  localValue.value = originalValue.value
  error.value = ''
}
</script>
