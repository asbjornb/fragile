# Claude Context

This is a browser game project called "Fragile" - an incremental rogue-civilization game.

The full game specification is in [SPEC.md](./SPEC.md).

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Type checking only (faster than build)
- `npm run test` - Run Playwright tests
- `npm run test:ui` - Run tests with UI
- `npm run test:install` - Install Playwright browsers (first time only)

## General instructions

If in doubt consider checking the docs at [SPEC.md](./SPEC.md), [README.md](./README.md), [TODO.md](./TODO.md), [tech-snapshot.md](./tech-snapshot.md).

After each change update relevant docs [SPEC.md](./SPEC.md), [README.md](./README.md), [TODO.md](./TODO.md), [tech-snapshot.md](./tech-snapshot.md)

## Quality Assurance

Always run `npm run build` after making code changes to verify they work correctly.