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
  private uiContainer: PIXI.Container;
  private foodText?: PIXI.Text;
  private isAnimating: boolean = false;

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
    
    this.uiContainer = new PIXI.Container();
    this.app.stage.addChild(this.uiContainer);
    
    this.visibilitySystem = new VisibilitySystem();
    this.visibilitySystem.updateVisibility({ q: 0, r: 0 }, 2);

    this.setupCamera();
    this.setupUI();
    this.renderInitialGrid();
  }

  private setupCamera() {
    this.centerCameraOnHex({ q: 0, r: 0 });
  }

  private centerCameraOnHex(hex: HexCoordinate) {
    const { x, y } = HexUtils.hexToPixel(hex);
    this.hexContainer.x = this.app.screen.width / 2 - x;
    this.hexContainer.y = this.app.screen.height / 2 - y;
  }

  private setupUI() {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff,
      align: 'left'
    });

    this.foodText = new PIXI.Text('Food: 20', style);
    this.foodText.x = this.app.screen.width - 120;
    this.foodText.y = 20;
    
    this.uiContainer.addChild(this.foodText);
  }

  private renderInitialGrid() {
    this.renderVisibleArea({ q: 0, r: 0 });
  }

  private renderVisibleArea(centerHex: HexCoordinate) {
    const viewRadius = 6;
    const renderedHexes = new Set<string>();
    
    for (let q = centerHex.q - viewRadius; q <= centerHex.q + viewRadius; q++) {
      for (let r = centerHex.r - viewRadius; r <= centerHex.r + viewRadius; r++) {
        const hex = { q, r };
        const distance = HexUtils.hexDistance(centerHex, hex);
        
        if (distance <= viewRadius) {
          const key = `${hex.q},${hex.r}`;
          if (!this.hexGraphics.has(key)) {
            const color = this.getHexColor(hex);
            this.renderHex(hex, color);
          }
          renderedHexes.add(key);
        }
      }
    }

    // Remove hexes that are now too far away
    this.hexGraphics.forEach((graphics, key) => {
      if (!renderedHexes.has(key)) {
        this.hexContainer.removeChild(graphics);
        this.hexGraphics.delete(key);
      }
    });
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

  animateSettlerMovement(fromHex: HexCoordinate, toHex: HexCoordinate, settler: Settler, onComplete: () => void) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const duration = 300; // ms
    const startTime = Date.now();
    
    const fromPixel = HexUtils.hexToPixel(fromHex);
    const toPixel = HexUtils.hexToPixel(toHex);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate settler position
      const currentX = fromPixel.x + (toPixel.x - fromPixel.x) * easeProgress;
      const currentY = fromPixel.y + (toPixel.y - fromPixel.y) * easeProgress;
      
      // Update settler graphics
      if (this.settlerGraphics) {
        this.hexContainer.removeChild(this.settlerGraphics);
      }
      
      this.settlerGraphics = new PIXI.Graphics();
      this.settlerGraphics.beginFill(0x4444ff);
      this.settlerGraphics.drawCircle(currentX, currentY, HexUtils.HEX_SIZE * 0.4);
      this.settlerGraphics.endFill();
      this.settlerGraphics.lineStyle(2, 0xffffff);
      this.settlerGraphics.drawCircle(currentX, currentY, HexUtils.HEX_SIZE * 0.4);
      this.hexContainer.addChild(this.settlerGraphics);
      
      // Interpolate camera position
      const targetCameraX = this.app.screen.width / 2 - (fromPixel.x + (toPixel.x - fromPixel.x) * easeProgress);
      const targetCameraY = this.app.screen.height / 2 - (fromPixel.y + (toPixel.y - fromPixel.y) * easeProgress);
      
      this.hexContainer.x = targetCameraX;
      this.hexContainer.y = targetCameraY;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        this.isAnimating = false;
        this.centerCameraOnHex(toHex);
        this.renderVisibleArea(toHex);
        this.renderSettler(settler);
        onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  }

  renderSettler(settler: Settler) {
    // Don't update if we're animating
    if (this.isAnimating) return;
    
    // Center camera on settler
    this.centerCameraOnHex(settler.position);
    
    // Render visible area around settler
    this.renderVisibleArea(settler.position);
    
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
    
    // Update food display
    if (this.foodText) {
      this.foodText.text = `Food: ${settler.food}`;
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }

  getCameraOffset(): { x: number; y: number } {
    return { x: this.hexContainer.x, y: this.hexContainer.y };
  }

  destroy() {
    this.app.destroy(true);
  }
}