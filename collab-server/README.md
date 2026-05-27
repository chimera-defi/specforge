# SpecForge Collaboration Server

Real-time collaborative document editing powered by Yjs and Hocuspocus.

## Ports

- **WebSocket server**: `4321` (default)
- **Health/metrics server**: `4322` (WebSocket port + 1)

## Environment Variables

The server loads `.env` automatically from the workspace root via `dotenv`.

| Variable | Required | Description |
|----------|----------|-------------|
| `SPECFORGE_COLLAB_SECRET` | Yes | Shared secret used to sign and verify room tokens |

## Dependencies

- `@hocuspocus/server`
- `yjs`
- `dotenv`

## How to Start

```bash
bun install
node src/index.js
```

Or from the workspace root:

```bash
bun run dev:collab
```

## Notes

- CORS headers are served on health/metrics endpoints for cross-origin browser checks.
- Document rooms are created on demand by Hocuspocus.
- Signed room tokens are verified before WebSocket clients can join.
- Room snapshots are persisted locally under `.data/collab-rooms/` so collaboration state survives server restarts.
