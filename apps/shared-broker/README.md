# @streamflix/shared-broker

Shared message broker architecture for StreamFlix microservices, built following SOLID principles and designed for reusability across all services.

## 🚀 Features

- **🎯 SOLID Principles** - Clean, maintainable, and extensible design
- **🔌 Plug & Play** - Easy integration into any microservice
- **📦 Event-Driven** - Loose coupling between services
- **🛡️ Reliable** - Persistent messages and error handling
- **📊 Observable** - Comprehensive logging and monitoring
- **🧪 Testable** - Mock implementations for unit testing

## 📦 Installation

```bash
# Install in your microservice
pnpm add @streamflix/shared-broker

# Peer dependencies
pnpm add amqplib
pnpm add -D @types/amqplib
```

## 🔧 Quick Start

### 1. Initialize the Broker

```typescript
import { initializeBrokerClient, shutdownBrokerClient } from '@streamflix/shared-broker'

// On application startup
await initializeBrokerClient()

// On application shutdown
process.on('SIGTERM', async () => {
  await shutdownBrokerClient()
  process.exit(0)
})
```

### 2. Publish Events

```typescript
import { getBrokerClient } from '@streamflix/shared-broker'

const brokerClient = getBrokerClient()

// Publish order created event
await brokerClient.publishOrderCreated({
  orderId: 'order-123',
  userId: 'user-456',
  subscriptionPlan: 'premium',
  amount: '19.99',
  currency: 'USD',
  status: 'pending'
})
```

### 3. Environment Configuration

```bash
# .env
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

## 📚 Documentation

For complete documentation, see:

- [Architecture Overview](../../docs/architecture/MESSAGE_BROKER_ARCHITECTURE.md)
- [Getting Started Tutorial](../../docs/architecture/GETTING_STARTED_TUTORIAL.md)
- [Quick Reference](../../docs/architecture/QUICK_REFERENCE.md)

## 🏗️ Architecture

The broker follows a layered architecture with clear separation of concerns:

```
@streamflix/shared-broker
├── interfaces/           # Abstractions
├── implementations/      # RabbitMQ implementations
├── events/              # Event factory and dispatcher
├── config/              # Configuration management
└── broker-client.ts     # Main facade
```

## 🔧 Adding New Event Types

1. **Define the event interface**:

```typescript
export interface UserCreatedEvent extends BaseEvent {
  eventType: 'user.created'
  data: {
    userId: string
    email: string
    plan: string
  }
}
```

2. **Add factory method**:

```typescript
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

3. **Update routing**:

```typescript
case 'user.created':
  return {
    exchange: 'user-events',
    routingKey: 'user.created'
  }
```

4. **Update configuration** for exchanges and queues.

## 🧪 Testing

The broker includes mock implementations for testing:

```typescript
import { MockBrokerClient } from '@streamflix/shared-broker/testing'

const mockBroker = new MockBrokerClient()
// Use in your tests
```

## 🔄 Migration

If migrating from an existing message broker implementation:

1. Install `@streamflix/shared-broker`
2. Replace imports with the shared package
3. Update initialization calls
4. Remove old broker code

## 📈 Performance

- **Connection Pooling**: Single connection shared across application
- **Persistent Messages**: Events survive broker restarts  
- **Efficient Routing**: Direct exchanges for optimal performance
- **Memory Management**: Graceful shutdown and cleanup

## 🛡️ Security

- Environment-based configuration
- Support for TLS/SSL connections
- Event payload can be encrypted at publisher level

## 📊 Monitoring

Built-in logging with emojis for easy identification:

```
🔌 Connecting to RabbitMQ...
📡 Exchange 'order-events' ready
📬 Queue 'order-created' ready  
📤 Published event to exchange 'order-events'
🚀 Dispatched event: order.created (event-id)
```

## 🤝 Contributing

This is a shared package used across all StreamFlix microservices. When making changes:

1. Ensure backward compatibility
2. Update version following semantic versioning
3. Update documentation
4. Test with all consuming services

## 📄 License

MIT License - see LICENSE file for details.
