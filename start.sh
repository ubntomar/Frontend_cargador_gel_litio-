#!/bin/bash
# Script para iniciar la aplicación

echo "🚀 Iniciando ESP32 Solar Vue..."
echo "📡 API configurada en: ${VITE_API_BASE_URL:-http://192.168.8.100:8000}"
echo ""

npm run dev
