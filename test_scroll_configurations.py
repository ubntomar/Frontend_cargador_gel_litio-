#!/usr/bin/env python3
"""
Script para crear configuraciones de prueba y validar el comportamiento del scroll
"""

import requests
import json
from datetime import datetime

API_BASE = "http://localhost:8000"

def create_test_configurations():
    """Crea múltiples configuraciones de prueba para probar el scroll"""
    
    # Configuraciones de prueba con diferentes tipos
    test_configs = [
        {
            "name": "Batería Litio 100Ah Casa",
            "config": {
                "batteryCapacity": 100.0,
                "isLithium": True,
                "thresholdPercentage": 5.0,
                "maxAllowedCurrent": 10000.0,
                "bulkVoltage": 14.4,
                "absorptionVoltage": 14.4,
                "floatVoltage": 13.6,
                "useFuenteDC": False,
                "fuenteDC_Amps": 0.0,
                "factorDivider": 1
            }
        },
        {
            "name": "Batería GEL 150Ah Oficina",
            "config": {
                "batteryCapacity": 150.0,
                "isLithium": False,
                "thresholdPercentage": 10.0,
                "maxAllowedCurrent": 12000.0,
                "bulkVoltage": 14.1,
                "absorptionVoltage": 14.1,
                "floatVoltage": 13.3,
                "useFuenteDC": True,
                "fuenteDC_Amps": 5.0,
                "factorDivider": 1
            }
        },
        {
            "name": "Batería AGM 200Ah Industrial",
            "config": {
                "batteryCapacity": 200.0,
                "isLithium": False,
                "thresholdPercentage": 8.0,
                "maxAllowedCurrent": 20000.0,
                "bulkVoltage": 14.2,
                "absorptionVoltage": 14.2,
                "floatVoltage": 13.4,
                "useFuenteDC": False,
                "fuenteDC_Amps": 0.0,
                "factorDivider": 1
            }
        },
        {
            "name": "Litio LifePO4 300Ah RV",
            "config": {
                "batteryCapacity": 300.0,
                "isLithium": True,
                "thresholdPercentage": 3.0,
                "maxAllowedCurrent": 30000.0,
                "bulkVoltage": 14.6,
                "absorptionVoltage": 14.6,
                "floatVoltage": 13.8,
                "useFuenteDC": True,
                "fuenteDC_Amps": 10.0,
                "factorDivider": 1
            }
        },
        {
            "name": "Batería Gel 80Ah Cabina",
            "config": {
                "batteryCapacity": 80.0,
                "isLithium": False,
                "thresholdPercentage": 12.0,
                "maxAllowedCurrent": 8000.0,
                "bulkVoltage": 14.0,
                "absorptionVoltage": 14.0,
                "floatVoltage": 13.2,
                "useFuenteDC": False,
                "fuenteDC_Amps": 0.0,
                "factorDivider": 1
            }
        },
        {
            "name": "Litio 400Ah Sistema Grande",
            "config": {
                "batteryCapacity": 400.0,
                "isLithium": True,
                "thresholdPercentage": 2.0,
                "maxAllowedCurrent": 40000.0,
                "bulkVoltage": 14.8,
                "absorptionVoltage": 14.8,
                "floatVoltage": 14.0,
                "useFuenteDC": True,
                "fuenteDC_Amps": 15.0,
                "factorDivider": 1
            }
        },
        {
            "name": "AGM 120Ah Respaldo UPS",
            "config": {
                "batteryCapacity": 120.0,
                "isLithium": False,
                "thresholdPercentage": 15.0,
                "maxAllowedCurrent": 10000.0,
                "bulkVoltage": 14.3,
                "absorptionVoltage": 14.3,
                "floatVoltage": 13.5,
                "useFuenteDC": False,
                "fuenteDC_Amps": 0.0,
                "factorDivider": 1
            }
        }
    ]
    
    print("🧪 Creando configuraciones de prueba para validar scroll...")
    created_configs = []
    
    for test_config in test_configs:
        name = test_config["name"]
        config = test_config["config"]
        
        # Agregar metadatos
        config["createdAt"] = datetime.now().isoformat()
        config["updatedAt"] = datetime.now().isoformat()
        
        try:
            response = requests.post(
                f"{API_BASE}/config/custom/configurations/{name}",
                json=config,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Configuración '{name}' creada")
                created_configs.append(name)
            else:
                print(f"❌ Error creando '{name}': HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error creando '{name}': {e}")
    
    return created_configs

def list_all_configurations():
    """Lista todas las configuraciones para verificar"""
    try:
        response = requests.get(f"{API_BASE}/config/custom/configurations")
        if response.status_code == 200:
            data = response.json()
            configurations = data.get('configurations', {})
            
            print(f"\n📋 Configuraciones totales: {len(configurations)}")
            for i, (name, config) in enumerate(configurations.items(), 1):
                capacity = config.get('batteryCapacity', 'N/A')
                lithium = config.get('isLithium', False)
                battery_type = 'Litio' if lithium else 'GEL/AGM'
                print(f"   {i:2d}. {name} ({capacity}Ah, {battery_type})")
            
            return list(configurations.keys())
        else:
            print(f"❌ Error listando configuraciones: HTTP {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def cleanup_test_configurations(config_names):
    """Limpia las configuraciones de prueba creadas"""
    print(f"\n🧹 Limpiando {len(config_names)} configuraciones de prueba...")
    
    for name in config_names:
        try:
            response = requests.delete(f"{API_BASE}/config/custom/configurations/{name}")
            if response.status_code == 200:
                print(f"✅ Eliminada '{name}'")
            else:
                print(f"❌ Error eliminando '{name}': HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ Error eliminando '{name}': {e}")

def main():
    print("🧪 PRUEBA DE SCROLL EN CONFIGURACIONES")
    print("="*50)
    
    # Listar configuraciones actuales
    print("📊 Estado inicial:")
    initial_configs = list_all_configurations()
    
    # Crear configuraciones de prueba
    print(f"\n🔧 Creando configuraciones de prueba...")
    created_configs = create_test_configurations()
    
    if created_configs:
        print(f"\n✅ {len(created_configs)} configuraciones de prueba creadas")
        
        # Listar todas las configuraciones
        all_configs = list_all_configurations()
        
        print(f"\n🎯 INSTRUCCIONES PARA PRUEBA:")
        print("1. Ve al frontend: http://localhost:5173")
        print("2. Busca la sección 'Configuraciones Guardadas'")
        print("3. Debería estar COLAPSADA por defecto")
        print("4. Haz clic para expandir")
        print("5. Con más de 5 configuraciones, debería aparecer scroll")
        print("6. Verifica que el scroll funcione correctamente")
        print("7. Prueba colapsar y expandir varias veces")
        
        # Preguntar si limpiar
        print(f"\n⚠️  NOTA: Después de probar, ejecuta este script con --cleanup")
        print("   o elimina manualmente las configuraciones de prueba")
        
    else:
        print("❌ No se pudieron crear configuraciones de prueba")

def cleanup():
    """Función para limpiar configuraciones de prueba"""
    print("🧹 LIMPIEZA DE CONFIGURACIONES DE PRUEBA")
    print("="*50)
    
    all_configs = list_all_configurations()
    
    # Configuraciones que probablemente son de prueba
    test_keywords = ['prueba', 'test', 'casa', 'oficina', 'industrial', 'rv', 'cabina', 'respaldo', 'ups']
    test_configs = []
    
    for config_name in all_configs:
        if any(keyword in config_name.lower() for keyword in test_keywords):
            test_configs.append(config_name)
    
    if test_configs:
        print(f"📋 Configuraciones que parecen de prueba ({len(test_configs)}):")
        for i, name in enumerate(test_configs, 1):
            print(f"   {i}. {name}")
        
        confirm = input(f"\n¿Eliminar estas {len(test_configs)} configuraciones? (s/N): ")
        if confirm.lower() in ['s', 'si', 'sí', 'y', 'yes']:
            cleanup_test_configurations(test_configs)
        else:
            print("❌ Limpieza cancelada")
    else:
        print("✅ No se encontraron configuraciones de prueba para eliminar")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--cleanup':
        cleanup()
    else:
        main()
