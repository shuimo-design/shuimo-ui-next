import type { Component } from "vue";
import AlertDemo from "./demos/AlertDemo.vue";
import AvatarDemo from "./demos/AvatarDemo.vue";
import BadgeDemo from "./demos/BadgeDemo.vue";
import BorderDemo from "./demos/BorderDemo.vue";
import BreadcrumbDemo from "./demos/BreadcrumbDemo.vue";
import ButtonDemo from "./demos/ButtonDemo.vue";
import CardDemo from "./demos/CardDemo.vue";
import CheckboxDemo from "./demos/CheckboxDemo.vue";
import CollapseDemo from "./demos/CollapseDemo.vue";
import ConfigProviderDemo from "./demos/ConfigProviderDemo.vue";
import ConfirmDemo from "./demos/ConfirmDemo.vue";
import DarkModeDemo from "./demos/DarkModeDemo.vue";
import DatePickerDemo from "./demos/DatePickerDemo.vue";
import DeleteIconDemo from "./demos/DeleteIconDemo.vue";
import DialogDemo from "./demos/DialogDemo.vue";
import DividerDemo from "./demos/DividerDemo.vue";
import DrawerDemo from "./demos/DrawerDemo.vue";
import EmptyDemo from "./demos/EmptyDemo.vue";
import FormDemo from "./demos/FormDemo.vue";
import GridDemo from "./demos/GridDemo.vue";
import InkTransitionDemo from "./demos/InkTransitionDemo.vue";
import InputDemo from "./demos/InputDemo.vue";
import InputNumberDemo from "./demos/InputNumberDemo.vue";
import ListDemo from "./demos/ListDemo.vue";
import LoadingDemo from "./demos/LoadingDemo.vue";
import MenuDemo from "./demos/MenuDemo.vue";
import MessageDemo from "./demos/MessageDemo.vue";
import PaginationDemo from "./demos/PaginationDemo.vue";
import PopoverDemo from "./demos/PopoverDemo.vue";
import PrinterDemo from "./demos/PrinterDemo.vue";
import ProgressDemo from "./demos/ProgressDemo.vue";
import RadioDemo from "./demos/RadioDemo.vue";
import RicePaperDemo from "./demos/RicePaperDemo.vue";
import ScrollDemo from "./demos/ScrollDemo.vue";
import SelectDemo from "./demos/SelectDemo.vue";
import SkeletonDemo from "./demos/SkeletonDemo.vue";
import SliderDemo from "./demos/SliderDemo.vue";
import StampDemo from "./demos/StampDemo.vue";
import StepsDemo from "./demos/StepsDemo.vue";
import SvgDemo from "./demos/SvgDemo.vue";
import SwitchDemo from "./demos/SwitchDemo.vue";
import TableDemo from "./demos/TableDemo.vue";
import TabsDemo from "./demos/TabsDemo.vue";
import TagDemo from "./demos/TagDemo.vue";
import TooltipDemo from "./demos/TooltipDemo.vue";
import TreeDemo from "./demos/TreeDemo.vue";
import VirtualListDemo from "./demos/VirtualListDemo.vue";

export interface DemoEntry {
  /** hash 路由用的 id */
  id: string;
  /** 菜单显示 */
  title: string;
  /** 组件名，页面标题用 */
  name: string;
  component: Component;
}

export interface DemoGroup {
  group: string;
  items: DemoEntry[];
}

export const DEMOS: DemoGroup[] = [
  {
    group: "特效",
    items: [
      { id: "rice-paper", title: "宣纸", name: "MRicePaper", component: RicePaperDemo },
      { id: "border", title: "笔触边框", name: "MBorder", component: BorderDemo },
      { id: "stamp", title: "印章", name: "MStamp", component: StampDemo },
      {
        id: "ink-transition",
        title: "落墨与转场",
        name: "MInkTransition",
        component: InkTransitionDemo,
      },
    ],
  },
  {
    group: "基础",
    items: [
      { id: "button", title: "按钮", name: "MButton", component: ButtonDemo },
      { id: "input", title: "输入框", name: "MInput", component: InputDemo },
      { id: "input-number", title: "数字输入", name: "MInputNumber", component: InputNumberDemo },
      { id: "select", title: "选择器", name: "MSelect", component: SelectDemo },
      { id: "date-picker", title: "日期选择", name: "MDatePicker", component: DatePickerDemo },
      { id: "checkbox", title: "复选框", name: "MCheckbox", component: CheckboxDemo },
      { id: "radio", title: "单选框", name: "MRadio", component: RadioDemo },
      { id: "switch", title: "开关", name: "MSwitch", component: SwitchDemo },
      { id: "slider", title: "滑块", name: "MSlider", component: SliderDemo },
      { id: "tag", title: "标签", name: "MTag", component: TagDemo },
      { id: "avatar", title: "头像", name: "MAvatar", component: AvatarDemo },
      { id: "progress", title: "进度条", name: "MProgress", component: ProgressDemo },
      { id: "collapse", title: "折叠面板", name: "MCollapse", component: CollapseDemo },
      { id: "list", title: "列表", name: "MList", component: ListDemo },
      { id: "tree", title: "树", name: "MTree", component: TreeDemo },
      { id: "card", title: "卡片", name: "MCard", component: CardDemo },
      { id: "badge", title: "角标", name: "MBadge", component: BadgeDemo },
    ],
  },
  {
    group: "模版",
    items: [
      { id: "breadcrumb", title: "面包屑", name: "MBreadcrumb", component: BreadcrumbDemo },
      { id: "menu", title: "菜单", name: "MMenu", component: MenuDemo },
      { id: "pagination", title: "分页", name: "MPagination", component: PaginationDemo },
      { id: "form", title: "表单", name: "MForm", component: FormDemo },
      { id: "table", title: "表格", name: "MTable", component: TableDemo },
      { id: "grid", title: "栅格", name: "MGrid", component: GridDemo },
      { id: "virtual-list", title: "虚拟列表", name: "MVirtualList", component: VirtualListDemo },
      { id: "steps", title: "步骤条", name: "MSteps", component: StepsDemo },
      { id: "tabs", title: "标签页", name: "MTabs", component: TabsDemo },
    ],
  },
  {
    group: "消息",
    items: [
      { id: "popover", title: "气泡卡片", name: "MPopover", component: PopoverDemo },
      { id: "tooltip", title: "悬浮提示", name: "MTooltip", component: TooltipDemo },
      { id: "message", title: "消息提示", name: "MMessage", component: MessageDemo },
      { id: "confirm", title: "确认框", name: "MConfirm", component: ConfirmDemo },
      { id: "dialog", title: "弹窗", name: "MDialog", component: DialogDemo },
      { id: "drawer", title: "抽屉", name: "MDrawer", component: DrawerDemo },
      { id: "alert", title: "警告提示", name: "MAlert", component: AlertDemo },
    ],
  },
  {
    group: "其他",
    items: [
      { id: "scroll", title: "滚动条", name: "MScroll", component: ScrollDemo },
      { id: "printer", title: "打字机", name: "MPrinter", component: PrinterDemo },
      { id: "divider", title: "分割线", name: "MDivider", component: DividerDemo },
      { id: "loading", title: "加载", name: "MLoading", component: LoadingDemo },
      { id: "delete-icon", title: "删除图标", name: "MDeleteIcon", component: DeleteIconDemo },
      {
        id: "config-provider",
        title: "全局配置",
        name: "MConfigProvider",
        component: ConfigProviderDemo,
      },
      { id: "dark-mode", title: "深浅切换", name: "MDarkMode", component: DarkModeDemo },
      { id: "svg", title: "图标", name: "MSvg", component: SvgDemo },
      { id: "empty", title: "空状态", name: "MEmpty", component: EmptyDemo },
      { id: "skeleton", title: "骨架屏", name: "MSkeleton", component: SkeletonDemo },
    ],
  },
];

export const ALL_DEMOS = DEMOS.flatMap((g) => g.items);
