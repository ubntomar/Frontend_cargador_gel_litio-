#!/bin/bash

# =============================================================================
# Script para habilitar startup automático de PM2
# =============================================================================
# EJECUTAR ESTE SCRIPT CON SUDO después de instalar PM2
# =============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configurando startup automático de PM2...${NC}"
echo

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Este script debe ejecutarse con sudo${NC}"
    echo -e "${YELLOW}💡 Uso: sudo ./enable-startup.sh${NC}"
    exit 1
fi

# Verificar que PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 no está instalado${NC}"
    echo -e "${YELLOW}💡 Instala PM2 primero con el instalador principal${NC}"
    exit 1
fi

# Configurar startup para el usuario orangepi
echo -e "${YELLOW}📋 Configurando startup automático para usuario 'orangepi'...${NC}"

# Generar y ejecutar comando de startup
STARTUP_OUTPUT=$(sudo env PATH=$PATH:$(which node) $(which pm2) startup systemd -u orangepi --hp /home/orangepi 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Startup automático configurado correctamente${NC}"
    echo
    
    echo -e "${BLUE}📋 Configuración aplicada:${NC}"
    echo "   - Usuario: orangepi"
    echo "   - Sistema: systemd"
    echo "   - Home: /home/orangepi"
    echo "   - Path: $(which node):$(which pm2)"
    echo
    
    echo -e "${YELLOW}🔄 Ahora ejecuta como usuario orangepi:${NC}"
    echo -e "${GREEN}   su - orangepi -c 'pm2 save'${NC}"
    echo
    
    echo -e "${BLUE}🎯 O simplemente ejecuta:${NC}"
    echo -e "${GREEN}   sudo -u orangepi pm2 save${NC}"
    echo
    
    # Ejecutar pm2 save automáticamente
    echo -e "${YELLOW}💾 Guardando configuración PM2...${NC}"
    sudo -u orangepi env PATH=$PATH:$(which node):$(which pm2) pm2 save
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Configuración guardada correctamente${NC}"
        echo
        
        echo -e "${GREEN}🎉 ¡Startup automático configurado!${NC}"
        echo -e "${BLUE}Tu aplicación ESP32 Solar Vue ahora se iniciará automáticamente tras reiniciar el sistema${NC}"
        echo
        
        echo -e "${YELLOW}🔍 Para verificar el estado:${NC}"
        echo "   systemctl status pm2-orangepi"
        echo
        
        echo -e "${YELLOW}📋 Para gestionar el servicio:${NC}"
        echo "   sudo systemctl start pm2-orangepi    # Iniciar servicio"
        echo "   sudo systemctl stop pm2-orangepi     # Detener servicio"
        echo "   sudo systemctl restart pm2-orangepi  # Reiniciar servicio"
        echo "   sudo systemctl disable pm2-orangepi  # Deshabilitar startup"
        echo
        
    else
        echo -e "${RED}❌ Error al guardar configuración PM2${NC}"
        echo -e "${YELLOW}💡 Ejecuta manualmente: sudo -u orangepi pm2 save${NC}"
    fi
    
else
    echo -e "${RED}❌ Error al configurar startup automático${NC}"
    echo -e "${YELLOW}Salida del comando:${NC}"
    echo "$STARTUP_OUTPUT"
    echo
    echo -e "${YELLOW}💡 Ejecuta manualmente:${NC}"
    echo -e "${GREEN}sudo env PATH=\$PATH:\$(which node) \$(which pm2) startup systemd -u orangepi --hp /home/orangepi${NC}"
fi