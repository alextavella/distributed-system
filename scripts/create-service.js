#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Get service name from command line argument
const serviceName = process.argv[2]

if (!serviceName) {
  console.error('❌ Please provide a service name')
  console.log('Usage: pnpm new-service <service-name>')
  process.exit(1)
}

// Validate service name
if (!/^[a-z][a-z0-9-]*$/.test(serviceName)) {
  console.error('❌ Service name must start with a letter and contain only lowercase letters, numbers, and hyphens')
  process.exit(1)
}

const serviceDir = path.join(__dirname, '..', 'apps', serviceName)

console.log(`🚀 Creating new service: ${serviceName}`)

// Check if service already exists
if (fs.existsSync(serviceDir)) {
  console.error(`❌ Service ${serviceName} already exists`)
  process.exit(1)
}

// Create service directory structure
const dirs = [
  'src',
  'src/db',
  'src/routes',
  'src/services',
  'src/types',
  'scripts'
]

dirs.forEach(dir => {
  fs.mkdirSync(path.join(serviceDir, dir), { recursive: true })
})

// Package.json template
const packageJson = {
  name: serviceName,
  version: '1.0.0',
  description: `${serviceName} service for StreamFlix platform`,
  type: 'module',
  main: 'dist/index.js',
  scripts: {
    dev: 'tsx watch src/index.ts',
    build: 'tsup src/index.ts --format esm --dts',
    start: 'node dist/index.js',
    clean: 'rm -rf dist node_modules',
    'db:generate': 'drizzle-kit generate',
    'db:migrate': 'tsx src/db/migrate.ts',
    'db:studio': 'drizzle-kit studio',
    lint: 'eslint src --ext .ts,.tsx',
    'lint:fix': 'eslint src --ext .ts,.tsx --fix',
    'type-check': 'tsc --noEmit',
    test: 'echo "No tests specified" && exit 0',
    'test:watch': 'echo "No tests specified" && exit 0'
  },
  keywords: ['fastify', 'microservice', 'drizzle', serviceName],
  author: '',
  license: 'MIT',
  dependencies: {
    fastify: '^4.24.3',
    '@fastify/cors': '^8.4.0',
    '@fastify/helmet': '^11.1.1',
    '@fastify/swagger': '^8.12.0',
    '@fastify/swagger-ui': '^2.1.0',
    'drizzle-orm': '^0.29.1',
    postgres: '^3.4.3',
    dotenv: '^16.3.1',
    zod: '^3.22.4'
  },
  devDependencies: {
    '@types/node': '^22.0.0',
    'drizzle-kit': '^0.20.6',
    tsx: '^4.6.0',
    tsup: '^8.0.1',
    typescript: '^5.2.2',
    eslint: '^8.54.0',
    '@typescript-eslint/eslint-plugin': '^6.12.0',
    '@typescript-eslint/parser': '^6.12.0'
  }
}

// Write package.json
fs.writeFileSync(
  path.join(serviceDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
)

// TypeScript config
const tsConfig = {
  extends: '../../tsconfig.base.json',
  compilerOptions: {
    outDir: 'dist',
    rootDir: 'src',
    noEmit: false
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist', 'drizzle']
}

fs.writeFileSync(
  path.join(serviceDir, 'tsconfig.json'),
  JSON.stringify(tsConfig, null, 2)
)

// Drizzle config
const drizzleConfig = \`import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config()

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
\`

fs.writeFileSync(path.join(serviceDir, 'drizzle.config.ts'), drizzleConfig)

// Environment files
const envExample = \`NODE_ENV=development
PORT=300X
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/\${serviceName}_db

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@localhost:5672
\`

fs.writeFileSync(path.join(serviceDir, 'env.example'), envExample)
fs.writeFileSync(path.join(serviceDir, '.env'), envExample)

// Basic index.ts
const indexTs = \`import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import dotenv from 'dotenv'
import Fastify from 'fastify'

// Load environment variables
dotenv.config()

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Register plugins
await fastify.register(helmet, {
  contentSecurityPolicy: false,
})

await fastify.register(cors, {
  origin: true,
  credentials: true,
})

// Swagger documentation
await fastify.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: '\${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service API',
      description: 'StreamFlix \${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service',
      version: '1.0.0',
    },
    servers: [
      {
        url: \`http://localhost:\${process.env.PORT || 3000}\`,
        description: 'Development server',
      },
    ],
  },
})

await fastify.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: true,
  transformSpecificationClone: true,
})

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '\${serviceName}',
    version: '1.0.0',
  }
})

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)

  if (error.validation) {
    reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.validation,
    })
    return
  }

  reply.status(500).send({
    success: false,
    error: 'Internal server error',
  })
})

// Start server
const start = async () => {
  try {
    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT || '3000')

    await fastify.listen({ host, port })

    fastify.log.info(\`🚀 \${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service running at http://\${host}:\${port}\`)
    fastify.log.info(
      \`📚 API Documentation available at http://\${host}:\${port}/docs\`,
    )
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
\`

fs.writeFileSync(path.join(serviceDir, 'src', 'index.ts'), indexTs)

// Basic schema
const schemaTs = \`import { pgTable, uuid, timestamp, varchar } from 'drizzle-orm/pg-core'

export const examples = pgTable('examples', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Example = typeof examples.$inferSelect
export type NewExample = typeof examples.$inferInsert
\`

fs.writeFileSync(path.join(serviceDir, 'src', 'db', 'schema.ts'), schemaTs)

// Connection file
const connectionTs = \`import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it's not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })

export type Database = typeof db
\`

fs.writeFileSync(path.join(serviceDir, 'src', 'db', 'connection.ts'), connectionTs)

// Migration file
const migrateTs = \`import dotenv from 'dotenv'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './connection.js'

dotenv.config()

async function main() {
  console.log('Running migrations...')

  await migrate(db, { migrationsFolder: 'drizzle' })

  console.log('Migrations completed!')
  process.exit(0)
}

main().catch(err => {
  console.error('Migration failed!', err)
  process.exit(1)
})
\`

fs.writeFileSync(path.join(serviceDir, 'src', 'db', 'migrate.ts'), migrateTs)

// Dockerfile
const dockerfile = \`# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY drizzle.config.ts ./

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE \${process.env.PORT || 3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:\${process.env.PORT || 3000}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]
\`

fs.writeFileSync(path.join(serviceDir, 'Dockerfile'), dockerfile)

// .dockerignore
const dockerignore = \`node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.example
.nyc_output
coverage
.cache
dist
.DS_Store
*.log
\`

fs.writeFileSync(path.join(serviceDir, '.dockerignore'), dockerignore)

// README.md
const readme = \`# \${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service

Microserviço \${serviceName} para a plataforma StreamFlix.

## 🚀 Tecnologias

- **Fastify** - Framework web rápido e eficiente
- **Drizzle ORM** - ORM TypeScript-first moderno
- **PostgreSQL** - Banco de dados relacional
- **TypeScript** - Tipagem estática
- **Docker** - Containerização
- **Zod** - Validação de schemas

## 🛠️ Instalação

### Desenvolvimento Local

\\\`\\\`\\\`bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp env.example .env

# Gerar migrações do banco
pnpm db:generate

# Executar migrações
pnpm db:migrate

# Iniciar em modo desenvolvimento
pnpm dev
\\\`\\\`\\\`

### Docker

\\\`\\\`\\\`bash
# Build da imagem
docker build -t \${serviceName} .

# Executar container
docker run -p 3000:3000 \${serviceName}
\\\`\\\`\\\`

## 📚 API Endpoints

### Health Check
- \`GET /health\` - Status do serviço

### Documentação
- \`GET /docs\` - Swagger UI

## 🔧 Scripts Disponíveis

\\\`\\\`\\\`bash
pnpm dev          # Desenvolvimento com hot reload
pnpm build        # Build para produção
pnpm start        # Iniciar aplicação
pnpm db:generate  # Gerar migrações
pnpm db:migrate   # Executar migrações
pnpm db:studio    # Interface visual do banco
\\\`\\\`\\\`

## 🌐 URLs

- **API**: http://localhost:\${process.env.PORT || 3000}
- **Health Check**: http://localhost:\${process.env.PORT || 3000}/health
- **Swagger Docs**: http://localhost:\${process.env.PORT || 3000}/docs
\`

fs.writeFileSync(path.join(serviceDir, 'README.md'), readme)

console.log(\`✅ Service \${serviceName} created successfully!\`)
console.log('')
console.log('📁 Structure created:')
console.log(\`   apps/\${serviceName}/\`)
console.log('   ├── src/')
console.log('   │   ├── db/')
console.log('   │   │   ├── schema.ts')
console.log('   │   │   ├── connection.ts')
console.log('   │   │   └── migrate.ts')
console.log('   │   ├── routes/')
console.log('   │   ├── services/')
console.log('   │   ├── types/')
console.log('   │   └── index.ts')
console.log('   ├── scripts/')
console.log('   ├── package.json')
console.log('   ├── tsconfig.json')
console.log('   ├── drizzle.config.ts')
console.log('   ├── Dockerfile')
console.log('   ├── .dockerignore')
console.log('   ├── env.example')
console.log('   ├── .env')
console.log('   └── README.md')
console.log('')
console.log('🚀 Next steps:')
console.log(\`   cd apps/\${serviceName}\`)
console.log('   pnpm install')
console.log('   pnpm db:generate')
console.log('   pnpm db:migrate')
console.log('   pnpm dev')
console.log('')
console.log('💡 Don\\'t forget to:')
console.log('   - Update the port in .env')
console.log('   - Add database configuration to docker-compose.yml')
console.log('   - Customize the schema in src/db/schema.ts')
console.log('   - Add routes in src/routes/')
