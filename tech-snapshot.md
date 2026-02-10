# Fragile - Technical Snapshot

*Version: Pre-Alpha - Basic Exploration*  
*Date: 2025-06-16*

## Current Features

### Core Gameplay
- **Settler exploration** with click-to-move mechanics
- **Procedural world generation** with 6 tile types, 5 resource types, and adaptive terrain clustering
- **Fog-of-war system** with visibility and exploration tracking
- **Resource management** with food consumption (20 starting food, -1 per move)
- **City founding mechanics** with transition from exploration to city management
- **Building system** with 8 building types (hut, farm, shed, lumber_yard, quarry, library, granary, warehouse, hunters_lodge)
- **Progressive building unlocks** - storage buildings unlock when respective resource is maxed, library at population 10, hunter's lodge via Hunting tech
- **Terrain-based production bonuses** - buildings gain efficiency from terrain within radius (includes city center)
- **Interactive terrain legend** - shows terrain types and production bonuses during exploration phase
- **Clean UI organization** - exploration shows food counter, city mode hides top bar and uses organized left sidebar
- **Worker assignment** and resource production systems
- **Scaling costs** with exponential pricing for building upgrades
- **Smooth movement animations** (300ms with easing)

### Technical Architecture

#### Frontend Stack
- **TypeScript + Vite** for development and building
- **PixiJS** for 2D rendering and animations
- **Zustand** for state management (prepared, not yet implemented)
- **React** for UI components (prepared, not yet used)

#### Core Systems

**Hex Grid System** (`src/core/hex.ts`)
- Axial coordinate system (q, r)
- Pixel ↔ hex coordinate conversion
- Distance calculations and neighbor finding
- 28px hex size with proper math

**Rendering Engine** (`src/core/renderer.ts`)
- PixiJS-based hex grid renderer
- Camera system that follows settler
- Procedural tile rendering (6-hex radius)
- Resource node visualization
- Fog-of-war visual states

**World Generation** (`src/systems/worldgen.ts`)
- Seeded procedural generation
- Weighted tile distribution
- Resource spawn system (30% chance)
- Infinite world support

**Visibility System** (`src/systems/visibility.ts`)
- 2-hex line-of-sight around settler
- Tracks visible vs explored hexes
- Used for fog-of-war rendering

**Input System** (`src/systems/input.ts`)
- Mouse click handling with camera offset compensation
- Hex coordinate conversion from screen coordinates
- Adjacent-only movement validation
- Touch-optimized via CSS `touch-action: manipulation`

**Save System** (`src/core/save.ts`)
- Versioned save format (v1)
- Auto-save on game tick, movement, building, and city founding
- Save on page unload
- Title screen with New Game / Continue
- localStorage-based persistence

**Game Controller** (`src/core/game.ts`)
- Orchestrates all systems
- Handles movement logic and validation
- Manages animation callbacks
- Controls phase transitions (exploration → city management)
- Mobile-responsive layout with toggleable overlay sidebars (<768px)
- Save/load integration with full state restoration

**City Management** (`src/entities/city.ts`)
- Population and worker management
- Resource storage with capacity limits
- Building construction and upgrades
- Progressive building unlock system (resource-based, population-based, and tech-based)
- Terrain-based production calculation system
- Tech effects applied to production (worker efficiency, food/stone bonuses) and building costs (cost reduction)
- Food consumption per population per tick (ceil(pop/3), reduced by Preservation tech)
- Integrity and unrest tracking

#### Data-Driven Design

**Tile Configuration** (`src/data/tiles.json`)
```json
{
  "plains": { "color": "#9ACD32", "resources": ["wild_game"], "weight": 40 },
  "forest": { "color": "#228B22", "resources": ["wood"], "weight": 25 },
  // ... etc
}
```

**Building Configuration** (`src/data/buildings.json`)
```json
{
  "hut": { "baseCost": { "wood": 8, "food": 2 }, "effects": { "populationCapacity": 2 } },
  "farm": { "baseCost": { "wood": 5, "stone": 2 }, "effects": { "foodPerTick": 1 }, "requiresTerrain": ["plains"] },
  "granary": { "baseCost": { "wood": 12, "stone": 5 }, "effects": { "foodStorage": 20 } },
  "warehouse": { "baseCost": { "wood": 15, "stone": 8 }, "effects": { "stoneStorage": 15 } },
  "hunters_lodge": { "baseCost": { "wood": 10, "food": 3 }, "effects": { "foodPerTick": 1 }, "requiresTerrain": ["forest", "plains"] }
  // ... etc
}
```

**Tech Configuration** (`src/data/techs.json`)
- 9 technologies across 3 branches: Tools, Agriculture, Construction
- Tech effects: workerEfficiency, foodProduction, stoneProduction, buildingCostReduction, foodConsumptionReduction
- Tech-based building unlocks (e.g., Hunting tech unlocks Hunter's Lodge)

**Procedural Generation**
- Deterministic seeded random using coordinate hashing
- Weighted tile selection (Plains 40%, Forest 25%, Hills 20%, etc.)
- Resource spawning based on tile type compatibility

### Visual Design

**Color Scheme**
- **Visible tiles**: Full vibrant colors
- **Explored tiles**: 40% darker versions
- **Unexplored**: Black (fog-of-war)
- **Settler**: Blue circle with white border
- **Resources**: Colored dots matching resource type

**Animation System**
- Smooth settler movement between hexes
- Camera interpolation following settler
- Ease-out animation curves (300ms duration)
- Non-blocking animations with completion callbacks

### File Structure
```
src/
├── core/           # Engine layer
│   ├── game.ts     # Main game controller
│   ├── hex.ts      # Hexagonal coordinate system
│   ├── renderer.ts # PixiJS rendering engine
│   └── save.ts     # Save/load system with localStorage
├── entities/       # Game objects
│   ├── settler.ts  # Settler entity and logic
│   └── city.ts     # City entity and management
├── systems/        # Game systems
│   ├── input.ts    # Mouse input handling
│   ├── visibility.ts # Fog-of-war system
│   └── worldgen.ts # Procedural world generation
├── data/           # Configuration
│   ├── tiles.json  # Tile and resource definitions
│   └── buildings.json # Building configurations
└── main.ts         # Application entry point
```

### Testing
- **Playwright** E2E testing setup
- Basic smoke tests for rendering and console output
- Manual testing for gameplay mechanics

### Deployment
- **GitHub Pages**: Automatic via `.github/workflows/deploy.yml` on push to `main`. Uses base path `/fragile/`.
- **Cloudflare Pages**: Dashboard-connected. Cloudflare sets `CF_PAGES=1` env var, which Vite detects to use base path `/` instead of `/fragile/`.

### Development Workflow
```bash
npm run dev      # Development server
npm run build    # Production build
npm run test     # Run Playwright tests
```

## Technical Decisions

### Why PixiJS?
- High-performance 2D rendering
- Excellent for hex grid games
- Built-in animation support
- WebGL acceleration

### Why Axial Coordinates?
- Simpler math than offset coordinates
- Better for algorithms (pathfinding, distance)
- Standard in hex grid libraries

### Why Seeded Generation?
- Consistent world across sessions
- Deterministic for testing
- Allows for future save/load features

### Performance Optimizations
- **Viewport culling**: Only renders 6-hex radius
- **Tile caching**: Generated tiles stored in memory
- **Graphics reuse**: Hex graphics cached by coordinate
- **Animation batching**: Single animation loop

## Known Limitations

1. **No dynamic events** - No bandit raids, harsh winters, or unrest mechanics
2. **Memory growth** - Generated tiles never cleaned up
3. **Ore/fish unused** - Defined in tiles but not yet consumed by any building or mechanic

## Next Planned Features
1. Implement unrest and collapse mechanics
2. Add dynamic events (bandit raids, harsh winters)
3. Create legacy/prestige system
4. Add more content (buildings using ore, defense buildings)

---

*This snapshot represents the foundation for the incremental rogue-civilization game described in SPEC.md*