#!/bin/bash
# Script para configurar fácilmente la IP de la API

echo "🔧 Configurador de IP de la API"
echo "================================"

# Verificar si existe .env
if [ ! -f .env ]; then
    echo "📄 Creando archivo .env desde plantilla..."
    cp .env.example .env
fi

# Mostrar IP actual
CURRENT_IP=$(grep "VITE_API_BASE_URL" .env | cut -d'=' -f2 | sed 's/http:\/\///' | sed 's/:8000//')
echo "📡 IP actual: ${CURRENT_IP}"

# Solicitar nueva IP
echo ""
read -p "🌐 Ingresa la nueva IP del Orange Pi (sin http:// ni puerto): " NEW_IP

# Validar que no esté vacío
if [ -z "$NEW_IP" ]; then
    echo "❌ Error: IP no puede estar vacía"
    exit 1
fi

# Actualizar archivo .env
sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://${NEW_IP}:8000|" .env

echo ""
echo "✅ Configuración actualizada:"
echo "📡 Nueva URL de API: http://${NEW_IP}:8000"
echo ""
echo "🔄 Reinicia el servidor de desarrollo para aplicar cambios:"
echo "   ./start.sh"
echo ""

# Mostrar configuración actual
echo "📋 Configuración actual en .env:"
echo "================================"
cat .env | grep -E "VITE_API_BASE_URL|VITE_DEV_PORT|VITE_DEBUG_MODE"
