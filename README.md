# StreamFlix Microservices

Arquitetura de microserviços para a plataforma StreamFlix usando pnpm workspace, Fastify, Drizzle ORM e Docker.

## 🏗️ Arquitetura

```
streamflix-microservices/
├── apps/                           # Microserviços
│   ├── order-service/              # Serviço de pedidos
│   ├── invoice-service/            # Serviço de faturas
│   └── shared-broker/              # Message broker compartilhado
├── docs/                           # Documentação
│   ├── architecture/               # Documentação de arquitetura
│   └── feature/                    # Documentação de features
├── tests/                          # Testes HTTP
│   └── http/                       # Arquivos de teste REST
├── scripts/                        # Scripts de desenvolvimento
├── docker-compose.yml              # Infraestrutura Docker
└── pnpm-workspace.yaml            # Configuração do workspace
```

## 🚀 Tecnologias

- **pnpm Workspace** - Gerenciamento de monorepo
- **Fastify** - Framework web rápido
- **Drizzle ORM** - ORM TypeScript-first
- **PostgreSQL** - Banco de dados relacional
- **RabbitMQ** - Message broker
- **Docker** - Containerização
- **TypeScript** - Tipagem estática
- **ESLint + Prettier** - Linting e formatação
- **Vitest** - Framework de testes
- **tsx** - Execução TypeScript em desenvolvimento

## 📋 Serviços e Pacotes

### Microserviços
| Serviço | Porta | Descrição | Status |
|---------|-------|-----------|--------|
| order-service | 3001 | Gerenciamento de pedidos e eventos | ✅ Ativo |
| invoice-service | 3002 | Processamento de faturas via eventos | ✅ Ativo |

### Pacotes Compartilhados
| Pacote | Versão | Descrição | Status |
|--------|--------|-----------|--------|
| @streamflix/shared-broker | 1.0.0 | RabbitMQ client com producer/consumer | ✅ Ativo |

## 📚 Documentação

### 🚀 **Guias de Desenvolvimento**
- [**Development Guidelines**](./docs/DEVELOPMENT_GUIDELINES.md) - Guia completo para criar novas features
- [**Code Standards**](./docs/CODE_STANDARDS.md) - Padrões de código obrigatórios
- [**Testing Guide**](./docs/TESTING.md) - Como executar e trabalhar com testes
- [**Database Migrations**](./docs/architecture/DATABASE_MIGRATIONS.md) - Boas práticas para migrations

### Arquitetura

- **[Message Broker Architecture](./docs/architecture/README.md)** - Documentação completa da arquitetura de message broker
  - [Tutorial](./docs/architecture/GETTING_STARTED_TUTORIAL.md) - Guia passo-a-passo para implementação
  - [Referência Rápida](./docs/architecture/QUICK_REFERENCE.md) - Consulta rápida para tarefas comuns
  - [Documentação Técnica](./docs/architecture/MESSAGE_BROKER_ARCHITECTURE.md) - Visão detalhada da arquitetura

### Features

- **[Order Management](./docs/feature/orders/01.CREATE_ORDER.md)** - Documentação completa da funcionalidade de criação de pedidos
- **[Invoice Processing](./docs/feature/invoices/README.md)** - Documentação do serviço de processamento de faturas
  - [Automatic Invoice Creation](./docs/feature/invoices/01.CREATE_INVOICE.md) - Implementação de criação automática via eventos
  - [Technical Specification](./docs/feature/invoices/TECHNICAL_SPECIFICATION.md) - Especificações técnicas detalhadas

## 🛠️ Instalação

### Pré-requisitos

- Node.js 18+ 
- pnpm 8+
- Docker & Docker Compose

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Verificar versão
pnpm --version
```

### Configuração Inicial

```bash
# Clonar e entrar no projeto
cd microservices

# Instalar dependências de todos os serviços
pnpm install

# Configurar variáveis de ambiente
cp apps/order-service/env.example apps/order-service/.env
cp apps/invoice-service/env.example apps/invoice-service/.env
```

## 🚀 Desenvolvimento

### Opção 1: Desenvolvimento Local

```bash
# Iniciar todos os serviços
pnpm dev

# Iniciar serviços específicos
pnpm dev:order      # Order Service
pnpm dev:invoice    # Invoice Service

# Build de todos os serviços
pnpm build

# Build de serviços específicos
pnpm build:order    # Order Service
pnpm build:invoice  # Invoice Service
```

### Opção 2: Desenvolvimento com Docker

```bash
# Subir toda a infraestrutura
pnpm docker:up

# Ver logs
pnpm docker:logs

# Parar serviços
pnpm docker:down
```

## 🗄️ Banco de Dados

### Comandos Gerais

```bash
# Gerar migrações (todos os serviços)
pnpm db:generate

# Executar migrações (todos os serviços)
pnpm db:migrate

# Abrir Drizzle Studio (todos os serviços)
pnpm db:studio
```

### Comandos Específicos

```bash
# Order Service
pnpm db:generate:order
pnpm db:migrate:order
pnpm db:studio:order

# Invoice Service  
pnpm db:generate:invoice
pnpm db:migrate:invoice
pnpm db:studio:invoice
```

## 🔧 Scripts Disponíveis

### Desenvolvimento
- `pnpm dev` - Iniciar todos os serviços
- `pnpm dev:order` - Iniciar apenas order-service
- `pnpm dev:invoice` - Iniciar apenas invoice-service
- `pnpm build` - Build de todos os serviços
- `pnpm start` - Iniciar todos os serviços em produção

### Qualidade de Código
- `pnpm lint` - Executar linting em todos os serviços
- `pnpm lint:fix` - Corrigir problemas de linting
- `pnpm type-check` - Verificar tipos TypeScript

### Testes
- `pnpm test` - Executar todos os testes
- `pnpm test:watch` - Testes em modo watch
- `pnpm test:ui` - Interface visual dos testes
- `pnpm --filter order-service test` - Testes do order-service
- `pnpm --filter invoice-service test` - Testes do invoice-service

### Docker
- `pnpm docker:build` - Build das imagens
- `pnpm docker:up` - Subir containers
- `pnpm docker:down` - Parar containers
- `pnpm docker:logs` - Ver logs dos containers

### Utilitários
- `pnpm new-service <name>` - Criar novo serviço
- `pnpm clean` - Limpar dependências e builds

## 🆕 Criando Novo Serviço

```bash
# Criar novo serviço automaticamente
pnpm new-service payment-service

# O script criará:
# - Estrutura completa de pastas
# - Configurações TypeScript/ESLint
# - Dockerfile e docker-compose config
# - Schema Drizzle básico
# - API Fastify com Swagger
# - Scripts de desenvolvimento
```

## 🌐 URLs de Desenvolvimento

### Serviços
- **Order Service**: http://localhost:3001
  - API Docs: http://localhost:3001/docs
  - Health: http://localhost:3001/health
- **Invoice Service**: http://localhost:3002
  - API Docs: http://localhost:3002/docs
  - Health: http://localhost:3002/health

### Infraestrutura
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- **PostgreSQL**: localhost:5432
  - Database: `orders_db` (Order Service)
  - Database: `invoices_db` (Invoice Service)

## 🗃️ Configuração do Banco de Dados

Nossa arquitetura usa **uma única instância do PostgreSQL** com **múltiplos databases** para diferentes serviços:

- **PostgreSQL**: localhost:5432
  - Database: `orders_db` (Order Service)
  - Database: `invoices_db` (Invoice Service)

Para mais detalhes sobre configuração, migrações e troubleshooting, veja [Database Configuration](../docs/architecture/DATABASE_CONFIGURATION.md).

## 📚 Estrutura de um Serviço

Cada serviço segue a estrutura padrão:

```
apps/service-name/
├── src/
│   ├── db/
│   │   ├── schema.ts        # Schema Drizzle
│   │   ├── connection.ts    # Conexão DB
│   │   └── migrate.ts       # Migrações
│   ├── routes/              # Rotas da API
│   ├── services/            # Lógica de negócio
│   ├── types/               # Tipos e validações
│   └── index.ts             # Aplicação principal
├── scripts/                 # Scripts específicos
├── package.json             # Dependências
├── tsconfig.json            # Config TypeScript
├── drizzle.config.ts        # Config Drizzle
├── Dockerfile               # Container
└── README.md                # Documentação
```

## 🔍 Comandos Úteis

### Workspace
```bash
# Ver todos os pacotes
pnpm list -r

# Executar comando em serviço específico
pnpm --filter order-service <comando>

# Executar comando em todos os serviços
pnpm --recursive <comando>

# Adicionar dependência a serviço específico
pnpm --filter order-service add fastify
```

### Docker
```bash
# Ver containers ativos
docker ps

# Logs de serviço específico
docker logs order-service

# Acessar container
docker exec -it order-service sh

# Rebuild serviço específico
docker-compose build order-service
```

## 🧪 Testes

### Testes HTTP (REST Client)

O projeto inclui uma suíte completa de testes HTTP usando arquivos `.http`:

```bash
# Estrutura dos testes
tests/
├── README.md           # Guia completo de testes
└── http/
    ├── order.http      # Testes do Order Service
    └── invoice.http    # Testes do Invoice Service
```

**Como usar:**
1. Instalar extensão "REST Client" no VS Code
2. Abrir arquivos `.http` em `tests/http/`
3. Clicar em "Send Request" acima de cada bloco HTTP
4. Ver respostas no painel dividido

**Sequência de teste recomendada:**
1. **Health Checks** → Verificar se serviços estão funcionando
2. **Create Orders** → Executar casos de teste em `order.http`
3. **Verify Invoices** → Validar criação automática em `invoice.http`
4. **Statistics** → Confirmar contadores corretos

### Testes Unitários

```bash
# Executar todos os testes
pnpm test

# Testes em modo watch
pnpm test:watch

# Testes de serviço específico
pnpm --filter order-service test
pnpm --filter invoice-service test
```

## 🐛 Debugging

### VS Code Debugger

O projeto inclui configurações completas de debug para VS Code:

#### **Debug Individual:**
- **🚀 Debug Order Service**: Debug apenas o order-service (porta 3001)
- **🚀 Debug Invoice Service**: Debug apenas o invoice-service (porta 3002)
- **🧪 Debug Order Service Tests**: Debug testes do order-service
- **🧪 Debug Invoice Service Tests**: Debug testes do invoice-service

#### **Debug Múltiplo:**
- **🚀 Debug Both Services**: Debug ambos os serviços simultaneamente
- **🧪 Debug All Tests**: Debug todos os testes simultaneamente
- **🚀🧪 Debug Services + Tests**: Debug serviços e testes ao mesmo tempo

### Como Usar:
1. **Breakpoints**: Clique na linha para adicionar breakpoints
2. **Variables**: Use o painel de variáveis para inspecionar valores
3. **Call Stack**: Veja a pilha de chamadas durante o debug
4. **Console**: Use `console.log()` ou o console integrado
5. **Debug Simultâneo**: Use configurações compound para debug múltiplo

### Atalhos:
- `F5`: Iniciar debug
- **Ctrl+Shift+D**: Abrir painel de debug
- **Selecionar**: Qualquer configuração individual ou compound

## 📦 Dependências Compartilhadas

As dependências comuns estão no `package.json` raiz:
- TypeScript
- ESLint
- Prettier
- @types/node
- Scripts de desenvolvimento

Cada serviço tem suas dependências específicas no próprio `package.json`:
- tsx (para desenvolvimento)
- Vitest (para testes)

## 🔧 Configuração de IDE

### VS Code

Recomendado instalar as extensões:
- ESLint
- Prettier
- TypeScript Importer
- Drizzle ORM
- REST Client

### Configurações

O projeto já inclui:
- `.eslintrc.js` - Regras de linting
- `.prettierrc` - Formatação de código
- `tsconfig.base.json` - Config TypeScript base
- `.vscode/launch.json` - Configurações de debug
- `.vscode/tasks.json` - Tasks do VS Code

## 🚀 Deploy

### Desenvolvimento
```bash
pnpm docker:up
```

### Produção
```bash
# Build das imagens
docker-compose build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testes de Integração

O projeto inclui uma suíte completa de testes de integração que valida o funcionamento dos serviços em cenários reais.

### Executar Testes

```bash
# Teste básico (recomendado para início)
pnpm run test:integration tests/integration/basic-containers.test.ts

# Todos os testes de integração
pnpm run test:integration

# Modo desenvolvimento (watch)
pnpm run test:integration:watch

# Interface visual
pnpm run test:integration:ui

# Script de conveniência
./scripts/test-integration.sh --help
```

### O que é Testado

- ✅ **Infraestrutura**: Containers PostgreSQL e RabbitMQ
- ✅ **APIs**: Criação, busca e atualização de pedidos/faturas  
- ✅ **Persistência**: Dados salvos corretamente no banco
- ✅ **Mensageria**: Eventos publicados e consumidos via RabbitMQ
- ✅ **Integração**: Fluxo completo order-service → invoice-service
- ✅ **Paginação**: Filtros e paginação de resultados
- ✅ **Validação**: Schemas Zod e tipos TypeScript

### Pré-requisitos para Testes

- Docker Desktop rodando
- Node.js 22+ e pnpm 8+
- Dependências instaladas (`pnpm install`)

> 📖 **Documentação completa**: [`docs/TESTING.md`](docs/TESTING.md)

## 📖 Próximos Passos

1. **Adicionar novos serviços**: `pnpm new-service <name>`
2. **Implementar testes unitários**: Adicionar Jest ou Vitest
3. **CI/CD**: Configurar GitHub Actions
4. **Monitoramento**: Adicionar logs e métricas com Prometheus/Grafana
5. **API Gateway**: Implementar roteamento centralizado
6. **Autenticação**: Adicionar JWT e autorização
7. **Event Sourcing**: Implementar audit trail completo
8. **Dead Letter Queue**: Adicionar tratamento de falhas em eventos
9. **Load Balancing**: Configurar múltiplas instâncias dos serviços
10. **Observabilidade**: Adicionar tracing distribuído com Jaeger

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.
