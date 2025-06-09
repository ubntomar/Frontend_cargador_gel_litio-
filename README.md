# ESP32 Solar Charger Vue3 Frontend

Frontend en Vue 3 para el control y monitoreo del cargador solar ESP32.

## 🚀 Instalación Rápida

```bash
# Instalar dependencias
./install.sh
# o manualmente:
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la IP de tu API

# Iniciar en modo desarrollo
./start.sh
# o manualmente:
npm run dev
```

## 📋 Características

- ✅ Dashboard en tiempo real
- ✅ Configuración de parámetros
- ✅ Control de carga (encender/apagar)
- ✅ Responsive design
- ✅ Polling inteligente
- ✅ Manejo de errores
- ✅ Validación de datos

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

- `VITE_API_BASE_URL`: URL de la API (default: http://192.168.8.100:8000)
- `VITE_POLLING_INTERVAL`: Intervalo de actualización en ms (default: 3000)
- `VITE_MAX_CONCURRENT_REQUESTS`: Requests simultáneos máximos (default: 3)

## 🔧 Desarrollo

```bash
# Servidor de desarrollo
npm run dev

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
3. **Polling**: Configurado cada 3 segundos por defecto
4. **Hardware**: Orange Pi tiene recursos limitados

## 🐛 Solución de Problemas

### La aplicación no se conecta a la API
- Verifica que la API esté ejecutándose
- Confirma la IP en `.env`
- Revisa CORS en la API

### Datos no se actualizan
- Verifica el polling interval
- Revisa la consola del navegador
- Confirma conexión con ESP32

## 📄 Licencia

MIT License - Libre para uso personal y comercial.
