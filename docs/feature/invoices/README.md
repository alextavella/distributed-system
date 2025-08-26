# Invoice Service Feature Documentation

## 📋 Overview

The Invoice Service is responsible for processing order creation events and managing the complete invoice lifecycle, from initial receipt to final generation and storage.

## 🎯 Business Requirements

### Core Functionality
- **Event Processing**: Receive `order.created` events from Order Service
- **Invoice Generation**: Create invoices based on order data
- **Status Management**: Track invoice status through lifecycle
- **Data Persistence**: Store invoice data in dedicated PostgreSQL database

### Invoice Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Pending: order.created event received
    Pending --> Processing: Start invoice generation
    Processing --> Generated: Invoice successfully created
    Processing --> Failed: Generation error
    Generated --> Sent: Invoice delivered to customer
    Failed --> Pending: Retry generation
    Sent --> [*]: Process complete
```

## 🏗️ Architecture Design

### Service Architecture
```mermaid
graph TB
    subgraph "Order Service"
        OS[Order Created]
    end
    
    subgraph "Message Broker"
        RMQ[RabbitMQ]
        EX[order-events exchange]
        Q[invoice-queue]
    end
    
    subgraph "Invoice Service"
        EC[Event Consumer]
        IS[Invoice Service]
        IG[Invoice Generator]
        DB[(PostgreSQL - Invoices)]
    end
    
    OS --> RMQ
    RMQ --> EX
    EX --> Q
    Q --> EC
    EC --> IS
    IS --> IG
    IS --> DB
```

### Database Design
```mermaid
erDiagram
    invoices {
        uuid id PK
        uuid order_id UK
        string invoice_number UK
        string status
        decimal amount
        string currency
        json order_data
        timestamp created_at
        timestamp updated_at
        timestamp generated_at
        timestamp sent_at
    }
    
    invoice_items {
        uuid id PK
        uuid invoice_id FK
        string item_type
        string item_id
        string item_name
        integer quantity
        decimal unit_price
        decimal total_price
    }
    
    invoices ||--o{ invoice_items : contains
```

## 📊 Technical Specifications

### Event Processing
- **Source**: `order-events` exchange
- **Routing Key**: `order.created`
- **Queue**: `invoice-queue`
- **Consumer Type**: Durable, auto-ack disabled

### Invoice Status Flow
1. **Pending** - Event received, processing not started
2. **Processing** - Invoice generation in progress
3. **Generated** - Invoice successfully created
4. **Failed** - Generation failed (with retry logic)
5. **Sent** - Invoice delivered to customer

### Database Schema

#### Invoices Table
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    order_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    generated_at TIMESTAMP,
    sent_at TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'generated', 'failed', 'sent'))
);

CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
```

#### Invoice Items Table
```sql
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
```

## 🔄 Event Flow

### 1. Order Created Event
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

### 2. Invoice Processing
1. **Event Reception**: Consumer receives order.created event
2. **Validation**: Validate event data and check for duplicates
3. **Invoice Creation**: Create invoice record with status 'pending'
4. **Item Processing**: Extract and store invoice items
5. **Status Update**: Update status to 'processing'
6. **Generation**: Simulate invoice generation (async process)
7. **Completion**: Update status to 'generated' with timestamp

### 3. Error Handling
- **Duplicate Orders**: Check order_id uniqueness, skip if exists
- **Invalid Data**: Log error, mark invoice as 'failed'
- **Generation Failure**: Retry with exponential backoff
- **Database Errors**: Transaction rollback, event requeue

## 🛠️ Implementation Plan

### Phase 1: Service Structure
- [ ] Create invoice-service directory structure
- [ ] Setup package.json with dependencies
- [ ] Configure TypeScript and build tools
- [ ] Create Dockerfile with multi-stage build

### Phase 2: Database Setup
- [ ] Add PostgreSQL service to docker-compose
- [ ] Create Drizzle schema for invoices
- [ ] Setup database connection and migrations
- [ ] Configure environment variables

### Phase 3: Event Consumer
- [ ] Integrate @streamflix/shared-broker
- [ ] Implement event consumer for order.created
- [ ] Add event validation and error handling
- [ ] Setup message acknowledgment logic

### Phase 4: Invoice Logic
- [ ] Create invoice service with business logic
- [ ] Implement invoice generation simulation
- [ ] Add status management methods
- [ ] Create invoice number generator

### Phase 5: API Endpoints (Optional)
- [ ] GET /invoices - List invoices
- [ ] GET /invoices/:id - Get invoice details
- [ ] GET /invoices/order/:orderId - Get by order
- [ ] GET /health - Health check

### Phase 6: Testing & Integration
- [ ] Unit tests for invoice service
- [ ] Integration tests with message broker
- [ ] End-to-end testing with order service
- [ ] Load testing for event processing

## 📈 Performance Considerations

### Throughput
- **Target**: 1000 invoices/minute
- **Concurrency**: Multiple consumer instances
- **Batch Processing**: Process multiple events together

### Scalability
- **Horizontal**: Multiple service instances
- **Database**: Connection pooling, read replicas
- **Message Broker**: Queue partitioning

### Monitoring
- **Metrics**: Processing time, success rate, queue depth
- **Logging**: Structured logs with correlation IDs
- **Alerts**: Failed invoices, processing delays

## 🔒 Security & Compliance

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Access Control**: Database user with minimal permissions
- **Audit Trail**: All invoice changes logged

### Compliance
- **Data Retention**: Configurable retention policies
- **GDPR**: Personal data handling procedures
- **Financial**: Invoice numbering compliance

## 🚀 Deployment Strategy

### Environment Configuration
```bash
# Database
DATABASE_URL=postgresql://invoices_user:password@postgres-invoices:5432/invoices_db

# Message Broker
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672

# Service Configuration
NODE_ENV=production
PORT=3002
HOST=0.0.0.0

# Invoice Settings
INVOICE_NUMBER_PREFIX=INV
GENERATION_DELAY_MS=5000
```

### Docker Compose Integration
- **Service**: invoice-service on port 3002
- **Database**: postgres-invoices with dedicated volume
- **Dependencies**: rabbitmq, postgres-invoices
- **Health Checks**: Service and database monitoring

## 📋 Success Criteria

### Functional
- [ ] Successfully consumes order.created events
- [ ] Creates invoices with all required data
- [ ] Handles duplicate orders gracefully
- [ ] Simulates invoice generation process
- [ ] Updates invoice status correctly

### Non-Functional
- [ ] Processes 100+ invoices/minute
- [ ] 99.9% event processing success rate
- [ ] < 10 second average processing time
- [ ] Zero data loss during failures
- [ ] Comprehensive error logging

## 📚 Documentation Deliverables

1. **API Documentation** - OpenAPI/Swagger specs
2. **Database Schema** - ERD and migration scripts
3. **Event Schemas** - JSON schema definitions
4. **Deployment Guide** - Step-by-step setup
5. **Monitoring Guide** - Metrics and alerting
6. **Troubleshooting** - Common issues and solutions

### Implementation Guides

- **[01. Automatic Invoice Creation](./01.CREATE_INVOICE.md)** - Complete implementation guide for event-driven invoice creation with RabbitMQ integration

---

*This document will be updated as the implementation progresses.*
