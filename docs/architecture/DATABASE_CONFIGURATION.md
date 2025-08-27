# Database Configuration

## 🗃️ Overview

Our microservices architecture uses a **single PostgreSQL instance** with **multiple databases** for different services. This approach provides:

- **Resource Efficiency**: Single database server to manage
- **Simplified Operations**: One connection pool and backup strategy
- **Cost Optimization**: Reduced infrastructure overhead
- **Easy Development**: Single database instance for local development

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Instance                      │
│                         Port: 5432                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   orders_db     │    │         invoices_db             │ │
│  │                 │    │                                 │ │
│  │ • orders table  │    │ • invoices table               │ │
│  │ • order_items   │    │ • invoice_items table          │ │
│  │ • migrations    │    │ • migrations                   │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      POSTGRES_DB: postgres          # Default database
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh:ro
```

### Database Initialization

The `init-databases.sh` script creates the required databases on container startup:

```bash
#!/bin/bash
# Create orders database
createdb -U postgres orders_db

# Create invoices database  
createdb -U postgres invoices_db
```

## 📊 Service Database URLs

### Order Service
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/orders_db
```

### Invoice Service
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/invoices_db
```

## 🚀 Local Development

### Starting Dependencies Only
```bash
# Start only PostgreSQL and RabbitMQ
docker compose up -d postgres rabbitmq

# Verify services are running
docker compose ps
```

### Running Applications Locally
```bash
# Terminal 1 - Order Service
cd apps/order-service
npm run dev

# Terminal 2 - Invoice Service  
cd apps/invoice-service
npm run dev
```

### Environment Files
Each service has an `env.local` file for local development:

**Order Service** (`apps/order-service/env.local`):
```bash
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:password@localhost:5432/orders_db
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

**Invoice Service** (`apps/invoice-service/env.local`):
```bash
NODE_ENV=development
PORT=3002
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:password@localhost:5432/invoices_db
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

## 🔄 Migrations

### Running Migrations
```bash
# Order Service migrations
cd apps/order-service
npm run db:migrate

# Invoice Service migrations
cd apps/invoice-service
npm run db:migrate
```

### Migration Files Location
```
apps/
├── order-service/
│   └── drizzle/           # Order service migrations
└── invoice-service/
    └── drizzle/           # Invoice service migrations
```

## 🧪 Testing

### Test Database Configuration
For testing, you can use the same PostgreSQL instance with test databases:

```bash
# Test databases
DATABASE_URL=postgresql://postgres:password@localhost:5432/orders_test_db
DATABASE_URL=postgresql://postgres:password@localhost:5432/invoices_test_db
```

### Running Tests
```bash
# Unit tests (no database required)
npm run test

# Integration tests (requires database)
npm run test:integration
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :5432

# Stop all Docker containers
docker compose down

# Start fresh
docker compose up -d postgres rabbitmq
```

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U postgres -d orders_db
```

#### Migration Errors
```bash
# Reset databases (⚠️ WARNING: This will delete all data)
docker compose down -v
docker compose up -d postgres rabbitmq

# Wait for PostgreSQL to be ready, then run migrations
cd apps/order-service && npm run db:migrate
cd ../invoice-service && npm run db:migrate
```

## 📈 Monitoring

### Health Checks
- **Order Service**: `http://localhost:3001/health/detailed`
- **Invoice Service**: `http://localhost:3002/health/detailed`

### Database Metrics
```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres

# Check database sizes
SELECT datname, pg_size_pretty(pg_database_size(datname)) 
FROM pg_database 
WHERE datname IN ('orders_db', 'invoices_db');

# Check active connections
SELECT datname, count(*) 
FROM pg_stat_activity 
GROUP BY datname;
```

## 🔒 Security Considerations

### Production Environment
- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular security updates
- Database user permissions

### Development Environment
- Default credentials are fine for local development
- Never commit `.env` files with real credentials
- Use `env.local` for local overrides
