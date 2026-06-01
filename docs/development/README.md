# SpecForge Development Guide

This guide is for developers contributing to SpecForge.

## Prerequisites

- Node.js 18+
- Bun (package manager)
- Git
- GitHub account (for OAuth testing)

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/chimera-defi/specforge.git
cd specforge
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure required variables:
```bash
NODE_ENV=development
SPECFORGE_SESSION_SECRET=your-secret-here
SPECFORGE_CSRF_SECRET=your-secret-here
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
SPECFORGE_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### 4. Install Git Hooks

```bash
git config core.hooksPath .githooks
```

### 5. Start Development Servers

```bash
# Terminal 1: Web app
cd web && bun run dev

# Terminal 2: Collab server
cd collab-server && bun run dev
```

The web app will be available at `http://localhost:3000`.

## Development Workflow

### Branching

Always work on feature branches:

```bash
git checkout -b feat/your-feature-name
```

### Commit Format

Follow the conventional commit format:

```
type(scope): description [Agent: Model Name]

Body explaining what and why.

Co-authored-by: Chimera <chimera_defi@protonmail.com>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance

### Verification

Before committing, run:

```bash
bun run contracts:validate  # When contracts.ts changes
bun run lint                # Lint code
bun run test                # Run tests
bun run build:web           # Build web app
```

### Pull Requests

Create a PR with the required template:

```markdown
**Agent:** Model Name
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>

## Summary
- What changed and why

## Original Request
> User's prompt

## Changes Made
- Change 1
- Change 2

## Verification
- [x] bun run build:web passes
- [x] bun run lint passes
- [x] No hallucinated results
- [x] Multi-pass review done
```

## Project Structure

```
specforge/
├── web/               # Next.js web app
│   ├── src/
│   │   ├── app/      # App router pages
│   │   ├── components/  # React components
│   │   └── lib/      # Utilities and libraries
│   └── DESIGN.md     # Design system
├── collab-server/     # Hocuspocus collab server
├── desktop/           # Tauri desktop app
├── cli/              # Terminal CLI
├── skills/           # AI agent skills
├── spec/             # Product specifications (read-only)
└── docs/             # Documentation
```

## Key Libraries

- **Next.js 16** - React framework
- **Tiptap** - Rich text editor
- **Yjs** - CRDT for collaboration
- **Hocuspocus** - Yjs WebSocket server
- **@electric-sql/pglite** - SQLite database
- **Zod** - Schema validation
- **Lucide React** - Icons

## Testing

### Unit Tests

```bash
cd web && bun run test
```

### Acceptance Tests

```bash
cd web && bun run test:acceptance
```

### E2E Tests

```bash
cd web && bun run test:e2e
```

## AI Agent Configuration

SpecForge uses AI agents for assistance. Configure skills in `skills/`:

- **specforge** - Main SpecForge skill
- **kimi-delegate** - Kimi delegation wrapper
- **gstack** - Browser testing and QA

See [Agent Guide](../../AGENTS.md) for detailed agent configuration.

## Claude Code Instructions

When using Claude Code, follow the instructions in [CLAUDE.md](../../CLAUDE.md):

- Always branch before making changes
- Read canonical docs before changing behavior
- Keep web app, CLI, skills aligned
- Use proper attribution format
- Run verification before committing

## Local Development Tips

### Database Reset

```bash
cd web && bun run reset-db
```

### Backup Creation

```bash
bun run backup
```

### Contract Validation

When modifying `contracts.ts`:
```bash
bun run contracts:validate
```

## Troubleshooting

### Port Already in Use

If port 3000 is in use:
```bash
lsof -ti:3000 | xargs kill -9
```

### Database Issues

Reset the database:
```bash
cd web && bun run reset-db
```

### Collab Server Issues

Restart the collab server:
```bash
cd collab-server && bun run dev
```

## Performance Optimization

### Bundle Analysis

```bash
cd web && bun run build
bun run analyze
```

### Linting

```bash
cd web && bun run lint
```

### Type Checking

TypeScript is checked during build. Fix type errors before committing.

## Design System

Follow the design system in `web/DESIGN.md`:
- Use design tokens, not hardcoded colors
- Follow spacing guidelines
- Use Lucide React icons
- Follow component patterns

## Accessibility

Ensure accessibility:
- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers

## Security

Follow security best practices:
- Never commit secrets
- Use environment variables
- Validate all inputs
- Use parameterized queries
- Implement rate limiting

See [Security Policy](../security/README.md) for complete security guidelines.

## Getting Help

- Check [Local Runbook](../../spec/LOCAL_RUNBOOK.md)
- Review [ARCHITECTURE_DECISIONS.md](../../spec/ARCHITECTURE_DECISIONS.md)
- Check [GitHub Issues](https://github.com/chimera-defi/specforge/issues)
- Contact: chimera_defi@protonmail.com

## Contributing

1. Read this guide
2. Read [AGENTS.md](../../AGENTS.md)
3. Read [CLAUDE.md](../../CLAUDE.md)
4. Create a feature branch
5. Make your changes
6. Run verification
7. Create a PR with proper template
8. Address review feedback
9. Merge when approved

## Meta Learnings

Keep these principles in mind:
- Treat placeholder content as technical debt
- Keep pricing/plans on shared contracts
- Require explicit design contracts for UI
- Split large UI components early
- Split persistence by domain
- Run verification sequentially
- Desktop should wrap existing architecture first
- Split MVP parity from platform parity
- Require runtime topology in specs
- Require acceptance tests in specs
- Prefer CSS modules over inline styles
- Add confirmation dialogs for destructive actions
- Use list-based fallbacks for search APIs
- Archive docs rather than delete
- Regularly prune obsolete content
- Cross-platform packaging requires valid assets
- Desktop configuration should be user-accessible
- Log capture should use piped stdout/stderr

## Additional Resources

- [API Documentation](../../web/src/app/api-docs) - Interactive API documentation
- [OpenAPI Specification](../../web/src/lib/api/openapi-spec.ts) - API spec for SDK generation
- [SDK Generation Guide](./SDK_GENERATION.md) - Generate client SDKs from OpenAPI spec
- [Operations Guide](../operations/README.md) - Deployment and operations
- [Security Policy](../security/README.md) - Security documentation