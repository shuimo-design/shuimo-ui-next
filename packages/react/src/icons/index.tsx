/**
 * 组件内部用的线性图标。几何数据在 @shuimo-design/core 的 ICONS 里只有一份，
 * 这里只负责把它画成 React 组件；Vue 包那边有一个同样十几行的对应物。
 * 尺寸跟随 font-size，颜色跟随 currentColor。
 */
import { createElement, type ComponentType, type SVGProps } from "react";
import { ICONS, iconComponentName, type IconName } from "@shuimo-design/core";

/** 数据里的属性名是 SVG 的写法（stroke-width），React 要驼峰 */
function toReactAttrs(attrs: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    out[key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return out;
}

/** SVG 元素自己有个 name 属性，要排掉，否则展开时会把图标名冲成普通字符串 */
export type IconExtraProps = Omit<SVGProps<SVGSVGElement>, "name">;

export function MIcon({ name, ...rest }: { name: IconName } & IconExtraProps) {
  const def = ICONS[name];
  return (
    <svg
      className="m-icon"
      viewBox={def.viewBox}
      width={def.width}
      height={def.height}
      fill={def.fill}
      stroke={"stroke" in def ? def.stroke : undefined}
      strokeWidth={"strokeWidth" in def ? def.strokeWidth : undefined}
      strokeLinecap={
        "strokeLinecap" in def
          ? (def.strokeLinecap as SVGProps<SVGSVGElement>["strokeLinecap"])
          : undefined
      }
      strokeLinejoin={
        "strokeLinejoin" in def
          ? (def.strokeLinejoin as SVGProps<SVGSVGElement>["strokeLinejoin"])
          : undefined
      }
      aria-hidden="true"
      {...rest}
    >
      {def.shapes.map((shape, index) =>
        createElement(shape.tag, { key: index, ...toReactAttrs(shape.attrs) }),
      )}
    </svg>
  );
}

function icon(name: IconName): ComponentType<IconExtraProps> {
  const component = (props: IconExtraProps) => <MIcon name={name} {...props} />;
  component.displayName = iconComponentName(name);
  return component;
}

export const IconBrushChevronDown = icon("brush-chevron-down");
export const IconCalendar = icon("calendar");
export const IconCheck = icon("check");
export const IconChevronDown = icon("chevron-down");
export const IconChevronLeft = icon("chevron-left");
export const IconChevronRight = icon("chevron-right");
export const IconChevronsLeft = icon("chevrons-left");
export const IconChevronsRight = icon("chevrons-right");
export const IconClose = icon("close");
export const IconDot = icon("dot");
export const IconEye = icon("eye");
export const IconEyeOff = icon("eye-off");
export const IconLoading = icon("loading");
export const IconMinus = icon("minus");
export const IconPlus = icon("plus");
export const IconSearch = icon("search");
export const IconUser = icon("user");
