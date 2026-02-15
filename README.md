# Mini-Dispatcher

This guide explains how to run and test the Mini-Dispatcher app (manual testing and basic checks). The project does not yet include automated unit or E2E tests; this document focuses on running the stack and validating behaviour by hand.

This is an application to provide a driver-passenger simple connection.

---

## Prerequisites

- **Node.js** 18+ (for local dev and scripts)
- **Docker & Docker Compose** (for one-click run)
- **PostgreSQL** (only if you run the backend locally without Docker)

---

## 1. Run the application

### Option A: Docker (recommended)

From the project root:

```bash
./run.sh
```

Or:

```bash
docker-compose up -d --build
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **PostgreSQL:** `localhost:5433` (user `postgres`, password `postgres`, DB `mini_dispatcher`)

Stop: `docker-compose down`

### Option B: Local development

1. **Database**
   Start PostgreSQL (e.g. on port 5433) and create a DB `mini_dispatcher`, or use Docker only for Postgres:

   ```bash
   docker-compose up -d postgres
   ```

2. **Backend**
   In `backend/`:

   ```bash
   cp .env.example .env   # edit DATABASE_URL if needed
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed    # optional: seed drivers/rides
   npm run start:dev
   ```

3. **Frontend**
   In another terminal, in `frontend/`:

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000 (or the port Next.js prints).

---

## 2. Lint and build (sanity checks)

Before manual testing, you can run lint and build to catch obvious issues.

**Frontend** (`frontend/`):

```bash
npm run lint
npm run build
```

**Backend** (`backend/`):

```bash
npm run lint
npm run build
```

---

## 3. Manual test scenarios

Use these flows to verify the main features. Run the app (Docker or local) and follow the steps in a browser.

### Home and role selection

1. Open http://localhost:3000.
2. Click **Passenger** → should go to `/passenger` and show the passenger dashboard.
3. Go back to home (e.g. via logo or back), then click **Driver** → should open the auth popup (driver login/registration).
4. For better experience is recommended to open a browser with the passenger view and another one with the driver view. As it has persistence by cookies it can have issues running in the same browser.

### Passenger flow

1. Go to **Passenger**.
2. **Request ride**
   - Click “Request Ride” (header or in the ride info area).
   - Request Ride popup should open.
   - Enter pick-up and destination (or use map), then confirm.
   - You should see a “Finding a driver…” / PENDING state (or “no drivers” if none available).
3. **Cancel ride**
   - While status is PENDING or ACCEPTED, click “Cancel ride” and confirm the ride is cancelled.
4. **Ride evaluation**
   - After a ride completes, the evaluation popup should open once.
   - Submit a rating (and optional comment) and confirm it’s sent (e.g. no errors, UI updates).

### Driver flow

1. **Auth**
   - From home, choose Driver and complete login/registration in the popup.
2. **Dashboard**
   - You should land on the driver dashboard with status and profile controls.
3. **Status**
   - Toggle status (e.g. available / offline) and confirm it updates.
4. **Incoming request**
   - With a driver available and a passenger requesting a ride, the driver should get an incoming request popup and be able to accept or reject.
5. **Location**
   - Use “Update location” / map picker and confirm location is sent (e.g. passenger sees driver on map when ride is accepted/initiated).

### WebSocket and reconnection

1. **Passenger**
   - Request a ride, then refresh the page.
   - Passenger ID should be restored from cookie (same session); ride state should sync from backend/WebSocket.
2. **Driver**
   - Log in as driver, set available, then refresh.
   - Reconnect and status should be restored/synced.

### Map and UI

1. **Passenger map**
   - When a ride has pick-up, destination, and driver, the map should show markers for all three.
2. **Driver map**
   - Driver location picker and any map views should load without errors and reflect chosen location.

---

## 4. Backend-only checks (optional)

- **Prisma**
  In `backend/`:

  ```bash
  npm run prisma:generate
  npm run prisma:migrate
  npm run prisma:seed
  npm run prisma:studio   # open Prisma Studio to inspect DB
  ```

- **Health**
  With the backend running, open http://localhost:3001 (or the backend root) and confirm it responds (e.g. 200 or your health endpoint).

