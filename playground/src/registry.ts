import type { Component } from "vue";
import type { ComponentType } from "react";

/**
 * 组件清单：只写 id / 标题 / 组件名三样，demo 本身按 id 从目录里查。
 * Vue 的 demo 在 demos/，React 的在 demos-react/，文件名都是 <Pascal>Demo。
 * React 那边还没搬到的组件，页面上显示占位，站照常构建 —— 这也是迁移进度看板。
 */
export interface DemoEntry {
  id: string;
  title: string;
  /** M 开头的组件名，用来查 API 表 */
  name: string;
  vue?: Component;
  react?: ComponentType;
}

export interface DemoGroup {
  group: string;
  items: DemoEntry[];
}

const vueDemos = import.meta.glob<{ default: Component }>("./demos/*Demo.vue", {
  eager: true,
  import: "default",
}) as unknown as Record<string, Component>;
const reactDemos = import.meta.glob<{ default: ComponentType }>("./demos-react/*Demo.tsx", {
  eager: true,
  import: "default",
}) as unknown as Record<string, ComponentType>;

/** delete-icon → DeleteIconDemo */
function fileOf(id: string): string {
  return `${id.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase())}Demo`;
}

function entry(id: string, title: string, name: string): DemoEntry {
  return {
    id,
    title,
    name,
    vue: vueDemos[`./demos/${fileOf(id)}.vue`],
    react: reactDemos[`./demos-react/${fileOf(id)}.tsx`],
  };
}

export const DEMOS: DemoGroup[] = [
  {
    group: "特效",
    items: [
      entry("rice-paper", "宣纸", "MRicePaper"),
      entry("border", "笔触边框", "MBorder"),
      entry("stamp", "印章", "MStamp"),
      entry("ink-transition", "落墨与转场", "MInkTransition"),
    ],
  },
  {
    group: "基础",
    items: [
      entry("button", "按钮", "MButton"),
      entry("input", "输入框", "MInput"),
      entry("input-number", "数字输入", "MInputNumber"),
      entry("select", "选择器", "MSelect"),
      entry("date-picker", "日期选择", "MDatePicker"),
      entry("checkbox", "复选框", "MCheckbox"),
      entry("radio", "单选框", "MRadio"),
      entry("switch", "开关", "MSwitch"),
      entry("slider", "滑块", "MSlider"),
      entry("tag", "标签", "MTag"),
      entry("avatar", "头像", "MAvatar"),
      entry("progress", "进度条", "MProgress"),
      entry("collapse", "折叠面板", "MCollapse"),
      entry("list", "列表", "MList"),
      entry("tree", "树", "MTree"),
      entry("card", "卡片", "MCard"),
      entry("badge", "角标", "MBadge"),
    ],
  },
  {
    group: "模版",
    items: [
      entry("breadcrumb", "面包屑", "MBreadcrumb"),
      entry("menu", "菜单", "MMenu"),
      entry("pagination", "分页", "MPagination"),
      entry("form", "表单", "MForm"),
      entry("table", "表格", "MTable"),
      entry("grid", "栅格", "MGrid"),
      entry("virtual-list", "虚拟列表", "MVirtualList"),
      entry("steps", "步骤条", "MSteps"),
      entry("tabs", "标签页", "MTabs"),
    ],
  },
  {
    group: "消息",
    items: [
      entry("popover", "气泡卡片", "MPopover"),
      entry("tooltip", "悬浮提示", "MTooltip"),
      entry("message", "消息提示", "MMessage"),
      entry("confirm", "确认框", "MConfirm"),
      entry("dialog", "弹窗", "MDialog"),
      entry("drawer", "抽屉", "MDrawer"),
      entry("alert", "警告提示", "MAlert"),
    ],
  },
  {
    group: "其他",
    items: [
      entry("scroll", "滚动条", "MScroll"),
      entry("printer", "打字机", "MPrinter"),
      entry("divider", "分割线", "MDivider"),
      entry("loading", "加载", "MLoading"),
      entry("delete-icon", "删除图标", "MDeleteIcon"),
      entry("config-provider", "全局配置", "MConfigProvider"),
      entry("dark-mode", "深浅切换", "MDarkMode"),
      entry("svg", "图标", "MSvg"),
      entry("empty", "空状态", "MEmpty"),
      entry("skeleton", "骨架屏", "MSkeleton"),
    ],
  },
];

export const ALL_DEMOS = DEMOS.flatMap((g) => g.items);

/** 清单里写了但 demos/ 下没有对应文件的，立刻炸出来，不要静默少一页 */
for (const demo of ALL_DEMOS) {
  if (!demo.vue) throw new Error(`registry: 找不到 demos/${fileOf(demo.id)}.vue`);
}

/** React 侧的迁移进度，印在导航栏顶上 */
export const REACT_PROGRESS = {
  done: ALL_DEMOS.filter((d) => d.react).length,
  total: ALL_DEMOS.length,
};
