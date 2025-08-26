#!/bin/bash

# Script para desenvolvimento de todos os serviços

echo "🚀 Starting StreamFlix Development Environment..."

# Verificar se o pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    pnpm install
fi

# Verificar se há serviços na pasta apps
if [ ! -d "apps" ] || [ -z "$(ls -A apps)" ]; then
    echo "⚠️ No services found in apps/ directory"
    echo "Create a new service with: pnpm new-service <service-name>"
    exit 1
fi

# Listar serviços disponíveis
echo ""
echo "📋 Available services:"
for service in apps/*/; do
    if [ -d "$service" ]; then
        service_name=$(basename "$service")
        echo "   - $service_name"
    fi
done

echo ""
echo "🔗 Available commands:"
echo "   pnpm dev              # Start all services in development mode"
echo "   pnpm dev:order        # Start only order-service"
echo "   pnpm build            # Build all services"
echo "   pnpm docker:up        # Start with Docker Compose"
echo "   pnpm new-service <name> # Create new service"
echo ""

# Verificar se Docker está rodando
if command -v docker &> /dev/null && docker info >/dev/null 2>&1; then
    echo "🐳 Docker is running"
    echo "   Use 'pnpm docker:up' to start with containers"
else
    echo "⚠️ Docker is not running or not installed"
    echo "   Install Docker to use containerized development"
fi

echo ""
echo "✅ Development environment ready!"
echo "Choose your preferred development method:"
echo "   1. Local development: pnpm dev"
echo "   2. Docker development: pnpm docker:up"
