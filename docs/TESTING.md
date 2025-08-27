# 🧪 Testing Guide - StreamFlix Microservices

## 📋 Visão Geral

Este guia cobre todos os tipos de testes disponíveis no projeto, incluindo testes unitários, de integração e HTTP.

## 🆕 Melhorias Implementadas

### ✅ **Test Framework**
- **Vitest**: Framework moderno e rápido para testes TypeScript
- **Test Environment**: Configuração otimizada para Node.js
- **Watch Mode**: Desenvolvimento com reload automático
- **Coverage**: Relatórios de cobertura de código

### ✅ **VS Code Integration**
- **Debug de Testes**: Configurações específicas para debug de testes
- **Breakpoints**: Suporte completo a breakpoints durante testes
- **Test Explorer**: Interface visual para execução de testes

### ✅ **Test Types**
- **Unit Tests**: Testes isolados de funções e classes
- **Integration Tests**: Testes de integração entre componentes
- **HTTP Tests**: Testes de API usando REST Client
- **Database Tests**: Testes com banco de dados real

## 🚀 Executando Testes

### Testes Unitários

```bash
# Executar todos os testes
pnpm test

# Testes em modo watch
pnpm test:watch

# Testes de serviço específico
pnpm --filter order-service test
pnpm --filter invoice-service test

# Testes com cobertura
pnpm test:coverage
```

### Testes de Integração

```bash
# Teste básico (recomendado para início)
pnpm run test:integration tests/integration/basic-containers.test.ts

# Todos os testes de integração
pnpm run test:integration

# Modo desenvolvimento (watch)
pnpm run test:integration:watch

# Interface visual
pnpm run test:integration:ui
```

### Testes HTTP (REST Client)

```bash
# Estrutura dos testes
tests/
├── http/
│   ├── order.http      # Testes do Order Service
│   └── invoice.http    # Testes do Invoice Service
```

**Como usar:**
1. Instalar extensão "REST Client" no VS Code
2. Abrir arquivos `.http` em `tests/http/`
3. Clicar em "Send Request" acima de cada bloco HTTP
4. Ver respostas no painel dividido

## 🧪 Estrutura de Testes

### Testes Unitários

```
apps/service-name/
├── src/
│   ├── services/
│   │   ├── my.service.ts
│   │   └── my.service.test.ts      # Testes do serviço
│   ├── repositories/
│   │   ├── my.repository.ts
│   │   └── my.repository.test.ts   # Testes do repositório
│   └── routes/
│       ├── my.routes.ts
│       └── my.routes.test.ts       # Testes das rotas
```

### Exemplo: Teste de Serviço

```typescript
// src/services/order.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrderService } from './order.service'
import { OrderRepository } from '../repositories/order.repository'
import { MessageBroker } from '../interfaces/message-broker.interface'

describe('OrderService', () => {
  let orderService: OrderService
  let mockRepository: vi.Mocked<OrderRepository>
  let mockMessageBroker: vi.Mocked<MessageBroker>

  beforeEach(() => {
    mockRepository = {
      createOrder: vi.fn(),
      getOrderById: vi.fn(),
      getOrders: vi.fn(),
      updateOrderStatus: vi.fn(),
    } as any

    mockMessageBroker = {
      publishOrderCreated: vi.fn(),
    } as any

    orderService = new OrderService(mockRepository, mockMessageBroker)
  })

  describe('createOrder', () => {
    it('should create order and publish event', async () => {
      // Arrange
      const orderData = {
        customerId: 'customer-123',
        amount: 99.99,
        items: [
          { productId: 'product-1', quantity: 2, unitPrice: 49.99 }
        ]
      }

      const createdOrder = {
        id: 'order-123',
        ...orderData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockRepository.createOrder.mockResolvedValue(createdOrder)
      mockMessageBroker.publishOrderCreated.mockResolvedValue()

      // Act
      const result = await orderService.createOrder(orderData)

      // Assert
      expect(mockRepository.createOrder).toHaveBeenCalledWith(orderData)
      expect(mockMessageBroker.publishOrderCreated).toHaveBeenCalledWith({
        orderId: createdOrder.id,
        customerId: createdOrder.customerId,
        amount: createdOrder.amount,
        items: createdOrder.items
      })
      expect(result).toEqual(createdOrder)
    })
  })
})
```

### Exemplo: Teste de Repositório

```typescript
// src/repositories/drizzle-order.repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DrizzleOrderRepository } from './drizzle-order.repository'
import { db } from '../db/connection'
import { orders, orderItems } from '../db/schema'

describe('DrizzleOrderRepository', () => {
  let repository: DrizzleOrderRepository

  beforeEach(() => {
    repository = new DrizzleOrderRepository(db)
  })

  afterEach(async () => {
    // Limpar dados de teste
    await db.delete(orderItems)
    await db.delete(orders)
  })

  describe('createOrder', () => {
    it('should create order with items', async () => {
      // Arrange
      const orderData = {
        customerId: 'customer-123',
        amount: 99.99,
        items: [
          { productId: 'product-1', quantity: 2, unitPrice: 49.99 }
        ]
      }

      // Act
      const result = await repository.createOrder(orderData)

      // Assert
      expect(result.id).toBeDefined()
      expect(result.customerId).toBe(orderData.customerId)
      expect(result.amount).toBe(orderData.amount)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].quantity).toBe(2)
      expect(result.items[0].unitPrice).toBe(49.99)
    })
  })
})
```

## 🐛 Debug de Testes

### VS Code Debugger

O projeto inclui configurações específicas para debug de testes:

#### **Debug Individual:**
- **🧪 Debug Order Service Tests**: Debug testes do order-service
- **🧪 Debug Invoice Service Tests**: Debug testes do invoice-service

#### **Debug Múltiplo:**
- **🧪 Debug All Tests**: Debug todos os testes simultaneamente
- **🚀🧪 Debug Services + Tests**: Debug serviços e testes ao mesmo tempo

### Como Usar:
1. **Breakpoints**: Adicione breakpoints nos arquivos de teste
2. **Debug Configuration**: Selecione a configuração de teste apropriada
3. **F5**: Inicie o debug
4. **Step Through**: Use F10, F11 para navegar pelo código

### Exemplo de Debug:

```typescript
describe('OrderService', () => {
  it('should handle decimal conversion correctly', async () => {
    // Adicione breakpoint aqui
    const orderData = {
      customerId: 'customer-123',
      amount: 99.99, // Breakpoint para inspecionar valor
      items: []
    }

    // Breakpoint para ver resultado da conversão
    const result = await orderService.createOrder(orderData)
    
    // Breakpoint para verificar resultado final
    expect(result.amount).toBe(99.99)
  })
})
```

## 🔧 Configuração de Testes

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

### Test Setup

```typescript
// src/test/setup.ts
import { beforeAll, afterAll } from 'vitest'
import { db } from '../db/connection'

beforeAll(async () => {
  // Configuração global para testes
  process.env.NODE_ENV = 'test'
})

afterAll(async () => {
  // Limpeza global após testes
  await db.disconnect()
})
```

## 📊 Cobertura de Código

### Executar com Cobertura

```bash
# Cobertura completa
pnpm test:coverage

# Cobertura específica
pnpm --filter order-service test:coverage
```

### Relatórios de Cobertura

- **HTML**: `coverage/index.html` - Relatório visual interativo
- **JSON**: `coverage/coverage-summary.json` - Dados para CI/CD
- **Text**: Console output com resumo

### Metas de Cobertura

- **Statements**: 80%+
- **Branches**: 70%+
- **Functions**: 80%+
- **Lines**: 80%+

## 🚀 Testes de Integração

### Configuração

```bash
# Pré-requisitos
docker-compose up -d postgres rabbitmq

# Executar testes
pnpm test:integration
```

### Estrutura

```
tests/
├── integration/
│   ├── basic-containers.test.ts    # Testes básicos de infraestrutura
│   ├── order-flow.test.ts          # Fluxo completo de pedidos
│   ├── invoice-flow.test.ts        # Fluxo completo de faturas
│   └── message-broker.test.ts      # Testes de mensageria
```

### Exemplo de Teste de Integração

```typescript
// tests/integration/order-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { OrderService } from '../../apps/order-service/src/services/order.service'
import { InvoiceService } from '../../apps/invoice-service/src/services/invoice.service'

describe('Order Flow Integration', () => {
  let orderService: OrderService
  let invoiceService: InvoiceService

  beforeAll(async () => {
    // Setup dos serviços
    orderService = new OrderService(/* dependencies */)
    invoiceService = new InvoiceService(/* dependencies */)
  })

  it('should create order and trigger invoice creation', async () => {
    // 1. Criar pedido
    const order = await orderService.createOrder({
      customerId: 'customer-123',
      amount: 99.99,
      items: []
    })

    // 2. Aguardar processamento assíncrono
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 3. Verificar fatura criada
    const invoices = await invoiceService.getInvoicesByOrderId(order.id)
    expect(invoices).toHaveLength(1)
    expect(invoices[0].orderId).toBe(order.id)
    expect(invoices[0].amount).toBe(99.99)
  })
})
```

## 🔍 Troubleshooting

### Problemas Comuns

#### **Testes não executam**
```bash
# Verificar dependências
pnpm install

# Verificar configuração
pnpm --filter service-name test --help
```

#### **Testes falham com banco**
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar variáveis de ambiente
cat apps/service-name/.env
```

#### **Debug não funciona**
1. Verificar configuração do VS Code
2. Confirmar se breakpoints estão ativos
3. Verificar se está usando configuração correta

#### **Cobertura não gera**
```bash
# Verificar se v8 está disponível
node --version

# Forçar geração
pnpm test:coverage --reporter=html
```

## 📚 Recursos Adicionais

### Documentação
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](./CODE_STANDARDS.md#testing)
- [VS Code Debugging](./.vscode/README.md)

### Exemplos
- [Order Service Tests](../../apps/order-service/src/services/order.service.test.ts)
- [Invoice Service Tests](../../apps/invoice-service/src/services/invoice.service.test.ts)
- [HTTP Tests](../../tests/http/)

### Scripts Úteis
```bash
# Limpar cache de testes
pnpm test:clear

# Executar testes específicos
pnpm test -- --grep "createOrder"

# Testes em paralelo
pnpm test -- --threads
```
