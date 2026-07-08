# ADR-004: JWT + RBAC Local Authentication

## Status
Accepted

## Date
2026-07-05

## Context

The platform requires authentication and authorization from the initial release. Five distinct user roles (Administrator, Dispatcher, Operator, Maintenance Engineer, Viewer) need different permission levels. The architecture must support future integration with OAuth, LDAP, and SSO providers without refactoring existing code.

Options evaluated:
- **Session-based auth**: Server-side session storage, requires sticky sessions or shared session store for horizontal scaling.
- **OAuth-first**: Requires external identity provider configuration from day one, complicates local development.
- **JWT with local auth**: Stateless tokens, role claims embedded in payload, works without external dependencies.

## Decision

Implement JWT-based authentication with local username/password login. Access tokens (HS256, 30-minute expiry) in Authorization header. Refresh tokens (7-day expiry) in HttpOnly cookies with rotation on use. Password hashing via bcrypt (cost factor 12). Five roles with a permission matrix enforced by middleware.

## Consequences

### Positive
- Stateless authentication enables horizontal scaling without shared session stores
- Role claims in JWT payload enable fast authorization checks without database queries
- Local auth works without any external service dependencies
- Architecture supports future OAuth/LDAP/SSO as additional authentication adapters

### Negative
- Token revocation requires additional infrastructure (token blacklist or short expiry)
- JWT payload size grows with additional claims

### Risks
- JWT secret exposure — mitigated by environment variables and rotation policy
- Refresh token theft — mitigated by HttpOnly cookies, token rotation, and secure flag
