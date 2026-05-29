# SpecForge Local Bridge

**Status**: Design spike implementation
**Purpose**: Allow hosted SpecForge workspaces to use local CLI tools (Codex, Claude)

## Overview

The local bridge is a small HTTP server that runs on the user's machine and proxies requests from hosted SpecForge to local CLI tools. This enables users in hosted mode to leverage their local AI provider credentials while still using the hosted SpecForge UI and infrastructure.

## Architecture

```
Hosted SpecForge → Local Bridge (localhost:4323) → Local CLI Tools (codex, claude)
```

## Features

### Current Implementation (Design Spike)

- HTTP server listening on `localhost:4323`
- Health check endpoint
- Simple request routing
- Basic error handling
- Process spawning for CLI commands

### Future Enhancements

- Authentication/authorization (signed tokens)
- Request validation and sanitization
- Rate limiting
- Logging and telemetry
- Multiple CLI tool support
- Configuration UI

## Usage

### Start the Bridge

```bash
cd bridge
bun run start
```

### Health Check

```bash
curl http://localhost:4323/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

### CLI Proxy Endpoint (Future)

```bash
curl -X POST http://localhost:4323/cli/codex \
  -H "Content-Type: application/json" \
  -d '{"prompt": "help me refactor this code"}'
```

## Configuration

Environment variables:
- `BRIDGE_PORT`: Port for bridge server (default: 4323)
- `BRIDGE_LOG_LEVEL`: Logging level (default: info)

## Security Considerations

- **Authentication**: Future implementation should use signed tokens from hosted SpecForge
- **Localhost-only**: Bridge should only bind to localhost for security
- **Input validation**: All CLI inputs must be validated before execution
- **Rate limiting**: Prevent abuse of local CLI resources
- **Secrets management**: Bridge should not store or expose any provider secrets

## Integration with Hosted SpecForge

Hosted SpecForge would:
1. Detect if bridge is available via health check
2. Show "Local CLI Available" indicator in UI
3. Route assist requests through bridge when enabled
4. Fall back to hosted provider credentials if bridge unavailable

## Development

```bash
cd bridge
bun run dev    # Development mode with auto-reload
bun run build   # Build for production
bun run start   # Start production server
```

## Testing

```bash
cd bridge
bun run test    # Run tests
bun run lint    # Run linting
```