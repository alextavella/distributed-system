# Order Service

Microserviço de gerenciamento de pedidos para a plataforma StreamFlix.

## 🚀 Tecnologias

- **Fastify** - Framework web rápido e eficiente
- **Drizzle ORM** - ORM TypeScript-first moderno
- **PostgreSQL** - Banco de dados relacional
- **TypeScript** - Tipagem estática
- **Docker** - Containerização
- **Zod** - Validação de schemas

## 📋 Funcionalidades

- ✅ CRUD completo de pedidos
- ✅ Relacionamento entre pedidos e itens
- ✅ Validação de dados com Zod
- ✅ Documentação automática com Swagger
- ✅ Health checks
- ✅ Paginação e filtros
- ✅ Containerização com Docker

## 🛠️ Instalação

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env

# Gerar migrações do banco
npm run db:generate

# Executar migrações
npm run db:migrate

# Iniciar em modo desenvolvimento
npm run dev
```

### Docker

```bash
# Subir toda a infraestrutura
docker-compose up -d

# Apenas o order-service
docker-compose up order-service
```

## 📚 API Endpoints

### Health Check

- `GET /health` - Status do serviço

### Orders

- `POST /api/orders` - Criar pedido
- `GET /api/orders` - Listar pedidos (com filtros e paginação)
- `GET /api/orders/:id` - Obter pedido por ID
- `PATCH /api/orders/:id` - Atualizar pedido
- `DELETE /api/orders/:id` - Deletar pedido
- `GET /api/orders/user/:userId` - Obter pedidos por usuário

### Documentação

- `GET /docs` - Swagger UI

## 📊 Schema do Banco

### Orders

- `id` (UUID) - Identificador único
- `userId` (UUID) - ID do usuário
- `subscriptionPlan` (String) - Plano de assinatura
- `amount` (Decimal) - Valor total
- `currency` (String) - Moeda (padrão: USD)
- `status` (Enum) - Status do pedido
- `paymentMethod` (String) - Método de pagamento
- `transactionId` (String) - ID da transação
- `metadata` (Text) - Dados adicionais em JSON
- `createdAt` (Timestamp) - Data de criação
- `updatedAt` (Timestamp) - Data de atualização

### Order Items

- `id` (UUID) - Identificador único
- `orderId` (UUID) - Referência ao pedido
- `itemType` (String) - Tipo do item
- `itemId` (UUID) - ID do item
- `itemName` (String) - Nome do item
- `quantity` (Decimal) - Quantidade
- `unitPrice` (Decimal) - Preço unitário
- `totalPrice` (Decimal) - Preço total
- `createdAt` (Timestamp) - Data de criação

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção
npm run start        # Iniciar aplicação
npm run db:generate  # Gerar migrações
npm run db:migrate   # Executar migrações
npm run db:studio    # Interface visual do banco
```

## 🌐 URLs

- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Swagger Docs**: http://localhost:3001/docs
- **Drizzle Studio**: `npm run db:studio`

## 📝 Exemplo de Uso

### Criar Pedido

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "subscriptionPlan": "premium",
    "amount": "29.99",
    "currency": "USD",
    "paymentMethod": "credit_card",
    "items": [
      {
        "itemType": "subscription",
        "itemId": "123e4567-e89b-12d3-a456-426614174001",
        "itemName": "Premium Monthly",
        "quantity": "1",
        "unitPrice": "29.99"
      }
    ]
  }'
```

## 🐳 Docker

O serviço está configurado para rodar com Docker Compose junto com PostgreSQL e RabbitMQ.

### Variáveis de Ambiente

- `NODE_ENV` - Ambiente (development/production)
- `PORT` - Porta do serviço (padrão: 3001)
- `HOST` - Host do serviço (padrão: 0.0.0.0)
- `DATABASE_URL` - URL de conexão com PostgreSQL
- `RABBITMQ_URL` - URL de conexão com RabbitMQ
