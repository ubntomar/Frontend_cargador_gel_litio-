# ESP32 Solar Charger Vue3 Frontend

Frontend en Vue 3 para el control y monitoreo del cargador solar ESP32.

## 🎯 **ACTUALIZACIÓN IMPORTANTE - Versión API 1.0.0**

Este frontend ha sido **completamente actualizado** para ser compatible con la nueva versión de la API. Los principales cambios incluyen:

### ✅ **Cambios Implementados:**

1. **📡 URL Base Actualizada**: Cambiada de `192.168.13.180:8000` a `localhost:8000` según documentación
2. **🔄 Polling Optimizado**: Reducido de 5 segundos a 3 segundos (recomendación API)
3. **📊 Nuevos Campos de Datos**: Agregados campos como `netCurrent`, `accumulatedAh`, `firmware_version`, etc.
4. **🔍 Búsqueda de Configuraciones**: Implementada búsqueda en configuraciones personalizadas
5. **✅ Validación Mejorada**: Integrada validación de la API para parámetros
6. **🔗 Estado de Conexión Avanzado**: Diferenciación entre estado API y ESP32
7. **📋 Endpoints Actualizados**: Corregidos endpoints obsoletos y agregados nuevos

### 📚 **Documentación API Incluida:**

- `API-DOCS/FRONTEND_EXECUTIVE_SUMMARY.md` - Resumen ejecutivo
- `API-DOCS/FRONTEND_API_DOCUMENTATION.md` - Documentación completa
- `API-DOCS/FRONTEND_EXAMPLES.md` - Ejemplos prácticos

---

## 🚀 Instalación Rápida

```bash
# Instalar dependencias
./install.sh
# o manualmente:
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la IP de tu API
nano .env

# Iniciar en modo desarrollo
./start.sh
# o manualmente:
npm run dev
```

## ⚙️ Configuración de Variables de Entorno

El proyecto usa archivos `.env` para manejar la configuración de manera flexible:

### 📄 Archivos de Configuración

- **`.env.example`**: Plantilla con todas las variables disponibles
- **`.env`**: Tu configuración específica (no se sube a git)

### 🔧 Variables Disponibles

```bash
# URL de la API del Orange Pi
# IMPORTANTE: Actualizada según nueva documentación
VITE_API_BASE_URL=http://localhost:8000
# Para producción, usar la IP real:
# VITE_API_BASE_URL=http://192.168.13.180:8000

# Puerto del servidor de desarrollo
VITE_DEV_PORT=5173

# Información de la aplicación
VITE_APP_NAME=ESP32 Solar Cargador
VITE_APP_VERSION=1.0.0

# Timeout de las peticiones API (milisegundos)
VITE_API_TIMEOUT=10000

# Intervalo de polling (ACTUALIZADO: ahora 3 segundos según API)
VITE_POLLING_INTERVAL=3000

# Modo debug (muestra logs adicionales)
VITE_DEBUG_MODE=true
```

### 🛠️ Configuración Inicial

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edita tu configuración:**
   ```bash
   nano .env
   ```

3. **Cambia la IP de tu Orange Pi:**
   ```bash
   VITE_API_BASE_URL=http://TU_IP_ORANGEPI:8000
   ```

4. **Guarda y reinicia el servidor de desarrollo**

### 🛠️ Scripts de Configuración

El proyecto incluye scripts útiles para manejar la configuración:

#### `./configure-ip.sh`
Configurar fácilmente la IP del Orange Pi:
```bash
./configure-ip.sh
# Te pedirá la nueva IP y actualizará automáticamente el .env
```

#### `./check-config.sh`
Verificar la configuración actual y conectividad:
```bash
./check-config.sh
# Muestra la configuración y prueba la conexión con la API
```

#### `./start.sh`
Iniciar el servidor de desarrollo:
```bash
./start.sh
# Carga automáticamente la configuración del .env
```

## 🔄 **Configuración PM2 para Persistencia** ⭐

**¡NUEVO!** Configura tu aplicación para que funcione de manera persistente y se reinicie automáticamente tras reiniciar el Orange Pi.

### 📋 Instalación PM2

```bash
# 1. Crear script de instalación PM2
cat > install-pm2.sh << 'EOF'
[Contenido del instalador rápido PM2]
EOF

# 2. Crear script de startup automático
cat > enable-startup.sh << 'EOF'
[Contenido del script de startup]
EOF

# 3. Hacer ejecutables
chmod +x install-pm2.sh enable-startup.sh

# 4. Ejecutar instalación
./install-pm2.sh

# 5. Configurar arranque automático
sudo ./enable-startup.sh
```

### 🛠️ Gestión con PM2

Una vez instalado PM2, gestiona tu aplicación con estos comandos:

```bash
# === COMANDOS BÁSICOS ===
./manage.sh start      # 🚀 Iniciar aplicación
./manage.sh stop       # ⏹️  Detener aplicación  
./manage.sh restart    # 🔄 Reiniciar aplicación
./manage.sh status     # 📊 Ver estado actual
./manage.sh logs       # 📄 Ver logs en tiempo real
./manage.sh monitor    # 📈 Monitor gráfico

# === COMANDOS PM2 DIRECTOS ===
pm2 list               # Ver todos los procesos
pm2 info esp32-solar-vue  # Info detallada del proceso
pm2 logs esp32-solar-vue  # Logs en tiempo real
pm2 flush              # Limpiar logs
pm2 restart esp32-solar-vue  # Reiniciar específico
pm2 save               # Guardar configuración actual
```

### 🌐 Acceso a la Aplicación

Con PM2 configurado, tu aplicación estará disponible en:

- 🏠 **Local**: http://localhost:3000
- 🌍 **Red LAN**: http://[IP-LOCAL]:3000  
- 🍊 **Orange Pi**: http://192.168.13.180:3000

### 📊 Verificar que PM2 Funciona

```bash
# Ver estado de procesos
pm2 list

# Deberías ver algo como:
# ┌─────┬──────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┐
# │ id  │ name             │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │
# ├─────┼──────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┤
# │ 0   │ esp32-solar-vue  │ default     │ 1.0.0   │ fork    │ 12345    │ 2m     │ 0    │ online    │ 2.1%     │ 45.2mb   │ orangepi │
# └─────┴──────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┘

# Verificar arranque automático
systemctl status pm2-orangepi

# Probar reinicio completo
sudo reboot
# Después del reinicio: pm2 list (debería mostrar la app corriendo)
```

### 📁 Archivos PM2 Generados

Después de la instalación PM2 tendrás:

```
Frontend_cargador_gel_litio-/
├── install-pm2.sh           # Script de instalación PM2
├── enable-startup.sh        # Script de startup automático  
├── ecosystem.config.js      # Configuración de PM2
├── manage.sh               # Script de gestión rápida
├── logs/                   # Directorio de logs PM2
│   ├── pm2-error.log      # Logs de errores
│   ├── pm2-out.log        # Logs de salida
│   ├── pm2-combined.log   # Logs combinados
│   └── backup/            # Backups automáticos
└── [archivos del proyecto...]
```

### 🔧 Configuración Avanzada PM2

Edita `ecosystem.config.js` para personalizar:

```javascript
// Cambiar variables de entorno
env_production: {
  NODE_ENV: 'production',
  VITE_API_BASE_URL: 'http://192.168.13.180:8000',  // Cambiar IP si necesario
  VITE_POLLING_INTERVAL: '5000',                    // Ajustar polling
  PORT: 3000                                        // Puerto personalizado
}

// Ajustar límites de memoria
max_memory_restart: '300M'  // Reiniciar si excede 300MB

// Configurar logs
log_date_format: 'YYYY-MM-DD HH:mm:ss Z'  // Formato de timestamps
```

### 🚨 Solución de Problemas PM2

```bash
# La aplicación no responde
pm2 restart esp32-solar-vue

# Ver errores específicos  
pm2 logs esp32-solar-vue --err

# Reiniciar desde cero
pm2 kill
./install-pm2.sh

# Problemas de arranque automático
sudo systemctl status pm2-orangepi
sudo ./enable-startup.sh

# Ver recursos del sistema
pm2 monit
```

---

## 📋 Características

- ✅ Dashboard en tiempo real
- ✅ Configuración de parámetros
- ✅ Control de carga (encender/apagar)
- ✅ Responsive design
- ✅ Polling inteligente
- ✅ Manejo de errores
- ✅ Validación de datos
- ✅ **Ejecución persistente con PM2** ⭐
- ✅ **Arranque automático tras reinicio** ⭐
- ✅ **Monitoreo de recursos y logs** ⭐

## 🎯 Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables
├── views/          # Vistas principales
├── services/       # Comunicación con API
├── stores/         # Estado global (Pinia)
├── composables/    # Composables de Vue
├── assets/         # CSS, imágenes
└── utils/          # Utilidades
```

## ⚙️ Configuración

Edita `.env` para configurar:

- `VITE_API_BASE_URL`: URL de la API (default: http://192.168.13.180:8000)
- `VITE_POLLING_INTERVAL`: Intervalo de actualización en ms (default: 3000)
- `VITE_MAX_CONCURRENT_REQUESTS`: Requests simultáneos máximos (default: 3)

## 🔧 Desarrollo

```bash
# Servidor de desarrollo (modo tradicional)
npm run dev

# Servidor con PM2 (modo persistente)
./manage.sh start

# Compilar para producción
npm run build

# Preview de producción
npm run preview

# Linting
npm run lint
```

## 📱 Vistas Principales

### Dashboard
- Métricas en tiempo real
- Estado de batería
- Flujo de energía
- Información del sistema

### Configuración
- Parámetros de batería
- Voltajes de carga
- Configuración de fuente DC
- Opciones avanzadas

### Control
- Apagar/encender carga
- Apagado temporal programado
- Acciones rápidas
- Estado actual

## 🚨 Consideraciones Importantes

1. **Rate Limiting**: Respeta los límites de la API (máx 5 requests simultáneos)
2. **Cache**: La API tiene cache de 2 segundos
3. **Polling**: Configurado cada 3 segundos por defecto (5 segundos en producción con PM2)
4. **Hardware**: Orange Pi tiene recursos limitados
5. **PM2**: Configurado para máximo 500MB de RAM por proceso

## 🐛 Solución de Problemas

### La aplicación no se conecta a la API
- Verifica que la API esté ejecutándose
- Confirma la IP en `.env`
- Revisa CORS en la API

### Datos no se actualizan
- Verifica el polling interval
- Revisa la consola del navegador
- Confirma conexión con ESP32

### Problemas con PM2
- Verifica estado: `pm2 list`
- Revisa logs: `./manage.sh logs`
- Reinicia proceso: `./manage.sh restart`
- Verifica startup: `systemctl status pm2-orangepi`

### La aplicación no arranca tras reinicio
- Verifica servicio: `systemctl status pm2-orangepi`
- Reconfigurar startup: `sudo ./enable-startup.sh`
- Revisar logs de PM2: `./manage.sh logs`

## 🔄 Workflows de Desarrollo

### Desarrollo Tradicional
```bash
npm run dev          # Desarrollo local
# Ctrl+C para detener
```

### Desarrollo con PM2 (Recomendado)
```bash
./manage.sh start    # Iniciar en background
./manage.sh logs     # Ver logs en tiempo real
./manage.sh restart  # Reiniciar después de cambios
./manage.sh stop     # Detener cuando termines
```

### Despliegue en Producción
```bash
npm run build        # Compilar
./manage.sh restart  # Reiniciar con nueva versión
pm2 save            # Guardar configuración
```

## 📊 Monitoreo y Logs

```bash
# Ver estado en tiempo real
./manage.sh monitor

# Logs específicos
./manage.sh logs error   # Solo errores
./manage.sh logs out     # Solo output
./manage.sh logs         # Todos los logs

# Información del sistema
pm2 info esp32-solar-vue

# Limpiar logs
pm2 flush
```

## 🎯 Comandos de Gestión Rápida

```bash
# === DESARROLLO ===
npm run dev              # Modo desarrollo tradicional
./manage.sh start        # Modo desarrollo con PM2

# === PRODUCCIÓN ===
npm run build           # Compilar
./manage.sh restart     # Aplicar cambios

# === GESTIÓN ===
./manage.sh status      # Ver estado
./manage.sh logs        # Ver logs
./manage.sh monitor     # Monitor gráfico

# === SISTEMA ===
sudo reboot            # Reiniciar Orange Pi (la app se inicia sola)
systemctl status pm2-orangepi  # Verificar servicio PM2
```

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

---

## 🆕 Changelog

### v1.1.0 - Configuración PM2
- ➕ Agregada configuración PM2 para persistencia
- ➕ Scripts de instalación automática (`install-pm2.sh`)
- ➕ Configuración de startup automático (`enable-startup.sh`)
- ➕ Script de gestión rápida (`manage.sh`)
- ➕ Logs organizados y rotación automática
- ➕ Monitoreo de recursos en tiempo real
- ✨ La aplicación ahora se reinicia automáticamente tras fallos o reinicios del sistema

### v1.0.0 - Lanzamiento Inicial
- ✅ Dashboard completo con métricas en tiempo real
- ✅ Configuración de parámetros del cargador
- ✅ Control manual y programado de carga
- ✅ Diseño responsive con Tailwind CSS
- ✅ Gestión de estado con Pinia