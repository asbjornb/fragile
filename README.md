# Fragile

An incremental rogue-civilization browser game where civilizations rise and inevitably fall.

## Overview

Control a lone settler exploring a fog-covered world, found a city, manage resources, and survive as long as possible before inevitable collapse. Each run leaves ruins that affect future playthroughs.

## Key Features

- **Hexagonal exploration** with fog-of-war
- **City building** with resource management
- **Dynamic threats** (bandits, harsh winters, civil unrest)
- **Legacy system** where past runs affect future maps
- **Pure client-side** - no server required

## Tech Stack

- TypeScript + Vite
- PixiJS for rendering
- Zustand for state management
- Local storage for saves

## Development

```bash
npm install
npm run dev
```

**Cross-Platform Note**: If using WSL + Windows, don't share the same project folder between them due to conflicting `node_modules` binaries. Either:
- Work entirely in WSL (recommended): `git clone` inside WSL at `~/code/fragile`
- Or keep separate copies of the project in each environment

### Pre-commit Hook (Optional)

Install a pre-commit hook that runs `npm run build` before each commit to catch TypeScript errors:

```bash
npm run setup-hooks
```

To bypass the hook if needed:
```bash
git commit --no-verify
```

## Testing

```bash
# Install Playwright browsers (first time only)
npm run test:install

# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

## Hosting

Designed for static hosting on platforms like Cloudflare Pages.

---

See [SPEC.md](./SPEC.md) for detailed game design specification.