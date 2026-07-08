#!/usr/bin/env bash
# RailMind AI — Development Environment Setup (Unix)
set -euo pipefail

echo ""
echo "=== RailMind AI — Development Setup ==="
echo "AI-Assisted Railway Operations Intelligence Platform"
echo ""

# Check prerequisites
check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo "[MISSING] $2 is required but not found."
        return 1
    fi
    return 0
}

ALL_GOOD=true
check_cmd "node" "Node.js" || ALL_GOOD=false
check_cmd "python3" "Python 3" || ALL_GOOD=false

if [ "$ALL_GOOD" = false ]; then
    echo ""
    echo "Install missing prerequisites and re-run this script."
    exit 1
fi

echo "[OK] Node.js $(node --version)"
echo "[OK] Python  $(python3 --version)"

if command -v psql &> /dev/null; then
    echo "[OK] PostgreSQL $(psql --version)"
else
    echo "[WARN] PostgreSQL CLI not found. Use Docker: docker compose -f docker-compose.dev.yml up -d"
fi

# Backend setup
echo ""
echo "--- Backend Setup ---"
cd backend

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing dependencies..."
pip install -q -r requirements-dev.txt

if [ ! -f ".env" ]; then
    echo "Copying .env.example to .env..."
    cp .env.example .env
fi

cd ..

# Frontend setup
echo ""
echo "--- Frontend Setup ---"
cd frontend

echo "Installing npm dependencies..."
npm ci --silent

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "Copying .env.example to .env..."
    cp .env.example .env
fi

cd ..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Start PostgreSQL:"
echo "     docker compose -f docker-compose.dev.yml up -d"
echo "  2. Start backend:"
echo "     cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "  3. Start frontend:"
echo "     cd frontend && npm run dev"
echo ""
