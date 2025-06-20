import { HexCoordinate } from '../core/hex';
import tilesData from '../data/tiles.json';

export interface TileType {
  id: string;
  name: string;
  color: string;
  resources: string[];
  weight: number;
}

export interface ResourceType {
  id: string;
  name: string;
  color: string;
}

export interface Tile {
  coordinate: HexCoordinate;
  type: TileType;
  hasResource: boolean;
  resourceType?: ResourceType;
}

export class WorldGenerator {
  private tileTypes: Map<string, TileType> = new Map();
  private resourceTypes: Map<string, ResourceType> = new Map();
  private generatedTiles: Map<string, Tile> = new Map();
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
    this.loadTileData();
  }

  private loadTileData() {
    Object.values(tilesData.tileTypes).forEach(tileType => {
      this.tileTypes.set(tileType.id, tileType as TileType);
    });
    
    Object.values(tilesData.resources).forEach(resource => {
      this.resourceTypes.set(resource.id, resource as ResourceType);
    });
  }

  private seededRandom(hex: HexCoordinate): number {
    // Simple seeded random based on position and global seed
    const x = hex.q;
    const y = hex.r;
    const seed = this.seed;
    
    let hash = ((x * 73856093) ^ (y * 19349663) ^ (seed * 83492791)) >>> 0;
    hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
    hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
    hash = (hash >> 16) ^ hash;
    
    return (hash >>> 0) / 4294967296;
  }

  private selectTileType(hex: HexCoordinate): TileType {
    const random = this.seededRandom(hex);
    const totalWeight = Array.from(this.tileTypes.values()).reduce((sum, type) => sum + type.weight, 0);
    
    let currentWeight = 0;
    const targetWeight = random * totalWeight;
    
    for (const tileType of this.tileTypes.values()) {
      currentWeight += tileType.weight;
      if (currentWeight >= targetWeight) {
        return tileType;
      }
    }
    
    // Fallback to plains
    return this.tileTypes.get('plains')!;
  }

  private hasResource(hex: HexCoordinate, tileType: TileType): { hasResource: boolean; resourceType?: ResourceType } {
    if (tileType.resources.length === 0) {
      return { hasResource: false };
    }
    
    // Use different seed offset for resource generation
    const resourceRandom = this.seededRandom({ q: hex.q + 1000, r: hex.r + 1000 });
    
    // 12% chance of having a resource (reduced from 30% - was too common)
    if (resourceRandom < 0.12) {
      const resourceId = tileType.resources[Math.floor(this.seededRandom({ q: hex.q + 2000, r: hex.r + 2000 }) * tileType.resources.length)];
      const resourceType = this.resourceTypes.get(resourceId);
      
      return {
        hasResource: true,
        resourceType
      };
    }
    
    return { hasResource: false };
  }

  generateTile(hex: HexCoordinate): Tile {
    const key = `${hex.q},${hex.r}`;
    
    if (this.generatedTiles.has(key)) {
      return this.generatedTiles.get(key)!;
    }
    
    const tileType = this.selectTileType(hex);
    const { hasResource, resourceType } = this.hasResource(hex, tileType);
    
    const tile: Tile = {
      coordinate: hex,
      type: tileType,
      hasResource,
      resourceType
    };
    
    this.generatedTiles.set(key, tile);
    return tile;
  }

  getTile(hex: HexCoordinate): Tile | undefined {
    const key = `${hex.q},${hex.r}`;
    return this.generatedTiles.get(key);
  }
}