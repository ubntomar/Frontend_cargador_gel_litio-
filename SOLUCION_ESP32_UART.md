# Solución: Comunicación con ESP32 via UART

## 🔧 Problema Identificado

El ESP32 NO maneja HTTP directamente. Usa comunicación serial UART con comandos específicos.

## 🏗️ Arquitectura Correcta

```
Frontend (Vue.js) → HTTP PUT → Orange Pi API → Serial UART → ESP32
                                     ↓
                              Traduce HTTP a comandos seriales
```

## 📝 Implementación en Orange Pi (Python/FastAPI)

### 1. Instalar dependencias

```bash
pip install pyserial fastapi uvicorn
```

### 2. Controlador ESP32 (esp32_controller.py)

```python
import serial
import json
import time
import logging
from typing import Dict, Any, Optional

class ESP32Controller:
    def __init__(self, port='/dev/ttyS0', baudrate=9600, timeout=2):
        """
        Inicializa la conexión serial con el ESP32
        """
        try:
            self.ser = serial.Serial(
                port=port,
                baudrate=baudrate,
                bytesize=8,
                parity='N',
                stopbits=1,
                timeout=timeout
            )
            time.sleep(2)  # Esperar estabilización
            logging.info(f"Conexión serial establecida en {port}")
        except Exception as e:
            logging.error(f"Error al conectar con ESP32: {e}")
            self.ser = None
        
    def send_command(self, command: str) -> str:
        """
        Envía un comando al ESP32 y retorna la respuesta
        """
        if not self.ser or not self.ser.is_open:
            return "ERROR:Serial connection not available"
            
        try:
            # Limpiar buffer de entrada
            self.ser.reset_input_buffer()
            
            # Enviar comando
            self.ser.write(f"{command}\n".encode())
            
            # Leer respuesta
            response = self.ser.readline().decode().strip()
            return response
        except Exception as e:
            logging.error(f"Error en comunicación serial: {e}")
            return f"ERROR:Serial communication failed: {e}"
        
    def get_all_data(self) -> Dict[str, Any]:
        """
        Obtiene todos los datos del sistema
        """
        response = self.send_command("CMD:GET_DATA")
        
        if response.startswith("ERROR:"):
            return {"error": response[6:]}
            
        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON response: {response}"}
            
    def set_parameter(self, parameter: str, value: Any) -> Dict[str, Any]:
        """
        Modifica un parámetro del sistema usando el protocolo UART del ESP32
        """
        # Mapeo de parámetros para asegurar compatibilidad
        param_mapping = {
            'batteryCapacity': 'batteryCapacity',
            'isLithium': 'isLithium',
            'thresholdPercentage': 'thresholdPercentage',
            'maxAllowedCurrent': 'maxAllowedCurrent',
            'bulkVoltage': 'bulkVoltage',
            'absorptionVoltage': 'absorptionVoltage',
            'floatVoltage': 'floatVoltage',
            'useFuenteDC': 'useFuenteDC',
            'fuenteDC_Amps': 'fuenteDC_Amps',
            'factorDivider': 'factorDivider'
        }
        
        if parameter not in param_mapping:
            return {
                "success": False,
                "error": f"Parámetro no soportado: {parameter}",
                "parameter": parameter,
                "value": value
            }
        
        esp32_param = param_mapping[parameter]
        command = f"CMD:SET_{esp32_param}:{value}"
        response = self.send_command(command)
        
        if response.startswith("OK:"):
            return {
                "success": True,
                "message": response[3:],
                "parameter": parameter,
                "value": value
            }
        elif response.startswith("ERROR:"):
            return {
                "success": False,
                "error": response[6:],
                "parameter": parameter,
                "value": value
            }
        else:
            return {
                "success": False,
                "error": f"Respuesta inesperada: {response}",
                "parameter": parameter,
                "value": value
            }
            
    def toggle_load(self, seconds: int) -> Dict[str, Any]:
        """
        Apaga la carga temporalmente
        """
        if not 1 <= seconds <= 43200:
            return {
                "success": False,
                "error": f"Segundos fuera de rango (1-43200): {seconds}"
            }
            
        response = self.send_command(f"CMD:TOGGLE_LOAD:{seconds}")
        
        if response.startswith("OK:"):
            return {"success": True, "message": response[3:]}
        else:
            return {"success": False, "error": response}
            
    def cancel_temp_off(self) -> Dict[str, Any]:
        """
        Cancela el apagado temporal de la carga
        """
        response = self.send_command("CMD:CANCEL_TEMP_OFF")
        
        if response.startswith("OK:"):
            return {"success": True, "message": response[3:]}
        else:
            return {"success": False, "error": response}
            
    def close(self):
        """Cierra la conexión serial"""
        if self.ser and self.ser.is_open:
            self.ser.close()
```

### 3. API modificada (main.py)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from esp32_controller import ESP32Controller
import logging
import json
import os

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="API Cargador de Baterías")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar controlador ESP32
esp32_controller = ESP32Controller(port='/dev/ttyS0')  # Ajustar puerto según tu configuración

class ParameterValue(BaseModel):
    value: any

class ConfigurationData(BaseModel):
    data: str

# ================================
# ENDPOINTS PARA DATOS
# ================================

@app.get("/data/")
async def get_all_data():
    """Obtener todos los datos del sistema"""
    data = esp32_controller.get_all_data()
    
    if "error" in data:
        raise HTTPException(status_code=503, detail=data["error"])
    
    return data

@app.get("/data/{parameter}")
async def get_parameter(parameter: str):
    """Obtener un parámetro específico"""
    data = esp32_controller.get_all_data()
    
    if "error" in data:
        raise HTTPException(status_code=503, detail=data["error"])
    
    if parameter not in data:
        raise HTTPException(status_code=404, detail=f"Parámetro no encontrado: {parameter}")
    
    return {parameter: data[parameter]}

# ================================
# ENDPOINTS PARA CONFIGURACIÓN
# ================================

@app.get("/config/")
async def get_configurable_parameters():
    """Obtener parámetros configurables con sus rangos y valores actuales"""
    data = esp32_controller.get_all_data()
    
    if "error" in data:
        raise HTTPException(status_code=503, detail=data["error"])
    
    # Definir parámetros configurables con sus metadatos
    parameter_info = {
        "batteryCapacity": {
            "current_value": data.get("batteryCapacity", 0),
            "type": "float",
            "min": 0.1,
            "max": 1000,
            "unit": "Ah",
            "description": "Capacidad total de la batería"
        },
        "isLithium": {
            "current_value": data.get("isLithium", False),
            "type": "bool",
            "description": "Tipo de batería (true: Litio, false: GEL/AGM)"
        },
        "thresholdPercentage": {
            "current_value": data.get("thresholdPercentage", 0),
            "type": "float",
            "min": 0.1,
            "max": 5.0,
            "unit": "%",
            "description": "Umbral de corriente para transición a flotación"
        },
        "maxAllowedCurrent": {
            "current_value": data.get("maxAllowedCurrent", 0),
            "type": "float",
            "min": 1000,
            "max": 15000,
            "unit": "mA",
            "description": "Corriente máxima de carga permitida"
        },
        "bulkVoltage": {
            "current_value": data.get("bulkVoltage", 0),
            "type": "float",
            "min": 12.0,
            "max": 15.0,
            "unit": "V",
            "description": "Voltaje objetivo en etapa BULK"
        },
        "absorptionVoltage": {
            "current_value": data.get("absorptionVoltage", 0),
            "type": "float",
            "min": 12.0,
            "max": 15.0,
            "unit": "V",
            "description": "Voltaje objetivo en etapa de absorción"
        },
        "floatVoltage": {
            "current_value": data.get("floatVoltage", 0),
            "type": "float",
            "min": 12.0,
            "max": 15.0,
            "unit": "V",
            "description": "Voltaje de flotación/mantenimiento"
        },
        "useFuenteDC": {
            "current_value": data.get("useFuenteDC", False),
            "type": "bool",
            "description": "Usar fuente DC en lugar de panel solar"
        },
        "fuenteDC_Amps": {
            "current_value": data.get("fuenteDC_Amps", 0),
            "type": "float",
            "min": 0,
            "max": 50,
            "unit": "A",
            "description": "Corriente de la fuente DC"
        },
        "factorDivider": {
            "current_value": data.get("factorDivider", 1),
            "type": "int",
            "min": 1,
            "max": 10,
            "description": "Factor divisor para límites de corriente"
        }
    }
    
    return {"parameter_info": parameter_info}

@app.put("/config/{parameter}")
async def set_parameter(parameter: str, param_data: ParameterValue):
    """Modificar un parámetro de configuración"""
    logger.info(f"Configurando {parameter} = {param_data.value}")
    
    # Enviar comando al ESP32 via UART
    result = esp32_controller.set_parameter(parameter, param_data.value)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "message": f"Parámetro {parameter} actualizado exitosamente",
        "parameter": parameter,
        "value": param_data.value,
        "esp32_response": result["message"]
    }

# ================================
# ENDPOINTS PARA CONFIGURACIONES PERSONALIZADAS
# ================================

CONFIG_FILE_PATH = "configuraciones.json"

@app.post("/config/configurations")
async def save_configurations(config_data: ConfigurationData):
    """Guardar configuraciones personalizadas en archivo JSON"""
    try:
        # Validar que sea JSON válido
        configurations = json.loads(config_data.data)
        
        # Guardar en archivo
        with open(CONFIG_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(configurations, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Configuraciones guardadas en {CONFIG_FILE_PATH}")
        return {"message": "Configuraciones guardadas exitosamente", "status": "success"}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Datos JSON inválidos")
    except Exception as e:
        logger.error(f"Error al guardar configuraciones: {e}")
        raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")

@app.get("/config/configurations")
async def load_configurations():
    """Cargar configuraciones personalizadas desde archivo JSON"""
    try:
        if not os.path.exists(CONFIG_FILE_PATH):
            return {"configurations": {}}
        
        with open(CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
            configurations = json.load(f)
        
        return {"configurations": configurations}
    except Exception as e:
        logger.error(f"Error al cargar configuraciones: {e}")
        raise HTTPException(status_code=500, detail=f"Error al cargar: {str(e)}")

# ================================
# ENDPOINTS PARA ACCIONES
# ================================

@app.post("/actions/toggle_load")
async def toggle_load(load_data: dict):
    """Controlar carga temporal"""
    hours = load_data.get("hours", 0)
    minutes = load_data.get("minutes", 0) 
    seconds = load_data.get("seconds", 0)
    
    total_seconds = hours * 3600 + minutes * 60 + seconds
    
    if total_seconds <= 0:
        raise HTTPException(status_code=400, detail="Duración debe ser mayor a 0")
    
    result = esp32_controller.toggle_load(total_seconds)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@app.get("/actions/status")
async def get_actions_status():
    """Obtener estado de las acciones"""
    data = esp32_controller.get_all_data()
    
    if "error" in data:
        raise HTTPException(status_code=503, detail=data["error"])
    
    return {
        "loadControlState": data.get("loadControlState", False),
        "temporaryLoadOff": data.get("temporaryLoadOff", False),
        "loadOffRemainingSeconds": data.get("loadOffRemainingSeconds", 0)
    }

# ================================
# HEALTH CHECK
# ================================

@app.get("/health")
async def health_check():
    """Verificar estado del sistema"""
    try:
        data = esp32_controller.get_all_data()
        if "error" not in data:
            return {
                "status": "healthy",
                "connected": data.get("connected", False),
                "uptime": data.get("uptime", 0),
                "firmware": data.get("firmware_version", "unknown"),
                "esp32_communication": "OK"
            }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
    
    return {"status": "unhealthy", "esp32_communication": "FAILED"}

@app.get("/data/status/connection")
async def get_connection_status():
    """Estado de conexión específico"""
    data = esp32_controller.get_all_data()
    
    if "error" in data:
        return {"connected": False, "error": data["error"]}
    
    return {
        "connected": data.get("connected", False),
        "firmware_version": data.get("firmware_version", "unknown"),
        "uptime": data.get("uptime", 0)
    }

# Cleanup al cerrar la aplicación
@app.on_event("shutdown")
def shutdown_event():
    esp32_controller.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 4. Script de prueba (test_esp32.py)

```python
#!/usr/bin/env python3
"""
Script de prueba para verificar comunicación con ESP32
"""

from esp32_controller import ESP32Controller
import time

def test_esp32_communication():
    print("🔌 Conectando con ESP32...")
    
    # Conectar (ajustar puerto según tu configuración)
    controller = ESP32Controller(port='/dev/ttyS0')
    
    if not controller.ser or not controller.ser.is_open:
        print("❌ Error: No se pudo conectar con ESP32")
        return False
    
    print("✅ Conexión establecida")
    
    # Obtener datos
    print("\n📊 Obteniendo datos del sistema...")
    data = controller.get_all_data()
    
    if "error" in data:
        print(f"❌ Error al obtener datos: {data['error']}")
        return False
    
    print(f"✅ Estado: {data.get('chargeState', 'unknown')}")
    print(f"✅ Voltaje batería: {data.get('voltageBatterySensor2', 0)} V")
    print(f"✅ SOC: {data.get('estimatedSOC', 0)}%")
    print(f"✅ Firmware: {data.get('firmware_version', 'unknown')}")
    
    # Probar modificación de parámetro
    print("\n🔧 Probando modificación de parámetro...")
    original_capacity = data.get('batteryCapacity', 100)
    test_capacity = 150 if original_capacity != 150 else 200
    
    result = controller.set_parameter("batteryCapacity", test_capacity)
    
    if result["success"]:
        print(f"✅ Parámetro modificado: {result['message']}")
        
        # Restaurar valor original
        time.sleep(1)
        restore_result = controller.set_parameter("batteryCapacity", original_capacity)
        if restore_result["success"]:
            print(f"✅ Valor restaurado: {restore_result['message']}")
        else:
            print(f"⚠️  Error al restaurar: {restore_result['error']}")
    else:
        print(f"❌ Error al modificar parámetro: {result['error']}")
    
    controller.close()
    print("\n🎉 Prueba completada")
    return True

if __name__ == "__main__":
    test_esp32_communication()
```

## 🚀 Pasos para Implementar

### 1. En el Orange Pi:

```bash
# Instalar dependencias
pip install pyserial fastapi uvicorn

# Copiar archivos
cp esp32_controller.py /path/to/your/api/
cp main.py /path/to/your/api/

# Verificar puerto serial
ls /dev/tty*
# Buscar algo como /dev/ttyS0, /dev/ttyUSB0, etc.

# Probar comunicación
python test_esp32.py

# Ejecutar API
python main.py
```

### 2. Verificar funcionalidad:

```bash
# Probar obtener datos
curl http://localhost:8000/data/

# Probar modificar parámetro
curl -X PUT http://localhost:8000/config/batteryCapacity \
  -H "Content-Type: application/json" \
  -d '{"value": 150}'
```

## 🔍 Puntos Clave

1. **Puerto Serial**: Ajusta `/dev/ttyS0` según tu configuración
2. **Baudrate**: El ESP32 usa 9600 bps
3. **Protocolo**: Los comandos deben tener formato `CMD:SET_parameter:value\n`
4. **Validación**: El ESP32 valida rangos y tipos automáticamente
5. **Respuestas**: `OK:` para éxito, `ERROR:` para fallos

Con esta implementación, tus comandos PUT del frontend funcionarán correctamente porque la API traducirá las peticiones HTTP a comandos seriales que el ESP32 entiende.
