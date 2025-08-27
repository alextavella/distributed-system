# 🚀 Debugger Configuration

## 🐛 Como Usar

### Debug com tsx watch (Recomendado)
- **🐛 Debug Order Service**: Debug o order-service com tsx watch (porta 3001)
- **🧾 Debug Invoice Service**: Debug o invoice-service com tsx watch (porta 3002)

### Debug com pnpm dev
- **🚀 Debug Order Service (npm dev)**: Debug usando o comando `pnpm run dev` (porta 3001)
- **🧾 Debug Invoice Service (npm dev)**: Debug usando o comando `pnpm run dev` (porta 3002)

## 🎯 Tasks Disponíveis

### 🚀 Iniciar Serviços
- **🚀 Start Order Service**: Inicia o order-service
- **🧾 Start Invoice Service**: Inicia o invoice-service  
- **🐳 Start Dependencies**: Inicia dependências (PostgreSQL, RabbitMQ)

### 🧪 Testes
- **🧪 Test Order Service**: Executa testes do order-service
- **🧪 Test Invoice Service**: Executa testes do invoice-service

### 🔍 Validação
- **🔍 Type Check All**: Verifica tipos de todos os serviços

## 💡 Dicas

1. **Breakpoints**: Clique na linha para adicionar breakpoints
2. **Variables**: Use o painel de variáveis para inspecionar valores
3. **Call Stack**: Veja a pilha de chamadas durante o debug
4. **Console**: Use `console.log()` ou o console integrado
5. **Hot Reload**: As configurações com `tsx watch` recarregam automaticamente

## 🎮 Atalhos

- `F5`: Iniciar debug
- `Ctrl+Shift+D`: Abrir painel de debug
- `Ctrl+Shift+P`: Executar tasks

## 🔧 Configurações

- **tsx watch**: Executa com hot reload automático
- **pnpm dev**: Executa o script dev do package.json
- **Portas**: Order Service (3001), Invoice Service (3002)
- **Source Maps**: Habilitados para debug de TypeScript
