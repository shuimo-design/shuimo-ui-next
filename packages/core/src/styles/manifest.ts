/**
 * 按需样式的清单。
 *
 * 全量的 style.css 之外，构建还会把样式按组件拆成 dist/css/<名字>.css（见 scripts/build-css.ts），
 * 这份表回答"用某个组件要引哪几个文件"。两个壳的 style/<组件名> 入口和 Vue 的 resolver 都从这里算，
 * 不各自维护一份。
 *
 * 表里只写两样东西：
 * - `css`：这个组件自己的样式文件名（去掉 .css）。没有就是只靠 base。
 * - `renders`：它内部会渲染哪些别的组件，或用到哪个共享样式块 —— 样式跟着一起要。
 *   写的是"谁渲染了谁"这个事实，不写算好的闭包，闭包由 styleFilesOf 求。
 *
 * base.css 永远排第一：层顺序、颜色、尺寸变量、基础重置、图标、墨迹引擎的动画都在里面，
 * 任何组件都少不了。
 *
 * scripts/check-style.ts 校验：每个 css 名字都有对应的源文件、每个源文件都被某个组件用到；
 * scripts/gen-meta.ts 校验：表的 key 和组件清单一一对应。
 */

/** 每份按需样式文件都以它开头，不管用户先引哪一份，层的先后都是对的 */
export const LAYER_ORDER = "@layer m.reset, m.tokens, m.base, m.component, m.ink;";

/** 所有组件都要的底子，对应 src/styles/index.css 里 components/ 之外的那些 */
export const STYLE_BASE = "base";

/** 组件之间共用的样式块（src/internal 下的），按需时当成一个普通文件 */
export const SHARED_STYLES = ["modal-ink", "popper", "tree-row"] as const;
export type SharedStyle = (typeof SHARED_STYLES)[number];

interface StyleEntry {
  css?: string;
  renders?: readonly string[];
}

export const COMPONENT_STYLES = {
  MAlert: { css: "alert" },
  MAutoComplete: { css: "auto-complete", renders: ["popper"] },
  MAvatar: { css: "avatar" },
  // 默认那枚「顶」字印是 MStamp
  MBackTop: { css: "back-top", renders: ["MStamp"] },
  MBadge: { css: "badge" },
  MBorder: { css: "border" },
  MBreadcrumb: { css: "breadcrumb" },
  MBreadcrumbItem: { css: "breadcrumb" },
  MButton: { css: "button" },
  MCard: { css: "card" },
  MCarousel: { css: "carousel" },
  MCarouselItem: { css: "carousel" },
  MCell: { css: "grid" },
  MCheckbox: { css: "checkbox" },
  MCheckboxGroup: { css: "checkbox" },
  MCollapse: { css: "collapse" },
  MCollapseItem: { css: "collapse" },
  // 自带一个 MOverlayOutlet
  MConfigProvider: { renders: ["MOverlayOutlet"] },
  MConfirm: { css: "confirm", renders: ["modal-ink", "MButton"] },
  MDarkMode: { css: "dark-mode" },
  MDatePicker: { css: "date-picker", renders: ["popper"] },
  MDeleteIcon: { css: "delete-icon" },
  MDescriptions: { css: "descriptions" },
  MDescriptionsItem: { css: "descriptions" },
  MDialog: { css: "dialog", renders: ["modal-ink"] },
  MDivider: { css: "divider" },
  MDrawer: { css: "drawer", renders: ["modal-ink"] },
  MDropdown: { css: "dropdown", renders: ["popper", "MBorder"] },
  MEmpty: { css: "empty" },
  MForm: { css: "form" },
  MFormItem: { css: "form" },
  MGrid: { css: "grid" },
  // 预览层的挂牌关闭钮借用弹窗的墨皮；加载中的占位是 MSkeletonItem
  MImage: { css: "image", renders: ["modal-ink", "MSkeletonItem"] },
  // 过渡的样式在 ink/transition 里，已经在 base
  MInkTransition: {},
  MInput: { css: "input" },
  MInputNumber: { css: "input-number" },
  MList: { css: "list" },
  MListItem: { css: "list" },
  MLoading: { css: "loading" },
  MMenu: { css: "menu" },
  MMenuItem: { css: "menu" },
  MMessage: { css: "message" },
  // 右上角的关闭是 MDeleteIcon 的叉
  MNotification: { css: "notification", renders: ["MDeleteIcon"] },
  // 函数式弹层的渲染出口：消息、通知和确认框都从这里出
  MOverlayOutlet: { renders: ["MMessage", "MNotification", "MConfirm"] },
  // Vue 侧的每页条数下拉和跳页输入框是 MSelect / MInput；React 侧手写了同一套类名
  MPagination: { css: "pagination", renders: ["MInput", "MSelect"] },
  MPaperTheme: { css: "paper-theme" },
  MPopconfirm: { css: "popconfirm", renders: ["popper", "MBorder", "MButton"] },
  MPopover: { css: "popover", renders: ["popper", "MBorder"] },
  MPrinter: { css: "printer" },
  MProgress: { css: "progress" },
  MRadio: { css: "radio" },
  MRadioGroup: { css: "radio" },
  MRate: { css: "rate" },
  MRicePaper: { css: "rice-paper" },
  MScroll: { css: "scroll" },
  // 印章是一枚 MStamp
  MSealColophon: { css: "seal-colophon", renders: ["MStamp"] },
  // 多选时选中项渲染成 MTag
  MSelect: { css: "select", renders: ["popper", "MTag"] },
  MSkeleton: { css: "skeleton" },
  MSkeletonItem: { css: "skeleton" },
  MSlider: { css: "slider" },
  MStamp: { css: "stamp" },
  MStep: { css: "steps" },
  MSteps: { css: "steps" },
  MSvg: { css: "svg" },
  MSwitch: { css: "switch" },
  // 开了行选择时第一列是 MCheckbox
  MTable: { css: "table", renders: ["MCheckbox"] },
  MTableColumn: { css: "table" },
  MTabPane: { css: "tabs" },
  MTabs: { css: "tabs" },
  MTag: { css: "tag" },
  MTimeline: { css: "timeline" },
  MTimelineItem: { css: "timeline" },
  MTooltip: { css: "tooltip", renders: ["popper", "MBorder"] },
  // 行的皮肤是两棵树共用的 tree-row 块；checkable 时行里是 MCheckbox
  MTree: { css: "tree", renders: ["tree-row", "MCheckbox"] },
  // 默认触发钮是 MButton；文件列表借 MList / MListItem 的骨架，传输中的行里是 MProgress
  MUpload: { css: "upload", renders: ["MButton", "MList", "MListItem", "MProgress"] },
  MVirtualList: { css: "virtual-list" },
  MVirtualTree: { css: "virtual-tree", renders: ["tree-row", "MCheckbox"] },
  MWatermark: { css: "watermark" },
} as const satisfies Record<string, StyleEntry>;

export type StyledComponentName = keyof typeof COMPONENT_STYLES;

export function isStyledComponent(name: string): name is StyledComponentName {
  return Object.hasOwn(COMPONENT_STYLES, name);
}

/**
 * 用这个组件要引的样式文件名，按引入顺序，base 永远在最前，被依赖的排在依赖它的前面。
 * 返回的是文件名（不带 .css），路径由调用方拼：core 的是 dist/css/<名字>.css，
 * 两个壳复制了同一份，用户从 `@shuimo-design/vue/css/<名字>.css` 引。
 */
export function styleFilesOf(name: StyledComponentName): string[] {
  const files: string[] = [STYLE_BASE];
  const seen = new Set<string>();
  const visit = (component: string) => {
    if (seen.has(component)) return;
    seen.add(component);
    if (!isStyledComponent(component)) {
      // 不是组件名就是共享样式块
      if (!files.includes(component)) files.push(component);
      return;
    }
    const entry: StyleEntry = COMPONENT_STYLES[component];
    for (const dep of entry.renders ?? []) visit(dep);
    if (entry.css && !files.includes(entry.css)) files.push(entry.css);
  };
  visit(name);
  return files;
}
