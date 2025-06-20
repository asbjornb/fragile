import { HexCoordinate } from '../core/hex';
import buildingsData from '../data/buildings.json';

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
  cost: {
    wood?: number;
    stone?: number;
    food?: number;
  };
  effects: {
    populationCapacity?: number;
    foodPerTick?: number;
    woodPerTick?: number;
    stonePerTick?: number;
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

  constructor() {
    this.loadBuildingData();
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
    return Array.from(this.buildingTypes.values());
  }

  canBuildBuilding(buildingTypeId: string): { canBuild: boolean; reason?: string } {
    if (!this.city) return { canBuild: false, reason: 'No city' };
    
    const buildingType = this.buildingTypes.get(buildingTypeId);
    if (!buildingType) return { canBuild: false, reason: 'Unknown building type' };

    // Check resource costs
    for (const [resource, cost] of Object.entries(buildingType.cost)) {
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

    // Spend resources
    for (const [resource, cost] of Object.entries(buildingType.cost)) {
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

    // Building production (with workers)
    this.city.buildings.forEach(building => {
      const buildingType = this.buildingTypes.get(building.type);
      if (!buildingType || building.assignedWorkers === 0) return;

      const effects = buildingType.effects;
      const workerRatio = building.assignedWorkers / building.maxWorkers;

      if (effects.foodPerTick) {
        this.city!.resources.food = Math.min(
          this.city!.resources.food + Math.floor(effects.foodPerTick * workerRatio * building.level),
          this.city!.storage.food
        );
      }
      if (effects.woodPerTick) {
        this.city!.resources.wood = Math.min(
          this.city!.resources.wood + Math.floor(effects.woodPerTick * workerRatio * building.level),
          this.city!.storage.wood
        );
      }
      if (effects.stonePerTick) {
        this.city!.resources.stone = Math.min(
          this.city!.resources.stone + Math.floor(effects.stonePerTick * workerRatio * building.level),
          this.city!.storage.stone
        );
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