import { HexCoordinate, HexUtils } from './hex';
import { HexRenderer } from './renderer';
import { SettlerSystem } from '../entities/settler';
import { InputSystem } from '../systems/input';

export class Game {
  private renderer: HexRenderer;
  private settlerSystem: SettlerSystem;
  private inputSystem: InputSystem;

  constructor(container: HTMLElement) {
    this.renderer = new HexRenderer(container);
    this.settlerSystem = new SettlerSystem();
    this.inputSystem = new InputSystem(this.renderer.getCanvas());

    this.setupInputHandling();
    this.render();
  }

  private setupInputHandling() {
    this.inputSystem.setClickHandler((hex: HexCoordinate) => {
      const settler = this.settlerSystem.getSettler();
      const distance = HexUtils.hexDistance(settler.position, hex);
      
      // Only allow movement to adjacent hexes
      if (distance === 1 && this.settlerSystem.canMove()) {
        const success = this.settlerSystem.moveSettler(hex);
        if (success) {
          console.log(`Settler moved to ${hex.q}, ${hex.r}`);
          this.updateVisibility();
          this.render();
        }
      } else if (distance > 1) {
        console.log('Can only move to adjacent hexes');
      } else if (!this.settlerSystem.canMove()) {
        console.log('Settler cannot move (no food remaining)');
      }
    });
  }

  private updateVisibility() {
    const settler = this.settlerSystem.getSettler();
    this.renderer.updateVisibility(settler.position, 2);
  }

  private render() {
    const settler = this.settlerSystem.getSettler();
    this.renderer.renderSettler(settler);
  }

  destroy() {
    this.inputSystem.destroy();
    this.renderer.destroy();
  }
}