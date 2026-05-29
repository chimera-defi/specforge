# SpecForge Desktop

Wraps the SpecForge web app and collab server in a Tauri desktop shell with startup UX.

## Development

```bash
# From the SpecForge repo root:
bun run dev:desktop    # opens Tauri dev window with loading screen
bun run launch --dev   # run services in dev mode without Tauri (browser workflow)

# Or run services manually:
cd web && bun run dev &
cd collab-server && bun run dev &
open http://localhost:3000/workspace
```

## Production Build

```bash
bun run desktop:build   # outputs to desktop/src-tauri/target/release/bundle/
```

## Supported Platforms

- **Linux**: deb, rpm packages (currently active)
- **macOS**: dmg, app bundle (configured, requires valid icons)
- **Windows**: msi, nsis installer (configured, requires valid icons)

**Note:** macOS and Windows packaging targets are configured in `tauri.conf.json` but currently disabled due to corrupted placeholder icons. Run `./scripts/generate-icons.sh` to create valid icons, then enable the targets in the config.

## How It Works

### Startup Flow

1. Tauri opens a loading screen (`desktop/splash/index.html`)
2. The loading screen polls both health endpoints every 1.5 seconds
3. Status indicators show which services are ready
4. Once both respond, the webview navigates to `http://localhost:3000`
5. If services don't start within 30 seconds, an error panel with a "Retry" button is shown
6. Settings can be configured via the ⚙️ Settings button (ports, timeout)

### Sidecar Management

- The Rust backend spawns web and collab-server as child processes on startup
- `desktop/scripts/launch.sh` provides the same lifecycle for non-Tauri use
- On window close (Destroyed event), all child processes are killed via `Sidecars` state
- The `Sidecars` struct also implements `Drop` for safety
- Logs are captured via piped stdout/stderr for debugging

### Health Endpoints

- Web: `GET http://localhost:3000/api/health`
- Collab: `GET http://127.0.0.1:4322/health`

### Tauri Commands

- `get_health` — Returns JSON `{ web: bool, collab: bool, ready: bool }`
- `get_service_logs` — Returns log file locations and viewing instructions
- `get_version` — Returns version info and platform details

### Configuration

The desktop app includes a settings panel (⚙️ button) to configure:
- Web port (default: 3000)
- Collab port (default: 4322)
- Startup timeout (default: 30 seconds)

Settings are persisted in localStorage and apply on next restart.

### Icon Generation

To regenerate desktop icons at all required sizes:
```bash
cd desktop
./scripts/generate-icons.sh
```

Requires ImageMagick:
- macOS: `brew install imagemagick`
- Linux: `apt-get install imagemagick`

## Requirements

- Rust toolchain (`rustup`)
- Bun
- Tauri CLI v2: `bun add -g @tauri-apps/cli`
- ImageMagick (for icon generation)
