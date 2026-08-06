# Deployment — LMS SaaS

## Docker Deployment

### Full Stack with Docker Compose

```bash
# Production build
docker-compose -f docker-compose.yml up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
POSTGRES_DB=lms_db
POSTGRES_USER=PLACEHOLDER_USER
POSTGRES_PASSWORD=PLACEHOLDER_PASSWORD
```

### Service Ports

| Service    | Port | URL                   |
| ---------- | ---- | --------------------- |
| API        | 5000 | http://localhost:5000 |
| Web        | 4200 | http://localhost:4200 |
| PostgreSQL | 5432 | localhost:5432        |
| Seq        | 5341 | http://localhost:5341 |

## Backend Deployment

### Build Docker Image

```bash
docker build -f backend/src/LMS.Api/Dockerfile -t lms-api:latest ./backend
```

### Run API Container

```bash
docker run -d \
  --name lms-api \
  -p 5000:8080 \
  -e ConnectionStrings__DefaultConnection="Host=HOST;Port=5432;Database=DB;Username=USER;Password=PASS" \
  -e ASPNETCORE_ENVIRONMENT=Production \
  lms-api:latest
```

## Frontend Deployment

### Build Docker Image

```bash
docker build -f frontend/Dockerfile -t lms-web:latest ./frontend
```

### Run Web Container

```bash
docker run -d \
  --name lms-web \
  -p 4200:80 \
  lms-web:latest
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Backend Job**: Restore → Build → Test
2. **Frontend Job**: Install → Build
3. **Docker Job**: Build API and Web Docker images

## Production Checklist

- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Configure real PostgreSQL connection string via environment variables
- [ ] Configure JWT signing key via environment variables
- [ ] Configure CORS allowed origins
- [ ] Configure Seq server URL for logging
- [ ] Run EF Core database migrations
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure reverse proxy (nginx/traefik)
- [ ] Set up database backups
- [ ] Configure health check endpoints in orchestrator
