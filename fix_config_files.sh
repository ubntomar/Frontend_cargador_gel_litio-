#!/bin/bash
# Script para corregir los archivos de configuración a formato CommonJS

echo "🔧 Corrigiendo archivos de configuración..."

# Corregir postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo "✅ postcss.config.js corregido"

# Corregir tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        dark: '#1F2937'
      }
    },
  },
  plugins: [],
}
EOF

echo "✅ tailwind.config.js corregido"

# Corregir vite.config.js
cat > vite.config.js << 'EOF'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',  // Permitir acceso desde la red
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://192.168.13.180:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
EOF

echo "✅ vite.config.js actualizado con host 0.0.0.0"

# Asegurarnos de que el archivo .eslintrc.cjs existe
if [ ! -f ".eslintrc.cjs" ]; then
cat > .eslintrc.cjs << 'EOF'
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'no-unused-vars': 'warn'
  }
}
EOF
echo "✅ .eslintrc.cjs creado"
fi

echo ""
echo "✅ ¡Archivos de configuración corregidos!"
echo ""
echo "Ahora puedes ejecutar:"
echo "  npm run dev"
echo ""
echo "La aplicación estará disponible en:"
echo "  - Local: http://localhost:3000"
echo "  - Red: http://[IP-DEL-ORANGE-PI]:3000"
