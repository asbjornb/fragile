import { HexCoordinate, HexUtils } from '../core/hex';
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
    // Better seeded random using multiple hash functions
    const x = hex.q;
    const y = hex.r;
    const seed = this.seed;
    
    // Use multiple mixing functions for better distribution
    let a = (x * 1664525 + y * 1013904223 + seed) >>> 0;
    a = (a ^ (a >>> 16)) * 0x85ebca6b;
    a = (a ^ (a >>> 13)) * 0xc2b2ae35;
    a = a ^ (a >>> 16);
    
    let b = (y * 22695477 + x * 1366128477 + seed * 2654435761) >>> 0;
    b = (b ^ (b >>> 16)) * 0x45d9f3b;
    b = (b ^ (b >>> 16)) * 0x45d9f3b;
    b = b ^ (b >>> 16);
    
    // Combine the two hashes
    const combined = (a ^ b) >>> 0;
    
    return combined / 4294967296;
  }

  private selectTileType(hex: HexCoordinate): TileType {
    const random = this.seededRandom(hex);
    
    // Get base weights and apply neighbor influence
    const modifiedWeights = this.getModifiedWeights(hex);
    
    // Sort by modified weight for consistent selection
    const sortedTileTypes = modifiedWeights.sort((a, b) => b.weight - a.weight);
    const totalWeight = sortedTileTypes.reduce((sum, type) => sum + type.weight, 0);
    
    let currentWeight = 0;
    const targetWeight = random * totalWeight;
    
    // Debug: Log selection process for a few tiles (showing adaptive clustering effects)
    if (Math.abs(hex.q) <= 1 && Math.abs(hex.r) <= 1) {
      console.log(`Tile (${hex.q}, ${hex.r}): random=${random.toFixed(3)}, target=${targetWeight.toFixed(1)}, total=${totalWeight}`);
    }
    
    for (const tileType of sortedTileTypes) {
      currentWeight += tileType.weight;
      if (Math.abs(hex.q) <= 1 && Math.abs(hex.r) <= 1) {
        console.log(`  ${tileType.type.name}: weight=${tileType.weight}, cumulative=${currentWeight}, selected=${currentWeight >= targetWeight}`);
      }
      if (currentWeight >= targetWeight) {
        return tileType.type;
      }
    }
    
    // Fallback to plains
    return this.tileTypes.get('plains')!;
  }

  private getModifiedWeights(hex: HexCoordinate): Array<{type: TileType, weight: number}> {
    // Get neighbors and count terrain types
    const neighbors = HexUtils.hexNeighbors(hex);
    const neighborCounts = new Map<string, number>();
    
    neighbors.forEach(neighborHex => {
      const existingTile = this.getTile(neighborHex);
      if (existingTile) {
        const count = neighborCounts.get(existingTile.type.id) || 0;
        neighborCounts.set(existingTile.type.id, count + 1);
      }
    });
    
    // Apply neighbor influence to weights
    const result: Array<{type: TileType, weight: number}> = [];
    
    this.tileTypes.forEach((tileType) => {
      let modifiedWeight = tileType.weight;
      const neighborCount = neighborCounts.get(tileType.id) || 0;
      
      if (neighborCount > 0) {
        // Apply different clustering bonuses based on terrain rarity
        let bonusMultiplier = 0;
        
        if (tileType.weight <= 3) {
          // Very rare terrain (rivers, lakes) - massive clustering bonus
          bonusMultiplier = 2.0; // 200% bonus per neighbor
        } else if (tileType.weight <= 10) {
          // Rare terrain (mountains) - strong clustering bonus
          bonusMultiplier = 1.0; // 100% bonus per neighbor
        } else if (tileType.weight <= 20) {
          // Medium terrain (hills) - moderate clustering bonus
          bonusMultiplier = 0.4; // 40% bonus per neighbor
        } else if (tileType.weight <= 30) {
          // Common terrain (forest) - small clustering bonus
          bonusMultiplier = 0.1; // 10% bonus per neighbor
        } else {
          // Very common terrain (plains) - no clustering bonus
          bonusMultiplier = 0; // No clustering for plains
        }
        
        const bonus = modifiedWeight * bonusMultiplier * neighborCount;
        modifiedWeight += bonus;
      }
      
      result.push({ type: tileType, weight: modifiedWeight });
    });
    
    return result;
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
    
    // Debug: Log tile generation for a small area around origin
    if (Math.abs(hex.q) <= 3 && Math.abs(hex.r) <= 3) {
      console.log(`Generated ${tileType.name} at (${hex.q}, ${hex.r})`);
    }
    
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

  getSeed(): number {
    return this.seed;
  }
}