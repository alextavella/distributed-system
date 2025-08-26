# Invoice Service - Technical Specification

## 🎯 Service Overview

The Invoice Service is an event-driven microservice that processes order creation events and manages invoice generation and lifecycle.

## 📋 Technical Requirements

### Runtime Environment
- **Node.js**: 22+ with ES Modules
- **TypeScript**: 5.9+
- **Package Manager**: pnpm (workspace)
- **Database**: PostgreSQL 15+
- **Message Broker**: RabbitMQ 3.8+

### Dependencies
```json
{
  "dependencies": {
    "@streamflix/shared-broker": "workspace:*",
    "fastify": "^5.5.0",
    "drizzle-orm": "^0.44.5",
    "postgres": "^3.4.7",
    "amqplib": "^0.10.9",
    "zod": "^4.1.3"
  }
}
```

## 🗃️ Database Schema (Drizzle)

### Invoice Schema
```typescript
// src/db/schema.ts
import { pgTable, uuid, varchar, decimal, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().unique(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  orderData: jsonb('order_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  generatedAt: timestamp('generated_at'),
  sentAt: timestamp('sent_at'),
}, (table) => ({
  orderIdIdx: index('idx_invoices_order_id').on(table.orderId),
  statusIdx: index('idx_invoices_status').on(table.status),
  createdAtIdx: index('idx_invoices_created_at').on(table.createdAt),
}))

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  itemType: varchar('item_type', { length: 50 }).notNull(),
  itemId: varchar('item_id', { length: 100 }).notNull(),
  itemName: varchar('item_name', { length: 200 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  invoiceIdIdx: index('idx_invoice_items_invoice_id').on(table.invoiceId),
}))

// Relations
export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}))
```

## 🔄 Event Processing Architecture

### Event Consumer Implementation
```typescript
// src/services/invoice-event-consumer.ts
import { getBrokerClient } from '@streamflix/shared-broker'
import type { OrderCreatedEvent } from '@streamflix/shared-broker'
import { InvoiceService } from './invoice.service.js'

export class InvoiceEventConsumer {
  constructor(private readonly invoiceService: InvoiceService) {}

  async startConsuming(): Promise<void> {
    const brokerClient = getBrokerClient()
    
    // Configure consumer for order.created events
    await brokerClient.subscribe(
      'invoice-queue',
      'order.created',
      this.handleOrderCreated.bind(this),
      {
        autoAck: false,
        prefetch: 10
      }
    )
  }

  private async handleOrderCreated(
    event: OrderCreatedEvent,
    metadata: EventMetadata
  ): Promise<void> {
    try {
      console.log(`📨 Processing order.created event: ${event.eventId}`)
      
      await this.invoiceService.processOrderEvent(event)
      
      // Acknowledge message after successful processing
      await this.acknowledgeMessage(metadata)
      
      console.log(`✅ Successfully processed invoice for order: ${event.data.orderId}`)
    } catch (error) {
      console.error(`❌ Failed to process order event: ${event.eventId}`, error)
      
      // Implement retry logic or dead letter queue
      await this.handleProcessingError(event, metadata, error)
    }
  }
}
```

## 🏗️ Service Layer Architecture

### Invoice Service
```typescript
// src/services/invoice.service.ts
import { db } from '../db/connection.js'
import { invoices, invoiceItems } from '../db/schema.js'
import type { OrderCreatedEvent } from '@streamflix/shared-broker'

export class InvoiceService {
  async processOrderEvent(event: OrderCreatedEvent): Promise<void> {
    const { orderId, userId, amount, currency } = event.data

    // Check if invoice already exists for this order
    const existingInvoice = await this.findByOrderId(orderId)
    if (existingInvoice) {
      console.log(`📋 Invoice already exists for order: ${orderId}`)
      return
    }

    await db.transaction(async (tx) => {
      // Create invoice record
      const [invoice] = await tx.insert(invoices).values({
        orderId,
        invoiceNumber: await this.generateInvoiceNumber(),
        status: 'pending',
        amount,
        currency,
        orderData: event.data,
      }).returning()

      // Extract and create invoice items from order data
      const items = this.extractItemsFromOrderData(event.data)
      if (items.length > 0) {
        await tx.insert(invoiceItems).values(
          items.map(item => ({
            invoiceId: invoice.id,
            ...item
          }))
        )
      }

      // Start async invoice generation
      this.scheduleInvoiceGeneration(invoice.id)
    })
  }

  async generateInvoice(invoiceId: string): Promise<void> {
    try {
      // Update status to processing
      await db.update(invoices)
        .set({ 
          status: 'processing',
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId))

      // Simulate invoice generation process
      await this.simulateInvoiceGeneration()

      // Update status to generated
      await db.update(invoices)
        .set({ 
          status: 'generated',
          generatedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId))

      console.log(`📄 Invoice generated successfully: ${invoiceId}`)
    } catch (error) {
      // Update status to failed
      await db.update(invoices)
        .set({ 
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId))

      throw error
    }
  }

  private async generateInvoiceNumber(): Promise<string> {
    const prefix = process.env.INVOICE_NUMBER_PREFIX || 'INV'
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  private async simulateInvoiceGeneration(): Promise<void> {
    const delay = parseInt(process.env.GENERATION_DELAY_MS || '5000')
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  private scheduleInvoiceGeneration(invoiceId: string): void {
    // Schedule async generation (could use job queue in production)
    setImmediate(() => {
      this.generateInvoice(invoiceId).catch(error => {
        console.error(`Failed to generate invoice ${invoiceId}:`, error)
      })
    })
  }
}
```

## 🌐 API Endpoints

### Health Check
```typescript
// src/routes/health.ts
export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      service: 'invoice-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  })
}
```

### Invoice Management
```typescript
// src/routes/invoices.ts
export async function invoiceRoutes(fastify: FastifyInstance) {
  const invoiceService = new InvoiceService()

  // List invoices with pagination
  fastify.get('/invoices', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          status: { type: 'string', enum: ['pending', 'processing', 'generated', 'failed', 'sent'] }
        }
      }
    }
  }, async (request, reply) => {
    const { page, limit, status } = request.query
    const invoices = await invoiceService.getInvoices({ page, limit, status })
    return { success: true, data: invoices }
  })

  // Get invoice by ID
  fastify.get('/invoices/:id', async (request, reply) => {
    const { id } = request.params
    const invoice = await invoiceService.getInvoiceById(id)
    
    if (!invoice) {
      return reply.status(404).send({ success: false, error: 'Invoice not found' })
    }
    
    return { success: true, data: invoice }
  })

  // Get invoice by order ID
  fastify.get('/invoices/order/:orderId', async (request, reply) => {
    const { orderId } = request.params
    const invoice = await invoiceService.findByOrderId(orderId)
    
    if (!invoice) {
      return reply.status(404).send({ success: false, error: 'Invoice not found' })
    }
    
    return { success: true, data: invoice }
  })
}
```

## 🐳 Docker Configuration

### Dockerfile
```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /workspace

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/shared-broker/ ./apps/shared-broker/
COPY apps/invoice-service/ ./apps/invoice-service/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build shared-broker
WORKDIR /workspace/apps/shared-broker
RUN pnpm run build

# Build invoice-service
WORKDIR /workspace/apps/invoice-service
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy workspace files
COPY --from=builder /workspace/pnpm-workspace.yaml ./
COPY --from=builder /workspace/package.json ./
COPY --from=builder /workspace/apps/shared-broker/package.json ./apps/shared-broker/
COPY --from=builder /workspace/apps/shared-broker/dist ./apps/shared-broker/dist
COPY --from=builder /workspace/apps/invoice-service/package.json ./apps/invoice-service/
COPY --from=builder /workspace/apps/invoice-service/dist ./apps/invoice-service/dist
COPY --from=builder /workspace/apps/invoice-service/drizzle ./apps/invoice-service/drizzle
COPY --from=builder /workspace/apps/invoice-service/drizzle.config.ts ./apps/invoice-service/

# Install production dependencies
WORKDIR /app/apps/invoice-service
RUN pnpm install --no-frozen-lockfile --prod

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]
```

## 📊 Monitoring & Observability

### Metrics to Track
- **Event Processing Rate**: Events processed per minute
- **Processing Latency**: Time from event receipt to completion
- **Success Rate**: Percentage of successful invoice generations
- **Queue Depth**: Number of pending events in queue
- **Database Performance**: Query execution times
- **Error Rate**: Failed processing attempts

### Logging Strategy
```typescript
// Structured logging with correlation IDs
console.log(JSON.stringify({
  level: 'info',
  timestamp: new Date().toISOString(),
  service: 'invoice-service',
  correlationId: event.correlationId,
  eventId: event.eventId,
  orderId: event.data.orderId,
  message: 'Processing order.created event',
  duration: processingTime
}))
```

## 🔒 Security Considerations

### Database Security
- Dedicated database user with minimal privileges
- Connection pooling with secure credentials
- Query parameterization to prevent SQL injection

### Event Processing Security
- Event validation and sanitization
- Idempotency checks to prevent duplicate processing
- Rate limiting for API endpoints

### Environment Variables
```bash
# Database (encrypted in production)
DATABASE_URL=postgresql://invoice_user:secure_password@postgres-invoices:5432/invoices_db

# Message Broker
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672

# Service Configuration
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

# Invoice Configuration
INVOICE_NUMBER_PREFIX=INV
GENERATION_DELAY_MS=5000
MAX_RETRY_ATTEMPTS=3
```

## 🧪 Testing Strategy

### Unit Tests
- Invoice service business logic
- Event processing functions
- Database operations
- Invoice number generation

### Integration Tests
- Event consumer with RabbitMQ
- Database operations with PostgreSQL
- API endpoint responses

### End-to-End Tests
- Complete order-to-invoice flow
- Error handling scenarios
- Performance under load

---

*This specification serves as the technical blueprint for implementing the Invoice Service.*
