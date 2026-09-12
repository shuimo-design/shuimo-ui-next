/**
 * 内部用的线性图标，只有几何数据。
 *
 * 原来每个图标一个 SFC；双框架之后那等于同一条 path 在两边各写一遍、还会各自漂移。
 * 现在几何在这里只有一份，Vue 和 React 各写一个十几行的 <Icon> 把它画出来。
 * 尺寸跟随 font-size，颜色跟随 currentColor。
 */

export interface IconShape {
  readonly tag: "path" | "circle" | "rect" | "line" | "polyline" | "ellipse";
  readonly attrs: Readonly<Record<string, string>>;
}

export interface IconDef {
  readonly viewBox: string;
  /** 宽度，默认 "1em"；只有非正方形的图标（比如一笔写出的箭头是 28:16）才不一样 */
  readonly width: string;
  readonly height: string;
  readonly fill: string;
  readonly stroke?: string;
  readonly strokeWidth?: string;
  readonly strokeLinecap?: string;
  readonly strokeLinejoin?: string;
  readonly shapes: readonly IconShape[];
}

export const ICONS = {
  /** 一笔写出的「V」，取自旧版折叠面板的箭头；宽高比 28:16，转向靠外层 rotate */
  "brush-chevron-down": {
    viewBox: "0 0 28 16",
    width: "1.75em",
    height: "1em",
    fill: "currentColor",
    shapes: [
      {
        tag: "path",
        attrs: {
          d: "M12,11c1.24,1.24,6.08-4.86,7.5-6,.2-.16.78.17,1,0,1.44-1.11,2.27-3.33,4.5-3,.47.43-2.47,2.83-3,3.5-.17.21.16.81,0,1-2.08,2.55-3.78,2.79-5,5-.62,1.12-2.57,1.53-2,3.5-1.74.2-3.01.07-4-1.5-2.16-3.42-4.31-4.94-7-8-.58-.66-2.96-2.54-2-3.5,1.27-1.27,6.31,5.16,7.5,6,.83.58,3.11.42,2.5,3Z",
        },
      },
    ],
  },
  calendar: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [
      { tag: "rect", attrs: { x: "4", y: "5", width: "16", height: "15", rx: "1.5" } },
      { tag: "path", attrs: { d: "M4 10h16M8 3v4M16 3v4" } },
    ],
  },
  check: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "M5 12.5 10 17.5 19 7" } }],
  },
  "chevron-down": {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "m6 9 6 6 6-6" } }],
  },
  "chevron-left": {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "m15 6-6 6 6 6" } }],
  },
  "chevron-right": {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "m9 6 6 6-6 6" } }],
  },
  "chevrons-left": {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "m11 6-6 6 6 6M18 6l-6 6 6 6" } }],
  },
  "chevrons-right": {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "m6 6 6 6-6 6M13 6l6 6-6 6" } }],
  },
  close: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "M7 7l10 10M17 7 7 17" } }],
  },
  dot: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    shapes: [{ tag: "circle", attrs: { cx: "12", cy: "12", r: "4.5", fill: "currentColor" } }],
  },
  eye: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [
      {
        tag: "path",
        attrs: { d: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" },
      },
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "3" } },
    ],
  },
  "eye-off": {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [
      {
        tag: "path",
        attrs: {
          d: "M3 3l18 18M10.6 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 3.9M6.6 6.6C4 8.5 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4.1-1",
        },
      },
      { tag: "path", attrs: { d: "M9.9 9.9a3 3 0 0 0 4.2 4.2" } },
    ],
  },
  loading: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "M12 3a9 9 0 1 0 9 9" } }],
  },
  minus: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "M6 12h12" } }],
  },
  plus: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [{ tag: "path", attrs: { d: "M12 6v12M6 12h12" } }],
  },
  search: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [
      { tag: "circle", attrs: { cx: "11", cy: "11", r: "6.5" } },
      { tag: "path", attrs: { d: "m16 16 4.5 4.5" } },
    ],
  },
  user: {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes: [
      { tag: "circle", attrs: { cx: "12", cy: "8", r: "4" } },
      { tag: "path", attrs: { d: "M4.5 20.5c0-4.2 3.4-6.8 7.5-6.8s7.5 2.6 7.5 6.8" } },
    ],
  },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

/** 图标名 → 组件名，两个框架共用同一套命名：close → IconClose */
export function iconComponentName(name: IconName): string {
  return `Icon${name.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase())}`;
}
