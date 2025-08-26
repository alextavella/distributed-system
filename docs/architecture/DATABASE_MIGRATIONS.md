# Database Migrations - Boas Práticas

## 📋 Visão Geral

As migrations do Drizzle são **sempre versionadas** no controle de versão (Git) para garantir consistência entre ambientes e desenvolvedores.

## 🔄 Por que versionar migrations?

### ✅ **Benefícios:**
- **Sincronização**: Todos os desenvolvedores têm o mesmo schema
- **Deploy consistente**: Ambientes dev/staging/prod ficam sincronizados  
- **Histórico**: Rastreamento completo de mudanças no schema
- **Rollback**: Possibilidade de reverter mudanças quando necessário
- **Colaboração**: Evita conflitos de schema entre desenvolvedores

### ❌ **Problemas sem versionamento:**
- Schema inconsistente entre ambientes
- Erros difíceis de debugar
- Deploy quebrado por diferenças de schema
- Perda do histórico de mudanças

## 📁 Estrutura das Migrations

```
apps/
├── order-service/
│   └── drizzle/
│       ├── 0000_glossy_gladiator.sql      # Migration inicial
│       ├── 0001_complete_living_tribunal.sql  # Próxima migration
│       └── meta/
│           ├── _journal.json              # Histórico de migrations
│           ├── 0000_snapshot.json         # Snapshot do schema
│           └── 0001_snapshot.json
└── invoice-service/
    └── drizzle/
        ├── 0000_mean_felicia_hardy.sql    # Migration inicial  
        └── meta/
            ├── _journal.json
            └── 0000_snapshot.json
```

## 🚀 Comandos Essenciais

### Gerar nova migration:
```bash
# Order Service
cd apps/order-service
pnpm run db:generate

# Invoice Service  
cd apps/invoice-service
pnpm run db:generate
```

### Executar migrations:
```bash
# Order Service
pnpm run db:migrate:order

# Invoice Service
pnpm run db:migrate:invoice
```

### Visualizar schema:
```bash
# Order Service
pnpm run db:studio:order

# Invoice Service
pnpm run db:studio:invoice
```

## 📝 Workflow de Development

### 1. **Alteração no Schema:**
```typescript
// Modificar schema em src/db/schema.ts
export const orders = pgTable('orders', {
  // ... campos existentes
  newField: varchar('new_field', { length: 100 }), // ← Nova coluna
})
```

### 2. **Gerar Migration:**
```bash
pnpm run db:generate
```

### 3. **Revisar Migration:**
```sql
-- Exemplo: drizzle/0002_new_migration.sql
ALTER TABLE "orders" ADD COLUMN "new_field" varchar(100);
```

### 4. **Testar Localmente:**
```bash
pnpm run db:migrate
```

### 5. **Versionar:**
```bash
git add apps/*/drizzle/
git commit -m "feat(db): adicionar campo new_field na tabela orders"
```

## ⚠️ Regras Importantes

### ✅ **SEMPRE fazer:**
- Versionar todas as migrations e metadados
- Testar migrations localmente antes do commit
- Usar nomes descritivos nos commits de migration
- Revisar o SQL gerado antes de aplicar

### ❌ **NUNCA fazer:**
- Modificar migrations já aplicadas em produção
- Ignorar arquivos de migration no `.gitignore`
- Aplicar migrations diretamente no banco sem usar o Drizzle
- Deletar migrations antigas sem planejamento

## 🔄 Rollback de Migrations

O Drizzle não tem rollback automático. Para reverter:

1. **Criar nova migration** que desfaz as mudanças
2. **Ou restaurar backup** do banco de dados

```bash
# Exemplo de rollback manual
pnpm run db:generate  # Após reverter mudanças no schema
```

## 🌍 Ambientes

### **Development:**
```bash
pnpm run db:migrate:order
pnpm run db:migrate:invoice
```

### **Production:**
```bash
# Executar via CI/CD ou scripts de deploy
docker-compose exec order-service pnpm run db:migrate
docker-compose exec invoice-service pnpm run db:migrate
```

## 🔍 Troubleshooting

### **Erro: Migration já existe**
```bash
# Resolver conflitos no _journal.json
# Regenerar migration se necessário
```

### **Schema fora de sincronia**
```bash
# Resetar banco local (apenas dev!)
pnpm run db:reset
pnpm run db:migrate
```

### **Migration falhou**
```bash
# Verificar logs
# Corrigir schema
# Gerar nova migration corretiva
```

## 📚 Referências

- [Drizzle Migrations](https://orm.drizzle.team/docs/migrations)
- [Database Schema Evolution](https://martinfowler.com/articles/evodb.html)
- [Migration Best Practices](https://flywaydb.org/documentation/concepts/migrations)
