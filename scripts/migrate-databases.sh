#!/bin/bash

# Script para executar migrações dos bancos de dados
set -e

echo "🚀 Executando migrações dos bancos de dados..."

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
until pg_isready -h postgres -U postgres > /dev/null 2>&1; do
    echo "   PostgreSQL ainda não está pronto..."
    sleep 2
done
echo "✅ PostgreSQL está pronto!"

# Função para executar migrações em um banco
execute_migrations() {
    local db_name=$1
    local service_name=$2
    local migration_dir=$3
    
    echo ""
    echo "📊 Executando migrações para $db_name ($service_name)..."
    
    # Verificar se o banco existe
    if ! psql -h postgres -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
        echo "   ❌ Banco $db_name não existe. Criando..."
        createdb -h postgres -U postgres "$db_name"
        echo "   ✅ Banco $db_name criado!"
    fi
    
    # Executar migrações em ordem
    if [ -d "$migration_dir" ]; then
        for migration_file in "$migration_dir"/*.sql; do
            if [ -f "$migration_file" ]; then
                echo "   🔄 Executando: $(basename "$migration_file")"
                psql -h postgres -U postgres -d "$db_name" < "$migration_file"
                echo "   ✅ Migração executada: $(basename "$migration_file")"
            fi
        done
    else
        echo "   ⚠️  Diretório de migrações não encontrado: $migration_dir"
    fi
    
    echo "   ✅ Migrações para $db_name concluídas!"
}

# Executar migrações para orders_db
execute_migrations "orders_db" "order-service" "/order-migrations"

# Executar migrações para invoices_db
execute_migrations "invoices_db" "invoice-service" "/invoice-migrations"

echo ""
echo "🎉 Todas as migrações foram executadas com sucesso!"
echo ""
echo "📋 Resumo dos bancos:"
psql -h postgres -U postgres -c "\l" | grep -E "(orders_db|invoices_db)"
