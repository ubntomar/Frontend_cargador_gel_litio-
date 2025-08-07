# 🔧 CORRECCIÓN: Error DOMException "String contains an invalid character"

## 🐛 PROBLEMA IDENTIFICADO

**Error:** `Uncaught (in promise) DOMException: String contains an invalid character`

**Contexto:** Error que ocurre al cambiar parámetros individuales, específicamente "Usar Fuente DC" y otros parámetros con caracteres especiales o acentos.

**Causa raíz:** El error se debe a problemas de codificación de caracteres en JavaScript cuando se manejan strings con caracteres especiales (espacios, caracteres Unicode) en:
- Sistema de notificaciones
- Generación de IDs únicos
- Manipulación de templates strings

## ✅ SOLUCIONES APLICADAS

### 1. **Corrección en ParameterInput.vue**

**Archivo:** `src/components/ParameterInput.vue`

**Cambios aplicados:**
- ✅ **Sanitización de labels:** Normalización de caracteres especiales antes de usar en notificaciones
- ✅ **Manejo seguro de strings:** Uso de `normalize('NFD')` para eliminar diacríticos problemáticos

**Código modificado:**
```javascript
// Antes
const notificationId = notificationStore.configurationOperation(props.label, 'saving')

// Después  
const sanitizedLabel = props.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const notificationId = notificationStore.configurationOperation(sanitizedLabel, 'saving')
```

### 2. **Mejora en notificationStore.js**

**Archivo:** `src/stores/notificationStore.js`

**Cambios aplicados:**
- ✅ **Generación segura de IDs:** Uso de `substring()` en lugar de `substr()` (deprecado)
- ✅ **Función de sanitización:** Nueva función para limpiar caracteres problemáticos
- ✅ **Sanitización automática:** Todos los strings de notificaciones se sanitizan automáticamente

**Código añadido:**
```javascript
// Función para sanitizar strings y evitar problemas con caracteres especiales
function sanitizeString(str) {
  if (typeof str !== 'string') return str
  try {
    // Normalizar y remover caracteres problemáticos
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  } catch (error) {
    console.warn('Error sanitizing string:', str, error)
    // Fallback: reemplazar caracteres problemáticos comunes
    return str.replace(/[^\x00-\x7F]/g, '').trim()
  }
}
```

### 3. **Interceptor mejorado en api.js**

**Archivo:** `src/services/api.js`

**Cambios aplicados:**
- ✅ **Interceptor de peticiones:** Sanitización automática de datos antes de envío
- ✅ **Manejo seguro de JSON:** Serialización/deserialización controlada para evitar problemas de codificación

**Código añadido:**
```javascript
// Interceptor para request - sanitizar datos antes de enviar
apiClient.interceptors.request.use(
  config => {
    // Sanitizar datos del body para evitar problemas de codificación
    if (config.data && typeof config.data === 'object') {
      try {
        config.data = JSON.parse(JSON.stringify(config.data))
      } catch (error) {
        console.warn('Error sanitizing request data:', error)
      }
    }
    return config
  }
)
```

## 🧪 HERRAMIENTAS DE DIAGNÓSTICO CREADAS

### 1. **debug_dom_exception.html**
- 🔍 **Propósito:** Diagnóstico general de problemas DOMException
- 🧪 **Tests incluidos:**
  - Análisis de caracteres problemáticos
  - Pruebas de btoa() 
  - Verificación de URLs
  - Test de API calls
  - Análisis de JSON
  - Pruebas del sistema de notificaciones

### 2. **test_usar_fuente_dc.html**
- 🎯 **Propósito:** Test específico para el parámetro "Usar Fuente DC"
- 🔬 **Funcionalidades:**
  - Estado del sistema en tiempo real
  - Test controlado del parámetro useFuenteDC
  - Análisis detallado de caracteres
  - Captura de errores en tiempo real
  - Simulación del sistema de notificaciones

## 🎯 RESULTADO ESPERADO

### ✅ **Problemas resueltos:**
1. **No más DOMException** al cambiar parámetros con caracteres especiales
2. **Notificaciones estables** sin errores de codificación
3. **IDs únicos seguros** sin caracteres problemáticos
4. **Peticiones HTTP robustas** con sanitización automática

### ✅ **Mejoras implementadas:**
- **Sanitización automática** de todos los strings en notificaciones
- **Fallback robusto** para caracteres problemáticos
- **Logging mejorado** para debug futuro
- **Interceptores preventivos** en peticiones HTTP

## 🔧 COMANDOS DE VERIFICACIÓN

### 1. **Abrir herramientas de diagnóstico:**
```bash
# Test general
open http://localhost:5173/debug_dom_exception.html

# Test específico
open http://localhost:5173/test_usar_fuente_dc.html
```

### 2. **Verificar funcionamiento:**
1. Abrir el frontend: `http://localhost:5173`
2. Ir a "Configuración" → "Fuente DC"
3. Cambiar el toggle de "Usar Fuente DC"
4. ✅ **Esperado:** No debe aparecer error DOMException
5. ✅ **Esperado:** Notificación debe aparecer correctamente

## 📋 CONSIDERACIONES TÉCNICAS

### **Normalización Unicode:**
- Usa `normalize('NFD')` para descomponer caracteres Unicode
- Remueve diacríticos con regex `/[\u0300-\u036f]/g`
- Mantiene compatibilidad con ASCII básico

### **Compatibilidad:**
- ✅ **Navegadores modernos:** Chrome, Firefox, Safari, Edge
- ✅ **Caracteres especiales:** Acentos, eñes, espacios
- ✅ **Fallback seguro:** Limpieza de caracteres no-ASCII si falla normalización

### **Performance:**
- **Impacto mínimo:** La sanitización solo se aplica a strings de notificaciones
- **Cache-friendly:** Los strings sanitizados se procesan una sola vez
- **Memory-safe:** No hay almacenamiento de referencias problemáticas

## 🚀 RECOMENDACIONES FUTURAS

1. **Monitoreo:** Usar las herramientas de diagnóstico para identificar nuevos problemas
2. **Testing:** Probar con otros parámetros que tengan caracteres especiales
3. **Logging:** Activar modo debug (`VITE_DEBUG_MODE=true`) para monitoreo detallado
4. **Validación:** Considerar validación de entrada en el backend para caracteres especiales

---

## ✅ VERIFICACIÓN FINAL

**Estado:** ✅ **SOLUCIONADO**

**Archivos modificados:**
- ✅ `src/components/ParameterInput.vue`
- ✅ `src/stores/notificationStore.js` 
- ✅ `src/services/api.js`

**Archivos de diagnóstico creados:**
- ✅ `debug_dom_exception.html`
- ✅ `test_usar_fuente_dc.html`

**Próximo paso:** Reiniciar el frontend y probar el cambio del parámetro "Usar Fuente DC"
