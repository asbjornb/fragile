# Fragile - Technical Snapshot

*Version: Alpha - Full Mechanics*
*Date: 2026-02-11*

## Current Features

### Core Gameplay
- **Settler exploration** with click-to-move mechanics
- **Procedural world generation** with 7 tile types (including ruins), 5 resource types, and adaptive terrain clustering
- **Fog-of-war system** with visibility and exploration tracking
- **Resource management** with food consumption (20 starting food, -1 per move)
- **City founding mechanics** with transition from exploration to city management
- **Building system** with 16 building types (hut, farm, shed, lumber_yard, quarry, library, granary, warehouse, hunters_lodge, stoneworks, sawmill, bakery, monument, storehouse, guard_post, watchtower)
- **Progressive building unlocks** - storage buildings unlock when respective resource is maxed, library at population 10, guard_post from start, tech-gated buildings (hunter's lodge via Hunting, stoneworks/monument via Masonry, sawmill via Advanced Tools, bakery via Crop Rotation, storehouse via Construction, watchtower via Defenses)
- **Terrain-based production bonuses** - buildings gain efficiency from terrain within radius (includes city center)
- **Seasons system** - 120 ticks/year, 4 seasons (Spring/Summer/Autumn/Winter), Winter reduces food production by 50%, harsh winter random event reduces by 75%
- **Unrest & integrity mechanics** - Starvation and overcrowding increase unrest, monuments reduce unrest, >70% unrest triggers civil unrest events, integrity tracks city structural health
- **Dynamic events** - Bandit raids (defense-dependent damage), harsh winters, civil unrest (moderate/severe), starvation warnings
- **Defense system** - Guard posts and watchtowers provide defense rating, raids compare against defense to determine outcome
- **Collapse mechanics** - Game over when population or integrity hits 0, shows collapse screen with stats and legacy rewards
- **Legacy/prestige system** - Relic shards earned from techs, winters survived, milestones; cross-run bonuses (production, starting food, building costs); collapsed cities become ruins tiles on future maps
- **Ruins generation** - Past cities persist as ruins tiles with unique visuals (crumbled walls, golden glow), discoverable during exploration for +3 food bonus and story messages
- **Interactive terrain legend** - shows terrain types and production bonuses during exploration phase
- **Clean UI organization** - exploration shows food counter, city mode shows season/year bar, integrity/unrest/defense stats, organized left sidebar
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
- Mobile-responsive layout with toggleable overlay sidebars (<768px), compact wrapping building/research grid on mobile
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
  "ruins": { "color": "#8B7355", "resources": ["stone"], "weight": 0 },
  // ... etc (7 tile types)
}
```

**Building Configuration** (`src/data/buildings.json`)
```json
{
  "hut": { "baseCost": { "wood": 8, "food": 2 }, "effects": { "populationCapacity": 2 }, "scaling": 1.15 },
  "farm": { "baseCost": { "wood": 5, "stone": 2 }, "effects": { "foodPerTick": 1 }, "requiresTerrain": ["plains"], "scaling": 1.20 },
  "stoneworks": { "baseCost": { "wood": 20, "stone": 15, "food": 5 }, "effects": { "stonePerTick": 2 }, "requiresTerrain": ["hill", "mountain"], "scaling": 1.30 },
  "sawmill": { "baseCost": { "wood": 15, "stone": 12 }, "effects": { "woodPerTick": 2 }, "requiresTerrain": ["forest"], "scaling": 1.25 },
  "bakery": { "baseCost": { "wood": 12, "stone": 10 }, "effects": { "foodPerTick": 2 }, "scaling": 1.25 },
  "monument": { "baseCost": { "wood": 10, "stone": 30, "food": 10 }, "effects": { "populationCapacity": 5 }, "scaling": 1.50 },
  "storehouse": { "baseCost": { "wood": 20, "stone": 15 }, "effects": { "foodStorage": 15, "woodStorage": 15, "stoneStorage": 10 }, "scaling": 1.20 }
  // ... etc (14 total)
}
```

**Tech Configuration** (`src/data/techs.json`)
- 10 technologies across 4 branches: Tools, Agriculture, Construction, Defenses
- Tech effects: workerEfficiency, foodProduction, stoneProduction, buildingCostReduction, foodConsumptionReduction
- Tech-based building unlocks (Hunting→Hunter's Lodge, Masonry→Stoneworks/Monument, Advanced Tools→Sawmill, Crop Rotation→Bakery, Construction→Storehouse, Defenses→Watchtower)

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
│   ├── worldgen.ts # Procedural world generation
│   ├── events.ts   # Story messages + dynamic event system
│   ├── tech.ts     # Technology research system
│   └── prestige.ts # Legacy/prestige cross-run system
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

1. **Memory growth** - Generated tiles never cleaned up
2. **Ore/fish unused** - Defined in tiles but not yet consumed by any building or mechanic
3. **No mid-game legacy panel** - Legacy data only shown on collapse

## Next Planned Features
1. Add mid-game legacy panel access
2. Add hidden achievements
3. Add more content (buildings using ore, fish mechanics)

---

*This snapshot represents the foundation for the incremental rogue-civilization game described in SPEC.md*