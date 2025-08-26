# 📐 Code Standards - StreamFlix Microservices

## 🎯 Visão Geral

Padrões de código obrigatórios para manter consistência e qualidade no projeto.

## 📝 Nomenclatura

### **Arquivos e Diretórios:**
```
kebab-case para arquivos:     user-service.ts, order-routes.ts
camelCase para diretórios:    src/services/, src/types/
```

### **Variáveis e Funções:**
```typescript
// ✅ Correto
const userName = 'john'
const getUserById = (id: string) => { }
const API_BASE_URL = 'https://api.example.com'

// ❌ Incorreto  
const user_name = 'john'
const GetUserById = (id: string) => { }
const apiBaseUrl = 'https://api.example.com' // constantes devem ser UPPER_CASE
```

### **Tipos e Interfaces:**
```typescript
// ✅ Correto - PascalCase
type User = { }
interface UserService { }
class ProductService { }

// Schemas - sufixos descritivos
const CreateUserBody = z.object({ })
const UserResponse = z.object({ })
const UsersQuery = z.object({ })
```

## 🏗️ Estrutura de Schemas Zod

### **Padrão Obrigatório:**
```typescript
// 1. Base schemas primeiro
export const StatusSchema = z.enum(['active', 'inactive'])
export const EntitySchema = z.object({ /* ... */ })

// 2. Params schemas
export const EntityIdParams = z.object({
  id: z.string().uuid(),
})

// 3. Query schemas  
export const EntitiesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // outros filtros...
})

// 4. Body schemas
export const CreateEntityBody = z.object({ /* ... */ })
export const UpdateEntityBody = z.object({ /* ... */ })

// 5. Response schemas
export const EntityResponse = EntityDto
export const EntitiesListResponse = z.object({
  entities: z.array(EntityDto),
  pagination: z.object({
    page: z.number(),
    limit: z.number(), 
    total: z.number(),
  }),
})

// 6. Error response
export const ErrorResponse = z.object({
  error: z.string(),
  code: z.string().optional(),
})

// 7. Types no final
export type EntityStatus = z.infer<typeof StatusSchema>
export type Entity = z.infer<typeof EntitySchema>
```

## 🛣️ Padrão de Rotas

### **Estrutura Obrigatória:**
```typescript
export async function entityRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()
  const entityService = new EntityService()

  // SEMPRE usar este padrão:
  app.method(
    '/path',
    {
      schema: {
        description: 'Descrição clara da operação',
        tags: ['entity-name'],
        summary: 'Resumo da operação',
        params: ParamsSchema,      // se necessário
        querystring: QuerySchema, // se necessário  
        body: BodySchema,         // se necessário
        response: {
          200: SuccessSchema,
          404: ErrorResponse,     // se aplicável
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        // Lógica da rota
        return reply.code(200).send(result)
      } catch (error) {
        console.error('Error description:', error)
        return reply.code(500).send({
          error: 'Error message',
        })
      }
    },
  )
}
```

### **Responses - Propriedades Explícitas:**
```typescript
// ✅ Correto - propriedades explícitas
return reply.code(200).send({
  id: entity.id,
  name: entity.name,
  status: entity.status as any, // cast quando necessário
  createdAt: entity.createdAt.toISOString(),
  updatedAt: entity.updatedAt.toISOString(),
})

// ❌ Incorreto - spread operator
return reply.code(200).send({
  ...entity,
  createdAt: entity.createdAt.toISOString(),
})
```

## 💾 Padrão de Services

### **Estrutura de Métodos:**
```typescript
export class EntityService {
  /**
   * Create entity with event publishing
   */
  async createEntity(data: CreateEntityData): Promise<Entity> {
    try {
      // 1. Validar dados se necessário
      // 2. Criar no banco
      const [entity] = await db.insert(entities).values(data).returning()
      
      // 3. Publicar evento se necessário
      await this.publishEntityCreated(entity)
      
      console.log(`✅ Created entity: ${entity.id}`)
      return entity
    } catch (error) {
      console.error('❌ Error creating entity:', error)
      throw error
    }
  }

  /**
   * Get entities with pagination - SEMPRE implementar
   */
  async getEntities(query?: {
    page?: number
    limit?: number
    // filtros específicos...
  }): Promise<{
    entities: Entity[]
    pagination: {
      page: number
      limit: number
      total: number
    }
  }> {
    const page = query?.page || 1
    const limit = query?.limit || 20
    const offset = (page - 1) * limit

    // Implementar paginação e filtros
    // ...
  }

  /**
   * Get by ID - SEMPRE implementar
   */
  async getEntityById(id: string): Promise<Entity | null> {
    const entity = await db.query.entities.findFirst({
      where: eq(entities.id, id),
    })
    return entity || null
  }

  /**
   * Update entity
   */
  async updateEntity(id: string, data: Partial<UpdateEntityData>): Promise<Entity | null> {
    try {
      const [updated] = await db
        .update(entities)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(entities.id, id))
        .returning()

      if (updated) {
        await this.publishEntityUpdated(updated)
        console.log(`✅ Updated entity: ${id}`)
      }

      return updated || null
    } catch (error) {
      console.error(`❌ Error updating entity ${id}:`, error)
      throw error
    }
  }
}
```

## 🗄️ Database Schema Patterns

### **Tabelas - Padrões Obrigatórios:**
```typescript
export const entities = pgTable(
  'entities', // plural
  {
    // SEMPRE incluir estes campos:
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    
    // Campos específicos da entidade
    name: varchar('name', { length: 255 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
  },
  table => ({
    // SEMPRE incluir índices relevantes:
    statusIdx: index('idx_entities_status').on(table.status),
    createdAtIdx: index('idx_entities_created_at').on(table.createdAt),
    // outros índices específicos...
  }),
)
```

### **Relacionamentos:**
```typescript
// SEMPRE definir relations quando aplicável
export const entitiesRelations = relations(entities, ({ one, many }) => ({
  category: one(categories, {
    fields: [entities.categoryId],
    references: [categories.id],
  }),
  items: many(entityItems),
}))
```

## 📨 Event Publishing Patterns

### **Nomenclatura de Eventos:**
```
Formato: {entity}.{action}
Exemplos: user.created, order.updated, product.deleted
```

### **Estrutura de Eventos:**
```typescript
await brokerClient.publishEvent({
  type: 'entity.created', // sempre kebab-case
  data: {
    entityId: entity.id,
    // dados relevantes do evento (não toda a entidade)
    name: entity.name,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
  },
  metadata: {
    source: 'entity-service',
    version: '1.0.0',
    correlationId: request.headers['x-correlation-id'], // se disponível
  },
})
```

## 🧪 Testes HTTP

### **Estrutura de Arquivos .http:**
```http
### Variables - SEMPRE no topo
@baseUrl = http://localhost:3001
@entityId = {{create-entity.response.body.id}}

### Create Entity
# @name create-entity
POST {{baseUrl}}/entities
Content-Type: application/json

{
  "name": "Test Entity",
  "description": "Test description"
}

### List Entities
GET {{baseUrl}}/entities
  ?page=1
  &limit=10
  &status=active

### Get Entity by ID
GET {{baseUrl}}/entities/{{entityId}}

### Update Entity  
PATCH {{baseUrl}}/entities/{{entityId}}
Content-Type: application/json

{
  "name": "Updated Name"
}

### Delete Entity
DELETE {{baseUrl}}/entities/{{entityId}}

### Health Checks - SEMPRE incluir
GET {{baseUrl}}/health
GET {{baseUrl}}/health/detailed
GET {{baseUrl}}/ready
```

## 🚨 Error Handling

### **Padrão de Tratamento:**
```typescript
// ✅ Correto
try {
  const result = await someOperation()
  return reply.code(200).send(result)
} catch (error) {
  console.error('Descriptive error message:', error)
  return reply.code(500).send({
    error: 'User-friendly error message',
  })
}

// Para erros específicos:
if (!entity) {
  return reply.code(404).send({
    error: 'Entity not found',
  })
}

// Para validação:
if (!isValid) {
  return reply.code(400).send({
    error: 'Invalid input data',
    code: 'VALIDATION_ERROR',
  })
}
```

## 📏 Logging Standards

### **Níveis de Log:**
```typescript
// ✅ Sucesso - emoji + descrição
console.log('✅ Created user:', user.id)
console.log('📤 Published event:', event.type)
console.log('🎧 Consumer started')

// ❌ Erro - emoji + contexto
console.error('❌ Error creating user:', error)
console.error('💥 Database connection failed:', error)

// 📝 Info - operações importantes
console.log('📝 Processing order:', orderId)
console.log('🔄 Updating inventory for:', productId)
```

## 🔧 TypeScript Standards

### **Configuração Obrigatória:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### **Uso de Tipos:**
```typescript
// ✅ Correto - tipos explícitos quando necessário
const users: User[] = await getUsers()
const userId: string = request.params.id

// ✅ Type assertions quando necessário
const status = entity.status as EntityStatus

// ❌ Evitar any
const data: any = request.body // ❌
const data = request.body as CreateEntityData // ✅
```

## 📋 Checklist de Code Review

### ✅ **Verificar sempre:**
- [ ] Schemas Zod seguem padrão definido
- [ ] Rotas têm documentação completa
- [ ] Propriedades explícitas (sem spread)
- [ ] Tratamento adequado de erros
- [ ] Logs informativos
- [ ] Paginação implementada
- [ ] Health checks funcionando
- [ ] Type-check passando
- [ ] Migrations versionadas
- [ ] Testes HTTP criados

### ❌ **Red flags:**
- [ ] Uso de `any` sem justificativa
- [ ] Spread operator em responses
- [ ] Falta de tratamento de erro
- [ ] Queries sem paginação
- [ ] Schemas sem validação
- [ ] Logs com dados sensíveis
- [ ] Migrations não versionadas

---

## 🎯 Exemplo Completo

Para referência completa, consulte a implementação em:
- `apps/order-service/` - Exemplo de CRUD completo
- `apps/invoice-service/` - Exemplo com event consumption
- `apps/shared-broker/` - Exemplo de package compartilhado

---

Seguindo estes padrões, garantimos código consistente, manutenível e de alta qualidade em todo o projeto! 🚀
