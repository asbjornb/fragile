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

## In Progress / Pending

### High Priority
- ✅ Implement save/load system with localStorage
- ⏳ Update spec with decisions made

### Medium Priority
- ⏳ Add dynamic events (bandit raids, harsh winters)
- ⏳ Implement unrest and collapse mechanics
- ⏳ Create legacy/prestige system

### Low Priority
- ⏳ Implement guard posts and watchtowers
- ⏳ Implement proper resource node rendering system
- ⏳ Add small powershell script to append all docs and copy to clipboard

---

## Notes
- Settler movement with smooth animation ✅
- Camera follows settler ✅ 
- Food counter working ✅
- Procedural map generation with tile types ✅
- Building system with scaling costs ✅