# ADR-001: PostgreSQL as Sole Database

## Status
Accepted

## Date
2026-07-05

## Context

RailMind AI requires a database that supports ACID transactions, relational integrity with foreign keys, spatial query capabilities for map features, JSON storage for flexible metadata, concurrent multi-user access, and production-grade reliability.

Three options were evaluated:
- **SQLite**: Single-file, no server, no concurrent writes, no network access, unsuitable for production multi-user scenarios.
- **MongoDB**: Document store, no ACID joins, schema-less (problematic for railway topology with strict relational constraints).
- **PostgreSQL**: Full ACID, mature relational engine, PostGIS spatial extensions, JSONB columns, proven at enterprise scale.

## Decision

Use PostgreSQL 16 as the sole database engine, accessed via the psycopg 3 driver through SQLAlchemy 2.x ORM.

Connection string format: `postgresql+psycopg://user:password@host:port/database`

Both local PostgreSQL installations and Docker-based PostgreSQL instances are supported using identical schema and Alembic migrations.

## Consequences

### Positive
- Full ACID compliance ensures data integrity for safety-critical railway operations data
- PostGIS-ready for future spatial queries on station/track coordinates
- JSONB support for flexible metadata storage (train telemetry, signal attributes)
- Proven scalability and reliability at enterprise scale
- Excellent tooling ecosystem (pgAdmin, pg_dump, replication)

### Negative
- Requires running PostgreSQL server locally or via Docker (additional setup step)
- Heavier resource footprint than SQLite for development

### Risks
- Local development setup friction — mitigated by providing Docker Compose configuration and setup scripts
