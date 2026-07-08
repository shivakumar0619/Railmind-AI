# ADR-006: Hybrid Folder Structure

## Status
Accepted

## Date
2026-07-05

## Context

Two primary folder structure strategies exist for full-stack applications:

- **Layer-based**: Group files by architectural layer (all models together, all services together, all routes together). Enforces clear separation of concerns but makes it harder to find all files related to a single feature.
- **Feature-based**: Group files by domain feature (all train files together — model, service, route, component). Improves feature discoverability but can blur architectural boundaries.

## Decision

Use a hybrid approach:

- **Backend**: Layer-based structure (`models/`, `services/`, `repositories/`, `api/`, `schemas/`). This enforces clean architecture boundaries and makes the Routes → Services → Repositories → Models pattern explicit and auditable.

- **Frontend**: Feature-based structure (`features/trains/`, `features/stations/`, etc.). Each feature directory contains its own page component, sub-components, hooks, and services. Shared components live in `components/shared/` and `components/ui/`.

## Consequences

### Positive
- Backend layers enforce architectural discipline (no business logic in routes, no SQL in services)
- Frontend features improve developer discoverability (everything for trains is in one place)
- Shared components prevent duplication across features
- Clear separation between UI primitives (shadcn/ui) and domain components

### Negative
- More directories to navigate compared to a flat structure
- Developers must understand which pattern applies to which tier

### Risks
- Feature boundaries may blur as the application grows — mitigated by code review discipline and the `shared/` directory for cross-cutting concerns
