# RailMind AI

**AI-Assisted Railway Operations Intelligence Platform**

> **Disclaimer:** This platform is an independent educational and operational simulation and is not affiliated with, endorsed by, or a replacement for Indian Railways Kavach or any certified railway safety system.

---

## Overview

RailMind AI is a comprehensive railway operations intelligence platform that combines real-time monitoring, AI-driven analytics, and digital twin visualization to enhance railway safety and efficiency. The platform provides dispatchers, operators, and administrators with actionable insights through an intuitive, modern interface.

## Features

- **Digital Twin Visualization** — Interactive map-based railway network visualization powered by MapLibre GL JS with real-time train positioning
- **AI-Powered Analytics** — Simulation-based predictive analytics for delay forecasting, maintenance scheduling, and anomaly detection
- **Real-Time Monitoring** — Live dashboards for train status, track occupancy, signal states, and system health metrics
- **Role-Based Access Control** — Five-tier RBAC system (Super Admin, Admin, Dispatcher, Operator, Viewer) with JWT authentication
- **Incident Management** — End-to-end incident reporting, tracking, escalation workflows, and resolution logging
- **Maintenance Scheduling** — Predictive and preventive maintenance planning with asset lifecycle tracking
- **Reporting & Exports** — Configurable reports with PDF/CSV export capabilities and scheduled delivery
- **Audit Logging** — Comprehensive audit trail for all system actions and configuration changes

## Tech Stack

| Layer        | Technology                          | Version  |
| ------------ | ----------------------------------- | -------- |
| Frontend     | React                               | 19       |
| Build Tool   | Vite                                | latest   |
| Styling      | TailwindCSS                         | v4       |
| UI Library   | shadcn/ui                           | latest   |
| Backend      | FastAPI                             | 0.115.12 |
| ORM          | SQLAlchemy                          | 2.0.41   |
| Database     | PostgreSQL                          | 16       |
| DB Driver    | psycopg 3                           | latest   |
| Maps         | MapLibre GL JS + react-map-gl       | latest   |
| Auth         | JWT (PyJWT) + bcrypt                | latest   |
| Testing (FE) | Vitest + React Testing Library      | latest   |
| Testing (BE) | pytest + coverage                   | latest   |
| Linting (FE) | ESLint + Prettier                   | latest   |
| Linting (BE) | Ruff                                | latest   |

## Prerequisites

| Requirement    | Minimum Version |
| -------------- | --------------- |
| Node.js        | 22+             |
| Python         | 3.12+           |
| PostgreSQL     | 16+             |
| Docker         | 24+ (optional)  |
| Docker Compose | 2.20+ (optional)|

## Quick Start

### Option A: Local Development

**Windows (PowerShell):**

```powershell
git clone https://github.com/your-org/railmind-ai.git
cd railmind-ai
.\scripts\setup.ps1
```

**macOS / Linux (Bash):**

```bash
git clone https://github.com/your-org/railmind-ai.git
cd railmind-ai
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Then start the services:

```bash
# 1. Start PostgreSQL (via Docker)
docker compose -f docker-compose.dev.yml up -d

# 2. Start the backend
cd backend
source .venv/bin/activate    # or .venv\Scripts\Activate.ps1 on Windows
uvicorn app.main:app --reload

# 3. Start the frontend (in a new terminal)
cd frontend
npm run dev
```

| Service    | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost:5173        |
| Backend    | http://localhost:8000        |
| API Docs   | http://localhost:8000/docs   |
| PostgreSQL | localhost:5432               |

### Option B: Docker (Full Stack)

```bash
docker compose up --build
```

| Service    | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost              |
| Backend    | http://localhost:8000        |
| API Docs   | http://localhost:8000/docs   |
| PostgreSQL | localhost:5432               |

## Project Structure

```
railmind-ai/
├── frontend/                  # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── components/        # Shared UI components
│   │   ├── features/          # Feature-based modules
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and helpers
│   │   ├── services/          # API client and services
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   └── package.json
│
├── backend/                   # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/               # Route handlers
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic layer
│   │   ├── repositories/      # Database access layer
│   │   ├── core/              # Config, security, dependencies
│   │   └── main.py            # Application entry point
│   ├── tests/                 # pytest test suite
│   ├── requirements.txt       # Production dependencies
│   └── requirements-dev.txt   # Development dependencies
│
├── shared/                    # Shared constants, enums, contracts
│
├── database/                  # Migration scripts and seed data
│
├── docker/                    # Docker configuration
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   ├── nginx.conf
│   └── postgres-init.sql
│
├── docs/                      # Documentation
│   └── adr/                   # Architecture Decision Records
│
├── scripts/                   # Development and CI scripts
│   ├── setup.ps1              # Windows setup
│   └── setup.sh               # Unix setup
│
├── .github/                   # GitHub configuration
│   └── workflows/             # CI/CD pipelines
│       ├── ci-frontend.yml
│       ├── ci-backend.yml
│       └── docker-build.yml
│
├── docker-compose.yml         # Full-stack production compose
├── docker-compose.dev.yml     # Development compose (DB only)
└── README.md
```

## Architecture Decision Records

All significant architectural decisions are documented in the [docs/adr/](docs/adr/) directory:

| ADR | Decision |
| --- | -------- |
| [ADR-001](docs/adr/ADR-001-postgresql-database.md) | PostgreSQL as sole database |
| [ADR-002](docs/adr/ADR-002-react-vite-typescript.md) | React 19 + Vite + TypeScript |
| [ADR-003](docs/adr/ADR-003-maplibre-gl-js.md) | MapLibre GL JS over Leaflet |
| [ADR-004](docs/adr/ADR-004-jwt-rbac-authentication.md) | JWT + RBAC local authentication |
| [ADR-005](docs/adr/ADR-005-synchronous-sqlalchemy.md) | Synchronous SQLAlchemy + psycopg 3 |
| [ADR-006](docs/adr/ADR-006-feature-based-structure.md) | Feature-based folder structure |
| [ADR-007](docs/adr/ADR-007-simulation-only-ai.md) | Simulation-only AI with adapter pattern |

## Development

### Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload          # Start dev server
pytest -v --cov=app                     # Run tests with coverage
ruff check .                            # Lint
ruff format .                           # Format
```

### Frontend

```bash
cd frontend
npm run dev                             # Start dev server
npm run test                            # Run tests
npm run lint                            # Lint
npm run type-check                      # Type checking
npm run build                           # Production build
```

### Docker

```bash
docker compose up --build               # Full stack
docker compose -f docker-compose.dev.yml up -d   # DB only
docker compose down                     # Stop all services
docker compose down -v                  # Stop and remove volumes
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes all CI checks before submitting a PR.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
