import { City } from '../entities/city';
import { SettlerSaveData } from '../entities/settler';
import { ResearchProgress } from '../systems/tech';
import { StoryMessage } from '../systems/events';

const SAVE_KEY = 'fragile_save';
const SAVE_VERSION = 1;

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

      if (data.version !== SAVE_VERSION) {
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
