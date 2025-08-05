# Documentación de Endpoints  para Configuraciones Personalizadas

## Endpoints Requeridos en el Backend

Para que la funcionalidad de configuraciones personalizadas funcione correctamente, necesitas implementar los siguientes endpoints en tu API:

### 1. Guardar archivo de configuraciones
**POST** `/config/configurations`

**Request Body:**
```json
{
  "data": "{\"config1\":{\"batteryCapacity\":100,\"isLithium\":true,...},\"config2\":{...}}"
}
```

**Response:**
```json
{
  "message": "Configuraciones guardadas exitosamente",
  "status": "success"
}
```

**Funcionalidad:**
- Recibe los datos de configuraciones como string JSON
- Guarda el contenido en un archivo `configuraciones.json` en el servidor
- El archivo debe ser persistente y accesible entre reinicios

### 2. Cargar archivo de configuraciones
**GET** `/config/configurations`

**Response:**
```json
{
  "configurations": {
    "Batería Litio 100Ah": {
      "batteryCapacity": 100,
      "isLithium": true,
      "thresholdPercentage": 2.0,
      "maxAllowedCurrent": 10000,
      "bulkVoltage": 14.4,
      "absorptionVoltage": 14.4,
      "floatVoltage": 13.6,
      "useFuenteDC": false,
      "fuenteDC_Amps": 0,
      "factorDivider": 1,
      "createdAt": "2025-08-03T10:00:00.000Z",
      "updatedAt": "2025-08-03T10:00:00.000Z"
    },
    "Batería GEL 200Ah": {
      "batteryCapacity": 200,
      "isLithium": false,
      "thresholdPercentage": 2.5,
      "maxAllowedCurrent": 8000,
      "bulkVoltage": 14.1,
      "absorptionVoltage": 14.1,
      "floatVoltage": 13.3,
      "useFuenteDC": true,
      "fuenteDC_Amps": 20,
      "factorDivider": 1,
      "createdAt": "2025-08-03T11:00:00.000Z",
      "updatedAt": "2025-08-03T11:00:00.000Z"
    }
  }
}
```

**Funcionalidad:**
- Lee el archivo `configuraciones.json` del servidor
- Retorna las configuraciones guardadas
- Si el archivo no existe, retorna un objeto vacío

## Parámetros Configurables

Los siguientes parámetros deben ser manejados en las configuraciones:

### Batería
- `batteryCapacity` (float): Capacidad en Ah
- `isLithium` (boolean): true para Litio, false para GEL/AGM
- `thresholdPercentage` (float): Umbral de corriente en %
- `maxAllowedCurrent` (float): Corriente máxima en mA

### Voltajes
- `bulkVoltage` (float): Voltaje BULK en V
- `absorptionVoltage` (float): Voltaje de absorción en V
- `floatVoltage` (float): Voltaje de flotación en V

### Fuente DC
- `useFuenteDC` (boolean): Usar fuente DC adicional
- `fuenteDC_Amps` (float): Corriente de la fuente DC en A

### Avanzado
- `factorDivider` (int): Factor divisor para cálculos internos

## Implementación Sugerida (Python/FastAPI)

```python
import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

CONFIG_FILE_PATH = "configuraciones.json"

class ConfigurationData(BaseModel):
    data: str

@router.post("/config/configurations")
async def save_configurations(config_data: ConfigurationData):
    try:
        # Validar que sea JSON válido
        configurations = json.loads(config_data.data)
        
        # Guardar en archivo
        with open(CONFIG_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(configurations, f, indent=2, ensure_ascii=False)
        
        return {"message": "Configuraciones guardadas exitosamente", "status": "success"}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Datos JSON inválidos")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")

@router.get("/config/configurations")
async def load_configurations():
    try:
        if not os.path.exists(CONFIG_FILE_PATH):
            return {"configurations": {}}
        
        with open(CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
            configurations = json.load(f)
        
        return {"configurations": configurations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cargar: {str(e)}")
```

## Características del Sistema

### ✅ Funcionalidades Implementadas en Frontend

1. **Guardar configuración actual**: Toma todos los parámetros actuales y los guarda con un nombre personalizado
2. **Lista de configuraciones**: Muestra todas las configuraciones guardadas con información resumida
3. **Aplicar configuración**: Aplica todos los parámetros de una configuración guardada
4. **Actualizar configuración**: Actualiza una configuración existente con los valores actuales
5. **Eliminar configuración**: Elimina una configuración guardada (con confirmación)
6. **Exportar a JSON**: Descarga todas las configuraciones en un archivo JSON
7. **Importar desde JSON**: Carga configuraciones desde un archivo JSON exportado
8. **Portabilidad**: Los archivos JSON pueden trasladarse entre diferentes OrangePi

### 🔄 Flujo de Uso

1. Usuario configura parámetros manualmente en la interfaz
2. Usuario guarda la configuración actual con un nombre descriptivo
3. La configuración se almacena en el servidor como archivo JSON
4. Usuario puede aplicar configuraciones guardadas según el tipo de batería
5. Usuario puede exportar configuraciones para usar en otros dispositivos
6. Usuario puede importar configuraciones desde otros dispositivos

### 📁 Estructura del Archivo JSON

```json
{
  "Batería Litio 100Ah": {
    "batteryCapacity": 100,
    "isLithium": true,
    "thresholdPercentage": 2.0,
    "maxAllowedCurrent": 10000,
    "bulkVoltage": 14.4,
    "absorptionVoltage": 14.4,
    "floatVoltage": 13.6,
    "useFuenteDC": false,
    "fuenteDC_Amps": 0,
    "factorDivider": 1,
    "createdAt": "2025-08-03T10:00:00.000Z",
    "updatedAt": "2025-08-03T10:00:00.000Z"
  }
}
```

Este sistema te permitirá tener configuraciones específicas para diferentes tipos de baterías y trasladarlas fácilmente entre diferentes OrangePi.
