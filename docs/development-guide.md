# Development Guide — LMS SaaS

## Prerequisites

| Tool       | Version | Purpose                  |
| ---------- | ------- | ------------------------ |
| .NET SDK   | 9.0+    | Backend runtime          |
| Node.js    | 20+     | Frontend runtime         |
| npm        | 10+     | Package manager          |
| Docker     | 24+     | Containerization         |
| PostgreSQL | 16+     | Database (or use Docker) |
| Git        | 2.40+   | Version control          |

## Backend Development

### Project Structure

```
backend/
├── LMS.slnx
├── Directory.Build.props        # Shared MSBuild properties
├── Directory.Packages.props     # Central package version management
├── src/
│   ├── LMS.Domain/              # No external dependencies
│   ├── LMS.Application/         # MediatR, AutoMapper, FluentValidation
│   ├── LMS.Infrastructure/      # EF Core, Npgsql, Services
│   └── LMS.Api/                 # ASP.NET Core Web API
└── tests/
    ├── LMS.Domain.Tests/
    ├── LMS.Application.Tests/
    └── LMS.Infrastructure.Tests/
```

### Build & Run

```bash
# Restore packages
dotnet restore backend/LMS.slnx

# Build solution
dotnet build backend/LMS.slnx

# Run API
dotnet run --project backend/src/LMS.Api

# Run tests
dotnet test backend/LMS.slnx
```

### Adding a New Feature (CQRS)

1. **Domain**: Create entity in `LMS.Domain/Entities/`
2. **Application**:
    - Create command/query in `LMS.Application/Features/{Feature}/Commands/` or `Queries/`
    - Create handler for the command/query
    - Create validator using FluentValidation
    - Create mapping profile (AutoMapper)
3. **Infrastructure**: Create EF Core configuration in `Persistence/Configurations/`
4. **API**: Create controller endpoint in `LMS.Api/Controllers/`

### EF Core Migrations

```bash
# Add migration
dotnet ef migrations add InitialCreate \
  --project backend/src/LMS.Infrastructure \
  --startup-project backend/src/LMS.Api

# Update database
dotnet ef database update \
  --project backend/src/LMS.Infrastructure \
  --startup-project backend/src/LMS.Api
```

### User Secrets (Development)

```bash
cd backend/src/LMS.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=lms_db;Username=YOUR_USER;Password=YOUR_PASSWORD"
```

## Frontend Development

### Build & Run

```bash
cd frontend
npm install
npm start          # Dev server at http://localhost:4200
npm run build      # Production build
npm test           # Unit tests
```

### Adding a New Feature

1. Create feature folder: `src/app/features/{feature}/`
2. Create standalone component(s)
3. Add route in `app.routes.ts` with lazy loading
4. Add service in `core/services/` if needed
5. Add models in `core/models/` if needed

### Code Style

- Use **standalone components** (no NgModules)
- Use **signals** for state management
- Use **functional interceptors** and **guards**
- Use **OnPush** change detection
- Use **SCSS** for styling
- Follow **strict TypeScript** settings

## Docker Development

```bash
# Start all services
docker-compose up --build

# Start specific service
docker-compose up postgres

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Remove volumes (fresh start)
docker-compose down -v
```

## Debugging

### Backend

- Use Visual Studio or VS Code with C# Dev Kit
- Set breakpoints in handlers or controllers
- Check Seq at `http://localhost:5341` for structured logs

### Frontend

- Use VS Code with Angular Language Service extension
- Use Angular DevTools browser extension
- Check browser console and Network tab
