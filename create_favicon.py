#!/usr/bin/env python3
"""
Generador de favicon simple para ESP32 Solar Charger
Crea un favicon.ico básico para evitar errores 404 en la consola
"""

def create_simple_favicon():
    # Crear un favicon.ico muy simple de 16x16 píxeles
    # ICO file header (6 bytes)
    ico_header = b'\x00\x00\x01\x00\x01\x00'
    
    # Image directory entry (16 bytes)
    # width(1) height(1) colors(1) reserved(1) planes(2) bitcount(2) size(4) offset(4)
    img_dir = b'\x10\x10\x00\x00\x01\x00\x20\x00\x00\x04\x00\x00\x16\x00\x00\x00'
    
    # Bitmap header (40 bytes)
    bmp_header = (
        b'\x28\x00\x00\x00'  # header size
        b'\x10\x00\x00\x00'  # width
        b'\x20\x00\x00\x00'  # height (double for ICO)
        b'\x01\x00'          # planes
        b'\x20\x00'          # bits per pixel
        b'\x00\x00\x00\x00'  # compression
        b'\x00\x04\x00\x00'  # image size
        b'\x00\x00\x00\x00'  # x pixels per meter
        b'\x00\x00\x00\x00'  # y pixels per meter
        b'\x00\x00\x00\x00'  # colors used
        b'\x00\x00\x00\x00'  # important colors
    )
    
    # Crear una imagen simple: fondo azul con un círculo amarillo (sol)
    pixels = []
    
    # 16x16 píxeles, formato BGRA (4 bytes por pixel)
    for y in range(16):
        for x in range(16):
            # Calcular distancia desde el centro
            dx = x - 8
            dy = y - 8
            dist = (dx*dx + dy*dy) ** 0.5
            
            if dist < 3:  # Sol amarillo en el centro
                # Amarillo: B=0, G=255, R=255, A=255
                pixels.extend([0, 255, 255, 255])
            elif dist < 6:  # Fondo azul alrededor
                # Azul: B=255, G=100, R=30, A=255  
                pixels.extend([255, 100, 30, 255])
            else:  # Fondo más oscuro
                # Azul oscuro: B=200, G=50, R=20, A=255
                pixels.extend([200, 50, 20, 255])
    
    # Crear archivo ICO
    with open('public/favicon.ico', 'wb') as f:
        f.write(ico_header)
        f.write(img_dir)
        f.write(bmp_header)
        f.write(bytes(pixels))
    
    print("✅ favicon.ico creado exitosamente")

if __name__ == "__main__":
    create_simple_favicon()
