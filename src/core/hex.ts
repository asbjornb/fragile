export interface HexCoordinate {
  q: number;
  r: number;
}

export class HexUtils {
  static readonly HEX_SIZE = 32;
  static readonly SQRT_3 = Math.sqrt(3);

  static hexToPixel(hex: HexCoordinate): { x: number; y: number } {
    const x = this.HEX_SIZE * (this.SQRT_3 * hex.q + this.SQRT_3 / 2 * hex.r);
    const y = this.HEX_SIZE * (3 / 2 * hex.r);
    return { x, y };
  }

  static pixelToHex(x: number, y: number): HexCoordinate {
    const q = (this.SQRT_3 / 3 * x - 1 / 3 * y) / this.HEX_SIZE;
    const r = (2 / 3 * y) / this.HEX_SIZE;
    return this.hexRound({ q, r });
  }

  static hexRound(hex: { q: number; r: number }): HexCoordinate {
    let q = Math.round(hex.q);
    let r = Math.round(hex.r);
    const s = Math.round(-hex.q - hex.r);

    const qDiff = Math.abs(q - hex.q);
    const rDiff = Math.abs(r - hex.r);
    const sDiff = Math.abs(s - (-hex.q - hex.r));

    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    }

    return { q, r };
  }

  static hexDistance(a: HexCoordinate, b: HexCoordinate): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }

  static hexNeighbors(hex: HexCoordinate): HexCoordinate[] {
    const directions = [
      { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
      { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return directions.map(dir => ({ q: hex.q + dir.q, r: hex.r + dir.r }));
  }
}