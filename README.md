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

## Hosting

Designed for static hosting on platforms like Cloudflare Pages.

---

See [SPEC.md](./SPEC.md) for detailed game design specification.