import { HexCoordinate } from '../core/hex';

export interface City {
  id: string;
  name: string;
  position: HexCoordinate;
  population: number;
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
}

export class CitySystem {
  private city: City | null = null;

  foundCity(position: HexCoordinate, settlerFood: number): City {
    if (this.city) {
      throw new Error('City already exists');
    }

    this.city = {
      id: 'city_1',
      name: 'New Settlement',
      position: { ...position },
      population: 1,
      integrity: 100,
      maxIntegrity: 100,
      unrest: 0,
      maxUnrest: 100,
      resources: {
        food: settlerFood, // Transfer settler's food to city
        wood: 0,
        stone: 0,
        research: 0
      },
      buildings: [
        {
          id: 'townhall_1',
          type: 'town_hall',
          name: 'Town Hall',
          level: 1,
          maxLevel: 5
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

  // Basic resource management methods
  addResource(type: keyof City['resources'], amount: number): void {
    if (!this.city) return;
    this.city.resources[type] += amount;
  }

  canAfford(costs: Partial<City['resources']>): boolean {
    if (!this.city) return false;
    
    for (const [resource, cost] of Object.entries(costs)) {
      if (this.city.resources[resource as keyof City['resources']] < (cost || 0)) {
        return false;
      }
    }
    return true;
  }

  spendResources(costs: Partial<City['resources']>): boolean {
    if (!this.canAfford(costs)) return false;
    
    for (const [resource, cost] of Object.entries(costs)) {
      this.city!.resources[resource as keyof City['resources']] -= (cost || 0);
    }
    return true;
  }
}