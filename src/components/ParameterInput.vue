<template>
  <div class="space-y-2">
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
        class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
      <button
        @click="reset"
        :disabled="saving"
        class="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancelar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useDataStore } from '@/stores/dataStore'

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
watch(localValue, (newValue) => {
  error.value = ''
  
  if (props.type !== 'bool') {
    if (props.min !== null && newValue < props.min) {
      error.value = `Valor mínimo: ${props.min}`
    }
    if (props.max !== null && newValue > props.max) {
      error.value = `Valor máximo: ${props.max}`
    }
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
  
  try {
    await configStore.updateParameter(props.parameter, localValue.value)
    originalValue.value = localValue.value
    
    // Actualizar datos
    await dataStore.fetchData()
    
    emit('saved', localValue.value)
  } catch (err) {
    error.value = err.response?.data?.detail || 'Error al guardar'
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
