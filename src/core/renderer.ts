import * as PIXI from 'pixi.js';
import { HexCoordinate, HexUtils } from './hex';
import { VisibilitySystem } from '../systems/visibility';
import { Settler } from '../entities/settler';

export class HexRenderer {
  private app: PIXI.Application;
  private hexContainer: PIXI.Container;
  private hexGraphics: Map<string, PIXI.Graphics> = new Map();
  private visibilitySystem: VisibilitySystem;
  private settlerGraphics?: PIXI.Graphics;

  constructor(container: HTMLElement) {
    console.log('Container dimensions:', container.clientWidth, container.clientHeight);
    
    this.app = new PIXI.Application({
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      backgroundColor: 0x1a1a1a,
      antialias: true,
    });

    console.log('PIXI app created:', this.app.screen.width, this.app.screen.height);

    container.appendChild(this.app.view as HTMLCanvasElement);

    this.hexContainer = new PIXI.Container();
    this.app.stage.addChild(this.hexContainer);
    
    this.visibilitySystem = new VisibilitySystem();
    this.visibilitySystem.updateVisibility({ q: 0, r: 0 }, 2);

    this.setupCamera();
    this.renderInitialGrid();
  }

  private setupCamera() {
    this.hexContainer.x = this.app.screen.width / 2;
    this.hexContainer.y = this.app.screen.height / 2;
  }

  private renderInitialGrid() {
    const gridRadius = 6;
    console.log('Rendering grid with radius:', gridRadius);
    
    let hexCount = 0;
    for (let q = -gridRadius; q <= gridRadius; q++) {
      const r1 = Math.max(-gridRadius, -q - gridRadius);
      const r2 = Math.min(gridRadius, -q + gridRadius);
      
      for (let r = r1; r <= r2; r++) {
        const hex = { q, r };
        const color = this.getHexColor(hex);
        this.renderHex(hex, color);
        hexCount++;
      }
    }
    console.log('Rendered', hexCount, 'hexes');
  }

  private getHexColor(hex: HexCoordinate): number {
    if (this.visibilitySystem.isVisible(hex)) {
      return 0x444444; // Visible - lighter gray
    } else if (this.visibilitySystem.isExplored(hex)) {
      return 0x222222; // Explored but not visible - darker gray
    } else {
      return 0x000000; // Unexplored - black (fog of war)
    }
  }

  private renderHex(hex: HexCoordinate, color: number) {
    const key = `${hex.q},${hex.r}`;
    
    if (this.hexGraphics.has(key)) {
      return;
    }

    const graphics = new PIXI.Graphics();
    const { x, y } = HexUtils.hexToPixel(hex);
    
    graphics.beginFill(color);
    graphics.lineStyle(1, 0x555555);
    
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hexX = x + HexUtils.HEX_SIZE * Math.cos(angle);
      const hexY = y + HexUtils.HEX_SIZE * Math.sin(angle);
      points.push(hexX, hexY);
    }
    
    graphics.drawPolygon(points);
    graphics.endFill();

    this.hexContainer.addChild(graphics);
    this.hexGraphics.set(key, graphics);
  }

  updateVisibility(viewerPosition: HexCoordinate, viewRange: number = 2) {
    this.visibilitySystem.updateVisibility(viewerPosition, viewRange);
    this.updateAllHexColors();
  }

  private updateAllHexColors() {
    this.hexGraphics.forEach((graphics, key) => {
      const [q, r] = key.split(',').map(Number);
      const hex = { q, r };
      const color = this.getHexColor(hex);
      this.updateHexColor(graphics, hex, color);
    });
  }

  private updateHexColor(graphics: PIXI.Graphics, hex: HexCoordinate, color: number) {
    graphics.clear();
    graphics.beginFill(color);
    graphics.lineStyle(1, 0x555555);
    
    const { x, y } = HexUtils.hexToPixel(hex);
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hexX = x + HexUtils.HEX_SIZE * Math.cos(angle);
      const hexY = y + HexUtils.HEX_SIZE * Math.sin(angle);
      points.push(hexX, hexY);
    }
    
    graphics.drawPolygon(points);
    graphics.endFill();
  }

  updateHex(hex: HexCoordinate, color: number) {
    const key = `${hex.q},${hex.r}`;
    const existing = this.hexGraphics.get(key);
    
    if (existing) {
      existing.clear();
      existing.beginFill(color);
      existing.lineStyle(1, 0x555555);
      
      const { x, y } = HexUtils.hexToPixel(hex);
      const points: number[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hexX = x + HexUtils.HEX_SIZE * Math.cos(angle);
        const hexY = y + HexUtils.HEX_SIZE * Math.sin(angle);
        points.push(hexX, hexY);
      }
      
      existing.drawPolygon(points);
      existing.endFill();
    } else {
      this.renderHex(hex, color);
    }
  }

  renderSettler(settler: Settler) {
    if (this.settlerGraphics) {
      this.hexContainer.removeChild(this.settlerGraphics);
    }

    this.settlerGraphics = new PIXI.Graphics();
    const { x, y } = HexUtils.hexToPixel(settler.position);
    
    // Draw settler as a blue circle
    this.settlerGraphics.beginFill(0x4444ff);
    this.settlerGraphics.drawCircle(x, y, HexUtils.HEX_SIZE * 0.4);
    this.settlerGraphics.endFill();
    
    // Add white border
    this.settlerGraphics.lineStyle(2, 0xffffff);
    this.settlerGraphics.drawCircle(x, y, HexUtils.HEX_SIZE * 0.4);

    this.hexContainer.addChild(this.settlerGraphics);
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }

  destroy() {
    this.app.destroy(true);
  }
}