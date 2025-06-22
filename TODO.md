# Fragile - Development TODO

## Completed ✅

- ✅ Set up project structure with Vite + TypeScript
- ✅ Install core dependencies (PixiJS, Zustand, React)
- ✅ Create basic hex grid rendering system
- ✅ Set up minimal UI testing with Playwright
- ✅ Implement fog-of-war visibility system
- ✅ Add settler unit with movement mechanics
- ✅ Create tile types and resource node generation
- ✅ Add city founding mechanics
- ✅ Create basic building system (hut, farm, shed, lumber_yard, quarry)
- ✅ Implement worker assignment system
- ✅ Add resource storage and scaling costs
- ✅ Implement terrain legend with production bonuses
- ✅ Add terrain bonus display to city UI (moved to left sidebar Resources pane)
- ✅ Clean up UI duplication between top bar and left sidebar
- ✅ Include city center tile in terrain bonuses and make radius extensible
- ✅ Remove broken resource node rendering (will implement properly later)
- ✅ Fixed terrain generation - sorted tile types for correct weighted selection
- ✅ Added adaptive terrain clustering - rare terrain (rivers, mountains) gets strong clustering bonuses while common terrain (plains, forest) gets minimal clustering for natural formations

## In Progress / Pending

### High Priority
- ⏳ Build basic UI overlay with resource display
- ⏳ Implement save/load system with localStorage
- ⏳ Update spec with decisions made
- ⏳ Add story / events

### Medium Priority
- ⏳ Add dynamic events (bandit raids, harsh winters)
- ⏳ Implement unrest and collapse mechanics
- ⏳ Create legacy/prestige system

### Low Priority
- ⏳ Add tech tree system
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