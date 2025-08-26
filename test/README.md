# Testing Guide

## 📋 Overview

This directory contains HTTP test files for validating the microservices functionality using REST Client (VS Code extension) or similar tools.

## 🧪 Test Files

### 1. `http/order.http`
Tests for the Order Service functionality:
- Health checks and service status
- Order creation with different scenarios
- Input validation and error handling

### 2. `http/invoice.http`  
Tests for the Invoice Service functionality:
- Health checks and service status
- Invoice listing and filtering
- Invoice retrieval by ID and Order ID
- Status updates
- Manual event processing
- Statistics and monitoring

## 🚀 Testing Sequence

### Prerequisites

1. **Start Services**
   ```bash
   docker compose up -d
   ```

2. **Verify Services are Running**
   ```bash
   curl http://localhost:3001/health  # Order Service
   curl http://localhost:3002/health  # Invoice Service
   ```

### Phase 1: Order Service Testing

Execute requests in `order.http` in the following sequence:

#### 1.1 Health Checks
```http
GET http://localhost:3001/health
GET http://localhost:3001/health/detailed
GET http://localhost:3001/ready
```

**Expected Results:**
- All health checks return `200 OK`
- Detailed health shows database and message broker as "healthy"
- Ready check confirms service initialization

#### 1.2 Order Creation Tests
```http
# Test Case 1: Premium Subscription
POST http://localhost:3001/api/orders
{
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "subscriptionPlan": "premium",
  "amount": "29.99",
  "currency": "USD"
}
```

**Expected Results:**
- Returns `201 Created` with order details
- Order ID is generated (UUID format)
- Status is "pending"
- Event is published to RabbitMQ (check logs)

#### 1.3 Additional Test Cases
Execute remaining test cases in order:
- Basic Subscription (19.99 USD)
- Enterprise with EUR (99.99 EUR)
- Invalid UUID (should return 500 error)
- Large Amount (999.99 USD)

### Phase 2: Invoice Service Testing

Execute requests in `invoice.http` after creating orders:

#### 2.1 Health Checks
```http
GET http://localhost:3002/health
GET http://localhost:3002/health/detailed
GET http://localhost:3002/ready
```

**Expected Results:**
- All health checks return `200 OK`
- Event consumer status shows as "healthy" and "isConsuming: true"

#### 2.2 Verify Automatic Invoice Creation
```http
GET http://localhost:3002/api/invoices/stats
```

**Expected Results:**
- Total count matches number of successful orders created
- All invoices should have "generated" status

#### 2.3 Invoice Retrieval Tests
```http
# List all invoices
GET http://localhost:3002/api/invoices

# Get specific invoice by order ID (use actual order ID from Phase 1)
GET http://localhost:3002/api/invoices/order/{orderId}
```

**Expected Results:**
- Invoice data matches corresponding order data
- Invoice number follows format: `INV-{timestamp}-{random}`
- Order data is stored as JSON string

#### 2.4 Manual Testing
```http
POST http://localhost:3002/api/invoices/test/process-order
{
  "orderId": "550e8400-e29b-41d4-a716-446655440010",
  "userId": "550e8400-e29b-41d4-a716-446655440011",
  "subscriptionPlan": "premium",
  "amount": "49.99",
  "currency": "USD",
  "status": "pending"
}
```

**Expected Results:**
- Returns `200 OK` with processing confirmation
- New invoice is created in database
- Statistics count increases

## 🔍 Validation Checklist

### ✅ Order Service Validation

- [ ] **Health Checks**: All endpoints return healthy status
- [ ] **Order Creation**: Successfully creates orders with valid data
- [ ] **Input Validation**: Rejects invalid UUIDs and malformed data
- [ ] **Event Publishing**: Logs show events published to RabbitMQ
- [ ] **Database Persistence**: Orders are stored in PostgreSQL

### ✅ Invoice Service Validation

- [ ] **Health Checks**: Service and dependencies are healthy
- [ ] **Event Consumption**: Consumer is actively listening
- [ ] **Automatic Processing**: Invoices created automatically from order events
- [ ] **Data Integrity**: Invoice data matches source order data
- [ ] **Duplicate Handling**: Duplicate orders don't create duplicate invoices
- [ ] **API Functionality**: All CRUD operations work correctly

### ✅ Integration Validation

- [ ] **Event Flow**: Order creation triggers invoice creation
- [ ] **Data Consistency**: Order and invoice data are consistent
- [ ] **Error Handling**: Failed orders don't create invoices
- [ ] **Performance**: Processing time < 100ms per event
- [ ] **Reliability**: No message loss during processing

## 📊 Expected Test Results

### Successful Order Creation Response
```json
{
  "success": true,
  "data": {
    "id": "8cf4d717-04cb-4dae-bfd9-43443e15c662",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "subscriptionPlan": "premium",
    "amount": "29.99",
    "currency": "USD",
    "status": "pending",
    "createdAt": "2025-08-26T18:56:32.011Z",
    "updatedAt": "2025-08-26T18:56:32.011Z"
  }
}
```

### Automatic Invoice Creation Result
```json
{
  "success": true,
  "data": {
    "id": "321b6fa0-1b9c-4ff9-899f-89aafe34a241",
    "orderId": "8cf4d717-04cb-4dae-bfd9-43443e15c662",
    "invoiceNumber": "INV-1756234592040-199",
    "status": "generated",
    "amount": "29.99",
    "currency": "USD",
    "orderData": {
      "orderId": "8cf4d717-04cb-4dae-bfd9-43443e15c662",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "subscriptionPlan": "premium",
      "amount": "29.99",
      "currency": "USD",
      "status": "pending"
    },
    "createdAt": "2025-08-26T18:56:32.041Z",
    "generatedAt": "2025-08-26T18:56:32.040Z"
  }
}
```

### Statistics Response
```json
{
  "success": true,
  "data": {
    "total": 3,
    "pending": 0,
    "generated": 3
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Service Not Responding
```bash
# Check if containers are running
docker ps

# Check service logs
docker logs order-service
docker logs invoice-service
```

#### 2. Database Connection Errors
```bash
# Check PostgreSQL containers
docker logs postgres-orders
docker logs postgres-invoices

# Test database connections
curl http://localhost:3001/health/detailed
curl http://localhost:3002/health/detailed
```

#### 3. RabbitMQ Issues
```bash
# Check RabbitMQ container
docker logs rabbitmq

# Check queue status
docker exec rabbitmq rabbitmqctl list_queues
```

#### 4. Events Not Processing
```bash
# Check invoice service consumer logs
docker logs invoice-service --tail 20

# Verify RabbitMQ bindings
docker exec rabbitmq rabbitmqctl list_bindings
```

### Debug Commands

```bash
# Full system status
docker compose ps

# Service logs with timestamps
docker logs --timestamps order-service
docker logs --timestamps invoice-service

# Follow logs in real-time
docker logs -f invoice-service

# Check network connectivity
docker network ls
docker network inspect microservices_default
```

## 📈 Performance Testing

### Load Testing with curl
```bash
# Create multiple orders rapidly
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/orders \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"550e8400-e29b-41d4-a716-44661417400$i\",
      \"subscriptionPlan\": \"premium\",
      \"amount\": \"29.99\",
      \"currency\": \"USD\"
    }"
  sleep 0.1
done

# Check if all invoices were created
curl http://localhost:3002/api/invoices/stats
```

### Expected Performance
- **Order Creation**: < 50ms response time
- **Invoice Processing**: < 100ms from event to database
- **Throughput**: 100+ orders/minute
- **Success Rate**: 99.9% under normal conditions

## 🔧 Test Automation

### Using VS Code REST Client

1. Install "REST Client" extension
2. Open `.http` files
3. Click "Send Request" above each HTTP block
4. View responses in split panel

### Using curl Scripts

Convert HTTP requests to curl commands for automation:

```bash
# Order creation
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"550e8400-e29b-41d4-a716-446655440001","subscriptionPlan":"premium","amount":"29.99","currency":"USD"}'

# Invoice verification
curl http://localhost:3002/api/invoices/stats
```

## 📝 Test Reporting

Document test results using this template:

```markdown
## Test Execution Report

**Date**: YYYY-MM-DD
**Environment**: Development/Staging/Production
**Tester**: [Name]

### Test Results Summary
- ✅ Order Service: X/Y tests passed
- ✅ Invoice Service: X/Y tests passed  
- ✅ Integration: X/Y tests passed

### Issues Found
1. [Description] - [Severity] - [Status]
2. [Description] - [Severity] - [Status]

### Performance Metrics
- Average Order Creation Time: XXms
- Average Invoice Processing Time: XXms
- Success Rate: XX.X%
```

---

*For additional support, check service logs and health endpoints, or refer to the feature documentation in `docs/feature/`.*
