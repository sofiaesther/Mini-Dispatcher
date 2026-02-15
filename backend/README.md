# Backend (NestJS + Prisma + PostgreSQL)

## Setup

1. **Install dependencies** (already done if you ran `npm install`):
   ```bash
   npm install
   ```

2. **Configure database**: Copy `.env.example` to `.env` and set **valid** PostgreSQL credentials in `DATABASE_URL`:
   ```bash
   cp .env.example .env
   # Edit .env: replace USER and PASSWORD with your real PostgreSQL username and password.
   # Example: postgresql://postgres:mysecret@localhost:5432/mini_dispatcher
   ```
   **If you see "Authentication failed" (P1000):** the username or password in `.env` don’t match your PostgreSQL server. Use the same user/password you use to connect with `psql` or your DB client. On macOS with Homebrew PostgreSQL, the default user is often your system username with no password; try `postgresql://YOUR_MAC_USERNAME@localhost:5432/mini_dispatcher` (and create the DB with `createdb mini_dispatcher` if needed).

3. **Run migrations** (creates tables):
   ```bash
   npm run prisma:migrate
   ```

4. **Generate Prisma client** (after schema changes):
   ```bash
   npm run prisma:generate
   ```

## Scripts

- `npm run start:dev` – Start dev server with watch
- `npm run build` – Build for production
- `npm run start:prod` – Run production build
- `npm run prisma:studio` – Open Prisma Studio (DB GUI)
- `npm run prisma:migrate` – Run migrations

## Models (Prisma)

- **Driver** – Drivers with car (JSON), presence, rides
- **DriverPresence** – Location and status (available | busy | offline)
- **Ride** – Rides with status (accepted | initiated | completed)
- **RideEvaluation** – Ratings (1–5) and comments
