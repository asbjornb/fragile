import { HexCoordinate, HexUtils } from '../core/hex';
import buildingsData from '../data/buildings.json';
import { WorldGenerator } from '../systems/worldgen';

export interface City {
  id: string;
  name: string;
  position: HexCoordinate;
  population: number;
  maxPopulation: number;
  availableWorkers: number;
  integrity: number;
  maxIntegrity: number;
  unrest: number;
  maxUnrest: number;
  resources: {
    food: number;
    wood: number;
    stone: number;
    research: number;
  };
  storage: {
    food: number;
    wood: number;
    stone: number;
    research: number;
  };
  buildings: Building[];
  founded: number; // timestamp
}

export interface Building {
  id: string;
  type: string;
  name: string;
  position?: HexCoordinate; // relative to city center
  level: number;
  maxLevel: number;
  assignedWorkers: number;
  maxWorkers: number;
}

export interface BuildingType {
  id: string;
  name: string;
  description: string;
  baseCost: {
    wood?: number;
    stone?: number;
    food?: number;
  };
  pricing: {
    scalingFactor: number;
    scalingType: 'exponential' | 'linear' | 'fixed';
  };
  effects: {
    populationCapacity?: number;
    foodPerTick?: number;
    woodPerTick?: number;
    stonePerTick?: number;
    researchPerTick?: number;
    woodStorage?: number;
    stoneStorage?: number;
    foodStorage?: number;
  };
  requiresWorker?: boolean;
  requiresTerrain?: string[];
  buildTime: number;
  maxLevel: number;
  icon: string;
}

export class CitySystem {
  private city: City | null = null;
  private buildingTypes: Map<string, BuildingType> = new Map();
  private unlockedBuildings: Set<string> = new Set();
  private worldGenerator: WorldGenerator;
  private storyCallback?: (buildingName: string) => void;

  constructor(worldGenerator: WorldGenerator) {
    this.worldGenerator = worldGenerator;
    this.loadBuildingData();
    this.initializeUnlocks();
  }

  private initializeUnlocks() {
    // Buildings available from the start
    this.unlockedBuildings.add('hut');
    this.unlockedBuildings.add('farm');
    this.unlockedBuildings.add('lumber_yard');
    this.unlockedBuildings.add('quarry');
    // shed is unlocked later when wood storage is maxed
    // library is unlocked when population reaches 10
  }

  private loadBuildingData() {
    Object.values(buildingsData.buildings).forEach(building => {
      this.buildingTypes.set(building.id, building as BuildingType);
    });
  }

  foundCity(position: HexCoordinate, settlerFood: number): City {
    if (this.city) {
      throw new Error('City already exists');
    }

    this.city = {
      id: 'city_1',
      name: 'New Settlement',
      position: { ...position },
      population: 1,
      maxPopulation: 3, // Base capacity
      availableWorkers: 1,
      integrity: 100,
      maxIntegrity: 100,
      unrest: 0,
      maxUnrest: 100,
      resources: {
        food: Math.min(settlerFood, 15), // Transfer settler's food to city, capped by storage
        wood: 5, // Starting wood
        stone: 0,
        research: 0
      },
      storage: {
        food: 15, // Base storage
        wood: 20,
        stone: 10,
        research: 10
      },
      buildings: [
        {
          id: 'townhall_1',
          type: 'town_hall',
          name: 'Town Hall',
          level: 1,
          maxLevel: 5,
          assignedWorkers: 0,
          maxWorkers: 0
        }
      ],
      founded: Date.now()
    };

    // Check for initial unlocks
    this.checkUnlocks();

    return { ...this.city };
  }

  getCity(): City | null {
    return this.city ? { ...this.city } : null;
  }

  hasCity(): boolean {
    return this.city !== null;
  }

  // Building management
  getBuildingTypes(): BuildingType[] {
    return Array.from(this.buildingTypes.values()).filter(building => 
      this.unlockedBuildings.has(building.id)
    );
  }

  private checkUnlocks(): void {
    if (!this.city) return;

    // Unlock shed when wood storage is maxed out
    if (!this.unlockedBuildings.has('shed') && this.city.resources.wood >= this.city.storage.wood) {
      this.unlockedBuildings.add('shed');
      console.log('🏚️ Shed unlocked! Wood storage was maxed out.');
      
      // Trigger story message
      if (this.storyCallback) {
        this.storyCallback('shed');
      }
    }

    // Unlock library when population reaches 10
    if (!this.unlockedBuildings.has('library') && this.city.population >= 10) {
      this.unlockedBuildings.add('library');
      console.log('📚 Library unlocked! Your settlement has grown large enough to support scholarly pursuits.');
      
      // Trigger story message
      if (this.storyCallback) {
        this.storyCallback('library');
      }
    }
  }

  setStoryCallback(callback: (buildingName: string) => void): void {
    this.storyCallback = callback;
  }

  hasResearchBuilding(): boolean {
    if (!this.city) return false;
    return this.city.buildings.some(building => building.type === 'library');
  }

  private getTerrainBonusRadius(): number {
    // Base radius of 1 (adjacent tiles + center)
    // This can be extended later by tech/buildings
    return 1;
  }

  private getTerrainBonus(buildingType: string): number {
    if (!this.city) return 0;

    const radius = this.getTerrainBonusRadius();
    let bonusMultiplier = 0;

    // Get all hexes within radius (including center tile)
    const hexesToCheck: HexCoordinate[] = [];
    
    // Add center tile (the city tile itself)
    hexesToCheck.push(this.city.position);
    
    // Add tiles within radius
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
        const hex = { q: this.city.position.q + q, r: this.city.position.r + r };
        
        // Skip center tile (already added)
        if (hex.q === this.city.position.q && hex.r === this.city.position.r) continue;
        
        // Only include if within actual radius
        if (HexUtils.hexDistance(this.city.position, hex) <= radius) {
          hexesToCheck.push(hex);
        }
      }
    }

    hexesToCheck.forEach((coord: HexCoordinate) => {
      const tile = this.worldGenerator.getTile(coord);
      if (!tile) return;

      // Apply terrain bonuses based on building type
      switch (buildingType) {
        case 'lumber_yard':
          if (tile.type.id === 'forest') {
            bonusMultiplier += 0.10; // +10% per forest tile
          }
          break;
        case 'quarry':
          if (tile.type.id === 'hill' || tile.type.id === 'mountain') {
            bonusMultiplier += 0.20; // +20% per hill/mountain tile
          }
          break;
        case 'farm':
          if (tile.type.id === 'plains') {
            bonusMultiplier += 0.05; // +5% per plains tile
          }
          break;
      }
    });

    return bonusMultiplier;
  }

  // Calculate current cost for a building type based on how many have been built
  getCurrentBuildingCost(buildingTypeId: string): { wood?: number; stone?: number; food?: number } {
    if (!this.city) return {};
    
    const buildingType = this.buildingTypes.get(buildingTypeId);
    if (!buildingType) return {};

    // Count how many of this building type exist
    const existingCount = this.city.buildings.filter(b => b.type === buildingTypeId).length;
    
    const scaledCost: { wood?: number; stone?: number; food?: number } = {};
    
    for (const [resource, baseCost] of Object.entries(buildingType.baseCost)) {
      if (baseCost !== undefined) {
        let currentCost: number;
        
        switch (buildingType.pricing.scalingType) {
          case 'exponential':
            currentCost = Math.ceil(baseCost * Math.pow(buildingType.pricing.scalingFactor, existingCount));
            break;
          case 'linear':
            currentCost = Math.ceil(baseCost * (1 + (buildingType.pricing.scalingFactor - 1) * existingCount));
            break;
          case 'fixed':
          default:
            currentCost = baseCost;
            break;
        }
        
        scaledCost[resource as keyof typeof scaledCost] = currentCost;
      }
    }
    
    return scaledCost;
  }

  canBuildBuilding(buildingTypeId: string): { canBuild: boolean; reason?: string } {
    if (!this.city) return { canBuild: false, reason: 'No city' };
    
    const buildingType = this.buildingTypes.get(buildingTypeId);
    if (!buildingType) return { canBuild: false, reason: 'Unknown building type' };

    // Get current scaled cost
    const currentCost = this.getCurrentBuildingCost(buildingTypeId);

    // Check resource costs
    for (const [resource, cost] of Object.entries(currentCost)) {
      if (this.city.resources[resource as keyof City['resources']] < (cost || 0)) {
        return { canBuild: false, reason: `Not enough ${resource}` };
      }
    }

    return { canBuild: true };
  }

  buildBuilding(buildingTypeId: string): { success: boolean; building?: Building; error?: string } {
    if (!this.city) return { success: false, error: 'No city' };
    
    const buildingType = this.buildingTypes.get(buildingTypeId);
    if (!buildingType) return { success: false, error: 'Unknown building type' };

    const canBuild = this.canBuildBuilding(buildingTypeId);
    if (!canBuild.canBuild) {
      return { success: false, error: canBuild.reason };
    }

    // Get current scaled cost and spend resources
    const currentCost = this.getCurrentBuildingCost(buildingTypeId);
    for (const [resource, cost] of Object.entries(currentCost)) {
      this.city.resources[resource as keyof City['resources']] -= (cost || 0);
    }

    // Create building
    const newBuilding: Building = {
      id: `${buildingTypeId}_${Date.now()}`,
      type: buildingTypeId,
      name: buildingType.name,
      level: 1,
      maxLevel: buildingType.maxLevel,
      assignedWorkers: 0,
      maxWorkers: buildingType.requiresWorker ? 1 : 0
    };

    this.city.buildings.push(newBuilding);
    this.applyBuildingEffects();
    
    // Check for unlocks after building (in case building affects storage capacity)
    this.checkUnlocks();

    return { success: true, building: newBuilding };
  }

  private applyBuildingEffects() {
    if (!this.city) return;

    // Reset to base values
    this.city.maxPopulation = 3; // Base capacity
    this.city.storage = {
      food: 15,
      wood: 20,
      stone: 10,
      research: 10
    };

    // Apply building effects
    this.city.buildings.forEach(building => {
      const buildingType = this.buildingTypes.get(building.type);
      if (!buildingType) return;

      const effects = buildingType.effects;
      if (effects.populationCapacity) {
        this.city!.maxPopulation += effects.populationCapacity * building.level;
      }
      if (effects.woodStorage) {
        this.city!.storage.wood += effects.woodStorage * building.level;
      }
      if (effects.foodStorage) {
        this.city!.storage.food += effects.foodStorage * building.level;
      }
      if (effects.stoneStorage) {
        this.city!.storage.stone += effects.stoneStorage * building.level;
      }
    });

    // Update population and workers based on max population
    this.city.population = Math.min(this.city.population, this.city.maxPopulation);
    
    // Calculate total assigned workers
    const assignedWorkers = this.city.buildings.reduce((total, building) => {
      return total + building.assignedWorkers;
    }, 0);
    
    // Available workers = population - assigned workers
    this.city.availableWorkers = this.city.population - assignedWorkers;

    // Cap resources to storage limits
    this.city.resources.food = Math.min(this.city.resources.food, this.city.storage.food);
    this.city.resources.wood = Math.min(this.city.resources.wood, this.city.storage.wood);
    this.city.resources.stone = Math.min(this.city.resources.stone, this.city.storage.stone);
  }

  // Resource production (called each tick)
  generateResources(): void {
    if (!this.city) return;

    // Base city production (no workers needed)
    this.city.resources.wood = Math.min(
      this.city.resources.wood + 1, 
      this.city.storage.wood
    );
    this.city.resources.stone = Math.min(
      this.city.resources.stone + 1, 
      this.city.storage.stone
    );

    // Check for building unlocks after resource changes
    this.checkUnlocks();

    // Population growth (if we have food surplus and space)
    if (this.city.resources.food >= 3 && this.city.population < this.city.maxPopulation) {
      // Every 5 ticks with food surplus, grow population
      const growthChance = 0.2; // 20% chance per tick when conditions are met
      if (Math.random() < growthChance) {
        this.city.population++;
        this.city.resources.food -= 3; // Population growth consumes food
        this.applyBuildingEffects(); // Recalculate available workers
      }
    }

    // Building production (with workers and terrain bonuses)
    this.city.buildings.forEach(building => {
      const buildingType = this.buildingTypes.get(building.type);
      if (!buildingType || building.assignedWorkers === 0) return;

      const effects = buildingType.effects;
      const workerRatio = building.assignedWorkers / building.maxWorkers;
      const terrainBonus = this.getTerrainBonus(building.type);
      const productionMultiplier = 1 + terrainBonus;

      if (effects.foodPerTick) {
        const production = Math.floor(effects.foodPerTick * workerRatio * building.level * productionMultiplier);
        this.city!.resources.food = Math.min(
          this.city!.resources.food + production,
          this.city!.storage.food
        );
      }
      if (effects.woodPerTick) {
        const production = Math.floor(effects.woodPerTick * workerRatio * building.level * productionMultiplier);
        this.city!.resources.wood = Math.min(
          this.city!.resources.wood + production,
          this.city!.storage.wood
        );
      }
      if (effects.stonePerTick) {
        const production = Math.floor(effects.stonePerTick * workerRatio * building.level * productionMultiplier);
        this.city!.resources.stone = Math.min(
          this.city!.resources.stone + production,
          this.city!.storage.stone
        );
      }
      if (effects.researchPerTick) {
        const production = Math.floor(effects.researchPerTick * workerRatio * building.level);
        this.city!.resources.research += production; // Research has no storage limit
      }
    });
  }

  // Worker management
  assignWorker(buildingId: string): boolean {
    if (!this.city) return false;

    const building = this.city.buildings.find(b => b.id === buildingId);
    if (!building) return false;

    if (this.city.availableWorkers <= 0) return false;
    if (building.assignedWorkers >= building.maxWorkers) return false;

    building.assignedWorkers++;
    // Recalculate available workers
    this.applyBuildingEffects();
    return true;
  }

  unassignWorker(buildingId: string): boolean {
    if (!this.city) return false;

    const building = this.city.buildings.find(b => b.id === buildingId);
    if (!building) return false;

    if (building.assignedWorkers <= 0) return false;

    building.assignedWorkers--;
    // Recalculate available workers
    this.applyBuildingEffects();
    return true;
  }

  // Unassign all workers from all buildings
  unassignAllWorkers(): void {
    if (!this.city) return;

    this.city.buildings.forEach(building => {
      building.assignedWorkers = 0;
    });
    this.applyBuildingEffects();
  }

  // Worker assignment by building type
  assignWorkerToType(buildingTypeId: string): boolean {
    if (!this.city) return false;

    // Find the first building of this type that has available worker slots
    const building = this.city.buildings.find(b => 
      b.type === buildingTypeId && 
      b.assignedWorkers < b.maxWorkers
    );
    
    if (!building) return false;
    if (this.city.availableWorkers <= 0) return false;

    building.assignedWorkers++;
    this.applyBuildingEffects();
    return true;
  }

  unassignWorkerFromType(buildingTypeId: string): boolean {
    if (!this.city) return false;

    // Find the first building of this type that has assigned workers
    const building = this.city.buildings.find(b => 
      b.type === buildingTypeId && 
      b.assignedWorkers > 0
    );
    
    if (!building) return false;

    building.assignedWorkers--;
    this.applyBuildingEffects();
    return true;
  }

  // Get worker assignment info for debugging
  getWorkerInfo(): { population: number; assigned: number; available: number; buildings: Array<{name: string; assigned: number; max: number}> } {
    if (!this.city) return { population: 0, assigned: 0, available: 0, buildings: [] };

    const assigned = this.city.buildings.reduce((total, building) => total + building.assignedWorkers, 0);
    const buildings = this.city.buildings
      .filter(b => b.maxWorkers > 0)
      .map(b => ({
        name: b.name,
        assigned: b.assignedWorkers,
        max: b.maxWorkers
      }));

    return {
      population: this.city.population,
      assigned,
      available: this.city.availableWorkers,
      buildings
    };
  }
}