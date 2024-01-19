
import type { Rectangle } from "tesseract.js";

export interface Grid {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  rows: number;
  columns: number;
  cornerRadius: number;
}
export const lerp = (from: number, to: number, by: number): number => {
  return from * (1 - by) + to * by;
}
const _canvasGridBlobsCanvas = document.createElement("canvas");
const _ctx = _canvasGridBlobsCanvas.getContext("2d");

export function gridToRects(g: Grid) {
  const results = new Array<Rectangle>();

  for (let iy = 0; iy < g.rows; iy++) {
    const top = g.y + ((iy / g.rows) * g.h);
    const height = g.h / g.rows;
    for (let ix = 0; ix < g.columns; ix++) {
      const left = g.x + ((ix / g.columns) * g.w);
      const width = g.w / g.columns;

      const r = {
        top,
        left,
        width,
        height
      };
      results.push(r);
    }
  }

  return results;
}
export function scaleRect(n: Rectangle, w: number, h: number) {
  n.top *= h;
  n.left *= w;
  n.height *= h;
  n.width *= w;
}
export function integerRects(n: Rectangle) {
  n.top = Math.floor(n.top);
  n.left = Math.floor(n.left);
  n.width = Math.floor(n.width);
  n.height = Math.floor(n.height);
}
export function dist(ax: number, ay: number, bx: number, by: number) {
  const a = ax - bx;
  const b = ay - by;
  return Math.sqrt(a * a + b * b);
}