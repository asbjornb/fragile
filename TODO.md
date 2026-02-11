# Fragile - Development TODO

## Completed ✅

- ✅ **Core Foundation**: Project structure (Vite + TypeScript), dependencies (PixiJS, Zustand, React), Playwright testing
- ✅ **World & Exploration**: Hex grid rendering, fog-of-war visibility, settler movement with smooth animation, procedural world generation with adaptive terrain clustering
- ✅ **City Management**: City founding, building system (8 building types), worker assignment, resource storage with scaling costs
- ✅ **UI Systems**: Resource display overlay, terrain legend with production bonuses, organized left sidebar, clean UI transitions
- ✅ **Game Systems**: Story/events system, tech tree with research mechanics (effects applied), terrain-based production bonuses
- ✅ **Content Expansion**: 3 new buildings (granary, warehouse, hunter's lodge), 2 new techs (hunting, preservation), food consumption mechanic, tech-based building unlocks, tech effects applied to production/costs
- ✅ **Resource Gating & Balance**: 5 new tech-gated buildings (stoneworks, sawmill, bakery, monument, storehouse), deeper progression chains via research prerequisites, increased building cost scaling
- ✅ **Mobile Support**: Responsive layout with toggleable sidebar overlays, touch-optimized targets, viewport zoom prevention, compact wrapping building/research grid in bottom bar
- ✅ **Save/Load System**: Auto-save with localStorage, title screen with New Game / Continue, versioned save format

- ✅ **Seasons & Time**: Season system (120 ticks/year), winter food production penalty (-50%), harsh winter random event (-75%)
- ✅ **Unrest & Integrity**: Unrest mechanics (starvation, overcrowding), integrity tracking, monument unrest reduction
- ✅ **Dynamic Events**: Bandit raids (defense-dependent), harsh winters, civil unrest (moderate/severe), starvation warnings
- ✅ **Defense System**: Guard post (available from start) and watchtower (Defenses tech) buildings, defense rating calculation
- ✅ **Collapse Mechanics**: Game over when population or integrity hits 0, collapse screen with stats
- ✅ **Legacy/Prestige System**: Relic shards earned from milestones, legacy bonuses (production, starting food, cost reduction), cross-run persistence
- ✅ **Save Migration**: v1→v2 save format migration with backwards compatibility

## In Progress / Pending

### Medium Priority
- ⏳ Implement ruins generation from past runs
- ⏳ Add legacy panel accessible mid-game (pause gameplay)
- ⏳ Update spec with all decisions made

### Low Priority
- ⏳ Implement proper resource node rendering system
- ⏳ Add hidden achievements
- ⏳ Add small powershell script to append all docs and copy to clipboard

---

## Notes
- Settler movement with smooth animation ✅
- Camera follows settler ✅ 
- Food counter working ✅
- Procedural map generation with tile types ✅
- Building system with scaling costs ✅