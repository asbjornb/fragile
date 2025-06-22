import * as PIXI from 'pixi.js';
import { HexCoordinate, HexUtils } from './hex';
import { VisibilitySystem } from '../systems/visibility';
import { Settler } from '../entities/settler';
import { City } from '../entities/city';
import { WorldGenerator } from '../systems/worldgen';

export class HexRenderer {
  private app: PIXI.Application;
  private hexContainer: PIXI.Container;
  private hexGraphics: Map<string, PIXI.Graphics> = new Map();
  private visibilitySystem: VisibilitySystem;
  private settlerGraphics?: PIXI.Graphics;
  private cityGraphics?: PIXI.Graphics;
  private uiContainer: PIXI.Container;
  private foodText?: PIXI.Text;
  private terrainLegend?: PIXI.Container;
  private isAnimating: boolean = false;
  private worldGenerator: WorldGenerator;
  private zoomLevel: number = 1.0;

  constructor(container: HTMLElement) {
    console.log('Container dimensions:', container.clientWidth, container.clientHeight);
    
    this.app = new PIXI.Application({
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      backgroundColor: 0x0f1419, // Darker, more atmospheric background
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
    
    this.worldGenerator = new WorldGenerator();

    this.setupCamera();
    this.setupUI();
    this.renderInitialGrid();
  }

  private setupCamera() {
    this.centerCameraOnHex({ q: 0, r: 0 });
  }

  private centerCameraOnHex(hex: HexCoordinate) {
    const { x, y } = HexUtils.hexToPixel(hex);
    this.hexContainer.scale.set(this.zoomLevel);
    this.hexContainer.x = this.app.screen.width / 2 - x * this.zoomLevel;
    this.hexContainer.y = this.app.screen.height / 2 - y * this.zoomLevel;
  }

  private setupUI() {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff,
      align: 'left'
    });

    this.foodText = new PIXI.Text('Food: 20', style);
    this.foodText.x = this.app.screen.width - 350; // Adjusted for shorter text
    this.foodText.y = 20;
    
    this.uiContainer.addChild(this.foodText);
    
    // Create terrain legend (visible only during exploration phase)
    this.createTerrainLegend();
  }

  private createTerrainLegend() {
    this.terrainLegend = new PIXI.Container();
    
    const legendStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
      align: 'left'
    });

    const legendTitle = new PIXI.Text('Terrain Types:', legendStyle);
    legendTitle.x = this.app.screen.width - 140;
    legendTitle.y = 60;
    this.terrainLegend.addChild(legendTitle);

    // Terrain data with colors from tiles.json
    const terrainInfo = [
      { name: 'Plains', color: 0x9ACD32, bonus: '+5% food', y: 85 },
      { name: 'Forest', color: 0x228B22, bonus: '+10% wood', y: 110 },
      { name: 'Hills', color: 0xDAA520, bonus: '+20% stone', y: 135 },
      { name: 'Mountain', color: 0x708090, bonus: '+20% stone', y: 160 },
      { name: 'River', color: 0x00BFFF, bonus: 'water source', y: 185 },
      { name: 'Lake', color: 0x1E90FF, bonus: 'water source', y: 210 }
    ];

    terrainInfo.forEach(terrain => {
      // Create colored circle for terrain type
      const circle = new PIXI.Graphics();
      circle.beginFill(terrain.color);
      circle.drawCircle(0, 0, 8);
      circle.endFill();
      circle.x = this.app.screen.width - 130;
      circle.y = terrain.y;
      
      // Create text label
      const label = new PIXI.Text(`${terrain.name} (${terrain.bonus})`, {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff
      });
      label.x = this.app.screen.width - 115;
      label.y = terrain.y - 8;
      
      this.terrainLegend!.addChild(circle);
      this.terrainLegend!.addChild(label);
    });

    this.uiContainer.addChild(this.terrainLegend);
  }

  private renderInitialGrid() {
    this.renderVisibleArea({ q: 0, r: 0 });
  }

  private renderVisibleArea(centerHex: HexCoordinate, hideUnexplored: boolean = false) {
    const viewRadius = 6;
    const renderedHexes = new Set<string>();
    
    for (let q = centerHex.q - viewRadius; q <= centerHex.q + viewRadius; q++) {
      for (let r = centerHex.r - viewRadius; r <= centerHex.r + viewRadius; r++) {
        const hex = { q, r };
        const distance = HexUtils.hexDistance(centerHex, hex);
        
        if (distance <= viewRadius) {
          const key = `${hex.q},${hex.r}`;
          
          // Skip unexplored tiles if hideUnexplored is true
          if (hideUnexplored && !this.visibilitySystem.isExplored(hex)) {
            continue;
          }
          
          if (!this.hexGraphics.has(key)) {
            const color = this.getHexColor(hex);
            this.renderHex(hex, color);
            this.renderResourceNode(hex);
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
    if (!this.visibilitySystem.isExplored(hex)) {
      return 0x0a0a0a; // Unexplored - very dark gray (fog of war)
    }
    
    const tile = this.worldGenerator.generateTile(hex);
    const baseColor = parseInt(tile.type.color.replace('#', ''), 16);
    
    if (this.visibilitySystem.isVisible(hex)) {
      return baseColor; // Visible - full color
    } else {
      // Explored but not visible - darker version with blue tint
      const r = Math.floor(((baseColor >> 16) & 0xff) * 0.35);
      const g = Math.floor(((baseColor >> 8) & 0xff) * 0.35);
      const b = Math.floor(((baseColor & 0xff) * 0.4) + 20); // Slight blue tint
      return (r << 16) | (g << 8) | Math.min(255, b);
    }
  }

  private renderHex(hex: HexCoordinate, color: number) {
    const key = `${hex.q},${hex.r}`;
    
    if (this.hexGraphics.has(key)) {
      return;
    }

    const graphics = new PIXI.Graphics();
    const { x, y } = HexUtils.hexToPixel(hex);
    const tile = this.worldGenerator.generateTile(hex);
    
    // Draw base hex with enhanced visuals
    this.drawEnhancedHex(graphics, x, y, color, tile.type.id);

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
    const { x, y } = HexUtils.hexToPixel(hex);
    const tile = this.worldGenerator.generateTile(hex);
    
    // Redraw with enhanced visuals
    this.drawEnhancedHex(graphics, x, y, color, tile.type.id);
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
      this.drawSettlerSprite(this.settlerGraphics, currentX, currentY);
      this.hexContainer.addChild(this.settlerGraphics);
      
      // Interpolate camera position
      const currentPixelX = fromPixel.x + (toPixel.x - fromPixel.x) * easeProgress;
      const currentPixelY = fromPixel.y + (toPixel.y - fromPixel.y) * easeProgress;
      const targetCameraX = this.app.screen.width / 2 - currentPixelX * this.zoomLevel;
      const targetCameraY = this.app.screen.height / 2 - currentPixelY * this.zoomLevel;
      
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
    
    // Draw enhanced settler sprite
    this.drawSettlerSprite(this.settlerGraphics, x, y);

    this.hexContainer.addChild(this.settlerGraphics);
    
    // Update food display
    if (this.foodText) {
      this.foodText.text = `Food: ${settler.food}`;
      this.foodText.visible = true; // Make sure it's visible during exploration
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }

  private renderResourceNode(hex: HexCoordinate) {
    if (!this.visibilitySystem.isVisible(hex)) return;
    
    const tile = this.worldGenerator.generateTile(hex);
    if (!tile.hasResource || !tile.resourceType) return;
    
    const { x, y } = HexUtils.hexToPixel(hex);
    const resourceColor = parseInt(tile.resourceType.color.replace('#', ''), 16);
    
    const resourceGraphics = new PIXI.Graphics();
    
    // Draw resource with type-specific visualization
    this.drawResourceIcon(resourceGraphics, x, y, tile.resourceType.id, resourceColor);
    
    this.hexContainer.addChild(resourceGraphics);
  }

  getCameraOffset(): { x: number; y: number } {
    return { x: this.hexContainer.x, y: this.hexContainer.y };
  }

  private drawEnhancedHex(graphics: PIXI.Graphics, x: number, y: number, color: number, tileType: string) {
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hexX = x + HexUtils.HEX_SIZE * Math.cos(angle);
      const hexY = y + HexUtils.HEX_SIZE * Math.sin(angle);
      points.push(hexX, hexY);
    }
    
    // Base hex fill
    graphics.beginFill(color);
    graphics.lineStyle(1, 0x2a2a2a, 0.6); // More subtle border
    graphics.drawPolygon(points);
    graphics.endFill();
    
    // Add terrain-specific visual enhancements
    this.addTerrainDetails(graphics, x, y, tileType, color);
  }
  
  private addTerrainDetails(graphics: PIXI.Graphics, x: number, y: number, tileType: string, baseColor: number) {
    const size = HexUtils.HEX_SIZE;
    
    // Only add terrain details if the tile is visible (not just explored)
    const hex = HexUtils.pixelToHex(x, y);
    if (!this.visibilitySystem.isVisible(hex)) {
      return;
    }
    
    switch (tileType) {
      case 'forest':
        // Add small tree-like dots scattered across the hex
        const treeColor = this.darkenColor(baseColor, 0.3);
        graphics.beginFill(treeColor);
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8 + Math.PI / 8;
          const radius = size * (0.3 + Math.sin(i * 1.3) * 0.2);
          const treeX = x + Math.cos(angle) * radius;
          const treeY = y + Math.sin(angle) * radius;
          graphics.drawCircle(treeX, treeY, 2);
        }
        graphics.endFill();
        break;
        
      case 'mountain':
        // Add triangular mountain peaks
        const peakColor = this.lightenColor(baseColor, 0.4);
        graphics.beginFill(peakColor);
        graphics.lineStyle(0);
        // Main peak
        graphics.drawPolygon([
          x - size * 0.3, y + size * 0.2,
          x, y - size * 0.4,
          x + size * 0.3, y + size * 0.2
        ]);
        // Secondary peaks
        graphics.drawPolygon([
          x - size * 0.6, y + size * 0.1,
          x - size * 0.3, y - size * 0.2,
          x, y + size * 0.1
        ]);
        graphics.drawPolygon([
          x, y + size * 0.1,
          x + size * 0.3, y - size * 0.2,
          x + size * 0.6, y + size * 0.1
        ]);
        graphics.endFill();
        break;
        
      case 'hill':
        // Add gentle hill contours
        const hillColor = this.lightenColor(baseColor, 0.2);
        graphics.lineStyle(1, hillColor);
        graphics.arc(x, y, size * 0.6, 0, Math.PI);
        graphics.arc(x - size * 0.3, y, size * 0.4, 0, Math.PI);
        graphics.arc(x + size * 0.3, y, size * 0.4, 0, Math.PI);
        break;
        
      case 'river':
      case 'lake':
        // Add water ripple effects
        const rippleColor = this.lightenColor(baseColor, 0.3);
        graphics.lineStyle(1, rippleColor, 0.6);
        for (let i = 0; i < 3; i++) {
          const rippleRadius = size * (0.2 + i * 0.15);
          graphics.drawCircle(x, y, rippleRadius);
        }
        break;
        
      case 'plains':
        // Add subtle grass texture with small lines
        const grassColor = this.darkenColor(baseColor, 0.2);
        graphics.lineStyle(1, grassColor, 0.4);
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          const startRadius = size * 0.1;
          const endRadius = size * 0.4;
          const startX = x + Math.cos(angle) * startRadius;
          const startY = y + Math.sin(angle) * startRadius;
          const endX = x + Math.cos(angle) * endRadius;
          const endY = y + Math.sin(angle) * endRadius;
          graphics.moveTo(startX, startY);
          graphics.lineTo(endX, endY);
        }
        break;
    }
  }
  
  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * (1 - factor));
    const g = Math.floor(((color >> 8) & 0xff) * (1 - factor));
    const b = Math.floor((color & 0xff) * (1 - factor));
    return (r << 16) | (g << 8) | b;
  }
  
  private lightenColor(color: number, factor: number): number {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * factor));
    const g = Math.min(255, Math.floor(((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * factor));
    const b = Math.min(255, Math.floor((color & 0xff) + (255 - (color & 0xff)) * factor));
    return (r << 16) | (g << 8) | b;
  }
  
  private drawResourceIcon(graphics: PIXI.Graphics, x: number, y: number, resourceType: string, color: number) {
    const size = HexUtils.HEX_SIZE * 0.15;
    
    switch (resourceType) {
      case 'wood':
        // Draw a tree-like symbol
        graphics.beginFill(0x8B4513); // Tree trunk
        graphics.drawRect(x - 2, y, 4, size);
        graphics.endFill();
        graphics.beginFill(color); // Tree foliage
        graphics.drawCircle(x, y - size * 0.5, size * 0.8);
        graphics.endFill();
        // White outline for visibility
        graphics.lineStyle(1, 0xffffff);
        graphics.drawCircle(x, y - size * 0.5, size * 0.8);
        break;
        
      case 'stone':
        // Draw a rocky cube/crystal shape
        graphics.beginFill(color);
        graphics.lineStyle(1, 0xffffff);
        graphics.drawPolygon([
          x - size, y + size * 0.5,
          x, y - size * 0.5,
          x + size, y + size * 0.5,
          x, y + size
        ]);
        graphics.endFill();
        break;
        
      case 'ore':
        // Draw pickaxe-like symbol
        graphics.beginFill(color);
        graphics.lineStyle(1, 0xffffff);
        // Pickaxe head
        graphics.drawPolygon([
          x - size * 0.8, y - size * 0.3,
          x + size * 0.8, y - size * 0.3,
          x + size * 0.5, y + size * 0.3,
          x - size * 0.5, y + size * 0.3
        ]);
        // Handle
        graphics.lineStyle(2, 0x8B4513);
        graphics.moveTo(x, y + size * 0.3);
        graphics.lineTo(x, y + size * 0.8);
        graphics.endFill();
        break;
        
      case 'wild_game':
        // Draw animal tracks or paw prints
        graphics.beginFill(color);
        graphics.lineStyle(1, 0xffffff);
        // Main paw pad
        graphics.drawEllipse(x, y, size * 0.6, size * 0.4);
        // Toe pads
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
          const padX = x + Math.cos(angle) * size * 0.8;
          const padY = y + Math.sin(angle) * size * 0.6;
          graphics.drawCircle(padX, padY, size * 0.2);
        }
        graphics.endFill();
        break;
        
      case 'fish':
        // Draw a fish symbol
        graphics.beginFill(color);
        graphics.lineStyle(1, 0xffffff);
        // Fish body
        graphics.drawEllipse(x, y, size * 0.8, size * 0.4);
        // Fish tail
        graphics.drawPolygon([
          x + size * 0.8, y,
          x + size * 1.2, y - size * 0.3,
          x + size * 1.2, y + size * 0.3
        ]);
        graphics.endFill();
        // Fish eye
        graphics.beginFill(0xffffff);
        graphics.drawCircle(x - size * 0.3, y, size * 0.1);
        graphics.endFill();
        break;
        
      default:
        // Fallback to enhanced circle
        graphics.beginFill(color);
        graphics.lineStyle(2, 0xffffff);
        graphics.drawCircle(x, y, size);
        graphics.endFill();
        // Add inner glow effect
        graphics.beginFill(this.lightenColor(color, 0.5), 0.5);
        graphics.drawCircle(x, y, size * 0.6);
        graphics.endFill();
        break;
    }
  }
  
  private drawSettlerSprite(graphics: PIXI.Graphics, x: number, y: number) {
    const size = HexUtils.HEX_SIZE * 0.35;
    
    // Add a subtle shadow/glow effect first (so it's behind everything)
    graphics.beginFill(0x000000, 0.2);
    graphics.drawCircle(x + 2, y + 2, size);
    graphics.endFill();
    
    // Clear any existing line styles
    graphics.lineStyle(0);
    
    // Body (main circle)
    graphics.beginFill(0x8B4513); // Brown body
    graphics.drawCircle(x, y, size);
    graphics.endFill();
    
    // Head (smaller circle above)
    graphics.beginFill(0xF4A460); // Lighter brown for head
    graphics.drawCircle(x, y - size * 0.8, size * 0.6);
    graphics.endFill();
    
    // Hat/hood
    graphics.beginFill(0x4169E1); // Blue hat
    graphics.drawCircle(x, y - size * 0.8, size * 0.7);
    graphics.endFill();
    graphics.beginFill(0xF4A460); // Face showing
    graphics.drawCircle(x, y - size * 0.6, size * 0.4);
    graphics.endFill();
    
    // Arms/tools
    graphics.lineStyle(3, 0x8B4513);
    // Left arm with tool
    graphics.moveTo(x - size * 0.8, y - size * 0.2);
    graphics.lineTo(x - size * 1.2, y - size * 0.6);
    // Right arm
    graphics.moveTo(x + size * 0.8, y - size * 0.2);
    graphics.lineTo(x + size * 1.0, y + size * 0.2);
    
    // Legs
    graphics.moveTo(x - size * 0.3, y + size * 0.8);
    graphics.lineTo(x - size * 0.5, y + size * 1.3);
    graphics.moveTo(x + size * 0.3, y + size * 0.8);
    graphics.lineTo(x + size * 0.5, y + size * 1.3);
    
    // Tool (pickaxe/shovel)
    graphics.lineStyle(2, 0x654321); // Handle
    graphics.moveTo(x - size * 1.2, y - size * 0.6);
    graphics.lineTo(x - size * 1.4, y - size * 1.0);
    graphics.lineStyle(0); // Clear line style before fill
    graphics.beginFill(0x708090); // Tool head
    graphics.drawRect(x - size * 1.5, y - size * 1.1, size * 0.3, size * 0.2);
    graphics.endFill();
    
    // No outline needed - settler is already visible with distinct colors
  }

  renderCity(city: City) {
    // Center camera on city
    this.centerCameraOnHex(city.position);
    
    // Render visible area around city, hiding unexplored tiles for focused city view
    this.renderVisibleArea(city.position, true);
    
    if (this.cityGraphics) {
      this.hexContainer.removeChild(this.cityGraphics);
    }

    this.cityGraphics = new PIXI.Graphics();
    const { x, y } = HexUtils.hexToPixel(city.position);
    
    // Draw city sprite
    this.drawCitySprite(this.cityGraphics, x, y, city);

    this.hexContainer.addChild(this.cityGraphics);
    
    // Update UI with city resources and terrain bonuses
    this.updateCityUI(city);
    
    // Hide terrain legend once city is founded
    if (this.terrainLegend) {
      this.uiContainer.removeChild(this.terrainLegend);
      this.terrainLegend = undefined;
    }
  }

  private drawCitySprite(graphics: PIXI.Graphics, x: number, y: number, city: City) {
    const size = HexUtils.HEX_SIZE * 0.6;
    
    // City walls (circular base with stone texture effect)
    graphics.beginFill(0x696969); // Dark gray stone
    graphics.lineStyle(2, 0x2F2F2F, 1); // Darker outline
    graphics.drawCircle(x, y, size);
    graphics.endFill();
    
    // Main keep/castle tower (central structure)
    const towerWidth = size * 0.7;
    const towerHeight = size * 1.2;
    graphics.beginFill(0xA0A0A0); // Light gray stone
    graphics.lineStyle(1, 0x2F2F2F, 1);
    graphics.drawRect(x - towerWidth/2, y - towerHeight/2, towerWidth, towerHeight);
    graphics.endFill();
    
    // Battlements on top of main tower
    for (let i = 0; i < 4; i++) {
      const battlementX = x - towerWidth/2 + (i * towerWidth/3);
      graphics.beginFill(0xA0A0A0);
      graphics.drawRect(battlementX, y - towerHeight/2 - 4, towerWidth/6, 8);
      graphics.endFill();
    }
    
    // Side towers based on city development
    if (city.population >= 3) {
      // Left tower
      graphics.beginFill(0x808080);
      graphics.drawRect(x - size * 0.9, y - size * 0.4, size * 0.3, size * 0.8);
      graphics.endFill();
      
      // Right tower  
      graphics.beginFill(0x808080);
      graphics.drawRect(x + size * 0.6, y - size * 0.4, size * 0.3, size * 0.8);
      graphics.endFill();
    }
    
    // City banner/flag on tallest point
    graphics.beginFill(0x4A90E2); // Royal blue
    graphics.drawRect(x + 2, y - towerHeight/2 - 8, 8, 6);
    graphics.endFill();
    
    // Flag pole
    graphics.lineStyle(2, 0x8B4513, 1); // Brown pole
    graphics.moveTo(x, y - towerHeight/2);
    graphics.lineTo(x, y - towerHeight/2 - 12);
    
    // City name text (will be handled by UI layer in future)
    // For now, just a visual marker
    graphics.beginFill(0xFFD700); // Gold marker
    graphics.drawCircle(x, y - size * 1.1, 3);
    graphics.endFill();
  }

  setZoom(zoomLevel: number) {
    this.zoomLevel = zoomLevel;
    this.hexContainer.scale.set(this.zoomLevel);
  }

  getWorldGenerator(): WorldGenerator {
    return this.worldGenerator;
  }


  updateCityUI(_city: City) {
    if (this.foodText) {
      // Hide the top bar info during city mode since it's all in the left sidebar
      this.foodText.visible = false;
    }
  }

  animateZoom(targetZoom: number, duration: number = 800, onComplete?: () => void) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const startZoom = this.zoomLevel;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate zoom level
      const currentZoom = startZoom + (targetZoom - startZoom) * easeProgress;
      this.zoomLevel = currentZoom;
      this.hexContainer.scale.set(this.zoomLevel);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        if (onComplete) onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  }

  destroy() {
    this.app.destroy(true);
  }
}