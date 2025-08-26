# Message Broker Architecture - Quick Reference

## 🚀 Quick Start

### Basic Setup
```typescript
// 1. Initialize on startup
import { initializeBrokerClient } from './broker'
await initializeBrokerClient()

// 2. Use in your code
import { getBrokerClient } from './broker'
const brokerClient = getBrokerClient()

// 3. Cleanup on shutdown
import { shutdownBrokerClient } from './broker'
await shutdownBrokerClient()
```

### Publish an Event
```typescript
// Simple way (convenience method)
await brokerClient.publishOrderCreated({
  orderId: 'order-123',
  userId: 'user-456',
  subscriptionPlan: 'premium',
  amount: '19.99',
  currency: 'USD',
  status: 'pending'
})

// Advanced way (full control)
const eventFactory = brokerClient.getEventFactory()
const eventDispatcher = brokerClient.getEventDispatcher()

const event = eventFactory.createOrderCreatedEvent(orderData)
await eventDispatcher.dispatch(event)
```

---

## 📁 Directory Structure

```
src/broker/
├── interfaces/
│   ├── message-broker.interface.ts    # Connection & Publisher interfaces
│   └── events.interface.ts            # Event & Factory interfaces
├── implementations/
│   ├── rabbitmq-connection.ts         # RabbitMQ connection manager
│   └── rabbitmq-event-publisher.ts    # RabbitMQ event publisher
├── events/
│   ├── event-factory.ts               # Creates domain events
│   └── event-dispatcher.ts            # Routes events to channels
├── config/
│   └── broker.config.ts               # Centralized configuration
├── broker-client.ts                   # Main facade
└── index.ts                          # Public exports
```

---

## 🔌 Key Interfaces

### `IEventPublisher`
```typescript
interface IEventPublisher {
  publish<T extends Record<string, any>>(
    exchange: string,
    routingKey: string,
    event: T,
    options?: PublishOptions
  ): Promise<void>
}
```

### `IEventFactory`
```typescript
interface IEventFactory {
  createOrderCreatedEvent(orderData: OrderData): OrderCreatedEvent
}
```

### `IEventDispatcher`
```typescript
interface IEventDispatcher {
  dispatch<T extends BaseEvent>(event: T): Promise<void>
}
```

---

## ⚙️ Configuration

### Environment Variables
```bash
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

### Default Config Structure
```typescript
{
  url: process.env.RABBITMQ_URL,
  exchanges: [
    {
      name: 'order-events',
      type: 'direct',
      options: { durable: true }
    }
  ],
  queues: [
    {
      name: 'order-created',
      options: { durable: true },
      bindings: [
        { exchange: 'order-events', routingKey: 'order.created' }
      ]
    }
  ]
}
```

---

## 📝 Event Structure

### Base Event
```typescript
interface BaseEvent {
  eventId: string
  eventType: string
  timestamp: string
  version: string
  correlationId?: string
}
```

### Order Created Event
```typescript
interface OrderCreatedEvent extends BaseEvent {
  eventType: 'order.created'
  data: {
    orderId: string
    userId: string
    subscriptionPlan: string
    amount: string
    currency: string
    status: string
  }
}
```

---

## 🛠️ Adding New Event Types

### 1. Define Interface
```typescript
// In events.interface.ts
export interface UserCreatedEvent extends BaseEvent {
  eventType: 'user.created'
  data: {
    userId: string
    email: string
    plan: string
  }
}
```

### 2. Add Factory Method
```typescript
// In event-factory.ts
createUserCreatedEvent(userData: UserData): UserCreatedEvent {
  return {
    eventId: randomUUID(),
    eventType: 'user.created',
    timestamp: new Date().toISOString(),
    version: this.version,
    data: userData
  }
}
```

### 3. Add Routing
```typescript
// In event-dispatcher.ts
case 'user.created':
  return {
    exchange: 'user-events',
    routingKey: 'user.created'
  }
```

### 4. Update Configuration
```typescript
// In broker.config.ts
exchanges: [
  // existing exchanges...
  {
    name: 'user-events',
    type: 'direct',
    options: { durable: true }
  }
],
queues: [
  // existing queues...
  {
    name: 'user-created',
    options: { durable: true },
    bindings: [
      { exchange: 'user-events', routingKey: 'user.created' }
    ]
  }
]
```

---

## 🎯 SOLID Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Single Responsibility** | Each class has one job: Connection, Publishing, Factory, Dispatch |
| **Open/Closed** | Easy to add new events without modifying existing code |
| **Liskov Substitution** | All implementations can be swapped via interfaces |
| **Interface Segregation** | Focused interfaces: IPublisher, IFactory, IDispatcher |
| **Dependency Inversion** | Depends on abstractions, not concrete implementations |

---

## 🔍 Common Patterns

### Service Integration
```typescript
// In your service class
export class OrderService {
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return await db.transaction(async tx => {
      // 1. Save to database
      const [order] = await tx.insert(orders).values(data).returning()
      
      // 2. Publish event
      try {
        const brokerClient = getBrokerClient()
        await brokerClient.publishOrderCreated({
          orderId: order.id,
          userId: order.userId,
          // ... other data
        })
      } catch (error) {
        console.error('Failed to publish event:', error)
        // Don't throw - avoid rolling back transaction
      }
      
      return order
    })
  }
}
```

### Error Handling
```typescript
try {
  await brokerClient.publishOrderCreated(orderData)
} catch (error) {
  console.error('Event publishing failed:', error)
  // Log for monitoring, don't fail the operation
  // Consider implementing retry logic or dead letter queue
}
```

### Graceful Shutdown
```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  await shutdownBrokerClient()  // Close connections
  await fastify.close()         // Close HTTP server
  process.exit(0)
})
```

---

## 📊 Monitoring & Logging

### Connection Events
```
🔌 Connecting to RabbitMQ...
📡 Exchange 'order-events' ready
📬 Queue 'order-created' ready
🔗 Bound 'order-created' to 'order-events' with key 'order.created'
✅ Connected to RabbitMQ
```

### Publishing Events
```
📤 Published event to exchange 'order-events' with routing key 'order.created'
🚀 Dispatched event: order.created (abc123-def456-ghi789)
```

### Key Metrics to Track
- Connection uptime
- Events published per second
- Failed publication count
- Queue depth/backlog
- Memory usage

---

## 🧪 Testing

### Mock Implementation
```typescript
class MockBrokerClient {
  publishedEvents: any[] = []
  
  async publishOrderCreated(orderData: any) {
    this.publishedEvents.push({
      type: 'order.created',
      data: orderData
    })
  }
}
```

### Unit Test Example
```typescript
test('should publish order created event', async () => {
  const mockBroker = new MockBrokerClient()
  const orderService = new OrderService(mockBroker)
  
  await orderService.createOrder(orderData)
  
  expect(mockBroker.publishedEvents).toHaveLength(1)
  expect(mockBroker.publishedEvents[0].type).toBe('order.created')
})
```

---

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check if RabbitMQ is running
docker compose ps rabbitmq

# Check RabbitMQ logs
docker compose logs rabbitmq

# Restart RabbitMQ
docker compose restart rabbitmq
```

### Event Not Publishing
1. Check broker connection: `brokerClient.isConnected()`
2. Verify exchange/queue configuration
3. Check routing key matches binding
4. Look for error logs in console

### Performance Issues
1. Monitor queue depth in RabbitMQ UI
2. Check memory usage of Node.js process
3. Verify connection pooling is working
4. Consider message batching for high volume

---

## 📚 Related Documentation

- [Full Architecture Documentation](./MESSAGE_BROKER_ARCHITECTURE.md)
- [Getting Started Tutorial](./GETTING_STARTED_TUTORIAL.md)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
