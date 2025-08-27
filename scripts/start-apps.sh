#!/bin/bash

echo "🚀 Starting microservices applications locally..."

echo "✅ Assuming dependencies are running (PostgreSQL + RabbitMQ)"
echo ""

# Run migrations for order-service
echo "🗄️  Running migrations for Order Service..."
cd apps/order-service
npm run db:migrate
cd ../..

# Run migrations for invoice-service
echo ""
echo "🗄️  Running migrations for Invoice Service..."
cd apps/invoice-service
npm run db:migrate
cd ../..

echo ""
echo "✅ All migrations completed!"
echo ""
echo "🚀 Now start the applications in separate terminals:"
echo ""
echo "Terminal 1 - Order Service:"
echo "  cd apps/order-service && pnpm dev"
echo ""
echo "Terminal 2 - Invoice Service:"
echo "  cd apps/invoice-service && pnpm dev"
echo ""
echo "📱 Services will be available at:"
echo "  Order Service: http://localhost:3001"
echo "  Invoice Service: http://localhost:3002"
echo "  RabbitMQ Management: http://localhost:15672 (admin/admin)"
