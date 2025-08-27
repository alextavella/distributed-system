# 🚀 Development Guidelines - StreamFlix Microservices

## 📋 Visão Geral

Este guia fornece padrões e exemplos práticos para desenvolver novas features seguindo a arquitetura de microserviços implementada.

## 🏗️ Arquitetura Base

```
microservices/
├── apps/
│   ├── order-service/          # Serviço de pedidos
│   ├── invoice-service/        # Serviço de faturas  
│   └── shared-broker/          # Message broker compartilhado
├── docs/                       # Documentação
└── test/                      # Testes HTTP
```

## 📝 Estrutura de um Serviço

### Anatomia de um Microserviço:
```
apps/my-service/
├── src/
│   ├── types/                 # Schemas Zod e tipos TypeScript
│   │   ├── my-entity.ts       # Tipos da entidade principal
│   │   └── health.ts          # Tipos de health check
│   ├── db/                    # Database layer
│   │   ├── schema.ts          # Schema do Drizzle ORM
│   │   ├── connection.ts      # Conexão com banco
│   │   └── migrate.ts         # Script de migração
│   ├── services/              # Business logic
│   │   └── my-entity.service.ts
│   ├── routes/                # API endpoints
│   │   ├── my-entity.ts       # Rotas da entidade
│   │   └── health.ts          # Health checks
│   └── index.ts               # Entry point
├── drizzle/                   # Migrations (versionadas!)
├── package.json
└── tsconfig.json
```

---

## 🎯 1. Definindo Tipos e Schemas

### Exemplo: `src/types/product.ts`

```typescript
import { z } from 'zod'

// ===== BASE SCHEMAS =====
export const ProductStatusSchema = z.enum([
  'active',
  'inactive', 
  'discontinued'
])

export const ProductSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  price: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.string().length(3),
  status: ProductStatusSchema,
  categoryId: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ===== API SCHEMAS =====
const ProductDto = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.string(),
  currency: z.string(),
  status: ProductStatusSchema,
  categoryId: z.uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// ===== PARAMS SCHEMAS =====
export const ProductIdParams = z.object({
  id: z.uuid(),
})

export const CategoryIdParams = z.object({
  categoryId: z.uuid(),
})

// ===== QUERY SCHEMAS =====
export const ProductsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ProductStatusSchema.optional(),
  categoryId: z.uuid().optional(),
  search: z.string().optional(),
})

// ===== BODY SCHEMAS =====
export const CreateProductBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  price: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.string().length(3).default('USD'),
  categoryId: z.uuid(),
})

export const UpdateProductBody = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  price: z.string().regex(/^\d+\.\d{2}$/).optional(),
  status: ProductStatusSchema.optional(),
})

// ===== RESPONSE SCHEMAS =====
export const ProductResponse = ProductDto

export const ProductsListResponse = z.object({
  products: z.array(ProductDto),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
})

export const ErrorResponse = z.object({
  error: z.string(),
  code: z.string().optional(),
})

// ===== TYPES =====
export type ProductStatus = z.infer<typeof ProductStatusSchema>
export type Product = z.infer<typeof ProductSchema>
```

---

## 🗄️ 2. Database Schema

### Exemplo: `src/db/schema.ts`

```typescript
import { relations } from 'drizzle-orm'
import {
  decimal,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 1000 }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    categoryId: uuid('category_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    statusIdx: index('idx_products_status').on(table.status),
    categoryIdx: index('idx_products_category').on(table.categoryId),
    nameIdx: index('idx_products_name').on(table.name),
  }),
)

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}))

// Types
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Category = typeof categories.$inferSelect
```

---

## ⚙️ 3. Service Layer

### Exemplo: `src/services/product.service.ts`

```typescript
import { eq, ilike, and } from 'drizzle-orm'
import { db } from '../db/connection.js'
import { products, type Product } from '../db/schema.js'

export class ProductService {
  /**
   * Create a new product
   */
  async createProduct(data: {
    name: string
    description?: string | null
    price: string
    currency: string
    categoryId: string
  }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...data,
        status: 'active',
      })
      .returning()

    console.log(`✅ Created product: ${product.id}`)
    return product
  }

  /**
   * Get products with pagination and filtering
   */
  async getProducts(query?: {
    page?: number
    limit?: number
    status?: string
    categoryId?: string
    search?: string
  }): Promise<{
    products: Product[]
    pagination: {
      page: number
      limit: number
      total: number
    }
  }> {
    const page = query?.page || 1
    const limit = query?.limit || 20
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions: any[] = []
    
    if (query?.status) {
      conditions.push(eq(products.status, query.status as any))
    }
    
    if (query?.categoryId) {
      conditions.push(eq(products.categoryId, query.categoryId))
    }
    
    if (query?.search) {
      conditions.push(ilike(products.name, `%${query.search}%`))
    }

    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined

    // Get total count
    const totalProducts = await db
      .select()
      .from(products)
      .where(whereClause)

    // Get paginated results
    const paginatedProducts = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(products.createdAt)
      .limit(limit)
      .offset(offset)

    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: totalProducts.length,
      },
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    })
    return product || null
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string, 
    data: Partial<{
      name: string
      description: string | null
      price: string
      status: string
    }>
  ): Promise<Product | null> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()

    return updatedProduct || null
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: string): Promise<boolean> {
    const [deletedProduct] = await db
      .update(products)
      .set({ 
        status: 'discontinued',
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()

    return !!deletedProduct
  }
}
```

---

## 🛣️ 4. API Routes

### Exemplo: `src/routes/products.ts`

```typescript
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { ProductService } from '../services/product.service.js'
import {
  ProductsQuery,
  ProductsListResponse,
  ProductIdParams,
  ProductResponse,
  CreateProductBody,
  UpdateProductBody,
  ErrorResponse,
} from '../types/product.js'

export async function productRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()
  const productService = new ProductService()

  // Create product
  app.post(
    '/products',
    {
      schema: {
        description: 'Create a new product',
        tags: ['products'],
        summary: 'Create Product',
        body: CreateProductBody,
        response: {
          201: ProductResponse,
          400: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const productData = request.body
        const product = await productService.createProduct(productData)

        return reply.code(201).send({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          currency: product.currency,
          status: product.status as any,
          categoryId: product.categoryId,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        })
      } catch (error) {
        console.error('Error creating product:', error)
        return reply.code(500).send({
          error: 'Failed to create product',
        })
      }
    },
  )

  // List products
  app.get(
    '/products',
    {
      schema: {
        description: 'List products with pagination and filtering',
        tags: ['products'],
        summary: 'List Products',
        querystring: ProductsQuery,
        response: {
          200: ProductsListResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query
        const result = await productService.getProducts(query)

        return reply.code(200).send({
          products: result.products.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            status: product.status as any,
            categoryId: product.categoryId,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString(),
          })),
          pagination: result.pagination,
        })
      } catch (error) {
        console.error('Error listing products:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Get product by ID
  app.get(
    '/products/:id',
    {
      schema: {
        description: 'Get product by ID',
        tags: ['products'],
        summary: 'Get Product by ID',
        params: ProductIdParams,
        response: {
          200: ProductResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const product = await productService.getProductById(id)

        if (!product) {
          return reply.code(404).send({
            error: 'Product not found',
          })
        }

        return reply.code(200).send({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          currency: product.currency,
          status: product.status as any,
          categoryId: product.categoryId,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        })
      } catch (error) {
        console.error('Error getting product:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Update product
  app.patch(
    '/products/:id',
    {
      schema: {
        description: 'Update product',
        tags: ['products'],
        summary: 'Update Product',
        params: ProductIdParams,
        body: UpdateProductBody,
        response: {
          200: ProductResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const updateData = request.body

        const updatedProduct = await productService.updateProduct(id, updateData)

        if (!updatedProduct) {
          return reply.code(404).send({
            error: 'Product not found',
          })
        }

        return reply.code(200).send({
          id: updatedProduct.id,
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          currency: updatedProduct.currency,
          status: updatedProduct.status as any,
          categoryId: updatedProduct.categoryId,
          createdAt: updatedProduct.createdAt.toISOString(),
          updatedAt: updatedProduct.updatedAt.toISOString(),
        })
      } catch (error) {
        console.error('Error updating product:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Delete product
  app.delete(
    '/products/:id',
    {
      schema: {
        description: 'Delete product (soft delete)',
        tags: ['products'],
        summary: 'Delete Product',
        params: ProductIdParams,
        response: {
          204: {},
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const deleted = await productService.deleteProduct(id)

        if (!deleted) {
          return reply.code(404).send({
            error: 'Product not found',
          })
        }

        return reply.code(204).send()
      } catch (error) {
        console.error('Error deleting product:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )
}
```

---

## 📨 5. Message Broker - Event Publishing

### Publicando Eventos:

```typescript
// Em ProductService
import { getBrokerClient } from '@streamflix/shared-broker'

export class ProductService {
  async createProduct(data: CreateProductData): Promise<Product> {
    // 1. Criar produto no banco
    const [product] = await db.insert(products).values(data).returning()

    // 2. Publicar evento
    const brokerClient = getBrokerClient()
    await brokerClient.publishEvent({
      type: 'product.created',
      data: {
        productId: product.id,
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
        createdAt: product.createdAt.toISOString(),
      },
      metadata: {
        source: 'product-service',
        version: '1.0.0',
      },
    })

    console.log(`📤 Published product.created event for: ${product.id}`)
    return product
  }
}
```

---

## 📬 6. Message Broker - Event Consuming

### Exemplo: `src/services/product-event-consumer.ts`

```typescript
import { getBrokerClient } from '@streamflix/shared-broker'
import type { OrderCreatedEvent } from '@streamflix/shared-broker'

class ProductEventConsumer {
  private isConsuming = false

  async start(): Promise<void> {
    if (this.isConsuming) return

    const brokerClient = getBrokerClient()
    
    // Consumir eventos de pedidos criados
    await brokerClient.subscribeToOrderCreated(
      this.handleOrderCreated.bind(this)
    )

    this.isConsuming = true
    console.log('🎧 Product event consumer started')
  }

  async stop(): Promise<void> {
    this.isConsuming = false
    console.log('⏹️ Product event consumer stopped')
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      console.log(`📨 Received order.created event: ${event.data.orderId}`)

      // Processar evento - exemplo: atualizar estoque
      await this.updateProductStock(event.data)
      
      console.log(`✅ Processed order.created event: ${event.data.orderId}`)
    } catch (error) {
      console.error('❌ Error processing order.created event:', error)
      throw error
    }
  }

  private async updateProductStock(orderData: any): Promise<void> {
    // Implementar lógica de atualização de estoque
    console.log('📦 Updating product stock for order:', orderData.orderId)
  }

  getStatus() {
    return { isConsuming: this.isConsuming }
  }
}

export const productEventConsumer = new ProductEventConsumer()
```

### Inicialização no `src/index.ts`:

```typescript
import { productEventConsumer } from './services/product-event-consumer.js'

// Inicializar consumer
await productEventConsumer.start()

// Graceful shutdown
process.on('SIGTERM', async () => {
  await productEventConsumer.stop()
  process.exit(0)
})
```

---

## 🏥 7. Health Checks

### Exemplo: `src/routes/health.ts`

```typescript
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../db/connection.js'
import { productEventConsumer } from '../services/product-event-consumer.js'
import {
  HealthResponse,
  DetailedHealthResponse,
  ReadinessResponse,
} from '../types/health.js'

export async function healthRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Basic health check
  app.get(
    '/health',
    {
      schema: {
        description: 'Basic health check endpoint',
        tags: ['health'],
        summary: 'Basic Health Check',
        response: {
          200: HealthResponse,
        },
      },
    },
    async (_request, reply) => {
      return reply.code(200).send({
        status: 'healthy',
        service: 'product-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      })
    },
  )

  // Detailed health check
  app.get(
    '/health/detailed',
    {
      schema: {
        description: 'Detailed health check including dependencies',
        tags: ['health'],
        summary: 'Detailed Health Check',
        response: {
          200: DetailedHealthResponse,
          503: DetailedHealthResponse,
        },
      },
    },
    async (_request, reply) => {
      const checks = {
        database: await checkDatabase(),
        eventConsumer: checkEventConsumer(),
      }

      const allHealthy = Object.values(checks).every(
        check => check.status === 'healthy',
      )

      return reply.code(allHealthy ? 200 : 503).send({
        status: allHealthy ? 'healthy' : 'unhealthy',
        service: 'product-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dependencies: checks,
      })
    },
  )

  // Readiness check
  app.get(
    '/ready',
    {
      schema: {
        description: 'Readiness check for container orchestration',
        tags: ['health'],
        summary: 'Readiness Check',
        response: {
          200: ReadinessResponse,
          503: ReadinessResponse,
        },
      },
    },
    async (_request, reply) => {
      try {
        const dbCheck = await checkDatabase()

        if (dbCheck.status !== 'healthy') {
          return reply.code(503).send({
            status: 'not ready',
            ready: false,
            error: 'Database connection failed',
          })
        }

        return reply.code(200).send({
          status: 'ready',
          ready: true,
        })
      } catch (error) {
        return reply.code(503).send({
          status: 'not ready',
          ready: false,
          error: 'Service initialization failed',
        })
      }
    },
  )
}

async function checkDatabase(): Promise<{
  status: 'healthy' | 'unhealthy'
  responseTime?: number
}> {
  const startTime = Date.now()
  try {
    await db.execute('SELECT 1')
    const responseTime = Date.now() - startTime
    return { status: 'healthy', responseTime }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Database health check failed:', error)
    return { status: 'unhealthy', responseTime }
  }
}

function checkEventConsumer(): {
  status: 'healthy' | 'unhealthy'
  isConsuming: boolean
} {
  const consumerStatus = productEventConsumer.getStatus()
  return {
    status: consumerStatus.isConsuming ? 'healthy' : 'unhealthy',
    isConsuming: consumerStatus.isConsuming,
  }
}
```

---

## 🧪 8. Testes HTTP

### Exemplo: `test/http/products.http`

```http
### Variables
@baseUrl = http://localhost:3001
@productId = {{create-product.response.body.id}}

### Create Product
# @name create-product
POST {{baseUrl}}/products
Content-Type: application/json

{
  "name": "MacBook Pro",
  "description": "Apple MacBook Pro 16-inch",
  "price": "2499.99",
  "currency": "USD",
  "categoryId": "123e4567-e89b-12d3-a456-426614174000"
}

### List Products
GET {{baseUrl}}/products
  ?page=1
  &limit=10
  &status=active

### Get Product by ID  
GET {{baseUrl}}/products/{{productId}}

### Update Product
PATCH {{baseUrl}}/products/{{productId}}
Content-Type: application/json

{
  "name": "MacBook Pro M3",
  "price": "2699.99"
}

### Delete Product
DELETE {{baseUrl}}/products/{{productId}}

### Health Checks
GET {{baseUrl}}/health

### Detailed Health
GET {{baseUrl}}/health/detailed

### Readiness Check
GET {{baseUrl}}/ready
```

---

## 📋 9. Checklist para Nova Feature

### ✅ **Antes de começar:**
- [ ] Definir entidade e relacionamentos
- [ ] Planejar eventos que serão publicados/consumidos
- [ ] Revisar dependencies necessárias

### ✅ **Implementação:**
- [ ] Criar schemas Zod em `src/types/`
- [ ] Definir schema do banco em `src/db/schema.ts`
- [ ] Gerar e aplicar migrations
- [ ] Implementar service layer
- [ ] Criar rotas com documentação completa
- [ ] Implementar health checks
- [ ] Configurar event publishing/consuming se necessário

### ✅ **Testes:**
- [ ] Criar arquivo `.http` com casos de teste
- [ ] Testar todos os endpoints
- [ ] Validar type-check: `pnpm run type-check`
- [ ] Testar health checks

### ✅ **Documentação:**
- [ ] Documentar API endpoints
- [ ] Atualizar README se necessário
- [ ] Documentar eventos publicados/consumidos

---

## 🚨 Regras Importantes

### ✅ **SEMPRE fazer:**
- Usar schemas Zod para validação
- Implementar paginação em listagens
- Documentar todos os endpoints
- Versionar migrations
- Implementar health checks
- Usar propriedades explícitas (não spread operator)
- Tratar erros adequadamente
- Seguir padrões de nomenclatura

### ❌ **NUNCA fazer:**
- Ignorar validação de tipos
- Usar `any` sem necessidade
- Modificar migrations já aplicadas
- Expor dados sensíveis em logs
- Fazer queries N+1
- Ignorar tratamento de erros

---

## 📚 Referências

- [Fastify Documentation](https://www.fastify.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod Validation](https://zod.dev/)
- [Message Broker Architecture](./architecture/MESSAGE_BROKER_ARCHITECTURE.md)
- [Database Migrations](./architecture/DATABASE_MIGRATIONS.md)
