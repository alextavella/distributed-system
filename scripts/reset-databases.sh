#!/bin/bash

# Reset Databases Script
# Simple script to reset all tables in both databases

set -e

# Configuration
CONTAINER_NAME=${CONTAINER_NAME:-"postgres"}
DB_USER=${DB_USER:-"postgres"}
ORDER_DB=${ORDER_DB:-"orders_db"}
INVOICE_DB=${INVOICE_DB:-"invoices_db"}

echo "🔄 Resetting databases..."

# Reset Order Service database
echo "📊 Resetting $ORDER_DB..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$ORDER_DB" -c "
    TRUNCATE TABLE order_items CASCADE;
    TRUNCATE TABLE orders CASCADE;
"

# Reset Invoice Service database
echo "📊 Resetting $INVOICE_DB..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$INVOICE_DB" -c "
    TRUNCATE TABLE invoice_items CASCADE;
    TRUNCATE TABLE invoices CASCADE;
"

echo "✅ Databases reset completed!"
echo ""
echo "📋 Final status:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$ORDER_DB" -c "SELECT 'orders' as table, COUNT(*) as count FROM orders UNION ALL SELECT 'order_items', COUNT(*) FROM order_items;"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$INVOICE_DB" -c "SELECT 'invoices' as table, COUNT(*) as count FROM invoices UNION ALL SELECT 'invoice_items', COUNT(*) FROM invoice_items;"
