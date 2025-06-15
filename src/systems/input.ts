import { HexCoordinate, HexUtils } from '../core/hex';

export type InputHandler = (hex: HexCoordinate) => void;

export class InputSystem {
  private canvas: HTMLCanvasElement;
  private clickHandler?: InputHandler;
  private getCameraOffset: () => { x: number; y: number };

  constructor(canvas: HTMLCanvasElement, getCameraOffset: () => { x: number; y: number }) {
    this.canvas = canvas;
    this.getCameraOffset = getCameraOffset;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.style.cursor = 'pointer';
  }

  private handleClick(event: MouseEvent) {
    if (!this.clickHandler) return;

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Get camera offset
    const cameraOffset = this.getCameraOffset();
    
    // Convert canvas coordinates to world coordinates
    const worldX = canvasX - cameraOffset.x;
    const worldY = canvasY - cameraOffset.y;

    const hex = HexUtils.pixelToHex(worldX, worldY);
    this.clickHandler(hex);
  }

  setClickHandler(handler: InputHandler) {
    this.clickHandler = handler;
  }

  removeClickHandler() {
    this.clickHandler = undefined;
  }

  destroy() {
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
  }
}