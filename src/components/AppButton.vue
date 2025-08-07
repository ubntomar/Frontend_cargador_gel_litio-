<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      variantClasses,
      sizeClasses,
      disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
      className
    ]"
    @click="handleClick"
  >
    <!-- Spinner cuando está cargando -->
    <LoadingSpinner 
      v-if="loading" 
      :size="spinnerSize"
      :color="spinnerColor"
    />
    
    <!-- Icono -->
    <span v-if="icon && !loading" class="text-base">{{ icon }}</span>
    
    <!-- Contenido del slot -->
    <slot></slot>
    
    <!-- Texto de loading -->
    <span v-if="loading && loadingText">{{ loadingText }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // 'primary', 'secondary', 'success', 'danger', 'warning', 'info'
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(value)
  },
  size: {
    type: String,
    default: 'md', // 'sm', 'md', 'lg'
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  className: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click'])

const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500'
  }
  return variants[props.variant] || variants.primary
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  return sizes[props.size] || sizes.md
})

const spinnerSize = computed(() => {
  const sizes = {
    sm: 'xs',
    md: 'sm',
    lg: 'md'
  }
  return sizes[props.size] || 'sm'
})

const spinnerColor = computed(() => {
  return ['primary', 'success', 'danger', 'warning', 'info'].includes(props.variant) ? 'white' : 'current'
})

function handleClick(event) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
