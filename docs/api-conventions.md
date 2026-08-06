# API Conventions — LMS SaaS

## Base URL

```
http://localhost:5000/api
```

## RESTful Conventions

| Method | Endpoint               | Purpose                    |
| ------ | ---------------------- | -------------------------- |
| GET    | `/api/{resource}`      | List all (with pagination) |
| GET    | `/api/{resource}/{id}` | Get by ID                  |
| POST   | `/api/{resource}`      | Create new                 |
| PUT    | `/api/{resource}/{id}` | Update existing            |
| DELETE | `/api/{resource}/{id}` | Delete                     |

## Response Format

### Success Response

```json
{
    "data": {},
    "statusCode": 200
}
```

### Error Response

```json
{
    "statusCode": 400,
    "title": "Validation failed: Email is required",
    "timestamp": "2025-01-15T10:30:00Z",
    "traceId": "00-abc123..."
}
```

### Paginated Response

```json
{
    "items": [],
    "pageNumber": 1,
    "pageSize": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasPreviousPage": false,
    "hasNextPage": true
}
```

## HTTP Status Codes

| Code | Meaning                        |
| ---- | ------------------------------ |
| 200  | OK                             |
| 201  | Created                        |
| 204  | No Content                     |
| 400  | Bad Request (validation error) |
| 401  | Unauthorized                   |
| 403  | Forbidden                      |
| 404  | Not Found                      |
| 409  | Conflict                       |
| 500  | Internal Server Error          |

## Authentication

- Uses **JWT Bearer** token authentication
- Token sent in `Authorization: Bearer {token}` header
- Token expiration: configurable (default 60 minutes)
- Refresh token endpoint: `POST /api/auth/refresh`

## Health Check

```
GET /health
```

Returns `200 OK` if the API and database are healthy.

## Swagger / OpenAPI

- Available in Development at `http://localhost:5000/swagger`
- OpenAPI spec at `http://localhost:5000/swagger/v1/swagger.json`

## Naming Conventions

- **Endpoints**: kebab-case (e.g., `/api/course-modules`)
- **JSON properties**: camelCase (e.g., `firstName`, `createdAt`)
- **Query parameters**: camelCase (e.g., `pageNumber`, `pageSize`)

## Versioning

- API version is embedded in the URL path: `/api/v1/{resource}`
- Versioning strategy: URL path versioning (to be implemented in Phase 2)
