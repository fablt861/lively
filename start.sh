#!/bin/bash

echo "Starting LIVELY local environment..."

# Start Redis via docker-compose if it exists
if [ -f "docker-compose.yml" ]; then
  echo "=> Starting Redis via Docker..."
  if command -v docker-compose &> /dev/null; then
    docker-compose up -d
  elif docker compose version &> /dev/null; then
    docker compose up -d
  else
    echo "WARNING: Docker not found. Cannot start Redis automatically."
  fi
fi

# Start Backend
echo "=> Starting Backend..."
cd backend
npm install
node server.js &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "=> Starting Frontend..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "LIVELY environment started."
echo "Backend running on port 3001"
echo "Frontend running on port 3000"
echo "Press [CTRL+C] to exit."

# Cleanup on exit
trap "echo 'Stopping all services...'; kill $BACKEND_PID; kill $FRONTEND_PID; if [ -f 'docker-compose.yml' ]; then if command -v docker-compose &> /dev/null; then docker-compose down; else docker compose down; fi; fi" INT TERM EXIT

wait
