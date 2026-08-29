# FlowForge

Visual workflow builder — Milestone 1 foundation.

## Local development

Requirements: Node.js 20.12+ and pnpm 10.x.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/dashboard`.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Environment strategy

Use `.env.example` as the template for local environment variables. Secrets remain server-side and are not committed. Supabase is intentionally not connected in Milestone 1; persistence/API work begins later.

## Scope

Milestone 1 establishes the Next.js App Router shell, routing, strict TypeScript, Tailwind, linting/formatting, Vitest, Playwright infrastructure, and CI quality gates. Product functionality is deliberately deferred to later milestones.
