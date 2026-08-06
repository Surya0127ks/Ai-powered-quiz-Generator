## Ai-powered-quiz-Generator


## What this app does (Working & Use)
- Provides course and lesson management, quizzes, question bank, enrollments, and progress tracking.
- Students can take quizzes, resume attempts, view scores, and receive certificates.
- Instructors can create courses, sections, lessons and quizzes, review attempts and manage course content.
- Quizzes support shareable links (work over LAN/phone when the frontend `devHostOverride` is configured) for quick sharing of specific quiz attempts or previews.

Users can run the project locally with Docker Compose or separately run the backend and frontend. The backend exposes a REST API used by the Angular frontend; authentication is JWT-based (set via env vars). EF Core handles migrations and schema updates.

## Repository Layout (files you can explore)

Top-level files and folders (click into each to view):

- `backend/`
	- `src/LMS.Api/` — API project with controllers, middleware, `Program.cs`, background services and `DesignTimeDbContextFactory` for EF CLI.
	- `src/LMS.Application/` — Application layer: MediatR handlers, DTOs, validation and mapping.
	- `src/LMS.Infrastructure/` — EF Core `ApplicationDbContext`, repository implementations, persistence services and migrations.
	- `tests/` — Unit and integration tests for each layer.
- `frontend/`
	- `src/` — Angular app source (components, services, features like quiz player and dashboards)
	- `environments/` — `environment.ts` and `environment.development.ts` for runtime config
	- `Dockerfile` and `docker/nginx.conf` — for containerized static hosting
- `docker/` — `postgres-init/init.sql` for local DB initialization
- `docs/` — architecture, deployment and developer guides
- `render.yaml` — suggested Render configuration (replace placeholders)
- `vercel.json` — Vercel static deploy config (update backend domain)
- `.env.example` — Example environment variables; DO NOT commit secrets

The README highlights the most important files and where to find app functionality. Browse these folders to inspect controllers, frontend components (`src/app/features`), and migrations (`backend/src/LMS.Infrastructure/Migrations`).

## Tech Stack

- Backend: ASP.NET Core 9, Entity Framework Core 9, Npgsql (PostgreSQL), MediatR, Serilog
- Frontend: Angular 20, TypeScript, RxJS, SCSS
- Infrastructure: Docker, Docker Compose, Neon (Postgres), Render (backend), Vercel (frontend)
- CI: GitHub Actions (provided in `.github/workflows/ci.yml`)
## What this app does (Working & Use)
- Provides course and lesson management, quizzes, question bank, enrollments, and progress tracking.
- Students can take quizzes, resume attempts, view scores, and receive certificates.
- Instructors can create courses, sections, lessons and quizzes, review attempts and manage course content.
- Quizzes support shareable links (work over LAN/phone when the frontend `devHostOverride` is configured) for quick sharing of specific quiz attempts or previews.

Users can run the project locally with Docker Compose or separately run the backend and frontend. The backend exposes a REST API used by the Angular frontend; authentication is JWT-based (set via env vars). EF Core handles migrations and schema updates.

## Repository Layout (files you can explore)

Top-level files and folders (click into each to view):

- `backend/`
	- `src/LMS.Api/` — API project with controllers, middleware, `Program.cs`, background services and `DesignTimeDbContextFactory` for EF CLI.
	- `src/LMS.Application/` — Application layer: MediatR handlers, DTOs, validation and mapping.
	- `src/LMS.Infrastructure/` — EF Core `ApplicationDbContext`, repository implementations, persistence services and migrations.
	- `tests/` — Unit and integration tests for each layer.
- `frontend/`
	- `src/` — Angular app source (components, services, features like quiz player and dashboards)
	- `environments/` — `environment.ts` and `environment.development.ts` for runtime config
	- `Dockerfile` and `docker/nginx.conf` — for containerized static hosting
- `docker/` — `postgres-init/init.sql` for local DB initialization
- `docs/` — architecture, deployment and developer guides
- `render.yaml` — suggested Render configuration (replace placeholders)
- `vercel.json` — Vercel static deploy config (update backend domain)
- `.env.example` — Example environment variables; DO NOT commit secrets

The README highlights the most important files and where to find app functionality. Browse these folders to inspect controllers, frontend components (`src/app/features`), and migrations (`backend/src/LMS.Infrastructure/Migrations`).

## Tech Stack

- Backend: ASP.NET Core 9, Entity Framework Core 9, Npgsql (PostgreSQL), MediatR, Serilog
- Frontend: Angular 20, TypeScript, RxJS, SCSS
- Infrastructure: Docker, Docker Compose, Neon (Postgres), Render (backend), Vercel (frontend)
- CI: GitHub Actions (provided in `.github/workflows/ci.yml`)

## Detailed Folder Structure

Below is a more explicit view of the workspace so you know where to find code and configuration.

```
my project/
├── backend/
│   ├── Directory.Build.props
   ├── Directory.Packages.props
   ├── global.json
   ├── LMS.slnx
   ├── src/
   │   ├── LMS.Api/
   │   │   ├── Program.cs
   │   │   ├── appsettings.json
   │   │   ├── appsettings.Development.json
   │   │   ├── Dockerfile
   │   │   ├── BackgroundServices/QuizCleanupService.cs
   │   │   ├── Controllers/*
   │   │   └── Extensions/
   │   ├── LMS.Application/
   │   │   ├── Behaviors/
   │   │   ├── Features/
   │   │   └── Mappings/
   │   ├── LMS.Infrastructure/
   │   │   ├── DependencyInjection.cs
   │   │   ├── Persistence/
   │   │   ├── Services/
   │   │   └── Migrations/
   │   └── LMS.Domain/
   │       ├── Entities/
   │       ├── Enums/
   │       └── Exceptions/
   └── tests/
	   ├── LMS.Application.Tests/
	   ├── LMS.Domain.Tests/
	   └── LMS.Infrastructure.Tests/
├── frontend/
│   ├── angular.json
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       ├── index.html
│       ├── main.ts
│       ├── app/
│       │   ├── core/
│       │   ├── features/
│       │   │   ├── courses/
│       │   │   └── quiz-player/
│       │   └── shared/
│       └── environments/
├── docker/
│   └── postgres-init/init.sql
├── docs/
└── README.md
```

## Run on your system (Windows) — step-by-step

Prerequisites:
- Install .NET 9 SDK
- Install Node.js 20+ and npm
- (Optional) Install Docker & Docker Compose

1) Run full stack with Docker Compose (recommended):

```powershell
# from repo root
docker-compose up --build
```

2) Run backend only (Windows PowerShell):

```powershell
cd backend
# set example env vars for a local run; replace values accordingly
$env:ASPNETCORE_ENVIRONMENT='Development'
$env:ConnectionStrings__DefaultConnection='Host=localhost;Database=lms;Username=postgres;Password=yourpassword'
# run migrations (requires dotnet-ef tools)
dotnet ef database update --project src/LMS.Api --startup-project src/LMS.Api
# run API
dotnet run --project src/LMS.Api --urls "http://0.0.0.0:5000"
```

3) Run frontend only:

```powershell
cd frontend
npm ci
npm start
# or build for production
npm run build
# serve dist locally (optional)
npx http-server ./dist/lms-web -p 8080
```

4) Common troubleshooting
- If `dotnet run` fails with "address already in use", find and kill the process:

```powershell
netstat -ano | findstr ':5000'
taskkill /PID <pid> /F
```
- If EF CLI fails because the host crashes on startup, the repo includes `DesignTimeDbContextFactory` so run `dotnet ef` directly against the project as shown above.

5) Protect secrets
- Never commit production credentials. Keep `.env.example` as template and set real values in your environment / Render / Vercel secrets.

If you want, I can now run a quick scan in the repo to look for likely secrets (connection strings, private keys). Proceed? 
# LMS SaaS — Learning Management System


A production-ready Learning Management System (LMS) built with an Angular 20 frontend and an ASP.NET Core 9 backend following Clean Architecture and CQRS principles.


## Quickstart (local)

1. Start PostgreSQL (Docker recommended):

```bash
docker-compose up -d postgres
```

2. Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet run --project src/LMS.Api
```

API: http://localhost:5000 (development)

3. Frontend

```bash
cd frontend
npm ci
npm start
```

Web: http://localhost:4200

4. Run EF migrations (if needed):

```bash
cd backend
dotnet ef database update --project src/LMS.Api --startup-project src/LMS.Api
```

## Deployment (overview)

- Database: Use Neon free Postgres (connection string in environment variables).
- Backend: Deploy with Render (Docker or `render.yaml`). Ensure env vars: `ConnectionStrings__DefaultConnection`, `JwtSettings__SecretKey`, `ASPNETCORE_ENVIRONMENT=Production`, `Cors__AllowedOrigins`.
- Frontend: Deploy on Vercel (static build). Configure rewrite or environment `API_URL` to point to Render backend.

See `docs/deployment.md` for full deployment instructions.

## Security

- Do NOT commit real secrets; use `.env.example` and platform environment variables. Before pushing, scan for sensitive values like `ConnectionStrings__DefaultConnection` or `JwtSettings__SecretKey`.
- Store secrets in Render/Vercel/GitHub Secrets.
- Ensure `JwtSettings__SecretKey` is a strong secret (≥32 chars).


## Contributing

- Follow the established code structure and naming conventions.
- Run tests before opening PRs: `dotnet test` (backend) and `npm test` (frontend).
- Open issues for bugs or feature requests and include steps to reproduce and failing logs.

## Notes & Changes Requested

- Removed multi-tenancy wording: the app is a single-tenant LMS by default. If you require multi-tenant support, open an issue and we can advise on architecture changes.


## License

Proprietary. Contact repository owner for license details.

