# Shared

Reusable frontend code lives here: API wrappers, generated bindings imports, UI primitives, generic hooks, shared styles, shared stores, and frontend-only utilities.

Shared code must not import from `src/features`.

Only `src/shared/api` owns Tauri command transport. Engine modules stay outside
`src/shared`; they receive capability ports from `src/engine/capabilities`
instead of importing frontend adapters.
