# Decision 004 — TanStack Query for workflow server state

## Context

Milestone 5 established the persistence API and repository boundary but intentionally left server-state orchestration to Milestone 6.

## Decision

Use TanStack Query for workflow list/detail queries and create/update/delete mutations.

- The workflow list is cached under a stable list query key.
- Workflow detail is cached independently by workflow id.
- Successful create/update/delete operations invalidate or update affected query data.
- The editor keeps its current draft local while editing; TanStack Query remains the server-state source and mutation lifecycle owner.
- Persistence routes and repository code are reused without redesign.

## Consequences

This gives the dashboard a real server-backed workflow list and gives the editor explicit query loading/error/mutation states without copying server responses into a global client store. Undo/redo, autosave, and revision-race handling remain deferred to Milestone 7.
