#!/bin/sh
set -e
echo "Generating Prisma client for this environment..."
npx prisma generate
echo "Running Prisma db push..."
npx prisma db push --accept-data-loss --skip-generate
echo "Starting backend..."
exec "$@"
