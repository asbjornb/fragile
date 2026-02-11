import { City } from '../entities/city';
import { SettlerSaveData } from '../entities/settler';
import { ResearchProgress } from '../systems/tech';
import { StoryMessage } from '../systems/events';

const SAVE_KEY = 'fragile_save';
const SAVE_VERSION = 2;

export interface SaveData {
  version: number;
  timestamp: number;
  seed: number;
  phase: 'exploration' | 'city';
  settler: SettlerSaveData;
  city: City | null;
  unlockedBuildings: string[];
  researchedTechs: string[];
  currentResearch: ResearchProgress | null;
  exploredHexes: string[];
  storyMessages: StoryMessage[];
  currentTab: 'buildings' | 'research';
  eventState?: {
    lastBanditRaidTick: number;
  };
  harshWinter?: boolean;
}

export class SaveSystem {
  static save(data: SaveData): void {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, json);
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  static load(): SaveData | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;

      const data = JSON.parse(json) as SaveData;

      // Accept both v1 and v2 saves, migrating v1 as needed
      if (data.version === 1) {
        data.version = SAVE_VERSION;
        // Add defaults for new fields
        if (data.city) {
          if (data.city.tickCount === undefined) data.city.tickCount = 0;
          if (data.city.defenseRating === undefined) data.city.defenseRating = 0;
          if (data.city.wintersSurvived === undefined) data.city.wintersSurvived = 0;
        }
        if (!data.eventState) data.eventState = { lastBanditRaidTick: 0 };
        if (data.harshWinter === undefined) data.harshWinter = false;
      } else if (data.version !== SAVE_VERSION) {
        console.warn(`Save version mismatch: expected ${SAVE_VERSION}, got ${data.version}`);
        return null;
      }

      return data;
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  static getSaveSummary(): { phase: string; timestamp: number; cityName?: string } | null {
    const data = this.load();
    if (!data) return null;

    return {
      phase: data.phase,
      timestamp: data.timestamp,
      cityName: data.city?.name
    };
  }
}
