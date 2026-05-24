# API Wrappers

Typed Tauri command wrappers live here. They are the only frontend layer that
should import `tauri-client.ts` or `@tauri-apps/api` for command transport.

Feature code should call focused wrappers from this folder instead of calling
`invokeTauri` directly. Engine code must not import this folder; engine services
accept ports from `src/engine/capabilities`, and feature/runtime/app-edge code
binds those ports to these wrappers.
