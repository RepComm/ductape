
import { Component, createRef } from "preact";
import { MutableRef, useEffect } from "preact/hooks";
import { Vec2 } from "./vec";

import style from "./style.module.css";
import type { Rectangle } from "tesseract.js";

export interface Props {
  img?: HTMLImageElement;
  rowCount: number;
  colCount: number;
}
export interface State {
  grid: Grid;
}
type CTX = CanvasRenderingContext2D;

export interface Grid {
  columns: Array<number>;
  rows: Array<number>;
  x: number;
  y: number;
}
function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}
export class ImgTable extends Component<Props, State> {
  constructor (props: Props) {
    super();
    this.state = {
      grid: {
        x: 10, y: 10,
        columns: new Array(props.colCount),
        rows: new Array(props.rowCount)
      }
    };
    this.state.grid.columns.fill(50);
    this.state.grid.rows.fill(50);
  }

  needsDraw: boolean;

  userPan = new Vec2();
  userZoom = 1;
  userZoomRate = 1.1;

  drawImage(ctx: CTX) {
    const img = this.props.img;
    if (!img) return;
    const x = 0;
    const y = 0;
    const w = img.width;
    const h = img.height;

    //explicitly using full image coordinates
    ctx.drawImage(img,
      x, y, w, h,
      x, y, w, h
    );
  }

  gridRowGrab = -1;
  gridColGrab = -1;

  getGridRowMax(): number {
    const g = this.state.grid;
    let maxy = g.y;
    for (let iy = 0; iy < g.rows.length; iy++) {
      maxy += g.rows[iy];
    }
    return maxy;
  }
  getGridColumnMax(): number {
    const g = this.state.grid;
    let maxx = g.x;
    for (let ix = 0; ix < g.columns.length; ix++) {
      maxx += g.columns[ix];
    }
    return maxx;
  }

  _getGridVec = new Vec2();
  getGridPointerRow(): number {
    const g = this.state.grid;

    const maxx = this.getGridColumnMax();
    const minx = g.x;

    let cy = g.y;
    for (let iy = 0; iy < g.rows.length; iy++) {

      this._getGridVec.set(
        clamp(this.pointerScenePos.x, minx, maxx),
        cy
      );

      if (this.pointerScenePos.distance(this._getGridVec) < 6) {
        return iy;
      }
      cy += g.rows[iy];
    }
    this._getGridVec.set(
      clamp(this.pointerScenePos.x, minx, maxx),
      cy
    );

    if (this.pointerScenePos.distance(this._getGridVec) < 6) {
      return g.rows.length;
    }
    
    return -1;
  }
  getGridPointerRowOffset(): number {
    const g = this.state.grid;

    const maxx = this.getGridColumnMax();
    const minx = g.x;

    let cy = g.y;
    for (let iy = 0; iy < g.rows.length; iy++) {

      this._getGridVec.set(
        clamp(this.pointerScenePos.x, minx, maxx),
        cy
      );

      if (this.pointerScenePos.distance(this._getGridVec) < 6) {
        return cy;
      }
      cy += g.rows[iy];
    }
    this._getGridVec.set(
      clamp(this.pointerScenePos.x, minx, maxx),
      cy
    );

    if (this.pointerScenePos.distance(this._getGridVec) < 6) {
      return cy;
    }
    return -1;
  }

  getGridPointerColumn(): number {
    const g = this.state.grid;

    const maxy = this.getGridRowMax();
    const miny = g.y;

    let cx = g.x;
    for (let ix = 0; ix < g.columns.length; ix++) {

      this._getGridVec.set(
        cx,
        clamp(this.pointerScenePos.y, miny, maxy),
      );

      if (this.pointerScenePos.distance(this._getGridVec) < 6) {
        return ix;
      }
      cx += g.columns[ix];
    }
    this._getGridVec.set(
      cx,
      clamp(this.pointerScenePos.y, miny, maxy),
    );

    if (this.pointerScenePos.distance(this._getGridVec) < 6) {
      return g.columns.length;
    }
    return -1;
  }
  getGridPointerColumnOffset(): number {
    const g = this.state.grid;

    const maxy = this.getGridRowMax();
    const miny = g.y;

    let cx = g.x;
    for (let ix = 0; ix < g.columns.length; ix++) {

      this._getGridVec.set(
        cx,
        clamp(this.pointerScenePos.y, miny, maxy),
      );

      if (this.pointerScenePos.distance(this._getGridVec) < 6) {
        return cx;
      }
      cx += g.columns[ix];
    }
    this._getGridVec.set(
      cx,
      clamp(this.pointerScenePos.y, miny, maxy),
    );

    if (this.pointerScenePos.distance(this._getGridVec) < 6) {
      return cx;
    }
    return -1;
  }

  drawGrid(ctx: CTX, strokeStyle = "#22f", strokeWidth = 2) {
    const g = this.state.grid;
    ctx.save();

    let maxx = this.getGridColumnMax();
    const minx = g.x;

    let maxy = this.getGridRowMax();
    const miny = g.y;

    ctx.beginPath();
    ctx.moveTo(minx, miny);
    ctx.lineTo(minx, maxy);

    ctx.moveTo(minx, miny);
    ctx.lineTo(maxx, miny);

    let cx = g.x;
    for (let ix = 0; ix < g.columns.length; ix++) {
      cx += g.columns[ix];
      ctx.moveTo(cx, miny);
      ctx.lineTo(cx, maxy);
    }

    let cy = g.y;
    for (let iy = 0; iy < g.rows.length; iy++) {
      cy += g.rows[iy];

      ctx.moveTo(minx, cy);
      ctx.lineTo(maxx, cy);

    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    ctx.restore();
  }

  drawSelectors (ctx: CTX) {
    const g = this.state.grid;
    const minx = g.x;
    const miny = g.y;

    const pr = this.getGridPointerRowOffset();
    if (pr !== -1) {
      ctx.beginPath();
      ctx.strokeStyle = "#2f2";
      ctx.lineWidth = 3;
      ctx.moveTo(minx, pr);
      const maxx = this.getGridColumnMax();
      ctx.lineTo(maxx, pr);
      ctx.stroke();
    } else {
      const pc = this.getGridPointerColumnOffset();
      if (pc !== -1) {
        ctx.beginPath();
        ctx.strokeStyle = "#2f2";
        ctx.lineWidth = 4;
        ctx.moveTo(pc, miny);
        const maxy = this.getGridRowMax();
        ctx.lineTo(pc, maxy);
        ctx.stroke();
      }
    }
  }

  drawPointer(ctx: CTX) {
    ctx.beginPath();
    const r = 15;
    ctx.ellipse(
      this.pointerScenePos.x,
      this.pointerScenePos.y,
      r, r, 0,
      0, Math.PI * 2
    );
    ctx.strokeStyle = "#f0f";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  draw(ctx: CTX, clean = false, whiteout = 0) {
    ctx.save();
    ctx.fillStyle = "#999";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!clean) {
      ctx.scale(this.userZoom, this.userZoom);
      ctx.translate(this.userPan.x, this.userPan.y);
    }

    this.drawImage(ctx);
    if (!clean) {
      this.drawGrid(ctx);
      this.drawSelectors(ctx);
      this.drawPointer(ctx);
    }
    if (whiteout > 0) {
      this.drawGrid(ctx, "#fff", whiteout);
    }

    ctx.restore();
  }

  pointerDown = false;
  winPointerDownCb = () => {
    this.pointerDown = false;
  };
  winResizeCb = () => {
    const cref = this.cref;
    if (!cref.current) return;
    if (!this.props.img) {
      const blankW = cref.current.parentElement.clientWidth;
      const blankH = cref.current.parentElement.clientHeight;

      cref.current.width = blankW;
      cref.current.width = blankH;
      cref.current.style.width = `${blankW}px`;
      cref.current.style.height = `${blankH}px`;

      console.log(blankW, blankH);
    }
  };

  componentWillMount(): void {
    window.addEventListener("mouseup", this.winPointerDownCb);
    window.addEventListener("resize", this.winResizeCb);
  }
  componentWillUnmount(): void {
    window.removeEventListener("mouseup", this.winPointerDownCb);
    window.removeEventListener("resize", this.winResizeCb);
  }
  cref: MutableRef<HTMLCanvasElement>;

  _domToScreenPointVec = new Vec2();
  domToScenePoint(p: Vec2, out: Vec2) {
    this._domToScreenPointVec.copy(this.userPan).mulScalar(this.userZoom);

    out.copy(p)
      .sub(this._domToScreenPointVec)
      .divScalar(this.userZoom);
  }
  pointerDomPos = new Vec2();
  pointerScenePos = new Vec2();
  pointerUpdate(offsetX: number, offsetY: number) {
    this.pointerDomPos.set(offsetX, offsetY);
    this.domToScenePoint(this.pointerDomPos, this.pointerScenePos);
  }
  animFrameHandle: number;

  addRow () {
    this.state.grid.rows.push(
      this.state.grid.rows[
        this.state.grid.rows.length-1
      ]
    );
  }
  removeRow () {
    this.state.grid.rows.length--;
  }
  addCol () {
  this.state.grid.columns.push(
    this.state.grid.columns[
      this.state.grid.columns.length-1
    ]
    );
  }
  removeCol () {
    this.state.grid.columns.length--;
  }

  rects() {
    const results = new Array<Rectangle>();
    const g = this.state.grid;

    // outputs Ys: [ Xs: [ rects ] ]
    let cy = g.y;
    for (let iy = 0; iy < g.rows.length; iy++) {
      const top = cy;
      const height = g.rows[iy];

      let cx = g.x; //reset x for each row
      
      for (let ix = 0; ix < g.columns.length; ix++) {
        const left = cx;
        const width = g.columns[ix];

        results.push({
          top,height,left,width
        });
        
        cx += width;
      }
      cy += height;
    }
    console.log(results, g);
    return results;
  }

  ctx: CTX;

  img () {
    this.draw(this.ctx, true, 3);
    return {
      src: this.cref.current.toDataURL("image/png"),
      width: this.cref.current.width,
      height: this.cref.current.height
    };
  }

  render() {
    if (this.animFrameHandle !== undefined) {
      window.cancelAnimationFrame(this.animFrameHandle);
    }

    this.cref = createRef<HTMLCanvasElement>();
    const cref = this.cref;

    useEffect(() => {
      if (!this.props.img) {
        const blankW = cref.current.parentElement.clientWidth;
        const blankH = cref.current.parentElement.clientHeight;

        cref.current.width = blankW;
        cref.current.width = blankH;
        cref.current.style.width = `${blankW}px`;
        cref.current.style.height = `${blankH}px`;

        console.log(blankW, blankH);
      }
      const ctx = cref.current.getContext("2d", {
        alpha: false,
        willReadFrequently: true,
      });
      this.ctx = ctx;

      const anim = (time: number) => {
        this.animFrameHandle = window.requestAnimationFrame(anim);

        if (this.needsDraw) {
          this.needsDraw = false;
          this.draw(ctx);
        }
      };
      this.animFrameHandle = window.requestAnimationFrame(anim);
    });

    const fps = 15;
    setInterval(() => {
      this.needsDraw = true;
    }, 1000 / fps);

    const initW = this.props.img?.width || 100;
    const initH = this.props.img?.height || 100;

    const dRef = createRef<HTMLDivElement>();

    return <div
      class={style.imgtable}
      ref={dRef}
      onWheel={(evt) => {

        const rate = evt.deltaY < 0 ? this.userZoomRate : 1 / this.userZoomRate;

        const t = dRef.current;


        const prevZoom = this.userZoom;
        this.userZoom *= rate;
        const zoomDiff = this.userZoom - prevZoom;

        const ox = evt.offsetX + (t.scrollLeft / 10);
        const oy = evt.offsetY + (t.scrollTop / 10);

        const ax = ox * (rate - 1);
        const ay = oy * (rate - 1);

        this.userPan.x -= ax * 1 / this.userZoom;
        this.userPan.y -= ay * 1 / this.userZoom;
      }}
    >
      <canvas
        ref={cref}
        width={initW}
        height={initH}
        style={{ width: `${initW}px`, height: `${initH}px` }}
        onWheel={(evt) => {
          evt.preventDefault();
          this.pointerUpdate(evt.offsetX, evt.offsetY);
        }}
        onMouseDown={(evt) => {
          this.gridRowGrab = this.getGridPointerRow();
          if (this.gridRowGrab === -1) {
            this.gridColGrab = this.getGridPointerColumn();
          }
          this.pointerDown = true;
          this.pointerUpdate(evt.offsetX, evt.offsetY);
        }}
        onMouseUp={(evt) => {
          this.gridRowGrab = -1;
          this.gridColGrab = -1;

          this.pointerDown = false;
          this.pointerUpdate(evt.offsetX, evt.offsetY);
        }}
        onMouseMove={(evt) => {
          this.pointerUpdate(evt.offsetX, evt.offsetY);
          if (this.pointerDown) {
            if (this.gridRowGrab !== -1) {
              if (this.gridRowGrab === 0) {
                this.state.grid.y += evt.movementY / this.userZoom;
              } else {
                this.state.grid.rows[this.gridRowGrab-1] += evt.movementY / this.userZoom;
              }
            } else if (this.gridColGrab !== -1) {
              if (this.gridColGrab === 0) {
                this.state.grid.x += evt.movementX / this.userZoom;
              } else {
                this.state.grid.columns[this.gridColGrab-1] += evt.movementX / this.userZoom;
              }
            } else {
              this.userPan.x += evt.movementX / this.userZoom;
              this.userPan.y += evt.movementY / this.userZoom;
            }
          }
        }}
      />
    </div>
  }
}
