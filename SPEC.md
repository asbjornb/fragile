# Fragile - an Incremental Rogue-Civ – Version 1.0 Specification

---
## 1 • Vision & Design Pillars
1. **Civilizations Rise and Fall** – Each run captures the full arc from lone settler ➜ thriving city ➜ inevitable collapse.
2. **Meaningful Micro-Choices** – Incremental depth (small, frequent upgrades) without idle timers or forced waiting.
3. **Harsh Yet Fair World** – Fog-of-war exploration, scarce resources, unpredictable threats.
4. **Legacy Across Ruins** – Ruins of past runs persist and subtly alter future maps (lore, minor bonuses, achievements).

---
## 2 • Target Audience & Platform
* **Platform:** Web-based (browser).
* **Audience:** Fans of *Civilization*, *Rogue-likes*, incremental / management sims who prefer active play over idle.
* **Session Length:** 10-60 minutes per run, with auto-saving to allow stopping and resuming.

---
## 3 • Core Gameplay Loop
1. **Spawn & Scout** – Control a single *Settler* unit with limited line-of-sight (LOS = 2 hexes).
2. **Settle** – Choose a hex; found a **City**.
3. **Develop** – Upgrade city buildings, manage population and food.
4. **Respond** – Handle dynamic events (bandit raids, winters, unrest).
5. **Collapse** – City fails when population or integrity hits 0.
6. **Legacy Screen** – Shows stats, prestige bonuses, and past civilizations. Can also be accessed in-game (pauses gameplay).

---
## 4 • World & Map
| Feature | Details |
|---------|---------|
| **Grid Shape** | Hexagonal tiles, unlimited map size. |
| **Tile Types** | Plains, Forest, Hill, Mountain, River, Lake, Ruins. |
| **Resource Nodes** | Wood (Forest), Stone (Hill), Ore (Mountain), Wild Game (Plains), Fish (River/Lake). |
| **LOS** | Settler sees 2 hexes; cities see adjacent ring. |
| **Ruins Generation** | Existing at world start + generated from previous runs. |

---
## 5 • Units & Actions
### 5.1 Units
* **Settler** – Movement = 1 hex per move; consumes food per move. Vulnerable to attacks while exploring.

### 5.2 Player Actions (Settler Phase)
| Action | Cost | Effect |
|--------|------|--------|
| Move Settler | 1 action | Consumes food; reveals tiles. Triggers map simulation tick. |
| Found City | Consumes settler | Transitions to city-building phase. |

### 5.3 Player Actions (City Phase)
| Action | Cost | Effect |
|--------|------|--------|
| Build | Variable resources | Adds building / upgrade. |
| Assign Jobs | Food/population | Improves resource output. |
| Manage Resources | Real-time effect | Balances growth, defense, and unrest. |

---
## 6 • Buildings & Tech (V1 subset)
| Building | Prereq | Output / Effect | Base Cost | Scaling |
|----------|--------|-----------------|-----------|---------|
| Hut | None | +2 pop capacity. | 8 wood, 2 food | 1.10x exponential |
| Farm | Plains adjacent | +3 food / tick. | 5 wood, 2 stone | 1.15x exponential |
| Shed | Wood storage maxed | +25 wood storage. | 10 wood | 1.08x exponential |
| Lumber Yard | Forest adjacent | +2 wood / tick. | 6 wood, 4 stone | 1.12x exponential |
| Quarry | Hill adjacent | +2 stone / tick. | 8 wood, 3 food | 1.20x exponential |
| Watchtower | Tech "Defenses" | Extends city LOS; improves defense. | TBD | TBD |
| Guard Post | None | Provides defense vs bandits/unrest (not a unit). | TBD | TBD |

**Building Mechanics:**
- **Scaling Costs:** Each building type uses exponential cost scaling with unique factors
- **Progressive Unlocks:** Buildings unlock based on gameplay conditions (e.g., shed unlocks when wood storage is first maxed)
- **Max Levels:** Most buildings cap at level 3-5 for balance
- **Worker Requirements:** Production buildings (Farm, Lumber Yard, Quarry) require assigned workers
- **Terrain Requirements:** Some buildings require specific adjacent terrain types

**Tech Tree (Linear for V1)**
1. **Basic Tools** – Unlock Quarry.
2. **Defenses** – Unlock Watchtower, Guard Post.
3. **Writing** – Enables legacy panel access, +10% research speed.

---
## 7 • Simulation & Time
* **Phase 1 (Exploration):** Player-directed turns, but events still tick forward to feel real-time.
* **Phase 2 (City Phase):** Real-time simulation begins (resource ticks, event timers, etc.).
* **Seasons:** 120 ticks/Year. Winter reduces food output by 50%. Random harsh winter event (-75%).
* **Bandit Spawn:** Bandit camps appear at edge; begin attacks after X ticks.

---
## 8 • Economy & People
| Resource | Use |
|----------|-----|
| **Food** | Consumed each tick by population and by settler while exploring. |
| **Wood** | Building materials, defense buildings. |
| **Stone** | Advanced structures. |
| **Research** | Unlocks tech. Gained passively by population after *Writing*. |

* **Population Growth:** Surplus food leads to slow growth. Capped by housing.
* **Unrest:** From overcrowding/starvation; >70% unrest = risk of civil collapse.

---
## 9 • Threats & Collapse
| Threat | Trigger | Outcome |
|--------|---------|---------|
| **Bandit Raid** | Bandit camp timer expires | Damages city unless defenses present. |
| **Harsh Winter** | Random seasonal event | Reduces food production. |
| **Civil Unrest** | High unrest | Can damage buildings or reduce population. |

**Collapse Conditions**
* Population ≤ 0 or Integrity ≤ 0.
* Triggers automatic prestige; shows legacy summary.

---
## 10 • Prestige & Legacy System (V1)
* **Relic Shards:** Earned from unlocking tech, surviving winters, and reaching milestones.
* **Legacy Bonuses:** Up to +20% production across runs (in V1).
* **Ruins:** Old cities become ruins with minor bonuses (e.g. +1 stone).
* **Hidden Achievements:** Cosmetic or humorous (e.g. "Died before Settling").
* **Legacy Panel:** Can be accessed mid-game, pauses game state.

---
## 11 • User Interface
* **Single-Screen Focus:** All gameplay on one screen per phase (exploration vs. city).
* **Top Bar:** Resources, population, integrity, unrest.
* **Sidebar (Contextual):** Settler phase – move/log. City phase – build/jobs/tech.
* **Overlay Buttons:** Access to legacy, pause, help.
* **Map:** Top-down hex grid with fog-of-war.

---
## 12 • Art & Audio Direction
* **Style:** Clean pixel-art or minimalist vector style, readable at a glance.
* **Audio:** Soft ambient loops with cues for events (bandit horn, winter chill).

---
## 13 • Technical Stack & Architecture

### Core Stack
* **TypeScript** + **Vite** for build tooling
* **PixiJS** for 2D rendering (hex grid, sprites, animations)
* **Zustand** for state management (lightweight, perfect for game state)
* **Local Storage** for save/load system

### Project Structure
```
src/
├── core/           # Game engine layer
│   ├── game.ts     # Main game loop
│   ├── world.ts    # Map generation & simulation
│   └── save.ts     # Save/load system
├── entities/       # Game objects
│   ├── settler.ts
│   ├── city.ts
│   └── buildings/
├── systems/        # Game systems
│   ├── movement.ts
│   ├── resources.ts
│   ├── events.ts
│   └── prestige.ts
├── ui/            # React components for UI panels
├── data/          # JSON configs for buildings, tech, etc.
└── assets/        # Sprites, audio
```

### Architecture Benefits
* **Pure client-side** – Perfect for Cloudflare Pages hosting
* **PixiJS** handles hex grid rendering efficiently
* **TypeScript** enables data-driven design
* **Vite** provides fast dev experience and optimized builds
* **Zustand** keeps game state predictable for save/load
* **Modular Data** – Tiles, buildings, techs are data-driven for future mod support

---
## 14 • Testing & Balance Goals
* First run survives at least 50 ticks on average.
* Losing before settling = very rare, but possible.
* Collapse triggers should feel earned, not random.

---
## 15 • Milestones
1. **Pre-Alpha (Month 1)** – Hex grid, settler movement, fog of war.
2. **Alpha (Month 2)** – Resource nodes, building system, collapse triggers.
3. **Beta (Month 3)** – Bandit raids, unrest, legacy screen, prestige.
4. **Content Lock (Month 4)** – UI finalization, balance pass.
5. **Release V1.0 (Month 5)** – Web demo on personal site.

---
## 16 • Out-of-Scope for V1 (Backlog)
* Multiple cities.
* Race/faction selection.
* Space and time mechanics.
* Diplomacy, trade systems.
* Multiplayer or online integration.

---
*Document version: 2025-06-15 (Revised)*

