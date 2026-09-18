/**
 * 组件内部用的线性图标。几何数据在 @shuimo-design/core 的 ICONS 里只有一份，
 * 这里只负责把它画成 Vue 组件；React 包那边有一个同样十几行的对应物。
 * 尺寸跟随 font-size，颜色跟随 currentColor。
 */
import { h, type FunctionalComponent } from "vue";
import { ICONS, iconComponentName, type IconName } from "@shuimo-design/core";

export const MIcon: FunctionalComponent<{ name: IconName }> = ({ name }) => {
  const def = ICONS[name];
  return h(
    "svg",
    {
      class: "m-icon",
      viewBox: def.viewBox,
      width: def.width,
      height: def.height,
      fill: def.fill,
      ...("stroke" in def ? { stroke: def.stroke } : {}),
      ...("strokeWidth" in def ? { "stroke-width": def.strokeWidth } : {}),
      ...("strokeLinecap" in def ? { "stroke-linecap": def.strokeLinecap } : {}),
      ...("strokeLinejoin" in def ? { "stroke-linejoin": def.strokeLinejoin } : {}),
      "aria-hidden": "true",
    },
    def.shapes.map((shape) => h(shape.tag, { ...shape.attrs })),
  );
};
MIcon.props = ["name"];

function icon(name: IconName): FunctionalComponent {
  const component: FunctionalComponent = () => h(MIcon, { name });
  component.displayName = iconComponentName(name);
  return component;
}

export const IconBrushChevronDown = icon("brush-chevron-down");
export const IconCalendar = icon("calendar");
export const IconCaretDown = icon("caret-down");
export const IconCaretUp = icon("caret-up");
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
export const IconRestore = icon("restore");
export const IconRotate = icon("rotate");
export const IconSearch = icon("search");
export const IconUser = icon("user");
