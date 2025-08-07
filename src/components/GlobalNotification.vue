<template>
  <div v-if="visible" class="fixed top-4 right-4 z-50 max-w-sm">
    <div 
      class="bg-white border-l-4 rounded-lg shadow-lg p-4 transition-all duration-300"
      :class="notificationClasses"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <!-- Spinner SVG para loading -->
          <svg 
            v-if="type === 'loading'"
            class="animate-spin h-5 w-5 text-purple-600" 
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
          <!-- Iconos estáticos para otros tipos -->
          <span v-else class="text-lg">{{ staticIcon }}</span>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium" :class="textClasses">
            {{ title }}
          </p>
          <p v-if="message" class="mt-1 text-xs" :class="messageClasses">
            {{ message }}
          </p>
          <div v-if="showProgress" class="mt-2">
            <div class="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                class="h-1.5 rounded-full transition-all duration-500"
                :class="progressClasses"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <p class="text-xs mt-1" :class="messageClasses">
              {{ progressText }}
            </p>
          </div>
        </div>
        <div class="ml-4 flex-shrink-0">
          <button 
            @click="close"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span class="sr-only">Cerrar</span>
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info', // 'success', 'error', 'warning', 'info', 'loading'
    validator: (value) => ['success', 'error', 'warning', 'info', 'loading'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  autoClose: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 5000
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  progressText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const staticIcon = computed(() => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳' // Fallback, pero se usa SVG
  }
  return icons[props.type] || icons.info
})

const notificationClasses = computed(() => {
  const classes = {
    success: 'border-green-400 bg-green-50',
    error: 'border-red-400 bg-red-50',
    warning: 'border-yellow-400 bg-yellow-50',
    info: 'border-blue-400 bg-blue-50',
    loading: 'border-purple-400 bg-purple-50'
  }
  return classes[props.type] || classes.info
})

const textClasses = computed(() => {
  const classes = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
    loading: 'text-purple-800'
  }
  return classes[props.type] || classes.info
})

const messageClasses = computed(() => {
  const classes = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700',
    loading: 'text-purple-700'
  }
  return classes[props.type] || classes.info
})

const progressClasses = computed(() => {
  const classes = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    loading: 'bg-purple-500'
  }
  return classes[props.type] || classes.info
})

let autoCloseTimer = null

function close() {
  emit('close')
}

function startAutoClose() {
  if (props.autoClose && props.duration > 0 && props.type !== 'loading') {
    autoCloseTimer = setTimeout(() => {
      close()
    }, props.duration)
  }
}

function clearAutoClose() {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

watch(() => props.visible, (newValue) => {
  if (newValue) {
    startAutoClose()
  } else {
    clearAutoClose()
  }
})

watch(() => [props.type, props.autoClose, props.duration], () => {
  clearAutoClose()
  if (props.visible) {
    startAutoClose()
  }
})
</script>

<style scoped>
/* Animaciones adicionales si es necesario */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
