# ADR-002: React 19 + Vite + TypeScript

## Status
Accepted

## Date
2026-07-05

## Context

The frontend requires a modern, performant framework with strong typing, component reusability, and excellent developer experience. The application has 15+ distinct pages with complex interactive features including a real-time Digital Twin map, data tables, charts, and form-heavy workflows.

Options evaluated:
- **Next.js**: Full-stack framework with SSR/SSG — unnecessary complexity for a SPA that communicates with a separate FastAPI backend.
- **Angular**: Enterprise-capable but heavier learning curve, less ecosystem flexibility, slower adoption of new patterns.
- **React 19 + Vite**: Latest React with automatic memoization (React Compiler), sub-second HMR via Vite, vast component ecosystem.

## Decision

Use React 19 with Vite as the build tool and strict TypeScript for type safety. TailwindCSS v4 for styling, shadcn/ui for component primitives.

## Consequences

### Positive
- React Compiler eliminates manual `useMemo`/`useCallback` optimization
- Vite provides sub-second hot module replacement during development
- TypeScript strict mode catches type errors at compile time
- Largest ecosystem of compatible libraries (maps, charts, tables, forms)
- shadcn/ui provides copy-paste components that are fully customizable

### Negative
- React 19 is relatively new; some third-party libraries may have edge-case compatibility issues
- TailwindCSS v4 uses a new CSS-first configuration model that differs from v3 documentation

### Risks
- Library compatibility gaps — mitigated by pinning all dependency versions and verifying compatibility before adoption
