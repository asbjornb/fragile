import { HexCoordinate } from '../core/hex';

export interface Settler {
  id: string;
  position: HexCoordinate;
  food: number;
  maxFood: number;
}

export class SettlerSystem {
  private settler: Settler;

  constructor() {
    this.settler = {
      id: 'settler_1',
      position: { q: 0, r: 0 },
      food: 20,
      maxFood: 20
    };
  }

  getSettler(): Settler {
    return { ...this.settler };
  }

  canMove(): boolean {
    return this.settler.food > 0;
  }

  moveSettler(newPosition: HexCoordinate): boolean {
    if (!this.canMove()) {
      return false;
    }

    this.settler.position = { ...newPosition };
    this.settler.food--;

    return true;
  }

  addFood(amount: number): void {
    this.settler.food = Math.min(this.settler.maxFood, this.settler.food + amount);
  }

  getPosition(): HexCoordinate {
    return { ...this.settler.position };
  }
}