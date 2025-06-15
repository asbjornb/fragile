import { HexCoordinate, HexUtils } from '../core/hex';

export type InputHandler = (hex: HexCoordinate) => void;

export class InputSystem {
  private canvas: HTMLCanvasElement;
  private clickHandler?: InputHandler;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
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

    // Convert canvas coordinates to world coordinates
    // Account for the camera offset (screen center)
    const worldX = canvasX - this.canvas.width / 2;
    const worldY = canvasY - this.canvas.height / 2;

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