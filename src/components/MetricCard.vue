<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        <p class="mt-2 text-3xl font-semibold text-gray-900">
          {{ formattedValue }}
        </p>
        <p v-if="subtitle" class="mt-1 text-sm text-gray-500">
          {{ subtitle }}
        </p>
      </div>
      <div 
        v-if="icon" 
        class="p-3 rounded-full"
        :class="iconBgClass"
      >
        <component :is="icon" class="w-6 h-6" :class="iconClass" />
      </div>
    </div>
    
    <!-- Progress bar opcional -->
    <div v-if="showProgress" class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full transition-all duration-300"
          :class="progressClass"
          :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  unit: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: Object,
    default: null
  },
  iconBgClass: {
    type: String,
    default: 'bg-blue-100'
  },
  iconClass: {
    type: String,
    default: 'text-blue-600'
  },
  decimals: {
    type: Number,
    default: 2
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  progressClass: {
    type: String,
    default: 'bg-blue-600'
  }
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toFixed(props.decimals) + ' ' + props.unit
  }
  return props.value + ' ' + props.unit
})
</script>
