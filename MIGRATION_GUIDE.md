# 🔄 Guía de Migración - Frontend ESP32 Solar Charger

## 📋 Resumen de Cambios Realizados

Este documento describe todos los cambios realizados para actualizar el frontend a la nueva versión de la API (v1.0.0).

---

## 🔧 **1. Configuración de API**

### Archivo: `src/services/api.js`

#### ✅ **Cambios realizados:**

1. **URL Base actualizada:**
   ```javascript
   // ANTES
   const API_BASE_URL = 'http://192.168.13.180:8000'
   
   // DESPUÉS
   const API_BASE_URL = 'http://localhost:8000'
   ```

2. **Endpoints actualizados:**
   - `getActionsStatus()`: Ahora usa `/data/` y mapea campos
   - `toggleLoad()`: Agregado manejo de errores para endpoint obsoleto
   - Agregados nuevos métodos: `searchConfigurations()`, `importConfigurations()`

---

## 📊 **2. Dashboard (DashboardView.vue)**

#### ✅ **Nuevas funcionalidades agregadas:**

1. **Información del Sistema:**
   - Estado de conexión ESP32 vs API
   - Versión del firmware
   - Tiempo de funcionamiento (uptime)
   - Última actualización

2. **Nuevos campos de datos:**
   - `netCurrent` - Corriente neta
   - `accumulatedAh` - Ah acumulados
   - `currentBulkHours` - Horas BULK actuales
   - `notaPersonalizada` - Notas del sistema

3. **Funciones de formateo:**
   - `formatUptime()` - Convierte segundos a formato legible
   - `formatLastUpdate()` - Formatea timestamp de última actualización

---

## ⚙️ **3. Gestión de Configuraciones**

### Archivo: `src/components/ConfigurationManager.vue`

#### ✅ **Nuevas funcionalidades:**

1. **Búsqueda de configuraciones:**
   - Campo de búsqueda en tiempo real
   - Integración con API de búsqueda
   - Fallback a filtrado local

2. **Validación mejorada:**
   - Uso de endpoint `/config/custom/configurations/validate`
   - Manejo de errores mejorado

### Archivo: `src/stores/configStore.js`

#### ✅ **Nuevos métodos agregados:**
- `searchConfigurations(searchTerm)`
- Integración con nuevos endpoints de la API

---

## 🔗 **4. Estado de Conexión**

### Archivo: `src/components/ConnectionStatus.vue`

#### ✅ **Mejorado para mostrar:**

1. **Diferenciación de estados:**
   - 🟢 ESP32 Conectado (API + ESP32 OK)
   - 🟡 API OK - ESP32 Desconectado
   - 🔴 Sin conexión

2. **Información adicional:**
   - Versión de la API
   - Timestamp de última actualización
   - Verificación automática cada 30 segundos

---

## 📝 **5. Validación de Parámetros**

### Archivo: `src/components/ParameterInput.vue`

#### ✅ **Validación mejorada:**

1. **Validación en tiempo real:**
   - Uso de API de validación para configuraciones
   - Manejo de errores de red
   - Validación local como fallback

---

## 🌐 **6. Variables de Entorno**

### Archivos: `.env`, `.env.example`

#### ✅ **Configuración actualizada:**

```bash
# NUEVA configuración recomendada
VITE_API_BASE_URL=http://localhost:8000
VITE_POLLING_INTERVAL=3000  # Reducido de 5000 a 3000
VITE_DEBUG_MODE=true
```

---

## ⚠️ **7. Advertencias de Compatibilidad**

### Archivo: `src/views/ActionsView.vue`

#### ✅ **Agregado aviso:**
- Advertencia sobre endpoints de control que pueden no estar disponibles
- Adaptación para usar datos del endpoint principal `/data/`

---

## 🚀 **8. Funcionalidades Nuevas Disponibles**

### Según la documentación de la API:

1. **✅ Implementadas:**
   - Búsqueda de configuraciones
   - Validación de configuraciones
   - Información de sistema extendida
   - Estado de conexión mejorado
   - Polling optimizado (3 segundos)

2. **📋 Disponibles para implementar (opcional):**
   - Programación de horarios avanzada
   - Gráficos históricos
   - Importación/exportación de configuraciones
   - Notificaciones push
   - Temas personalizables

---

## 🔍 **9. Verificación de Cambios**

### Para verificar que todo funciona correctamente:

1. **Comprobar variables de entorno:**
   ```bash
   cat .env
   # Debe mostrar: VITE_API_BASE_URL=http://localhost:8000
   ```

2. **Verificar polling:**
   - Dashboard debe actualizar cada 3 segundos
   - Revisar en DevTools que se hace petición a `/data/`

3. **Probar nuevas funcionalidades:**
   - Búsqueda en configuraciones
   - Información del sistema en dashboard
   - Estado de conexión diferenciado

4. **Verificar endpoints:**
   - Todos los endpoints deben apuntar a `localhost:8000`
   - Endpoint principal: `http://localhost:8000/data/`

---

## 📞 **10. Resolución de Problemas**

### Problemas comunes y soluciones:

1. **Error de conexión a API:**
   ```bash
   # Verificar que la API esté ejecutándose en puerto 8000
   curl http://localhost:8000/health
   ```

2. **Datos no se actualizan:**
   - Verificar que `VITE_POLLING_INTERVAL=3000`
   - Revisar consola para errores de red

3. **Configuraciones no se guardan:**
   - Verificar endpoint `/config/custom/configurations/{name}`
   - Revisar logs del servidor API

---

## ✅ **11. Checklist de Verificación**

- [ ] ✅ URL base cambiada a `localhost:8000`
- [ ] ✅ Polling configurado a 3 segundos
- [ ] ✅ Nuevos campos mostrados en dashboard
- [ ] ✅ Búsqueda de configuraciones funcional
- [ ] ✅ Estado de conexión diferenciado
- [ ] ✅ Validación de parámetros integrada
- [ ] ✅ Variables de entorno actualizadas
- [ ] ✅ Advertencias de compatibilidad agregadas

---

**🎯 El frontend ha sido exitosamente actualizado para ser compatible con la nueva API v1.0.0**

Para más información, consultar la documentación completa en `API-DOCS/`.
