#!/bin/bash
# Script para verificar la configuración del proyecto

echo "🔍 Verificador de Configuración"
echo "================================"

# Verificar archivos de configuración
echo "📄 Archivos de configuración:"
if [ -f .env.example ]; then
    echo "  ✅ .env.example existe"
else
    echo "  ❌ .env.example no encontrado"
fi

if [ -f .env ]; then
    echo "  ✅ .env existe"
else
    echo "  ❌ .env no encontrado - ejecuta: cp .env.example .env"
    exit 1
fi

echo ""

# Mostrar configuración actual
echo "⚙️ Configuración actual:"
echo "========================"
source .env

echo "📡 API URL: ${VITE_API_BASE_URL}"
echo "🌐 Puerto dev: ${VITE_DEV_PORT}"
echo "📝 App Name: ${VITE_APP_NAME}"
echo "📊 App Version: ${VITE_APP_VERSION}"
echo "⏱️ API Timeout: ${VITE_API_TIMEOUT}ms"
echo "🐛 Debug Mode: ${VITE_DEBUG_MODE}"

echo ""

# Probar conectividad con la API
API_HOST=$(echo $VITE_API_BASE_URL | sed 's/http:\/\///' | cut -d':' -f1)
API_PORT=$(echo $VITE_API_BASE_URL | sed 's/http:\/\///' | cut -d':' -f2)

echo "🔗 Probando conectividad con la API..."
echo "   Host: $API_HOST"
echo "   Puerto: $API_PORT"

if timeout 3 bash -c "echo >/dev/tcp/$API_HOST/$API_PORT" 2>/dev/null; then
    echo "  ✅ Conexión exitosa"
    
    # Probar endpoint de health
    if command -v curl > /dev/null 2>&1; then
        echo "🩺 Probando endpoint de salud..."
        HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$VITE_API_BASE_URL/health" -o /dev/null 2>/dev/null)
        if [ "$HEALTH_RESPONSE" = "200" ]; then
            echo "  ✅ API responde correctamente"
        else
            echo "  ⚠️ API responde pero con código: $HEALTH_RESPONSE"
        fi
    fi
else
    echo "  ❌ No se puede conectar - verifica que:"
    echo "     • La IP sea correcta: $API_HOST"
    echo "     • El puerto esté abierto: $API_PORT"
    echo "     • La API esté ejecutándose"
fi

echo ""
echo "🚀 Para cambiar la IP ejecuta: ./configure-ip.sh"
echo "📖 Para más información consulta el README.md"
