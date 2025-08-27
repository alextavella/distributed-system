# Message Broker Architecture Documentation

Welcome to the comprehensive documentation for our microservices message broker architecture. This documentation follows the [Diátaxis framework](https://diataxis.fr/) to provide you with the right information at the right time.

## 📖 Documentation Structure

Our documentation is organized into four types to serve different needs:

### 🎯 **Tutorial** - Learning-oriented
**"I want to learn how to use this"**

- [**Getting Started Tutorial**](./GETTING_STARTED_TUTORIAL.md) - Step-by-step guide to implement the message broker in your service

### 🛠️ **How-to Guides** - Problem-oriented
**"I want to solve a specific problem"**

- [**Quick Reference**](./QUICK_REFERENCE.md) - Fast lookup for common tasks and patterns
- [**Adding New Event Types**](./GETTING_STARTED_TUTORIAL.md#step-4-publish-your-first-event) - Guide to extend the system
- [**Testing Strategies**](./MESSAGE_BROKER_ARCHITECTURE.md#testing-strategy) - How to test your implementation
- [**Troubleshooting**](./QUICK_REFERENCE.md#-troubleshooting) - Common issues and solutions

### 📚 **Reference** - Information-oriented
**"I need to look up specific information"**

- [**API Reference**](./MESSAGE_BROKER_ARCHITECTURE.md#api-reference) - Complete interface documentation
- [**Configuration Options**](./MESSAGE_BROKER_ARCHITECTURE.md#configuration) - All configuration parameters
- [**Event Schema Reference**](./QUICK_REFERENCE.md#-event-structure) - Event type definitions

### 💡 **Explanation** - Understanding-oriented
**"I want to understand the concepts and design decisions"**

- [**Architecture Overview**](./MESSAGE_BROKER_ARCHITECTURE.md) - Complete architectural documentation
- [**Design Principles**](./MESSAGE_BROKER_ARCHITECTURE.md#design-principles) - Why we built it this way
- [**Technical Explanation**](./MESSAGE_BROKER_ARCHITECTURE.md#technical-explanation) - Deep dive into implementation details

---

## 🚀 Quick Start

New to the message broker architecture? Start here:

1. **📖 Read the [Getting Started Tutorial](./GETTING_STARTED_TUTORIAL.md)** (15 minutes)
2. **🔍 Keep the [Quick Reference](./QUICK_REFERENCE.md) handy** for common tasks
3. **📚 Dive deeper with the [Architecture Overview](./MESSAGE_BROKER_ARCHITECTURE.md)** when needed

---

## 🏗️ Architecture at a Glance

> **📋 Note**: For detailed architecture diagrams and complete project structure, see [Project Structure Documentation](./PROJECT_STRUCTURE.md).

## ✨ Key Features

- **🎯 SOLID Principles** - Clean, maintainable, and extensible design
- **🔌 Plug & Play** - Easy integration into any microservice
- **📦 Event-Driven** - Loose coupling between services
- **🛡️ Reliable** - Persistent messages and error handling
- **📊 Observable** - Comprehensive logging and monitoring
- **🧪 Testable** - Mock implementations for unit testing
- **🔒 Type-Safe** - Full TypeScript support with strict typing
- **🔄 Decimal Handling** - Automatic conversion between number/string types
- **🐛 Debug Ready** - VS Code debugger configurations included

## 🔧 Core Components

> **📋 Note**: For detailed component descriptions and responsibilities, see [Architecture Overview](./MESSAGE_BROKER_ARCHITECTURE.md#key-components-responsibilities).

### 🆕 **New Components Implemented:**
- **Repository Pattern** - Clean data access layer with interfaces
- **Message Broker Interface** - Type-safe contracts for event communication
- **Factory Pattern** - Dependency injection for better testability
- **Error Handling** - Standardized HTTP error classes
- **Type Conversion** - Automatic decimal type handling for Drizzle ORM

## 📋 Prerequisites

- **Node.js** 18+ with TypeScript
- **RabbitMQ** server (via Docker or standalone)
- **PostgreSQL** with Drizzle ORM
- **Basic understanding** of microservices and event-driven architecture
- **VS Code** with recommended extensions for optimal development experience

## 🎯 Use Cases

This architecture is perfect for:

- ✅ **Microservice Communication** - Services need to notify each other
- ✅ **Event Sourcing** - Track all changes as events
- ✅ **Async Processing** - Decouple heavy operations from user requests
- ✅ **Integration Events** - Sync data between bounded contexts
- ✅ **Audit Logging** - Track all business events for compliance
- ✅ **Type-Safe Development** - Full TypeScript support with strict validation
- ✅ **Database Integration** - Seamless ORM integration with automatic type conversion

## 📈 Benefits

### For Developers
- **Faster Development** - Pre-built, tested components
- **Consistent Patterns** - Same approach across all services
- **Better Testing** - Mock implementations included
- **Clear Documentation** - Everything you need to know
- **Type Safety** - Compile-time error detection
- **Debug Support** - VS Code debugger ready to use
- **Hot Reload** - Development with automatic reload

### For Architecture
- **Loose Coupling** - Services don't depend on each other directly
- **Scalability** - Easy to scale services independently
- **Resilience** - System works even if some services are down
- **Extensibility** - Add new event types without breaking changes
- **Data Consistency** - Automatic type conversion for database operations
- **Repository Pattern** - Clean separation of concerns

### For Operations
- **Monitoring** - Built-in logging and observability
- **Debugging** - Clear event trails for troubleshooting
- **Performance** - Efficient connection and resource management
- **Reliability** - Persistent messages survive restarts
- **Type Validation** - Runtime type checking with Zod schemas
- **Error Handling** - Standardized error responses

## 🆕 Recent Improvements

### ✅ **Type Safety & Drizzle ORM**
- **Decimal Type Handling**: Automatic conversion between `number` (application) ↔ `string` (Drizzle ORM)
- **Repository Interfaces**: Standardized contracts for data access operations
- **Zod Validation**: Runtime type validation with TypeScript inference

### ✅ **Development Experience**
- **VS Code Debugger**: Complete debugging configurations for individual and compound debugging
- **Hot Reload**: tsx for development with automatic reload
- **Test Framework**: Vitest configured for unit and integration testing
- **Monorepo**: pnpm workspace with shared dependencies

### ✅ **Code Quality**
- **ESLint + Prettier**: Automated code formatting and linting
- **TypeScript Strict**: Rigorous type checking configuration
- **Error Classes**: Consistent error handling patterns
- **Repository Pattern**: Clear separation between business logic and data access

## 🔗 Related Documentation

- [**Development Guidelines**](../DEVELOPMENT_GUIDELINES.md) - Complete development patterns
- [**Testing Guide**](../TESTING.md) - Comprehensive testing strategies
- [**VS Code Debugging**](../.vscode/README.md) - Debugger configuration guide
- [**Database Migrations**](./DATABASE_MIGRATIONS.md) - Database management best practices
