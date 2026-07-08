# ADR-005: Synchronous SQLAlchemy + psycopg 3

## Status
Accepted

## Date
2026-07-05

## Context

The application needs a Python ORM for PostgreSQL access. Two key decisions were required:

1. **Sync vs Async**: SQLAlchemy 2.x supports both synchronous (`create_engine`) and asynchronous (`create_async_engine`) patterns. Async introduces complexity in testing, debugging, and context management.

2. **psycopg 2 vs psycopg 3**: psycopg2 is the legacy PostgreSQL driver. psycopg 3 (package name: `psycopg`) is the actively maintained successor with native async support, connection pooling, and modern Python features.

The application serves an operations center with modest concurrent users (~50 max). There is no measured concurrency requirement that justifies async complexity.

## Decision

Use synchronous SQLAlchemy 2.x sessions with the psycopg 3 driver. Connection string dialect: `postgresql+psycopg://`.

If async is needed in the future, migration requires only changing `create_engine` to `create_async_engine` and `sessionmaker` to `async_sessionmaker` — zero business logic, service, or repository code changes.

## Consequences

### Positive
- Simpler code: no `await` keywords, no async context managers in business logic
- Easier debugging: standard synchronous stack traces
- Easier testing: no async test fixtures or event loop management
- psycopg 3 is actively maintained with modern Python typing support
- Connection pooling built into psycopg 3

### Negative
- Cannot handle thousands of concurrent database calls per second
- Each request blocks a thread during database operations

### Risks
- Scale limitations at very high concurrency — mitigated by the fact that migration to async requires only engine/session changes, not business logic refactoring
