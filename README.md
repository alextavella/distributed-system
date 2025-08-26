# StreamFlix Microservices

Arquitetura de microserviços para a plataforma StreamFlix usando pnpm workspace, Fastify, Drizzle ORM e Docker.

## 🏗️ Arquitetura

```
streamflix-microservices/
├── apps/                    # Microserviços
│   └── order-service/       # Serviço de pedidos
├── packages/                # Bibliotecas compartilhadas
├── tools/                   # Ferramentas e utilitários
├── scripts/                 # Scripts de desenvolvimento
├── docker-compose.yml       # Infraestrutura Docker
└── pnpm-workspace.yaml     # Configuração do workspace
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

## 📋 Serviços Disponíveis

| Serviço | Porta | Descrição | Status |
|---------|-------|-----------|--------|
| order-service | 3001 | Gerenciamento de pedidos | ✅ Ativo |

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
```

## 🚀 Desenvolvimento

### Opção 1: Desenvolvimento Local

```bash
# Iniciar todos os serviços
pnpm dev

# Iniciar serviço específico
pnpm dev:order

# Build de todos os serviços
pnpm build

# Build de serviço específico
pnpm build:order
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
```

## 🔧 Scripts Disponíveis

### Desenvolvimento
- `pnpm dev` - Iniciar todos os serviços
- `pnpm dev:order` - Iniciar apenas order-service
- `pnpm build` - Build de todos os serviços
- `pnpm start` - Iniciar todos os serviços em produção

### Qualidade de Código
- `pnpm lint` - Executar linting em todos os serviços
- `pnpm lint:fix` - Corrigir problemas de linting
- `pnpm type-check` - Verificar tipos TypeScript
- `pnpm test` - Executar testes

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

### Infraestrutura
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- **PostgreSQL**: localhost:5432

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

```bash
# Executar todos os testes
pnpm test

# Testes em modo watch
pnpm test:watch

# Testes de serviço específico
pnpm --filter order-service test
```

## 📦 Dependências Compartilhadas

As dependências comuns estão no `package.json` raiz:
- TypeScript
- ESLint
- Prettier
- Scripts de desenvolvimento

Cada serviço tem suas dependências específicas no próprio `package.json`.

## 🔧 Configuração de IDE

### VS Code

Recomendado instalar as extensões:
- ESLint
- Prettier
- TypeScript Importer
- Drizzle ORM

### Configurações

O projeto já inclui:
- `.eslintrc.js` - Regras de linting
- `.prettierrc` - Formatação de código
- `tsconfig.base.json` - Config TypeScript base

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

## 📖 Próximos Passos

1. **Adicionar novos serviços**: `pnpm new-service <name>`
2. **Implementar testes**: Adicionar Jest ou Vitest
3. **CI/CD**: Configurar GitHub Actions
4. **Monitoramento**: Adicionar logs e métricas
5. **API Gateway**: Implementar roteamento centralizado
6. **Autenticação**: Adicionar JWT e autorização

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.
