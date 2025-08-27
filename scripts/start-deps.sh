#!/bin/bash

echo "🐳 Starting dependencies (PostgreSQL + RabbitMQ)..."

# Start only dependencies
docker compose up -d postgres rabbitmq migrations

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Dependencies are running!"
echo "📱 Services available at:"
echo "  PostgreSQL: localhost:5432"
echo "  RabbitMQ: localhost:5672"
echo "  RabbitMQ Management: http://localhost:15672 (admin/admin)"
echo ""
echo "🚀 Now run: ./scripts/start-apps.sh"
