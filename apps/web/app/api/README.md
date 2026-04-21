# Legacy API Proxy Surface

The active Pyramid V1 app is frontend-only and does not use watcher proxy routes, loan endpoints, or server-managed write flows.

If new API routes are added, they should support direct user-facing product needs without reintroducing centralized backend assumptions.

The current product direction is:

- no centralized backend assumptions
- no watcher-based UX
- direct reads from the frontend
- on-chain persistence for durable logic
