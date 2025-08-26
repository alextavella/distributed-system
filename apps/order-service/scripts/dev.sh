#!/bin/bash

# Script para desenvolvimento local

echo "🚀 Starting Order Service Development Environment..."

# Verificar se o .env existe
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Gerar migrações se necessário
if [ ! -d "drizzle" ]; then
    echo "🗄️ Generating database migrations..."
    npm run db:generate
fi

echo "✅ Environment ready!"
echo ""
echo "🔗 Available URLs:"
echo "   API: http://localhost:3001"
echo "   Health: http://localhost:3001/health"
echo "   Docs: http://localhost:3001/docs"
echo ""
echo "📚 Available commands:"
echo "   npm run dev          # Start development server"
echo "   npm run db:migrate   # Run database migrations"
echo "   npm run db:studio    # Open Drizzle Studio"
echo ""

# Iniciar servidor de desenvolvimento
npm run dev
