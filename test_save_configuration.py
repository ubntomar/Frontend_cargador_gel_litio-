#!/usr/bin/env python3
"""
Test script para validar los endpoints de configuraciones personalizadas
"""

import requests
import json
import time
from datetime import datetime

API_BASE = "http://localhost:8000"

def print_separator(title):
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def test_api_connection():
    print_separator("TEST 1: Conexión con API")
    try:
        response = requests.get(f"{API_BASE}/data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ API conectada exitosamente")
            print(f"   Voltaje batería: {data.get('batteryVoltage', 'N/A')}V")
            print(f"   Capacidad batería: {data.get('batteryCapacity', 'N/A')}Ah")
            return True
        else:
            print(f"❌ Error HTTP {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def get_current_configuration():
    print_separator("TEST 2: Obtener Configuración Actual")
    try:
        response = requests.get(f"{API_BASE}/data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            # Extraer solo parámetros configurables
            config = {
                'batteryCapacity': data.get('batteryCapacity'),
                'isLithium': data.get('isLithium'),
                'thresholdPercentage': data.get('thresholdPercentage'),
                'maxAllowedCurrent': data.get('maxAllowedCurrent'),
                'bulkVoltage': data.get('bulkVoltage'),
                'absorptionVoltage': data.get('absorptionVoltage'),
                'floatVoltage': data.get('floatVoltage'),
                'useFuenteDC': data.get('useFuenteDC'),
                'fuenteDC_Amps': data.get('fuenteDC_Amps'),
                'factorDivider': data.get('factorDivider')
            }
            
            print("✅ Configuración actual obtenida:")
            for param, value in config.items():
                print(f"   {param}: {value}")
            
            return config
        else:
            print(f"❌ Error al obtener datos: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_configuration_endpoints():
    print_separator("TEST 3: Probar Endpoints de Configuración")
    
    endpoints = [
        ("GET", "/config/custom/configurations", "Listar configuraciones"),
        ("GET", "/config/custom/configurations/info", "Info de configuraciones"),
    ]
    
    for method, endpoint, description in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
            
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {description}: HTTP {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if endpoint == "/config/custom/configurations":
                        configs = data.get('configurations', {})
                        print(f"   → {len(configs)} configuración(es) encontrada(s)")
                    elif endpoint == "/config/custom/configurations/info":
                        print(f"   → Info: {json.dumps(data, indent=2)}")
                except:
                    print(f"   → Respuesta: {response.text[:100]}...")
            else:
                print(f"   → Error: {response.text[:100]}...")
                
        except Exception as e:
            print(f"❌ {description}: Error - {e}")

def save_test_configuration(current_config):
    print_separator("TEST 4: Guardar Configuración de Prueba")
    
    if not current_config:
        print("❌ No hay configuración actual para guardar")
        return None
    
    config_name = f"Test_Config_{datetime.now().strftime('%H%M%S')}"
    
    # Preparar configuración con metadatos
    config_to_save = {
        **current_config,
        'createdAt': datetime.now().isoformat(),
        'updatedAt': datetime.now().isoformat()
    }
    
    try:
        print(f"Guardando configuración '{config_name}'...")
        response = requests.post(
            f"{API_BASE}/config/custom/configurations/{config_name}",
            json=config_to_save,
            timeout=15
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Configuración '{config_name}' guardada exitosamente")
            return config_name
        else:
            print(f"❌ Error al guardar: HTTP {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error al guardar configuración: {e}")
        return None

def list_saved_configurations():
    print_separator("TEST 5: Listar Configuraciones Guardadas")
    
    try:
        response = requests.get(f"{API_BASE}/config/custom/configurations", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            configurations = data.get('configurations', {})
            
            if configurations:
                print(f"✅ {len(configurations)} configuración(es) encontrada(s):")
                for name, config in configurations.items():
                    created = config.get('createdAt', 'N/A')
                    capacity = config.get('batteryCapacity', 'N/A')
                    lithium = config.get('isLithium', 'N/A')
                    print(f"   📁 {name}")
                    print(f"      Creada: {created}")
                    print(f"      Capacidad: {capacity}Ah, Litio: {lithium}")
                return list(configurations.keys())
            else:
                print("⚠️ No hay configuraciones guardadas")
                return []
                
        else:
            print(f"❌ Error al listar: HTTP {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def apply_configuration(config_name):
    print_separator(f"TEST 6: Aplicar Configuración '{config_name}'")
    
    try:
        print(f"Aplicando configuración '{config_name}'... (puede tomar hasta 30s)")
        response = requests.post(
            f"{API_BASE}/config/custom/configurations/{config_name}/apply",
            timeout=35
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Configuración '{config_name}' aplicada exitosamente")
            if 'applied_parameters' in result:
                print(f"   Parámetros aplicados: {len(result['applied_parameters'])}")
            return True
        else:
            print(f"❌ Error al aplicar: HTTP {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏰ Timeout al aplicar configuración (>35s)")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def delete_configuration(config_name):
    print_separator(f"TEST 7: Eliminar Configuración '{config_name}'")
    
    try:
        response = requests.delete(
            f"{API_BASE}/config/custom/configurations/{config_name}",
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Configuración '{config_name}' eliminada exitosamente")
            return True
        else:
            print(f"❌ Error al eliminar: HTTP {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def validate_configuration(config):
    print_separator("TEST EXTRA: Validar Configuración")
    
    try:
        response = requests.post(
            f"{API_BASE}/config/custom/configurations/validate",
            json=config,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Configuración válida")
            return True
        else:
            print(f"❌ Configuración inválida: HTTP {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error al validar: {e}")
        return False

def main():
    print("🧪 INICIANDO TESTS DE CONFIGURACIONES PERSONALIZADAS")
    print(f"API Base: {API_BASE}")
    print(f"Timestamp: {datetime.now()}")
    
    # Test 1: Conexión
    if not test_api_connection():
        print("\n❌ No se puede conectar a la API. Verifica que esté corriendo.")
        return
    
    # Test 2: Obtener configuración actual
    current_config = get_current_configuration()
    if not current_config:
        print("\n❌ No se pudo obtener la configuración actual.")
        return
    
    # Test 3: Probar endpoints
    test_configuration_endpoints()
    
    # Test Extra: Validar configuración
    validate_configuration(current_config)
    
    # Test 4: Guardar configuración de prueba
    test_config_name = save_test_configuration(current_config)
    if not test_config_name:
        print("\n❌ No se pudo guardar la configuración de prueba.")
        return
    
    # Test 5: Listar configuraciones
    saved_configs = list_saved_configurations()
    
    # Test 6: Aplicar configuración (solo si se guardó exitosamente)
    if test_config_name and test_config_name in saved_configs:
        apply_success = apply_configuration(test_config_name)
        
        # Esperar un poco después de aplicar
        if apply_success:
            print("⏳ Esperando 3 segundos para que se complete la aplicación...")
            time.sleep(3)
    
    # Test 7: Limpiar - eliminar configuración de prueba
    if test_config_name:
        delete_configuration(test_config_name)
    
    print_separator("RESUMEN DE TESTS")
    print("Tests completados. Revisa los resultados arriba.")
    print("Si hay errores, verifica:")
    print("1. Que la API esté corriendo en puerto 8000")
    print("2. Que el ESP32 esté conectado y respondiendo")
    print("3. Los logs de la API para errores detallados")

if __name__ == "__main__":
    main()
