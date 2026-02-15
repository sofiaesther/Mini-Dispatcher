#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "Starting Mini-Dispatcher (PostgreSQL + Backend + Frontend)..."
docker-compose up -d --build
echo ""
echo "Containers started. Waiting for services to be ready..."
sleep 5
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo "  Postgres:  localhost:5433 (user: postgres, password: postgres, db: mini_dispatcher)"
echo ""
echo "Stop with: docker-compose down"
