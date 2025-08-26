# Getting Started with Message Broker Architecture

## Tutorial Overview

This tutorial will guide you through setting up and using the new message broker architecture in your microservice. By the end of this tutorial, you'll be able to:

- ✅ Initialize the broker client in your service
- ✅ Publish events to other services
- ✅ Handle graceful shutdown
- ✅ Configure custom event types

**Estimated time:** 15 minutes  
**Prerequisites:** Node.js, TypeScript, basic understanding of microservices

---

## Step 1: Project Setup

### Add Shared Broker Dependency

The message broker is now available as a shared workspace package:

```bash
# Navigate to your service directory
cd apps/your-service

# Add shared broker to package.json dependencies
{
  "dependencies": {
    "@streamflix/shared-broker": "workspace:*",
    "amqplib": "^0.10.9"
  },
  "devDependencies": {
    "@types/amqplib": "^0.10.7"
  }
}

# Install dependencies
pnpm install
```

### Environment Configuration

Add the RabbitMQ connection URL to your `.env` file:

```bash
# .env
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

---

## Step 2: Import the Shared Broker

No need to copy files! The broker is now a shared workspace package:

```typescript
// Simply import from the shared package
import { 
  initializeBrokerClient,
  shutdownBrokerClient,
  getBrokerClient 
} from '@streamflix/shared-broker'
```

The shared broker is located at:
```
apps/shared-broker/
├── src/
│   ├── interfaces/
│   ├── implementations/
│   ├── events/
│   ├── config/
│   ├── broker-client.ts
│   └── index.ts
├── package.json
└── README.md
```

---

## Step 3: Initialize the Broker in Your Service

### Update your main application file

```typescript
// src/index.ts
import Fastify from 'fastify'
import {
  initializeBrokerClient,
  shutdownBrokerClient,
} from '@streamflix/shared-broker'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Your existing routes and middleware...

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully')
  await shutdownBrokerClient()
  await fastify.close()
})

process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully')
  await shutdownBrokerClient()
  await fastify.close()
})

// Start server
const start = async () => {
  try {
    // 🔥 Initialize broker client FIRST
    await initializeBrokerClient()

    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT || '3002')

    await fastify.listen({ host, port })

    fastify.log.info(`🚀 Your Service running at http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    await shutdownBrokerClient()
    process.exit(1)
  }
}

start()
```

---

## Step 4: Publish Your First Event

### Create a new event type for your service

1. **Update the events interface** (`apps/shared-broker/src/interfaces/events.interface.ts`):

```typescript
// Add your new event interface
export interface UserCreatedEvent extends BaseEvent {
  eventType: 'user.created'
  data: {
    userId: string
    email: string
    plan: string
    createdAt: string
  }
}
```

2. **Update the event factory** (`apps/shared-broker/src/events/event-factory.ts`):

```typescript
import { randomUUID } from 'node:crypto'
import {
  IEventFactory,
  OrderCreatedEvent,
  UserCreatedEvent, // 👈 Add this import
} from '../interfaces/events.interface.js'

export class EventFactory implements IEventFactory {
  private readonly version = '1.0.0'

  // Existing createOrderCreatedEvent method...

  // 🔥 Add your new event factory method
  createUserCreatedEvent(userData: {
    userId: string
    email: string
    plan: string
  }): UserCreatedEvent {
    return {
      eventId: randomUUID(),
      eventType: 'user.created',
      timestamp: new Date().toISOString(),
      version: this.version,
      data: {
        userId: userData.userId,
        email: userData.email,
        plan: userData.plan,
        createdAt: new Date().toISOString(),
      },
    }
  }
}
```

3. **Update the event dispatcher routing** (`apps/shared-broker/src/events/event-dispatcher.ts`):

```typescript
/**
 * Maps event types to their routing configuration
 */
private getEventRouting(event: BaseEvent): {
  exchange: string
  routingKey: string
} {
  switch (event.eventType) {
    case 'order.created':
      return {
        exchange: 'order-events',
        routingKey: 'order.created',
      }
    // 🔥 Add your new event routing
    case 'user.created':
      return {
        exchange: 'user-events',
        routingKey: 'user.created',
      }
    default:
      throw new Error(`Unknown event type: ${event.eventType}`)
  }
}
```

4. **Update the broker configuration** (`apps/shared-broker/src/config/broker.config.ts`):

```typescript
export const defaultBrokerConfig: BrokerConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  exchanges: [
    {
      name: 'order-events',
      type: 'direct',
      options: { durable: true, autoDelete: false },
    },
    // 🔥 Add your service's exchange
    {
      name: 'user-events',
      type: 'direct',
      options: { durable: true, autoDelete: false },
    },
  ],
  queues: [
    {
      name: 'order-created',
      options: { durable: true, exclusive: false, autoDelete: false },
      bindings: [
        { exchange: 'order-events', routingKey: 'order.created' },
      ],
    },
    // 🔥 Add your service's queue
    {
      name: 'user-created',
      options: { durable: true, exclusive: false, autoDelete: false },
      bindings: [
        { exchange: 'user-events', routingKey: 'user.created' },
      ],
    },
  ],
  connectionOptions: {
    heartbeat: 60,
    connectionTimeout: 30000,
  },
}
```

### Use the broker in your service logic

```typescript
// src/services/user.service.ts
import { getBrokerClient } from '@streamflix/shared-broker'
import { db } from '../db/connection.js'
import { users } from '../db/schema.js'

export class UserService {
  async createUser(userData: {
    email: string
    plan: string
  }): Promise<User> {
    return await db.transaction(async tx => {
      // Create user in database
      const [user] = await tx.insert(users).values({
        email: userData.email,
        plan: userData.plan,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      // 🔥 Publish user created event
      try {
        const brokerClient = getBrokerClient()
        const eventFactory = brokerClient.getEventFactory()
        const eventDispatcher = brokerClient.getEventDispatcher()

        const event = eventFactory.createUserCreatedEvent({
          userId: user.id,
          email: user.email,
          plan: user.plan,
        })

        await eventDispatcher.dispatch(event)
      } catch (error) {
        console.error('Failed to publish user created event:', error)
        // Don't throw - we don't want to rollback the transaction
      }

      return user
    })
  }
}
```

---

## Step 5: Test Your Implementation

### Start your services

1. **Start RabbitMQ** (if using Docker Compose):
```bash
docker compose up rabbitmq -d
```

2. **Start your service**:
```bash
cd apps/your-service
pnpm run dev
```

You should see logs like:
```
🔌 Connecting to RabbitMQ...
📡 Exchange 'user-events' ready
📬 Queue 'user-created' ready
🔗 Bound 'user-created' to 'user-events' with key 'user.created'
✅ Connected to RabbitMQ
🚀 Your Service running at http://0.0.0.0:3002
```

### Test event publishing

Create a test route to publish an event:

```typescript
// In your routes file
app.post('/test/user', async (request, reply) => {
  const brokerClient = getBrokerClient()
  const eventFactory = brokerClient.getEventFactory()
  const eventDispatcher = brokerClient.getEventDispatcher()

  const event = eventFactory.createUserCreatedEvent({
    userId: 'test-user-123',
    email: 'test@example.com',
    plan: 'premium',
  })

  await eventDispatcher.dispatch(event)

  return { success: true, eventId: event.eventId }
})
```

Test it with curl:
```bash
curl -X POST http://localhost:3002/test/user \
  -H "Content-Type: application/json"
```

You should see logs:
```
📤 Published event to exchange 'user-events' with routing key 'user.created'
🚀 Dispatched event: user.created (abc123-def456-ghi789)
```

---

## Step 6: Verify in RabbitMQ Management UI

1. Open http://localhost:15672 in your browser
2. Login with `admin` / `admin`
3. Go to **Exchanges** tab - you should see `user-events`
4. Go to **Queues** tab - you should see `user-created` with messages

---

## What You've Learned

✅ **Initialized** the broker client in your service  
✅ **Created** custom event types for your domain  
✅ **Published** events using the event factory and dispatcher  
✅ **Configured** exchanges and queues for your service  
✅ **Tested** the complete event flow  

## Next Steps

Now that you have the basics working, you can:

1. **Add more event types** for your service domain
2. **Implement event consumers** to react to events from other services
3. **Add error handling and retry logic** for failed events
4. **Set up monitoring** for your message broker usage
5. **Write unit tests** using mock implementations

## Common Issues & Solutions

### Issue: "Connection refused"
**Solution:** Make sure RabbitMQ is running:
```bash
docker compose up rabbitmq -d
```

### Issue: "Exchange/Queue not found"
**Solution:** Check your configuration in `broker.config.ts` and restart your service.

### Issue: "Events not being published"
**Solution:** Check the logs for error messages and verify your event routing configuration.

### Issue: TypeScript errors
**Solution:** Make sure you've updated all the interfaces and implementations consistently.

---

## Congratulations! 🎉

You've successfully integrated the message broker architecture into your service. Your service can now communicate with other services through reliable, asynchronous events while maintaining loose coupling and high scalability.
