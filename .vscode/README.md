# 🚀 Debugger Configuration

## 🐛 Como Usar

### Debug Individual
- **🚀 Debug Order Service**: Debug apenas o order-service (porta 3001)
- **🧾 Debug Invoice Service**: Debug apenas o invoice-service (porta 3002)

### Debug de Testes
- **🧪 Debug Order Service Tests**: Debug testes do order-service
- **🧪 Debug Invoice Service Tests**: Debug testes do invoice-service

### Debug Múltiplo
- **🚀 Debug Both Services**: Debug ambos os serviços simultaneamente
- **🧪 Debug All Tests**: Debug todos os testes simultaneamente
- **🚀 Debug Services + Tests**: Debug serviços e testes ao mesmo tempo

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
5. **Debug Simultâneo**: Use configurações compound para debug múltiplo
6. **Debug de Testes**: Adicione breakpoints nos testes para inspecionar valores
7. **Watch Mode**: Os testes rodam em modo watch para desenvolvimento

## 🎮 Atalhos

- `F5`: Iniciar debug
- `Ctrl+Shift+D`: Abrir painel de debug
- `Ctrl+Shift+P`: Executar tasks

## 🔧 Configurações

- **tsx watch**: Executa com hot reload automático
- **pnpm dev**: Executa o script dev do package.json
- **pnpm test:watch**: Executa testes em modo watch
- **Portas**: Order Service (3001), Invoice Service (3002)
- **Source Maps**: Habilitados para debug de TypeScript
- **Compound Debug**: Debug simultâneo de múltiplos serviços e testes
- **Test Environment**: NODE_ENV=test para testes
