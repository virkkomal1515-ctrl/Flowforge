# Persistence boundary

FlowForge persists the domain `Workflow`, not React Flow state.

- Supabase/PostgreSQL is accessed only from server-side infrastructure.
- A workflow row stores metadata plus the graph as JSONB.
- `lib/workflow/persistence-transforms.ts` maps domain workflows to storage DTOs and validates storage data on the way back.
- `features/workflow-persistence/repository.ts` owns CRUD and optimistic revision checks.
- Route Handlers expose the persistence boundary to the editor.
- Selected node, viewport, messages, and form state are not persisted.

Autosave, TanStack Query server-state synchronization, and broader revision-safe mutation orchestration remain outside this milestone and belong to the later autosave/editor server-state work.
