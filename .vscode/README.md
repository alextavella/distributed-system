# 🚀 Debugger Configuration

## 🐛 Como Usar

### Debug Individual
- **🚀 Debug Order Service**: Debug apenas o order-service (porta 3001)
- **🚀 Debug Invoice Service**: Debug apenas o invoice-service (porta 3002)

### Debug de Testes
- **🧪 Debug Order Service Tests**: Debug testes do order-service
- **🧪 Debug Invoice Service Tests**: Debug testes do invoice-service

### Debug Múltiplo
- **🚀 Debug Both Services**: Debug ambos os serviços simultaneamente
- **🧪 Debug All Tests**: Debug todos os testes simultaneamente
- **🚀🧪 Debug Services + Tests**: Debug serviços e testes ao mesmo tempo

## 🎯 Tasks Disponíveis

### 🚀 Iniciar Serviços
- **🚀 Start Order Service**: Inicia o order-service
- **🚀 Start Invoice Service**: Inicia o invoice-service  
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
- **Ctrl+Shift+D**: Abrir painel de debug
- **Ctrl+Shift+P**: Executar tasks

## 🔧 Configurações

- **tsx watch**: Executa com hot reload automático
- **pnpm dev**: Executa o script dev do package.json
- **pnpm test:watch**: Executa testes em modo watch
- **Portas**: Order Service (3001), Invoice Service (3002)
- **Source Maps**: Habilitados para debug de TypeScript
- **Compound Debug**: Debug simultâneo de múltiplos serviços e testes
- **Test Environment**: NODE_ENV=test para testes

## 🚀 Configurações de Debug

### Serviços
- **🚀 Debug Order Service**: Executa `pnpm run dev` no order-service
- **🚀 Debug Invoice Service**: Executa `pnpm run dev` no invoice-service

### Testes
- **🧪 Debug Order Service Tests**: Executa `pnpm run test:watch` no order-service
- **🧪 Debug Invoice Service Tests**: Executa `pnpm run test:watch` no invoice-service

### Configurações Compound
- **🚀 Debug Both Services**: Debug ambos os serviços simultaneamente
- **🧪 Debug All Tests**: Debug todos os testes simultaneamente
- **🚀🧪 Debug Services + Tests**: Debug completo (serviços + testes)

## 🔍 Troubleshooting

### Debugger não inicia
1. Verifique se o serviço está rodando
2. Confirme se as portas estão disponíveis
3. Verifique se o `pnpm` está instalado globalmente

### Breakpoints não funcionam
1. Confirme se os source maps estão habilitados
2. Verifique se está debugando o arquivo correto
3. Reinicie o debugger se necessário

### Testes não param nos breakpoints
1. Verifique se está usando a configuração correta de testes
2. Confirme se o Vitest está configurado para debug
3. Use `--inspect-brk` se necessário
