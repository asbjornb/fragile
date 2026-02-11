import { City } from '../entities/city';

const LEGACY_KEY = 'fragile_legacy';

export interface LegacyRun {
  cityName: string;
  population: number;
  ticksSurvived: number;
  wintersSurvived: number;
  techsResearched: number;
  buildingsBuilt: number;
  collapseReason: string;
  relicShardsEarned: number;
  timestamp: number;
}

export interface LegacyData {
  totalRelicShards: number;
  runs: LegacyRun[];
  bonuses: {
    productionBonus: number;   // % bonus to all production
    startingFood: number;      // extra starting food
    buildingCostReduction: number; // % reduction
  };
}

export class PrestigeSystem {
  private legacyData: LegacyData;

  constructor() {
    this.legacyData = this.loadLegacy();
  }

  private loadLegacy(): LegacyData {
    try {
      const json = localStorage.getItem(LEGACY_KEY);
      if (json) {
        return JSON.parse(json);
      }
    } catch (e) {
      console.error('Failed to load legacy data:', e);
    }
    return {
      totalRelicShards: 0,
      runs: [],
      bonuses: {
        productionBonus: 0,
        startingFood: 0,
        buildingCostReduction: 0
      }
    };
  }

  private saveLegacy(): void {
    try {
      localStorage.setItem(LEGACY_KEY, JSON.stringify(this.legacyData));
    } catch (e) {
      console.error('Failed to save legacy data:', e);
    }
  }

  calculateRelicShards(city: City, techsResearched: number): number {
    let shards = 0;

    // Techs researched: 2 shards each
    shards += techsResearched * 2;

    // Winters survived: 3 shards each
    shards += city.wintersSurvived * 3;

    // Population milestones
    if (city.population >= 5) shards += 2;
    if (city.population >= 10) shards += 3;
    if (city.population >= 15) shards += 5;
    if (city.population >= 20) shards += 8;

    // Survival duration: 1 shard per 60 ticks
    shards += Math.floor(city.tickCount / 60);

    // Building count bonus
    const buildingCount = city.buildings.length - 1; // exclude town hall
    if (buildingCount >= 5) shards += 2;
    if (buildingCount >= 10) shards += 3;
    if (buildingCount >= 15) shards += 5;

    return shards;
  }

  recordCollapse(city: City, techsResearched: number, collapseReason: string): LegacyRun {
    const shards = this.calculateRelicShards(city, techsResearched);

    const run: LegacyRun = {
      cityName: city.name,
      population: city.population,
      ticksSurvived: city.tickCount,
      wintersSurvived: city.wintersSurvived,
      techsResearched,
      buildingsBuilt: city.buildings.length - 1,
      collapseReason,
      relicShardsEarned: shards,
      timestamp: Date.now()
    };

    this.legacyData.runs.push(run);
    this.legacyData.totalRelicShards += shards;

    // Recalculate bonuses based on total shards (capped at 20% per spec)
    this.recalculateBonuses();
    this.saveLegacy();

    return run;
  }

  private recalculateBonuses(): void {
    const shards = this.legacyData.totalRelicShards;

    // Production bonus: +1% per 5 shards, capped at 20%
    this.legacyData.bonuses.productionBonus = Math.min(0.20, Math.floor(shards / 5) * 0.01);

    // Starting food: +2 per 10 shards, capped at 20
    this.legacyData.bonuses.startingFood = Math.min(20, Math.floor(shards / 10) * 2);

    // Building cost reduction: +1% per 8 shards, capped at 10%
    this.legacyData.bonuses.buildingCostReduction = Math.min(0.10, Math.floor(shards / 8) * 0.01);
  }

  getLegacyData(): LegacyData {
    return { ...this.legacyData, runs: [...this.legacyData.runs] };
  }

  getBonuses(): LegacyData['bonuses'] {
    return { ...this.legacyData.bonuses };
  }

  getTotalShards(): number {
    return this.legacyData.totalRelicShards;
  }

  getRunCount(): number {
    return this.legacyData.runs.length;
  }

  resetLegacy(): void {
    this.legacyData = {
      totalRelicShards: 0,
      runs: [],
      bonuses: {
        productionBonus: 0,
        startingFood: 0,
        buildingCostReduction: 0
      }
    };
    this.saveLegacy();
  }
}
