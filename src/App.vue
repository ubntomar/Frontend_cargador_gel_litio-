<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-blue-600 text-white shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z"/>
            </svg>
            <h1 class="text-xl md:text-2xl font-bold">ESP32 Solar Charger</h1>
          </div>
          
          <!-- Connection Status -->
          <ConnectionStatus />
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex space-x-8">
          <router-link 
            to="/" 
            class="py-4 px-2 border-b-2 font-medium text-sm transition-colors"
            :class="[$route.path === '/' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
          >
            Dashboard
          </router-link>
          <router-link 
            to="/config" 
            class="py-4 px-2 border-b-2 font-medium text-sm transition-colors"
            :class="[$route.path === '/config' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
          >
            Configuración
          </router-link>
          <router-link 
            to="/actions" 
            class="py-4 px-2 border-b-2 font-medium text-sm transition-colors"
            :class="[$route.path === '/actions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
          >
            Control
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-gray-300 py-4 mt-auto">
      <div class="container mx-auto px-4 text-center text-sm">
        <p>ESP32 Solar Charger Control Panel v1.0.0</p>
      </div>
    </footer>

    <!-- Global Notifications -->
    <GlobalNotification
      v-if="notificationStore.currentNotification"
      :visible="notificationStore.currentNotification.visible"
      :type="notificationStore.currentNotification.type"
      :title="notificationStore.currentNotification.title"
      :message="notificationStore.currentNotification.message"
      :auto-close="notificationStore.currentNotification.autoClose"
      :duration="notificationStore.currentNotification.duration"
      :show-progress="notificationStore.currentNotification.showProgress"
      :progress="notificationStore.currentNotification.progress"
      :progress-text="notificationStore.currentNotification.progressText"
      @close="notificationStore.closeNotification(notificationStore.currentNotification.id)"
    />
  </div>
</template>

<script setup>
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import GlobalNotification from '@/components/GlobalNotification.vue'
import { onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { useNotificationStore } from '@/stores/notificationStore'

const dataStore = useDataStore()
const notificationStore = useNotificationStore()

onMounted(() => {
  // Iniciar polling de datos
  dataStore.startPolling()
})
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
