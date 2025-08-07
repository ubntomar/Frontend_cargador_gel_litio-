#!/bin/bash

echo "🔍 DIAGNÓSTICO DE TIMEOUT AL APLICAR CONFIGURACIONES"
echo "=================================================="
echo

# Variables
API_BASE="http://localhost:8000"
FRONTEND_URL="http://localhost:5173"
CONFIG_NAME="BateriaLitio200Ah"

echo "📋 Información del sistema:"
echo "- API Base: $API_BASE"
echo "- Frontend: $FRONTEND_URL"
echo "- Configuración de prueba: $CONFIG_NAME"
echo

# Test 1: Verificar estado del backend
echo "🔧 Test 1: Estado del Backend API"
echo "---------------------------------"
response=$(curl -s -w "HTTP %{http_code} | Tiempo: %{time_total}s" -o /dev/null "$API_BASE/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ API Backend: $response"
else
    echo "❌ API Backend: No disponible"
    echo "   Inicia el backend con: cd API_cargador_gel_litio- && python main.py"
    exit 1
fi
echo

# Test 2: Verificar configuraciones existentes
echo "🗂️ Test 2: Configuraciones Existentes"
echo "-------------------------------------"
configs_response=$(curl -s "$API_BASE/config/custom/configurations" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Lista de configuraciones obtenida"
    echo "$configs_response" | jq -r '.configurations | keys[]' 2>/dev/null || echo "Respuesta: $configs_response"
else
    echo "❌ Error al obtener configuraciones"
fi
echo

# Test 3: Verificar configuración específica
echo "🎯 Test 3: Configuración Específica ($CONFIG_NAME)"
echo "------------------------------------------------"
specific_config=$(curl -s "$API_BASE/config/custom/configurations/$CONFIG_NAME" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Configuración '$CONFIG_NAME' encontrada"
    echo "$specific_config" | jq '.' 2>/dev/null || echo "Respuesta: $specific_config"
else
    echo "❌ Configuración '$CONFIG_NAME' no encontrada"
fi
echo

# Test 4: Probar aplicar configuración con timeout extendido
echo "⚡ Test 4: Aplicar Configuración (Timeout Extendido)"
echo "---------------------------------------------------"
echo "Probando aplicar '$CONFIG_NAME' con timeout de 30 segundos..."
start_time=$(date +%s)

apply_response=$(timeout 30s curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}" \
    -X POST "$API_BASE/config/custom/configurations/$CONFIG_NAME/apply" \
    -H "Content-Type: application/json" 2>/dev/null)

end_time=$(date +%s)
duration=$((end_time - start_time))

echo "⏱️ Duración real: ${duration}s"

if [ $? -eq 0 ]; then
    echo "✅ Respuesta recibida:"
    echo "$apply_response"
else
    echo "❌ Timeout o error en la aplicación"
fi
echo

# Test 5: Verificar estado del ESP32
echo "🔌 Test 5: Estado del ESP32"
echo "---------------------------"
esp32_data=$(curl -s "$API_BASE/data/" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Datos del ESP32 obtenidos"
    echo "$esp32_data" | jq -r '
        "Estado ESP32: " + (.esp32_connection.status // "unknown") + 
        " | Puerto: " + (.esp32_connection.port // "unknown") +
        " | Último update: " + (.esp32_connection.last_successful_update // "unknown")
    ' 2>/dev/null || echo "Respuesta: $esp32_data"
else
    echo "❌ Error al obtener datos del ESP32"
fi
echo

# Test 6: Verificar logs del backend
echo "📝 Test 6: Últimos Logs del Backend"
echo "-----------------------------------"
if [ -f "../API_cargador_gel_litio-/logs/esp32_api.log" ]; then
    echo "✅ Últimas 10 líneas del log:"
    tail -10 "../API_cargador_gel_litio-/logs/esp32_api.log"
else
    echo "⚠️ Archivo de log no encontrado"
fi
echo

# Test 7: Verificar configuración frontend
echo "🌐 Test 7: Configuración Frontend"
echo "---------------------------------"
if [ -f ".env" ]; then
    echo "✅ Variables de entorno frontend:"
    grep -E "VITE_API|VITE_TIMEOUT" .env
else
    echo "⚠️ Archivo .env no encontrado"
fi
echo

echo "🎯 RESUMEN DE DIAGNÓSTICO:"
echo "========================="
echo "1. Verificar que el backend esté corriendo en $API_BASE"
echo "2. Verificar que la configuración '$CONFIG_NAME' exista"
echo "3. Verificar que el ESP32 esté conectado correctamente"
echo "4. Timeout frontend aumentado a 30s (antes: 10s)"
echo "5. Revisar logs del backend para errores específicos"
echo
echo "🔧 Comandos útiles:"
echo "- Reiniciar backend: cd ../API_cargador_gel_litio- && python main.py"
echo "- Ver logs en tiempo real: tail -f ../API_cargador_gel_litio-/logs/esp32_api.log"
echo "- Test configuraciones completas: open test_timeout_fix.html"
echo "- Test parámetros individuales: open test_individual_parameters.html"
echo
echo "📋 MEJORAS IMPLEMENTADAS:"
echo "- ✅ Timeout aumentado de 10s a 30s"
echo "- ✅ Spinner visual durante configuración"
echo "- ✅ Notificaciones informativas globales"
echo "- ✅ Manejo específico de errores de lock/timeout"
echo "- ✅ Mejor feedback para usuarios"
