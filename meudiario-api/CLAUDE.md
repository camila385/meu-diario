# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project overview

REST API backend for the *Meu Diário* personal diary app. Built with TypeScript + Express + PostgreSQL (Prisma ORM). Follows **Spec-Driven Development (SDD)**: every feature starts from an approved spec in `specs/` before any code is written.

## Commands

```bash
npm run dev          # Run in development mode (tsx watch)
npm run build        # Compile to dist/ with tsup
npm run start        # Run compiled output
npm run format       # Run Prettier across src/
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:seed      # Seed levels and badges
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:studio    # Open Prisma Studio
```

Required environment variables (see `.env.example`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=<min 32 chars>
JWT_EXPIRES_IN=7d
PORT=3000
```

No test suite — do not create `.spec.ts` or `.test.ts` files.

## Architecture

Strict layered architecture — **never skip layers**:

```
Routes → Middlewares → Controllers → Validators → Services → Repositories → PostgreSQL
```

| Layer | Responsibility | What's forbidden |
|---|---|---|
| `routes/` | Map URL + chain middlewares | Business logic |
| `controllers/` | Extract req, call service, send response | Prisma, business logic |
| `validators/` | Zod schemas only | Manual type definitions |
| `services/` | Business rules | `req`/`res`, Prisma direct |
| `repositories/` | All Prisma queries | Business logic |
| `models/` | Output DTOs + re-exports of Prisma types | — |
| `mappers/` | Transform Prisma entities to output DTOs | — |
| `errors/` | Custom error classes extending `AppError` | — |

### Dependency injection

All dependencies are wired manually in `src/composition-root.ts` and exported as controller singletons. Routes import these singletons directly — no DI framework.

### Prisma client

The singleton lives in `src/repositories/prisma.client.ts`, using `@prisma/adapter-pg` for the PostgreSQL connection. Prisma generates types to `src/generated/prisma/` — always import entity types from there:

```ts
import type { User } from '@/generated/prisma';
```

Never write manual interfaces for database entities.

## Key conventions

**Response shape** — always use helpers from `src/utils/response.ts`:
```ts
sendSuccess(res, data, 201);            // { success: true, data }
sendPaginated(res, items, meta);        // { success: true, data, meta: { page, limit, total } }
```

**Error handling** — throw typed error classes; the global `errorMiddleware` catches everything:
```ts
throw new NotFoundError('Anotação não encontrada.');
throw new ForbiddenError('Acesso negado.');
throw new ConflictError('Email já cadastrado.');
```

**Validators** — export Zod schema + inferred type, import both in the controller:
```ts
export const createNoteSchema = z.object({ ... });
export type CreateNoteRequest = z.infer<typeof createNoteSchema>;
```

**Mappers** — always transform Prisma results before returning from a service. Never expose raw Prisma shapes as API responses.

**Language** — code/types in English, user-facing messages in Portuguese.

**File naming** — `recurso.camada.ts` (e.g., `notes.service.ts`, `notes.validator.ts`).

**Path alias** — `@/` maps to `src/` (configured in `tsconfig.json` + `tsup`).

## Commit conventions

Semantic commits are mandatory after each task:
```
<type>(<scope>): <description in Portuguese, imperative, max 72 chars>
```
Types: `feat` | `fix` | `refactor` | `chore` | `docs` | `style`

Never group multiple user stories into a single commit. Never commit `.env`.

## SDD workflow

Before implementing any feature, check `specs/<feature>/` for: `spec.md`, `plan.md`, `tasks.md`. The spec is the source of truth. The current active spec is tracked in `.github/copilot-instructions.md` under `Plano atual`.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
