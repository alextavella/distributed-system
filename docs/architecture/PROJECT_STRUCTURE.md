# Project Structure - Message Broker Architecture

## 📁 Complete Project Structure

```
microservices/
├── docs/                                    # 📚 Documentation
│   ├── architecture/                       # 🏗️ Architecture documentation
│   │   ├── README.md                       # 📖 Documentation hub (Diátaxis)
│   │   ├── MESSAGE_BROKER_ARCHITECTURE.md  # 💡 Technical explanation
│   │   ├── GETTING_STARTED_TUTORIAL.md     # 🎯 Learning tutorial
│   │   ├── QUICK_REFERENCE.md              # 🛠️ How-to guides & reference
│   │   └── PROJECT_STRUCTURE.md            # 📋 This file
│   ├── features/                           # 🎯 Feature documentation
│   │   └── 01.CREATE_ORDER.md             # Order creation feature
│   └── CHALLENGE.md                        # Original challenge description
│
├── apps/                                   # 🚀 Microservices & Shared Packages
│   ├── shared-broker/                     # 🎭 Shared Message Broker
│   │   ├── src/
│   │   │   ├── interfaces/                # 🔌 Abstractions
│   │   │   │   ├── message-broker.interface.ts
│   │   │   │   └── events.interface.ts
│   │   │   ├── implementations/           # 🛠️ Concrete implementations
│   │   │   │   ├── rabbitmq-connection.ts
│   │   │   │   └── rabbitmq-event-publisher.ts
│   │   │   ├── events/                   # 🎯 Event handling
│   │   │   │   ├── event-factory.ts
│   │   │   │   └── event-dispatcher.ts
│   │   │   ├── config/                   # ⚙️ Configuration
│   │   │   │   └── broker.config.ts
│   │   │   ├── broker-client.ts          # 🎭 Main facade
│   │   │   └── index.ts                  # 📦 Public exports
│   │   ├── dist/                         # 📦 Built package
│   │   ├── package.json                  # 📦 Package definition
│   │   ├── tsconfig.json                 # ⚙️ TypeScript config
│   │   └── README.md                     # 📖 Package documentation
│   │
│   └── order-service/                     # 🛍️ Order management service
│       ├── src/
│       │   ├── db/                       # 🗃️ Database layer
│       │   │   ├── connection.ts
│       │   │   ├── migrate.ts
│       │   │   └── schema.ts
│       │   ├── routes/                   # 🛣️ API routes
│       │   │   └── orders.ts
│       │   ├── services/                 # 🔧 Business logic
│       │   │   └── order.service.ts
│       │   ├── types/                    # 📝 Type definitions
│       │   │   └── order.ts
│       │   └── index.ts                  # 🚪 Application entry point
│       ├── drizzle/                      # 📊 Database migrations
│       ├── package.json                  # 📦 Dependencies (includes @streamflix/shared-broker)
│       ├── tsconfig.json                 # ⚙️ TypeScript config
│       ├── drizzle.config.ts            # 🗃️ Drizzle ORM config
│       ├── Dockerfile                    # 🐳 Container definition (workspace-aware)
│       └── .env.example                  # 🔐 Environment variables
│
├── scripts/                              # 🔧 Development tools
│   ├── create-service.js                # Service generator
│   └── dev-all.sh                       # Start all services
│
├── docker-compose.yml                    # 🐳 Infrastructure setup
├── pnpm-workspace.yaml                  # 📦 Monorepo configuration
├── tsconfig.base.json                   # ⚙️ Base TypeScript config
└── README.md                            # 📖 Project overview
```

## 🎯 Architecture Layers

### 📱 Application Layer
```
apps/order-service/src/
├── index.ts              # Entry point, server setup
├── routes/               # HTTP API endpoints
└── services/             # Business logic
```

### 🎭 Broker Client Layer (Facade)
```
apps/order-service/src/broker/
├── broker-client.ts      # Main facade - single entry point
├── index.ts              # Public exports
```

### 🎯 Domain Layer
```
apps/order-service/src/broker/events/
├── event-factory.ts      # Creates domain events
└── event-dispatcher.ts   # Routes events to channels
```

### 🔌 Interface Layer (Abstractions)
```
apps/order-service/src/broker/interfaces/
├── message-broker.interface.ts  # Connection & Publisher contracts
└── events.interface.ts          # Event & Factory contracts
```

### 🛠️ Implementation Layer (Concrete)
```
apps/order-service/src/broker/implementations/
├── rabbitmq-connection.ts       # RabbitMQ connection manager
└── rabbitmq-event-publisher.ts  # RabbitMQ event publisher
```

### ⚙️ Configuration Layer
```
apps/order-service/src/broker/config/
└── broker.config.ts      # Centralized configuration
```

## 📚 Documentation Structure (Diátaxis Framework)

### 🎯 Tutorial (Learning-oriented)
**"I want to learn how to use this"**
- `GETTING_STARTED_TUTORIAL.md` - Step-by-step implementation guide

### 🛠️ How-to Guides (Problem-oriented)  
**"I want to solve a specific problem"**
- `QUICK_REFERENCE.md` - Common tasks and troubleshooting

### 📚 Reference (Information-oriented)
**"I need to look up specific information"**
- API documentation in `MESSAGE_BROKER_ARCHITECTURE.md`
- Configuration options in `QUICK_REFERENCE.md`

### 💡 Explanation (Understanding-oriented)
**"I want to understand the concepts and design decisions"**
- `MESSAGE_BROKER_ARCHITECTURE.md` - Complete architectural overview
- Design principles and technical explanations

## 🔄 Data Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant BC as BrokerClient
    participant EF as EventFactory
    participant ED as EventDispatcher
    participant REP as RabbitMQPublisher
    participant RMC as RabbitMQConnection
    participant RMQ as RabbitMQ

    App->>BC: publishOrderCreated(data)
    BC->>EF: createOrderCreatedEvent(data)
    EF-->>BC: OrderCreatedEvent
    BC->>ED: dispatch(event)
    ED->>REP: publish(exchange, routingKey, event)
    REP->>RMC: getChannel()
    RMC-->>REP: channel
    REP->>RMQ: publish message
    RMQ-->>REP: ack
    REP-->>ED: success
    ED-->>BC: success
    BC-->>App: success
```

## 🎨 Design Patterns Used

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| **Facade** | `BrokerClient` | Simplified interface to complex subsystem |
| **Factory** | `EventFactory` | Creates objects without specifying exact classes |
| **Strategy** | `RabbitMQEventPublisher` | Encapsulates algorithm (publishing strategy) |
| **Adapter** | `RabbitMQConnection` | Adapts RabbitMQ client to our interface |
| **Command** | `EventDispatcher` | Encapsulates requests as objects |
| **Singleton** | `getBrokerClient()` | Single instance across application |

## 🏗️ SOLID Principles Implementation

### 🎯 Single Responsibility Principle (SRP)
- **RabbitMQConnection**: Only manages connections
- **RabbitMQEventPublisher**: Only publishes events  
- **EventFactory**: Only creates events
- **EventDispatcher**: Only routes events

### 🔓 Open/Closed Principle (OCP)
- Easy to add new event types without modifying existing code
- New broker implementations can be added without changes

### 🔄 Liskov Substitution Principle (LSP)
- All implementations can be substituted through interfaces
- Mock implementations work seamlessly in tests

### 🧩 Interface Segregation Principle (ISP)
- Focused interfaces: `IEventPublisher`, `IEventFactory`, etc.
- Clients depend only on methods they use

### 🔗 Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions
- Dependency injection throughout the architecture

## 🔧 Key Components Responsibilities

### 🎭 BrokerClient (Facade)
```typescript
// Single entry point for all broker operations
const brokerClient = getBrokerClient()
await brokerClient.publishOrderCreated(orderData)
```

**Responsibilities:**
- Orchestrates all messaging components
- Provides simple API for applications
- Manages component lifecycle

### 🏭 EventFactory (Factory Pattern)
```typescript
const event = eventFactory.createOrderCreatedEvent(orderData)
```

**Responsibilities:**
- Creates standardized domain events
- Ensures consistent event structure
- Handles event metadata (ID, timestamp, version)

### 📨 EventDispatcher (Command Pattern)
```typescript
await eventDispatcher.dispatch(event)
```

**Responsibilities:**
- Routes events to appropriate exchanges
- Maps event types to routing configurations
- Handles publishing coordination

### 🔌 RabbitMQConnection (Adapter Pattern)
```typescript
await connection.connect()
const channel = connection.getChannel()
```

**Responsibilities:**
- Manages RabbitMQ connection lifecycle
- Sets up exchanges and queues
- Handles connection errors and recovery

### 📤 RabbitMQEventPublisher (Strategy Pattern)
```typescript
await publisher.publish(exchange, routingKey, event)
```

**Responsibilities:**
- Publishes events to RabbitMQ
- Handles message serialization
- Manages publishing options and headers

## 🚀 Getting Started

1. **For New Services**: Follow the [Getting Started Tutorial](./GETTING_STARTED_TUTORIAL.md)
2. **For Quick Tasks**: Use the [Quick Reference](./QUICK_REFERENCE.md)  
3. **For Deep Understanding**: Read the [Architecture Overview](./MESSAGE_BROKER_ARCHITECTURE.md)

## 📈 Scalability Considerations

### Horizontal Scaling
- Multiple service instances can share the same broker
- Connection pooling handles multiple consumers
- Queue-based load distribution

### Performance Optimization
- Persistent connections reduce overhead
- Channel reuse for publishing efficiency
- Configurable message persistence

### Resource Management
- Graceful shutdown prevents message loss
- Connection heartbeat keeps links alive
- Memory-efficient event serialization

## 🔮 Future Extensions

The architecture is designed for easy extension:

- **New Event Types**: Add to factory and dispatcher
- **New Brokers**: Implement interfaces for Kafka, Redis, etc.
- **Consumer Support**: Add event subscription capabilities
- **Schema Registry**: Validate event schemas
- **Dead Letter Queues**: Handle failed message processing

This structure provides a solid foundation for scalable, maintainable event-driven microservices communication! 🎉
