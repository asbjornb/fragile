import techsData from '../data/techs.json';

export interface TechType {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: {
    research: number;
  };
  researchTime: number; // seconds
  prerequisites: string[];
  effects: {
    workerEfficiency?: number;
    foodProduction?: number;
    buildingCostReduction?: number;
    stoneProduction?: number;
  };
  unlocks: string[];
}

export interface ResearchProgress {
  techId: string;
  progress: number; // 0-100
  startTime: number;
  researchTime: number;
}

export class TechSystem {
  private techTypes: Map<string, TechType> = new Map();
  private researchedTechs: Set<string> = new Set();
  private currentResearch: ResearchProgress | null = null;

  constructor() {
    this.loadTechData();
  }

  private loadTechData() {
    Object.values(techsData.techs).forEach(tech => {
      this.techTypes.set(tech.id, tech as TechType);
    });
  }

  getTechTypes(): TechType[] {
    return Array.from(this.techTypes.values());
  }

  getAvailableTechs(): TechType[] {
    return this.getTechTypes().filter(tech => 
      !this.researchedTechs.has(tech.id) && 
      this.canResearch(tech.id).canResearch
    );
  }

  getResearchedTechs(): TechType[] {
    return Array.from(this.researchedTechs)
      .map(id => this.techTypes.get(id))
      .filter(tech => tech !== undefined) as TechType[];
  }

  canResearch(techId: string): { canResearch: boolean; reason?: string } {
    const tech = this.techTypes.get(techId);
    if (!tech) {
      return { canResearch: false, reason: 'Tech not found' };
    }

    if (this.researchedTechs.has(techId)) {
      return { canResearch: false, reason: 'Already researched' };
    }

    if (this.currentResearch) {
      return { canResearch: false, reason: 'Already researching something' };
    }

    // Check prerequisites
    for (const prereq of tech.prerequisites) {
      if (!this.researchedTechs.has(prereq)) {
        const prereqTech = this.techTypes.get(prereq);
        return { 
          canResearch: false, 
          reason: `Requires ${prereqTech?.name || prereq}` 
        };
      }
    }

    return { canResearch: true };
  }

  startResearch(techId: string, currentResearchPoints: number): boolean {
    const canResearch = this.canResearch(techId);
    if (!canResearch.canResearch) {
      return false;
    }

    const tech = this.techTypes.get(techId)!;
    if (currentResearchPoints < tech.cost.research) {
      return false; // Not enough research points
    }

    this.currentResearch = {
      techId,
      progress: 0,
      startTime: Date.now(),
      researchTime: tech.researchTime * 1000 // Convert to milliseconds
    };

    return true;
  }

  updateResearch(): { completed?: string; progress?: number } {
    if (!this.currentResearch) {
      return {};
    }

    const elapsed = Date.now() - this.currentResearch.startTime;
    const progress = Math.min(100, (elapsed / this.currentResearch.researchTime) * 100);
    
    this.currentResearch.progress = progress;

    if (progress >= 100) {
      // Research completed
      const completedTech = this.currentResearch.techId;
      this.researchedTechs.add(completedTech);
      this.currentResearch = null;
      
      return { completed: completedTech };
    }

    return { progress };
  }

  getCurrentResearch(): ResearchProgress | null {
    return this.currentResearch;
  }

  isResearched(techId: string): boolean {
    return this.researchedTechs.has(techId);
  }

  getTechEffects(): {
    workerEfficiency: number;
    foodProduction: number;
    buildingCostReduction: number;
    stoneProduction: number;
  } {
    const effects = {
      workerEfficiency: 0,
      foodProduction: 0,
      buildingCostReduction: 0,
      stoneProduction: 0
    };

    for (const techId of this.researchedTechs) {
      const tech = this.techTypes.get(techId);
      if (tech) {
        effects.workerEfficiency += tech.effects.workerEfficiency || 0;
        effects.foodProduction += tech.effects.foodProduction || 0;
        effects.buildingCostReduction += tech.effects.buildingCostReduction || 0;
        effects.stoneProduction += tech.effects.stoneProduction || 0;
      }
    }

    return effects;
  }
}