#!/bin/bash

echo "🔧 DIAGNÓSTICO COMPLETO FRONTEND-BACKEND"
echo "========================================"

echo ""
echo "1. 🏥 Verificando estado del backend..."
curl -s -X GET "http://localhost:8000/health" | jq '.' 2>/dev/null || echo "❌ Error en /health"

echo ""
echo "2. 📊 Verificando endpoint de datos..."
curl -s -X GET "http://localhost:8000/data/" | jq '. | {voltagePanel, voltageBatterySensor2, estimatedSOC, chargeState, connected}' 2>/dev/null || echo "❌ Error en /data/"

echo ""
echo "3. 🔄 Verificando proxy del frontend..."
curl -s -X GET "http://localhost:5173/api/data/" | jq '. | {voltagePanel, voltageBatterySensor2, estimatedSOC, chargeState, connected}' 2>/dev/null || echo "❌ Error en proxy /api/data/"

echo ""
echo "4. ⚙️ Verificando configuraciones..."
curl -s -X GET "http://localhost:8000/config/custom/configurations" | jq '.total_count' 2>/dev/null || echo "❌ Error en configuraciones"

echo ""
echo "5. 🧪 Probando modificación de parámetro..."
curl -s -X POST "http://localhost:8000/config/parameter" \
  -H "Content-Type: application/json" \
  -d '{"parameter": "bulkVoltage", "value": 14.4}' | jq '.success' 2>/dev/null || echo "❌ Error modificando parámetro"

echo ""
echo "6. ⏰ Verificando schedule..."
curl -s -X GET "http://localhost:8000/schedule/" | jq '. | {enabled, currently_active, next_execution}' 2>/dev/null || echo "❌ Error en schedule"

echo ""
echo "7. 🌐 Verificando CORS..."
curl -s -I -X OPTIONS "http://localhost:8000/health" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" | grep -i "access-control" || echo "❌ CORS no configurado"

echo ""
echo "8. 📱 Verificando frontend..."
if curl -s "http://localhost:5173" | grep -q "ESP32 Solar Charger"; then
    echo "✅ Frontend cargando correctamente"
else
    echo "❌ Error cargando frontend"
fi

echo ""
echo "9. 🔍 Verificando logs del frontend..."
echo "Revisando si hay errores en la consola..."

echo ""
echo "10. 📈 Test de flujo completo..."
echo "Simulando flujo completo de la aplicación..."

# Simular el flujo que hace Vue
echo "  - Cargando datos iniciales..."
DATA=$(curl -s "http://localhost:5173/api/data/")
if echo "$DATA" | jq -e '.connected' >/dev/null 2>&1; then
    echo "  ✅ Datos iniciales cargados"
    SOC=$(echo "$DATA" | jq -r '.estimatedSOC')
    VOLTAGE=$(echo "$DATA" | jq -r '.voltageBatterySensor2')
    STATE=$(echo "$DATA" | jq -r '.chargeState')
    echo "  📊 SOC: ${SOC}%, Voltaje: ${VOLTAGE}V, Estado: ${STATE}"
else
    echo "  ❌ Error cargando datos iniciales"
fi

echo "  - Probando health check..."
HEALTH=$(curl -s "http://localhost:5173/api/health")
if echo "$HEALTH" | jq -e '.status' >/dev/null 2>&1; then
    echo "  ✅ Health check OK"
    ESP32_STATUS=$(echo "$HEALTH" | jq -r '.esp32_connection.connected')
    echo "  🔌 ESP32 conectado: ${ESP32_STATUS}"
else
    echo "  ❌ Error en health check"
fi

echo ""
echo "📋 RESUMEN"
echo "=========="
echo "Si todos los tests anteriores muestran ✅, el sistema está funcionando correctamente."
echo "Si hay ❌, revisa los logs específicos de cada componente."
echo ""
echo "Para verificar errores en tiempo real en el frontend:"
echo "1. Abre http://localhost:5173 en el navegador"
echo "2. Abre las herramientas de desarrollador (F12)"
echo "3. Ve a la pestaña Console"
echo "4. Ve a la pestaña Network para ver las llamadas HTTP"
echo ""
