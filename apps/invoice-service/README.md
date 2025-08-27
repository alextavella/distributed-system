# Invoice Service

Event-driven microservice for processing order events and managing invoice lifecycle.

## 🎯 Overview

The Invoice Service is responsible for:
- **Event Processing**: Consuming `order.created` events from Order Service
- **Invoice Generation**: Creating and managing invoices based on order data
- **Status Management**: Tracking invoice status through complete lifecycle
- **Data Persistence**: Storing invoice data in dedicated PostgreSQL database

## 🏗️ Architecture

```
Order Service → RabbitMQ → Invoice Service → PostgreSQL
     ↓              ↓            ↓              ↓
  Creates Order  Publishes   Consumes Event  Stores Invoice
                 Event       & Generates      & Items
```

## 🚀 Features

- **Event-Driven Architecture**: Processes orders asynchronously
- **Invoice Lifecycle Management**: pending → processing → generated → sent
- **Automatic Invoice Generation**: Simulated async invoice creation
- **RESTful API**: Full CRUD operations for invoices
- **Health Monitoring**: Comprehensive health checks
- **Swagger Documentation**: Auto-generated API docs
- **Database Migrations**: Automated schema management
- **Docker Support**: Containerized deployment

## 📊 Database Schema

### Invoices Table
- `id` - UUID primary key
- `order_id` - UUID foreign key to orders (unique)
- `invoice_number` - Unique invoice identifier
- `status` - Current invoice status
- `amount` - Invoice total amount
- `currency` - Currency code
- `order_data` - Original order data (JSON)
- Timestamps: `created_at`, `updated_at`, `generated_at`, `sent_at`

### Invoice Items Table
- `id` - UUID primary key
- `invoice_id` - Foreign key to invoices
- `item_type`, `item_id`, `item_name` - Item details
- `quantity`, `unit_price`, `total_price` - Pricing info

## 🛠️ Development

### Prerequisites
- Node.js 22+
- pnpm 8+
- PostgreSQL 15+
- RabbitMQ 3.8+

### Setup
```bash
# Install dependencies
pnpm install

# Setup environment
cp env.example .env

# Generate database migrations
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Start development server
pnpm run dev
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/invoices_db

# Message Broker
RABBITMQ_URL=amqp://admin:admin@localhost:5672

# Server
NODE_ENV=development
PORT=3002
HOST=0.0.0.0

# Invoice Settings
INVOICE_NUMBER_PREFIX=INV
GENERATION_DELAY_MS=5000
```

## 📡 API Endpoints

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies
- `GET /ready` - Kubernetes readiness probe

### Invoices
- `GET /api/invoices` - List invoices (paginated)
- `GET /api/invoices/:id` - Get invoice by ID
- `GET /api/invoices/order/:orderId` - Get invoice by order ID
- `GET /api/invoices/stats` - Get invoice statistics
- `PATCH /api/invoices/:id/status` - Update invoice status

### Documentation
- `GET /docs` - Swagger UI documentation

## 🔄 Invoice Lifecycle

1. **Event Reception**: Receive `order.created` event from RabbitMQ
2. **Validation**: Validate event data and check for duplicates
3. **Invoice Creation**: Create invoice record with status 'pending'
4. **Item Processing**: Extract and store invoice items
5. **Status Update**: Update status to 'processing'
6. **Generation**: Simulate invoice generation (configurable delay)
7. **Completion**: Update status to 'generated' with timestamp

## 🎧 Event Processing

The service consumes events from:
- **Exchange**: `order-events`
- **Queue**: `order-created` (bound to `order.created` routing key)
- **Consumer**: Auto-ack disabled for reliability

### Event Format
```json
{
  "eventId": "uuid",
  "eventType": "order.created",
  "timestamp": "2025-01-26T10:00:00Z",
  "version": "1.0.0",
  "data": {
    "orderId": "uuid",
    "userId": "uuid", 
    "subscriptionPlan": "premium",
    "amount": "29.99",
    "currency": "USD",
    "status": "pending"
  }
}
```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Start all services
docker compose up -d

# Start only invoice service and dependencies
docker compose up -d invoice-service

# View logs
docker compose logs invoice-service -f
```

### Service Configuration
- **Port**: 3002
- **Database**: postgres (port 5432, database: invoices_db)
- **Dependencies**: RabbitMQ, PostgreSQL
- **Health Checks**: HTTP endpoint monitoring

## 📈 Monitoring

### Metrics to Track
- Event processing rate and latency
- Invoice generation success rate
- Queue depth and processing backlog
- Database query performance
- API response times

### Logging
- Structured JSON logs with correlation IDs
- Event processing lifecycle tracking
- Error logging with context
- Performance metrics

## 🧪 Testing

### Manual Testing
```bash
# Create order in order-service
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","subscriptionPlan":"premium","currency":"USD",...}'

# Check if invoice was created
curl http://localhost:3002/api/invoices/stats

# Get invoice by order ID
curl http://localhost:3002/api/invoices/order/{orderId}
```

### Health Check
```bash
curl http://localhost:3002/health
curl http://localhost:3002/health/detailed
```

## 🔧 Configuration

### Invoice Generation
- **Prefix**: Configurable invoice number prefix
- **Delay**: Simulated generation delay (5 seconds default)
- **Retry**: Failed generation retry logic

### Database
- **Connection Pooling**: Optimized for concurrent operations
- **Migrations**: Automated schema management
- **Indexes**: Optimized for common queries

### Message Broker
- **Durability**: Persistent messages and queues
- **Error Handling**: Dead letter queue support
- **Acknowledgment**: Manual ack for reliability

## 📋 Status Codes

- **pending** - Event received, processing not started
- **processing** - Invoice generation in progress  
- **generated** - Invoice successfully created
- **failed** - Generation failed (retry logic applies)
- **sent** - Invoice delivered to customer

## 🚨 Error Handling

- **Duplicate Orders**: Idempotent processing
- **Invalid Data**: Validation with detailed error messages
- **Database Errors**: Transaction rollback and retry
- **Generation Failures**: Status tracking and retry logic
- **Network Issues**: Graceful degradation

## 📚 Documentation

- **Feature Documentation**: `/docs/feature/invoices/`
- **API Documentation**: Available at `/docs` endpoint
- **Architecture Docs**: Technical specifications and design decisions

## 🔮 Future Enhancements

- **Real Invoice Generation**: PDF creation and storage
- **Email Integration**: Automatic invoice delivery
- **Payment Integration**: Payment status tracking
- **Advanced Retry Logic**: Exponential backoff
- **Consumer Scaling**: Multiple consumer instances
- **Metrics Dashboard**: Real-time monitoring

---

**Version**: 1.0.0  
**Port**: 3002  
**Database**: PostgreSQL (invoices_db)  
**Message Broker**: RabbitMQ
