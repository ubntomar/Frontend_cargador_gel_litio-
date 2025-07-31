#!/bin/bash

# =============================================================================
# Instalador rápido PM2 para ESP32 Solar Vue
# =============================================================================
# Instalador simple y rápido que configura todo automáticamente
# =============================================================================

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
  ███████╗███████╗██████╗ ██████╗ ██████╗     ███████╗ ██████╗ ██╗      █████╗ ██████╗ 
  ██╔════╝██╔════╝██╔══██╗╚════██╗╚════██╗    ██╔════╝██╔═══██╗██║     ██╔══██╗██╔══██╗
  █████╗  ███████╗██████╔╝ █████╔╝ █████╔╝    ███████╗██║   ██║██║     ███████║██████╔╝
  ██╔══╝  ╚════██║██╔═══╝ ██╔═══╝ ██╔═══╝     ╚════██║██║   ██║██║     ██╔══██║██╔══██╗
  ███████╗███████║██║     ███████╗███████╗    ███████║╚██████╔╝███████╗██║  ██║██║  ██║
  ╚══════╝╚══════╝╚═╝     ╚══════╝╚══════╝    ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
                                              PM2 INSTALLER                             
EOF
echo -e "${NC}"

echo -e "${GREEN}🚀 Instalador rápido para ESP32 Solar Vue con PM2${NC}"
echo -e "${BLUE}Este script configurará automáticamente PM2 para tu aplicación${NC}"
echo

# Variables
PROJECT_DIR="/home/orangepi/Frontend_cargador_gel_litio-"
PROJECT_NAME="esp32-solar-vue"

# Verificaciones básicas
echo -e "${YELLOW}📋 Verificando requisitos...${NC}"

if [ "$USER" != "orangepi" ]; then
    echo -e "${RED}❌ Este script debe ejecutarse como usuario 'orangepi'${NC}"
    exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ No se encontró el directorio del proyecto: $PROJECT_DIR${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo -e "${BLUE}💡 Instala con: sudo apt update && sudo apt install nodejs npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Verificaciones completadas${NC}"
echo

# Mostrar información
echo -e "${BLUE}📊 Información del sistema:${NC}"
echo "   SO: $(lsb_release -d | cut -f2)"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   Usuario: $USER"
echo "   Directorio: $PROJECT_DIR"
echo

# Confirmar instalación
read -p "¿Continuar con la instalación? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Instalación cancelada${NC}"
    exit 0
fi

echo -e "${BLUE}🔧 Iniciando instalación...${NC}"
echo

# 1. Instalar PM2
echo -e "${YELLOW}[1/6]${NC} Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}    🔑 PM2 requiere permisos sudo para instalación global...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}    ✅ PM2 instalado${NC}"
else
    echo -e "${GREEN}    ✅ PM2 ya está instalado ($(pm2 --version))${NC}"
fi

# 2. Crear estructura de logs
echo -e "${YELLOW}[2/6]${NC} Creando estructura de logs..."
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/logs/backup"
echo -e "${GREEN}    ✅ Estructura creada${NC}"

# 3. Instalar dependencias del proyecto
echo -e "${YELLOW}[3/6]${NC} Instalando dependencias del proyecto..."
cd "$PROJECT_DIR"
npm install > /dev/null 2>&1
echo -e "${GREEN}    ✅ Dependencias instaladas${NC}"

# 4. Crear archivo de configuración PM2
echo -e "${YELLOW}[4/6]${NC} Creando configuración PM2..."
cat > "$PROJECT_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'npm',
    args: 'run dev',
    cwd: '$PROJECT_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      VITE_API_BASE_URL: 'http://192.168.13.180:8000',
      VITE_POLLING_INTERVAL: '3000',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      VITE_API_BASE_URL: 'http://192.168.13.180:8000',
      VITE_POLLING_INTERVAL: '5000',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000
  }]
};
EOF
echo -e "${GREEN}    ✅ Configuración creada${NC}"

# 5. Crear script de gestión
echo -e "${YELLOW}[5/6]${NC} Creando script de gestión..."
cat > "$PROJECT_DIR/manage.sh" << 'EOF'
#!/bin/bash
PROJECT_NAME="esp32-solar-vue"
case "$1" in
    start) pm2 start ecosystem.config.js --env production ;;
    stop) pm2 stop $PROJECT_NAME ;;
    restart) pm2 restart $PROJECT_NAME ;;
    status) pm2 list; pm2 info $PROJECT_NAME ;;
    logs) pm2 logs $PROJECT_NAME --lines ${2:-50} ;;
    monitor) pm2 monit ;;
    *) echo "Uso: $0 {start|stop|restart|status|logs|monitor}" ;;
esac
EOF
chmod +x "$PROJECT_DIR/manage.sh"
echo -e "${GREEN}    ✅ Script de gestión creado${NC}"

# 6. Iniciar aplicación
echo -e "${YELLOW}[6/6]${NC} Iniciando aplicación..."
pm2 stop $PROJECT_NAME 2>/dev/null || true
pm2 delete $PROJECT_NAME 2>/dev/null || true
pm2 start ecosystem.config.js --env production > /dev/null 2>&1
pm2 save > /dev/null 2>&1
echo -e "${GREEN}    ✅ Aplicación iniciada${NC}"

echo
echo -e "${GREEN}🎉 ¡Instalación completada exitosamente!${NC}"
echo

# Mostrar estado final
echo -e "${BLUE}📊 Estado actual:${NC}"
pm2 list

echo
echo -e "${BLUE}🌐 Tu aplicación está disponible en:${NC}"
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "   🏠 Local:     http://localhost:3000"
echo "   🌍 Red LAN:   http://$LOCAL_IP:3000"
echo "   🍊 Orange Pi: http://192.168.13.180:3000"

echo
echo -e "${BLUE}📋 Comandos útiles:${NC}"
echo "   ./manage.sh start      # Iniciar aplicación"
echo "   ./manage.sh stop       # Detener aplicación"
echo "   ./manage.sh restart    # Reiniciar aplicación"
echo "   ./manage.sh status     # Ver estado"
echo "   ./manage.sh logs       # Ver logs"
echo "   ./manage.sh monitor    # Monitor en tiempo real"

echo
echo -e "${YELLOW}⚠️  Para arranque automático tras reiniciar, ejecuta:${NC}"
echo -e "${GREEN}   sudo env PATH=\$PATH:\$(which node) \$(which pm2) startup systemd -u orangepi --hp /home/orangepi${NC}"
echo -e "${GREEN}   pm2 save${NC}"

echo
echo -e "${GREEN}✨ ¡Tu ESP32 Solar Vue ahora funciona de manera persistente!${NC}"