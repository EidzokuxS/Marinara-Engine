## Hard Rules

- Product behavior belongs in `src/engine`; React UI belongs in `src/features`; runtime wrappers belong in `src/shared/api`; privileged/hostable capabilities belong in `src-tauri`.
- Engine code must not import React, Zustand stores, `@tauri-apps/api`, feature internals, or concrete `src/shared/api` adapters.
- New or touched feature code should use focused shared API wrappers, not raw `invokeTauri` imports or raw remote-runtime `fetch`.
- Remote-capable behavior must follow the explicit HTTP pipeline documented in `marinara-architecture-guard`.
- Chat, roleplay, and game remain separate mode owners.
- Fix root causes; do not add fake success, silent catches, broad fallbacks, or UI-only guards over broken contracts.

## Verification

Run checks that match the change:

- TypeScript/UI/engine: `pnpm typecheck`
- Build/import graph/bundling: `pnpm build`
- Rust commands/capabilities/provider transport/hostable runtime: `cargo check --manifest-path src-tauri/Cargo.toml`
- Docs/skills/agent guidance: `pnpm check:docs`
- Architecture/import rules: `pnpm check:architecture`

For code changes, final responses must include behavior changed, primary files/modules touched, impact/dependent areas reviewed, verification, and remaining risk.
