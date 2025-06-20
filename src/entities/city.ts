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

    // Cap resources to storage limits
    this.city.resources.food = Math.min(this.city.resources.food, this.city.storage.food);
    this.city.resources.wood = Math.min(this.city.resources.wood, this.city.storage.wood);
    this.city.resources.stone = Math.min(this.city.resources.stone, this.city.storage.stone);
  }

  // Worker management
  assignWorker(buildingId: string): boolean {
    if (!this.city) return false;

    const building = this.city.buildings.find(b => b.id === buildingId);
    if (!building) return false;

    if (this.city.availableWorkers <= 0) return false;
    if (building.assignedWorkers >= building.maxWorkers) return false;

    building.assignedWorkers++;
    this.city.availableWorkers--;
    return true;
  }

  unassignWorker(buildingId: string): boolean {
    if (!this.city) return false;

    const building = this.city.buildings.find(b => b.id === buildingId);
    if (!building) return false;

    if (building.assignedWorkers <= 0) return false;

    building.assignedWorkers--;
    this.city.availableWorkers++;
    return true;
  }
}