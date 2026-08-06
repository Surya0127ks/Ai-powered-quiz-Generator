# Architecture — LMS SaaS

## Overview

The LMS SaaS platform follows **Clean Architecture** (also known as Onion Architecture), ensuring separation of concerns, testability, and maintainability.

## Clean Architecture Layers

### 1. Domain Layer (`LMS.Domain`)

The innermost layer containing enterprise business rules. It has **no external dependencies**.

**Contents:**

- **Entities**: Aggregate roots and entities (e.g., `BaseEntity`, `AuditableEntity`)
- **Enums**: Domain enumerations (e.g., `UserRole`)
- **Exceptions**: Domain-specific exceptions (e.g., `DomainException`, `NotFoundException`)
- **Interfaces**: Repository and Unit of Work contracts
- **Common**: Base classes and domain event abstractions

**Rules:**

- No NuGet packages (pure C#)
- No EF Core dependencies
- No external framework references

### 2. Application Layer (`LMS.Application`)

Contains use cases and application business rules. Implements **CQRS** using MediatR.

**Contents:**

- **CQRS**: Commands and Queries (MediatR handlers)
- **Behaviors**: Cross-cutting concerns (validation, logging, performance)
- **Mappings**: AutoMapper profiles
- **Common**: Application models (`Result`, `PagedResult`), interfaces (`IApplicationDbContext`, `ICurrentUserService`)
- **DependencyInjection**: Service registration extension methods

**Rules:**

- Depends only on Domain
- No direct database access (uses interfaces)
- No HTTP concerns

### 3. Infrastructure Layer (`LMS.Infrastructure`)

Implements external concerns: database access, file storage, external services.

**Contents:**

- **Persistence**: `ApplicationDbContext`, EF Core configurations, repository implementations
- **Services**: `CurrentUserService`, external service integrations
- **DependencyInjection**: Service registration for infrastructure

**Rules:**

- Depends on Application (and transitively Domain)
- Contains EF Core and PostgreSQL provider
- Implements interfaces defined in Application/Domain

### 4. API Layer (`LMS.Api`)

The presentation layer. ASP.NET Core 9 Web API.

**Contents:**

- **Controllers**: API endpoints
- **Middleware**: Global exception handling
- **Extensions**: Service configuration, Swagger setup
- **Program.cs**: Application entry point and middleware pipeline

**Rules:**

- Depends on Application and Infrastructure
- Contains HTTP-specific concerns
- No business logic (delegates to Application via MediatR)

## CQRS Pattern

Commands and Queries are separated using MediatR:

- **Commands**: Modify state (Create, Update, Delete). Return `Result<T>`.
- **Queries**: Read data. Return DTOs or `PagedResult<T>`.

```
HTTP Request → Controller → MediatR.Send(Query/Command) → Handler → Repository → DbContext
```

## Repository Pattern

Generic repository (`IRepository<T>`) provides a consistent data access contract. The `IUnitOfWork` manages transactions.

## Dependency Injection

Each layer has its own `DependencyInjection` static class:

- `AddApplicationServices()` — MediatR, AutoMapper, FluentValidation, Behaviors
- `AddInfrastructureServices()` — DbContext, Repositories, UnitOfWork, Services
- `AddApiServices()` — Controllers, Swagger, CORS, Health Checks

## Frontend Architecture (Angular 20)

- **Standalone Components**: No NgModules
- **Signals**: Reactive state management
- **Functional Guards & Interceptors**: Modern Angular patterns
- **Core/Shared/Features**: Feature-based organization
- **Lazy Loading**: Route-level code splitting
