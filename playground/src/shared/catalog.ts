/**
 * 组件清单：只有 id / 标题 / 组件名三样数据，**不引任何框架**。
 *
 * 两版文档站（Vue 版在 /vue/，React 版在 /react/）共用这一份清单，所以左边栏的分组、
 * 顺序、标题永远一致；各自再按 id 去自己的 demos/ 目录里取示例。
 */
export interface DemoMeta {
  /** 页面的 hash 路由，也用来拼 demo 文件名 */
  id: string;
  title: string;
  /** M 开头的组件名，用来查 API 表 */
  name: string;
}

export interface DemoGroup {
  group: string;
  items: DemoMeta[];
}

function entry(id: string, title: string, name: string): DemoMeta {
  return { id, title, name };
}

export const CATALOG: DemoGroup[] = [
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

export const ALL_DEMOS: DemoMeta[] = CATALOG.flatMap((g) => g.items);

/** delete-icon → DeleteIconDemo */
export function fileOf(id: string): string {
  return `${id.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase())}Demo`;
}

/** 清单里写了但目录下没有对应文件的，启动就炸，不要静默少一页 */
export function assertComplete(found: Record<string, unknown>, dir: string, ext: string): void {
  for (const demo of ALL_DEMOS) {
    if (!found[demo.id]) throw new Error(`catalog: 找不到 ${dir}/${fileOf(demo.id)}${ext}`);
  }
}

/** 当前 hash 对应的组件 id，没有或认不出就回到第一个 */
export function readHash(): string {
  const id = location.hash.replace(/^#\/?/, "");
  return ALL_DEMOS.some((d) => d.id === id) ? id : ALL_DEMOS[0]!.id;
}
