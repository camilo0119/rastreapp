#!/bin/bash

# Script de inicio rápido para RastreApp
# Uso: ./start.sh [docker|manual]

set -e

echo "🚛 RastreApp - Sistema de Gestión de Transporte"
echo "================================================"

# Función para mostrar ayuda
show_help() {
    echo "Uso: ./start.sh [opción]"
    echo ""
    echo "Opciones:"
    echo "  docker    - Levantar con Docker (recomendado)"
    echo "  manual    - Levantar manualmente"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./start.sh docker"
    echo "  ./start.sh manual"
}

# Función para levantar con Docker
start_docker() {
    echo "🐳 Iniciando RastreApp con Docker..."
    
    # Verificar si Docker está instalado
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker no está instalado. Por favor instala Docker Desktop."
        exit 1
    fi
    
    # Verificar si Docker Compose está disponible
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose no está disponible."
        exit 1
    fi
    
    echo "📦 Construyendo imágenes..."
    docker-compose up -d --build
    
    echo "⏳ Esperando que los servicios estén listos..."
    sleep 10
    
    echo "🌱 Poblando base de datos..."
    docker-compose exec server npm run seed
    
    echo ""
    echo "✅ RastreApp iniciado correctamente!"
    echo ""
    echo "🌐 URLs de acceso:"
    echo "  Frontend:     http://localhost:3000"
    echo "  API:          http://localhost:3001/api"
    echo "  MongoDB:      localhost:27017"
    echo "  Mongo Express: http://localhost:8081"
    echo ""
    echo "📋 Comandos útiles:"
    echo "  Ver logs:     docker-compose logs -f"
    echo "  Detener:      docker-compose down"
    echo "  Reiniciar:    docker-compose restart"
}

# Función para levantar manualmente
start_manual() {
    echo "🔧 Iniciando RastreApp manualmente..."
    
    # Verificar si Node.js está instalado
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js no está instalado. Por favor instala Node.js 18+."
        exit 1
    fi
    
    # Verificar si npm está disponible
    if ! command -v npm &> /dev/null; then
        echo "❌ npm no está disponible."
        exit 1
    fi
    
    # Verificar si MongoDB está ejecutándose
    if ! pgrep -x "mongod" > /dev/null; then
        echo "⚠️  MongoDB no está ejecutándose."
        echo "   Por favor inicia MongoDB antes de continuar:"
        echo "   - macOS: brew services start mongodb-community"
        echo "   - Ubuntu: sudo systemctl start mongod"
        echo "   - Windows: net start MongoDB"
        exit 1
    fi
    
    echo "📦 Instalando dependencias..."
    npm install
    
    echo "🌱 Poblando base de datos..."
    npm run seed
    
    echo "🚀 Iniciando aplicación..."
    npm run dev:full
    
    echo ""
    echo "✅ RastreApp iniciado correctamente!"
    echo ""
    echo "🌐 URLs de acceso:"
    echo "  Frontend: http://localhost:3000"
    echo "  API:      http://localhost:3001/api"
}

# Procesar argumentos
case "${1:-docker}" in
    "docker")
        start_docker
        ;;
    "manual")
        start_manual
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Opción inválida: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
