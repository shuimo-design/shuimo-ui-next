/**
 * 栅格与格子的无框架部分：栅格的 CSS 变量、每个格子的属性归一化（含 gapRotate 分角），
 * 以及格子的四边形几何、遮罩和那个"往左压一点"的位移控制器。
 *
 * 排列顺序就是 `cells` 数组的顺序（子组件写法由壳在 render 期按书写顺序收集成同一个数组），
 * 所以 gapRotate 的第 i 道斜缝在服务端就分得对，不用等挂载去比 DOM 位置。
 */
import { brushPolygonUrl } from "../../ink/assets/polygon";
import type { BrushBorderControllerOptions } from "../../ink/stroke";
import type { Controller } from "../../runtime/controller";
import { createStore } from "../../runtime/store";
import {
  isTilted,
  polygonClip,
  quadPoints,
  resolveAngles,
  tiltShift,
  type CellAngles,
} from "./quad";
import type { CellComponentProps, GridBreakpoint, GridCellConfig, GridProps } from "./types";

export { isTilted, parseAngle, polygonClip, quadPoints, resolveAngles, tiltShift } from "./quad";
export type { CellAngles } from "./quad";
export type {
  CellAngle,
  CellComponentProps,
  CellProps,
  CellSlots,
  GridBreakpoint,
  GridCellConfig,
  GridCols,
  GridProps,
  GridSlots,
} from "./types";

/** 笔触边框 / 多边形共用的参数 */
const BRUSH = { strokeWidth: 2, seed: 7 };
/** 遮罩尺寸按 8px 分桶再生成，拖窗口时不至于每像素重画一张 SVG */
const MASK_BUCKET = 8;

const BREAKPOINTS: GridBreakpoint[] = ["xs", "sm", "md", "lg", "xl"];

function toLength(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

export function gridClasses(props: Pick<GridProps, "direction" | "cols">): string[] {
  return [
    "m-grid",
    `m-grid--${props.direction ?? "row"}`,
    ...(props.cols === undefined ? [] : ["m-grid--cols"]),
  ];
}

export function gridStyle(props: GridProps): Record<string, string> {
  const { direction = "row", cols, gap, colGap, rowGap } = props;
  const style: Record<string, string> = {};
  // 横排 / cols 模式的主间距是 colGap，竖排是 rowGap；都没给就用 gap
  const main = direction === "row" || cols !== undefined ? colGap : rowGap;
  const mainGap = toLength(main ?? gap);
  if (mainGap !== undefined) style["--m-grid-gap"] = mainGap;
  // cols 模式会换行，行间距单独一个变量，不传时跟随主间距
  const cross = toLength(rowGap);
  if (cols !== undefined && cross !== undefined) style["--m-grid-row-gap"] = cross;
  if (typeof cols === "number") {
    style["--m-grid-cols-xs"] = String(cols);
  } else if (cols) {
    for (const bp of BREAKPOINTS) {
      const n = cols[bp];
      if (n !== undefined) style[`--m-grid-cols-${bp}`] = String(n);
    }
  }
  return style;
}

/** 栅格算好之后直接交给 MCell 的一项 */
export interface ResolvedGridCell<Node = unknown> {
  readonly key: string | number;
  /** 原样展开给 MCell 的属性 */
  readonly props: CellComponentProps;
  /** 格子内容 */
  readonly content: Node | undefined;
}

/**
 * 把 `cells` 里的每一项补成 MCell 的完整属性：
 * 宽高回落到栅格的默认值，gapRotate 的第 i 道斜缝分给第 i 个格子的右边和第 i+1 个格子的左边
 * （格子自己写了 b / d 就以自己的为准）。cols 模式和竖排不分斜角。
 */
export function resolveGridCells<Node>(
  cells: readonly GridCellConfig<Node>[],
  grid: Pick<GridProps, "w" | "h" | "direction" | "cols" | "gapRotate">,
): ResolvedGridCell<Node>[] {
  const tiltable = (grid.direction ?? "row") === "row" && grid.cols === undefined;
  const rotate = grid.gapRotate ?? [];
  return cells.map((cell, index) => {
    const { key, content, ...rest } = cell;
    const right = tiltable ? rotate[index] : undefined;
    const left = tiltable && index > 0 ? rotate[index - 1] : undefined;
    const d = cell.d ?? left;
    return {
      key: key ?? index,
      props: {
        ...rest,
        w: cell.w ?? grid.w,
        h: cell.h ?? grid.h,
        b: cell.b ?? right,
        d,
        // 左斜角是栅格分的（不是格子自己写的）才需要往左压
        shiftAngle: cell.d === undefined ? left : undefined,
      },
      content,
    };
  });
}

function isInkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

/** 直边格子的笔触边框参数；开不开由 cellBrushEnabled 决定 */
export function cellBrush(): Omit<BrushBorderControllerOptions, "enabled"> {
  return { ...BRUSH };
}

/**
 * 只有"要边框 + 直边 + 引擎就绪"才画笔触边框：
 * 斜边格子套不上矩形边框，换成按角点生成的笔触多边形（见 cellGeometry 里的遮罩）。
 */
export function cellBrushEnabled(border: boolean | undefined, tilted: boolean): boolean {
  return Boolean(border) && !tilted && isInkReady();
}

function bucket(value: number): number {
  return Math.max(MASK_BUCKET, Math.ceil(value / MASK_BUCKET) * MASK_BUCKET);
}

/** 模板要用的全部派生值，一次算完 */
export interface CellGeometry {
  readonly angles: CellAngles;
  readonly tilted: boolean;
  readonly classes: string[];
  /** 根元素上的内联样式（含 CSS 变量、位移和栅格定位） */
  readonly style: Record<string, string>;
  /** 内容区的裁剪；直边格子是 undefined */
  readonly clipPath: string | undefined;
  /** 默认皮肤那条细线轮廓的 points；没量到尺寸或不画边框时是 undefined */
  readonly outlinePoints: string | undefined;
}

/**
 * 格子的几何。宽高是量出来的，服务端和水合首帧都是 0 —— 那时 quad 一律不算，
 * 渲染的是没有裁剪、没有轮廓的朴素版，两边输出一致。
 * `mounted` 同时也是"敢不敢读引擎状态"的闸门：没挂载前一律当作没开引擎。
 */
export function cellGeometry(o: {
  props: CellComponentProps;
  /** 量出来的宽高 px，未量到是 0 */
  width: number;
  height: number;
  /** 往左压的距离 px，由 createCellShift 给 */
  shift: number;
  mounted: boolean;
}): CellGeometry {
  const { props, width, height, shift } = o;
  const angles = resolveAngles(props);
  const tilted = isTilted(angles);
  const measured = width > 0 && height > 0;
  const ink = o.mounted && isInkReady();
  const quad = tilted && measured ? quadPoints(width, height, angles) : undefined;

  const style: Record<string, string> = {};
  if (props.w !== undefined) style["--m-cell-w"] = `${props.w}px`;
  if (props.h !== undefined) style["--m-cell-h"] = `${props.h}px`;
  if (shift !== 0) style.marginLeft = `-${shift}px`;
  if (props.span !== undefined) style.gridColumnEnd = `span ${props.span}`;
  if (props.offset !== undefined) style.gridColumnStart = String(props.offset + 1);
  if (props.border && quad && ink) {
    const bw = bucket(width);
    const bh = bucket(height);
    const mask = brushPolygonUrl(quadPoints(bw, bh, angles), bw, bh, BRUSH);
    style["--m-cell-quad-mask"] = `url("${mask.url}")`;
    style["--m-cell-quad-pad"] = `${mask.padding}px`;
  }

  return {
    angles,
    tilted,
    classes: [
      "m-cell",
      ...(props.border ? ["m-cell--border"] : []),
      ...(tilted ? ["m-cell--tilted"] : []),
      ...(props.w !== undefined ? ["m-cell--fixed-w"] : []),
      ...(props.h !== undefined ? ["m-cell--fixed-h"] : []),
    ],
    style,
    clipPath: quad ? polygonClip(quad) : undefined,
    outlinePoints:
      props.border && quad
        ? quad
            .map(([x, y]) => `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`)
            .join(" ")
        : undefined,
  };
}

export interface CellShiftState {
  /** 往左压的距离 px */
  readonly shift: number;
}

export interface CellShiftOptions {
  /** 量出来的高度 px */
  height: number;
  /** 左边那个来自栅格的斜角；没有就不压 */
  angle: number | undefined;
}

export interface CellShiftController extends Controller<CellShiftState, CellShiftOptions> {
  /** 这一轮渲染完之后调一次：算出新的位移并推到下一帧再写 */
  flush(): void;
}

/**
 * 左斜角来自栅格时，格子要往左压 h·tan|θ|，才和前一个格子的右斜边平行等距。
 *
 * 这个值改的是布局，而它又是从尺寸算出来的 —— 在尺寸回调里同步改会引起观察器的循环告警，
 * 所以推到下一帧再写。首帧是 0（服务端也是 0），量到高度之后才补上。
 */
export function createCellShift(initial: CellShiftOptions): CellShiftController {
  const server: CellShiftState = { shift: 0 };
  const store = createStore<CellShiftState>(server);
  let options = initial;
  let frame: number | undefined;
  let connected = false;

  function target(): number {
    const { angle, height } = options;
    if (angle === undefined || angle === 0 || height <= 0) return 0;
    return Math.round(tiltShift(height, angle) * 100) / 100;
  }

  function flush(): void {
    if (!connected) return;
    const next = target();
    if (next === store.get().shift) return;
    if (typeof requestAnimationFrame === "undefined") {
      store.set({ shift: next });
      return;
    }
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = undefined;
      store.set({ shift: target() });
    });
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,
    // 纯赋值：不通知、不碰 DOM。真正写值由壳在 DOM 更新后调 flush()
    update(next) {
      options = next;
    },
    flush,
    connect() {
      if (connected) return;
      connected = true;
      flush();
    },
    disconnect() {
      connected = false;
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
    },
  };
}
