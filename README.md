# Mini-Dispatcher

## Docker (all services)

From the project root:

```bash
docker-compose up -d --build
```

- **PostgreSQL**: `localhost:5433` (user `postgres`, password `postgres`, DB `mini_dispatcher`)
- **Backend (NestJS)**: http://localhost:3001 — health: `GET /` → `{"status":"ok"}`
- **Frontend (Next.js)**: http://localhost:3000

Stop: `docker-compose down`
