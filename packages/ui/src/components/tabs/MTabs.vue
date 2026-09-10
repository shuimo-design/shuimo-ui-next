<script setup lang="ts">
import "./tabs.css";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowReactive,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { useElementSize, useResizeObserver } from "@vueuse/core";
import { IconClose } from "../../icons";
import { inkShapeUrl, type InkShape } from "../../ink/assets/shape";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import {
  applyBrushBorder,
  brushBorderUrl,
  clearBrushBorder,
  useBrushBorder,
} from "../../ink/stroke";
import { useBrushLine } from "../divider/use-brush-line";
import { paneElementId, tabElementId, tabsKey, type TabPaneRegistration } from "./context";
import type { TabName, TabsEmits, TabsPosition, TabsProps, TabsSlots } from "./types";

defineOptions({ name: "MTabs" });

const {
  type = "line",
  position = "top",
  closable = false,
  stretch = false,
  disabled = false,
} = defineProps<TabsProps>();
const emit = defineEmits<TabsEmits>();
defineSlots<TabsSlots>();
const model = defineModel<TabName>();

const vertical = computed(() => position === "left" || position === "right");
const card = computed(() => type === "card");

/** 水墨引擎是否就绪；m.ink 层的样式和这里的底图生成都以它为前提，没开引擎时一切照旧 */
function inkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

/** 按导航顺序排好的 pane；浅响应就够，每一项的字段本身都是取值函数 */
const panes = shallowReactive<TabPaneRegistration[]>([]);

/** 没设 v-model 时默认第一个 pane 激活（不回写，v-model 保持未设） */
const activeName = computed<TabName | undefined>(() => model.value ?? panes[0]?.name());

function isActive(name: TabName): boolean {
  return activeName.value === name;
}

function setActive(name: TabName) {
  if (name === activeName.value) return;
  model.value = name;
  emit("change", name);
}

/** 同一帧内多个 pane 挂载只重排一次 */
let reorderPending = false;
function reorder() {
  if (reorderPending) return;
  reorderPending = true;
  void nextTick(() => {
    reorderPending = false;
    const withEl = panes.filter((p) => p.el());
    if (withEl.length < 2) return;
    const sorted = [...panes].sort((a, b) => {
      const ea = a.el();
      const eb = b.el();
      if (!ea || !eb) return 0;
      return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    panes.splice(0, panes.length, ...sorted);
  });
}

function register(pane: TabPaneRegistration) {
  panes.push(pane);
}

function unregister(uid: string) {
  const index = panes.findIndex((p) => p.uid === uid);
  if (index < 0) return;
  const removed = panes[index];
  panes.splice(index, 1);
  // 被删掉的正好是 v-model 指向的那一页：像浏览器关标签一样落到邻居上，别让内容区空着
  if (removed && model.value !== undefined && model.value === removed.name()) {
    const neighbor = panes[index] ?? panes[index - 1];
    if (neighbor) setActive(neighbor.name());
  }
}

provide(tabsKey, { register, unregister, reorder, isActive });

function isDisabled(pane: TabPaneRegistration): boolean {
  return disabled || pane.disabled();
}

function isClosable(pane: TabPaneRegistration): boolean {
  return pane.closable() ?? closable;
}

function onTabClick(pane: TabPaneRegistration, event: MouseEvent) {
  if (isDisabled(pane)) return;
  const name = pane.name();
  emit("tabClick", name, event);
  setActive(name);
}

function onRemove(pane: TabPaneRegistration, event: MouseEvent) {
  event.stopPropagation();
  if (isDisabled(pane)) return;
  emit("tabRemove", pane.name());
}

// ---- 键盘：roving tabindex，方向键在可用标签间循环，Home / End 跳到两头 ----
const list = useTemplateRef<HTMLElement>("list");

function tabElements(): HTMLElement[] {
  return Array.from(list.value?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []);
}

function onKeydown(event: KeyboardEvent) {
  if (disabled) return;
  const prevKey = vertical.value ? "ArrowUp" : "ArrowLeft";
  const nextKey = vertical.value ? "ArrowDown" : "ArrowRight";
  const enabled = panes.map((p, i) => ({ p, i })).filter(({ p }) => !p.disabled());
  if (enabled.length === 0) return;
  const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="tab"]');
  const focusedIndex = target ? tabElements().indexOf(target) : -1;
  const currentPos = Math.max(
    0,
    enabled.findIndex(({ p, i }) => (focusedIndex >= 0 ? i === focusedIndex : isActive(p.name()))),
  );

  let nextPos: number;
  switch (event.key) {
    case prevKey:
      nextPos = (currentPos - 1 + enabled.length) % enabled.length;
      break;
    case nextKey:
      nextPos = (currentPos + 1) % enabled.length;
      break;
    case "Home":
      nextPos = 0;
      break;
    case "End":
      nextPos = enabled.length - 1;
      break;
    default:
      return;
  }
  event.preventDefault();
  const next = enabled[nextPos];
  if (!next) return;
  tabElements()[next.i]?.focus();
  setActive(next.p.name());
}

// ---- line 型的两条线：整长的底线按导航条长度生成，指示器按激活项宽度单独生成 ----
const line = useTemplateRef<HTMLElement>("line");
const indicator = useTemplateRef<HTMLElement>("indicator");
useBrushLine(line, { thickness: 2, vertical: () => vertical.value, seed: 1 });
// 指示器是朱笔一横：比底线厚、飞白重，像蘸得不满的朱砂在纸上拖过去；颜色在 tabs.css 的 m.ink 层换成 --m-seal
useBrushLine(indicator, {
  thickness: 3,
  vertical: () => vertical.value,
  seed: 2,
  flyingWhite: 0.4,
});

/** 指示器的尺寸和位移，量激活项在导航列表里的偏移得到 */
const indicatorStyle = shallowReactive({ size: 0, offset: 0 });
/** 当前激活的标签元素；card 型给它挂三面笔触框用 */
const activeTab = shallowRef<HTMLElement | null>(null);

function updateIndicator() {
  const el = list.value?.querySelector<HTMLElement>(".m-tabs__tab--active") ?? null;
  activeTab.value = el;
  if (!el) {
    indicatorStyle.size = 0;
    return;
  }
  if (vertical.value) {
    indicatorStyle.size = el.offsetHeight;
    indicatorStyle.offset = el.offsetTop;
  } else {
    indicatorStyle.size = el.offsetWidth;
    indicatorStyle.offset = el.offsetLeft;
  }
}

// ---- card 型 = 签条：每条标签一张毛边宣纸底图，激活的那条三面笔触框、插进内容区的框线里 ----
// 底图用 inkShapeUrl 而不是 inkTagFrame：三段式标签底图自带四面描边，和"朝内容区那面不画"冲突，
// 竖排时也没法转过来用；毛边填充形横竖都能按签条实际尺寸生成，8px 分桶缓存
const SLIP_SHAPE = { seed: 6, raggedness: 0.4, corner: 0.08 };
/** 每条签条的毛边底图，按导航项 id 存；宽度随文字变，所以逐条量 */
const slips = shallowReactive<Record<string, InkShape>>({});

function updateSlips() {
  const tabs = card.value && inkReady() ? tabElements() : [];
  const seen = new Set<string>();
  for (const el of tabs) {
    // 隐藏、过渡中会量到 0：跳过，保留上一张
    if (!el.offsetWidth || !el.offsetHeight) continue;
    const shape = inkShapeUrl(el.offsetWidth, el.offsetHeight, SLIP_SHAPE);
    seen.add(el.id);
    // 同一尺寸桶返回的是同一个缓存对象，比引用就知道要不要重写
    if (slips[el.id] !== shape) slips[el.id] = shape;
  }
  for (const id of Object.keys(slips)) if (!seen.has(id)) delete slips[id];
}

/**
 * 签条底图走素材登记：同尺寸桶的签条共用样式表里的一条规则，元素上只挂属性；登记不了（SSR）才内联。
 * 属性和内边距变量都绑在签条上，所以一次返回 attrs 和 style 两份
 */
function slipBindings(uid: string): InkVarBindings {
  const shape = slips[tabElementId(uid)];
  if (!shape) return { attrs: {}, style: {} };
  const ink = inkVarBindings({ "--m-tabs-slip": shape.url });
  return { attrs: ink.attrs, style: { ...ink.style, "--m-tabs-slip-pad": `${shape.padding}px` } };
}

/** 签条朝内容区的那一面：书签插进书里的那一边，不画线 */
const OPEN_SIDE: Record<TabsPosition, "top" | "right" | "bottom" | "left"> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

// 激活签条的三面框不走 useBrushBorder：目标元素随激活项换、不画的那面随 position 换，
// 它的 sides 是挂上去时定死的，这里直接用同一套 brushBorderUrl / applyBrushBorder 自己跟
const { width: activeW, height: activeH } = useElementSize(activeTab, undefined, {
  box: "border-box",
});
watch(
  [activeTab, activeW, activeH, () => position, card],
  ([el, w, h, pos, isCard], [prevEl]) => {
    if (prevEl && prevEl !== el) clearBrushBorder(prevEl);
    if (!el) return;
    if (!isCard || !inkReady()) {
      clearBrushBorder(el);
      return;
    }
    // 尺寸监听挂上的瞬间会报一次 0：忽略，别把框清掉
    if (w === 0 || h === 0) return;
    const sides = { top: true, right: true, bottom: true, left: true };
    sides[OPEN_SIDE[pos]] = false;
    // 线比内容区框略细，拐角不出头：签条是薄纸片，框线要轻
    applyBrushBorder(
      el,
      brushBorderUrl(w, h, { strokeWidth: 1.4, seed: 5, overshoot: 0.5, wobble: 0.4, sides }),
    );
  },
  { flush: "post" },
);
onBeforeUnmount(() => {
  if (activeTab.value) clearBrushBorder(activeTab.value);
});

// 内容区四面框，签条插进它的上沿；stroke.css 只在 html.m-ink-ready 下生效
const content = useTemplateRef<HTMLElement>("content");
useBrushBorder(content, {
  strokeWidth: 1.6,
  seed: 4,
  overshoot: 1,
  enabled: computed(() => card.value && inkReady()),
});

function measure() {
  updateIndicator();
  updateSlips();
}

let alive = true;
onBeforeUnmount(() => {
  alive = false;
});
onMounted(() => {
  measure();
  // 手写体是异步加载的字体：加载完成后标签宽度会变，指示器位置和签条底图都要重量一次。
  // 列表的尺寸监听在 stretch 下量不到（标签宽度由容器定，文字变宽列表不变），所以单独等一次
  if (typeof document !== "undefined" && "fonts" in document) {
    void document.fonts.ready.then(() => {
      if (alive) measure();
    });
  }
});
// 激活项、pane 数量、方向、外形变了都要重量；flush post 保证 DOM 已经换好 active 类
watch([activeName, () => panes.length, () => position, card], measure, { flush: "post" });
// 字体加载、stretch 下容器变宽都会改标签宽度
useResizeObserver(list, measure);

const indicatorCss = computed(() =>
  vertical.value
    ? { height: `${indicatorStyle.size}px`, transform: `translateY(${indicatorStyle.offset}px)` }
    : { width: `${indicatorStyle.size}px`, transform: `translateX(${indicatorStyle.offset}px)` },
);
</script>

<template>
  <div
    class="m-tabs"
    :class="[
      `m-tabs--${type}`,
      `m-tabs--${position}`,
      {
        'm-tabs--vertical': vertical,
        'm-tabs--stretch': stretch,
        'm-tabs--disabled': disabled,
      },
    ]"
  >
    <div class="m-tabs__nav">
      <div
        ref="list"
        class="m-tabs__list"
        role="tablist"
        :aria-orientation="vertical ? 'vertical' : 'horizontal'"
        @keydown="onKeydown"
      >
        <div
          v-for="pane in panes"
          :id="tabElementId(pane.uid)"
          :key="pane.uid"
          class="m-tabs__tab"
          :class="{
            'm-tabs__tab--active': isActive(pane.name()),
            'm-tabs__tab--disabled': isDisabled(pane),
            'm-tabs__tab--closable': isClosable(pane),
          }"
          role="tab"
          :aria-selected="isActive(pane.name())"
          :aria-controls="paneElementId(pane.uid)"
          :aria-disabled="isDisabled(pane) || undefined"
          :tabindex="isActive(pane.name()) && !isDisabled(pane) ? 0 : -1"
          :style="slipBindings(pane.uid).style"
          v-bind="slipBindings(pane.uid).attrs"
          @click="onTabClick(pane, $event)"
          @keydown.enter.space.prevent="setActive(pane.name())"
        >
          <span class="m-tabs__label">
            <component :is="pane.labelSlot()" v-if="pane.labelSlot()" />
            <template v-else>{{ pane.label() ?? pane.name() }}</template>
          </span>
          <button
            v-if="isClosable(pane)"
            type="button"
            class="m-tabs__close"
            :aria-label="`关闭 ${pane.label() ?? pane.name()}`"
            :disabled="isDisabled(pane)"
            tabindex="-1"
            @click="onRemove(pane, $event)"
          >
            <IconClose />
          </button>
        </div>
        <!-- 指示器放在列表里，位移直接用标签相对列表的 offset -->
        <span
          v-if="type === 'line'"
          ref="indicator"
          class="m-tabs__indicator"
          :style="indicatorCss"
          aria-hidden="true"
        />
      </div>
      <div v-if="$slots.extra" class="m-tabs__extra"><slot name="extra" /></div>
      <!-- 底线跨整个导航条（含 extra），所以放在 nav 上而不是列表里 -->
      <span v-if="type === 'line'" ref="line" class="m-tabs__line" aria-hidden="true" />
    </div>
    <div ref="content" class="m-tabs__content"><slot /></div>
  </div>
</template>
