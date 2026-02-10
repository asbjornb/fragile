import { HexCoordinate, HexUtils } from '../core/hex';

export interface VisibilityState {
  visible: Set<string>;
  explored: Set<string>;
}

export class VisibilitySystem {
  private state: VisibilityState;

  constructor() {
    this.state = {
      visible: new Set(),
      explored: new Set()
    };
  }

  private hexKey(hex: HexCoordinate): string {
    return `${hex.q},${hex.r}`;
  }

  updateVisibility(viewerPosition: HexCoordinate, viewRange: number = 2) {
    this.state.visible.clear();

    // Add viewer position
    const viewerKey = this.hexKey(viewerPosition);
    this.state.visible.add(viewerKey);
    this.state.explored.add(viewerKey);

    // Add hexes within view range
    for (let q = viewerPosition.q - viewRange; q <= viewerPosition.q + viewRange; q++) {
      for (let r = viewerPosition.r - viewRange; r <= viewerPosition.r + viewRange; r++) {
        const hex = { q, r };
        const distance = HexUtils.hexDistance(viewerPosition, hex);
        
        if (distance <= viewRange) {
          const key = this.hexKey(hex);
          this.state.visible.add(key);
          this.state.explored.add(key);
        }
      }
    }
  }

  isVisible(hex: HexCoordinate): boolean {
    return this.state.visible.has(this.hexKey(hex));
  }

  isExplored(hex: HexCoordinate): boolean {
    return this.state.explored.has(this.hexKey(hex));
  }

  getVisibilityState(): VisibilityState {
    return {
      visible: new Set(this.state.visible),
      explored: new Set(this.state.explored)
    };
  }

  getVisibleHexes(): HexCoordinate[] {
    return Array.from(this.state.visible).map(key => {
      const [q, r] = key.split(',').map(Number);
      return { q, r };
    });
  }

  getExploredHexes(): HexCoordinate[] {
    return Array.from(this.state.explored).map(key => {
      const [q, r] = key.split(',').map(Number);
      return { q, r };
    });
  }

  exportState(): string[] {
    return Array.from(this.state.explored);
  }

  importState(exploredKeys: string[]): void {
    this.state.explored = new Set(exploredKeys);
  }
}