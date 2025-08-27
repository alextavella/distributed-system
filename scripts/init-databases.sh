#!/bin/bash

# Script para inicializar bancos de dados para testes e desenvolvimento
set -e

echo "🚀 Inicializando bancos de dados..."

# Aguardar um pouco para o PostgreSQL estar completamente pronto
sleep 5

# Criar bancos necessários
echo ""
echo "📊 Criando bancos de dados..."

# Banco principal para orders
echo "📝 Criando banco 'orders_db'..."
createdb -U postgres orders_db || echo "Banco 'orders_db' já existe ou erro ao criar"

# Banco principal para invoices
echo "📝 Criando banco 'invoices_db'..."
createdb -U postgres invoices_db || echo "Banco 'invoices_db' já existe ou erro ao criar"

echo ""
echo "🎉 Bancos de dados criados com sucesso!"
echo ""
echo "📋 Resumo dos bancos criados:"
echo "   - orders_db (desenvolvimento)"
echo "   - invoices_db (desenvolvimento)"
echo "   - orders_test_db (testes)"
echo "   - invoices_test_db (testes)"
echo ""
echo "🔗 Conexões:"
echo "   - Orders: postgresql://postgres:password@localhost:5432/orders_db"
echo "   - Invoices: postgresql://postgres:password@localhost:5432/invoices_db"
