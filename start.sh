#!/bin/bash
# Script para iniciar la aplicación

echo "🚀 Iniciando ESP32 Solar Vue..."

# Cargar variables del archivo .env si existe
if [ -f .env ]; then
    source .env
    echo "📄 Configuración cargada desde .env"
else
    echo "⚠️  Archivo .env no encontrado, usando valores por defecto"
    echo "� Ejecuta: cp .env.example .env para crear tu configuración"
fi

echo "�📡 API configurada en: ${VITE_API_BASE_URL:-http://192.168.13.180:8000}"
echo "🌐 Puerto de desarrollo: ${VITE_DEV_PORT:-5173}"

if [ "${VITE_DEBUG_MODE}" = "true" ]; then
    echo "🐛 Modo DEBUG activado"
fi

echo ""

npm run dev
