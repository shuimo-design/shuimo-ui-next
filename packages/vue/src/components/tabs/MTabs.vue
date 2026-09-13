<script setup lang="ts">
import { computed, onMounted, reactive, ref, useId, useSlots, useTemplateRef, watch } from "vue";
import {
  activeTabName,
  createTabsInk,
  fallbackTabName,
  focusTab,
  focusedTabIndex,
  isVerticalTabs,
  nextTabIndex,
  resolveTabs,
  tabIndicatorStyle,
  tabSlipBindings,
  tabsClasses,
  tabsContentBrush,
  tabsInkEnabled,
  tabsIndicatorOptions,
  tabsLineOptions,
  type TabName,
  type TabsEmits,
  type TabsProps,
  type TabsSlots,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useController } from "../../runtime";
import { RenderNode } from "../../runtime/render-node";
import { useBrushLine } from "../divider/use-brush-line";
import { collectPanes, type MTabsProps, type VueTabPane } from "./collect";

defineOptions({ name: "MTabs" });

const {
  panes: panesProp,
  type = "line",
  position = "top",
  closable = false,
  stretch = false,
  disabled = false,
} = defineProps<MTabsProps>();
const emit = defineEmits<TabsEmits>();
const slots = useSlots() as TabsSlots;
defineSlots<TabsSlots>();
/** 当前激活的标签页；没给 name 的页用书写位置的下标 */
const model = defineModel<TabName>();

const uid = useId();
const vertical = computed(() => isVerticalTabs(position));
const card = computed(() => type === "card");

/**
 * 页的来源：传了 panes 就用传的，没传才从子组件收集。
 * 收集在渲染期完成（读 vnode 的 props），顺序 = 模板里的书写顺序。
 */
const panes = computed<VueTabPane[]>(() => panesProp ?? collectPanes(slots.default?.()));

const activeName = computed(() => activeTabName(panes.value, model.value));
const tabs = computed(() =>
  resolveTabs({ panes: panes.value, active: activeName.value, uid, closable, disabled }),
);

function setActive(name: TabName) {
  if (name === activeName.value) return;
  model.value = name;
  emit("change", name);
}

/** 记住激活项的位置：v-model 指向的页被删掉时，像浏览器关标签一样落到邻居上 */
let lastIndex = 0;
watch(
  tabs,
  (list) => {
    const index = list.findIndex((tab) => tab.active);
    if (index >= 0) {
      lastIndex = index;
      return;
    }
    if (model.value === undefined || list.length === 0) return;
    const next = fallbackTabName(panes.value, lastIndex);
    if (next !== undefined) setActive(next);
  },
  { immediate: true },
);

/** lazy 的页记住"已经激活过"，之后切走只隐藏不销毁 */
const opened = reactive(new Set<TabName>());
watch(
  activeName,
  (name) => {
    if (name !== undefined) opened.add(name);
  },
  { immediate: true },
);
function shouldRender(index: number, name: TabName): boolean {
  return !panes.value[index]?.lazy || opened.has(name);
}

function onTabClick(tab: { index: number; name: TabName; disabled: boolean }, event: MouseEvent) {
  if (tab.disabled) return;
  emit("tabClick", tab.name, event);
  setActive(tab.name);
}

function onRemove(tab: { name: TabName; disabled: boolean }, event: MouseEvent) {
  event.stopPropagation();
  if (tab.disabled) return;
  emit("tabRemove", tab.name);
}

// ---- 键盘：roving tabindex，方向键在可用标签间循环，Home / End 跳到两头 ----
const list = useTemplateRef<HTMLElement>("list");

function onKeydown(event: KeyboardEvent) {
  if (disabled) return;
  const focused = focusedTabIndex(list.value, event.target);
  const from = focused >= 0 ? focused : tabs.value.findIndex((tab) => tab.active);
  const next = nextTabIndex(panes.value, { key: event.key, vertical: vertical.value, from });
  if (next === undefined) return;
  event.preventDefault();
  focusTab(list.value, next);
  const pane = panes.value[next];
  if (pane) setActive(pane.name);
}

// ---- line 型的两条线：整长的底线按导航条长度生成，指示器按激活项宽度单独生成 ----
const line = useTemplateRef<HTMLElement>("line");
const indicator = useTemplateRef<HTMLElement>("indicator");
useBrushLine(line, { ...tabsLineOptions(), vertical: () => vertical.value });
useBrushLine(indicator, { ...tabsIndicatorOptions(), vertical: () => vertical.value });

// 内容区四面框，签条插进它的上沿；stroke.css 只在 html.m-ink-ready 下生效
const content = useTemplateRef<HTMLElement>("content");
useBrushBorder(content, {
  ...tabsContentBrush(),
  enabled: computed(() => tabsInkEnabled(card.value)),
});

// ---- 量导航条：指示器位置、签条底图、激活签条的三面框全在 core 的控制器里 ----
const { controller: ink, state } = useController(createTabsInk, () => ({
  vertical: vertical.value,
  card: card.value,
  position,
}));

/** 挂载后才敢走素材登记（服务端登记不了），首帧一律内联，两边输出才对得上 */
const mounted = ref(false);
watch(list, (el) => ink.setList(el), { immediate: true, flush: "post" });
onMounted(() => {
  mounted.value = true;
  ink.measure();
});
// 激活项、页数、方向、外形变了都要重量；flush post 保证 DOM 已经换好 active 类
watch([activeName, () => panes.value.length, () => position, card], () => ink.measure(), {
  flush: "post",
});

const indicatorCss = computed(() => tabIndicatorStyle(state.value.indicator, vertical.value));
function slip(tabId: string) {
  return tabSlipBindings(state.value.slips[tabId], mounted.value);
}
</script>

<template>
  <div class="m-tabs" :class="tabsClasses({ type, position, stretch, disabled })">
    <div class="m-tabs__nav">
      <div
        ref="list"
        class="m-tabs__list"
        role="tablist"
        :aria-orientation="vertical ? 'vertical' : 'horizontal'"
        @keydown="onKeydown"
      >
        <div
          v-for="tab in tabs"
          :id="tab.tabId"
          :key="tab.name"
          class="m-tabs__tab"
          :class="{
            'm-tabs__tab--active': tab.active,
            'm-tabs__tab--disabled': tab.disabled,
            'm-tabs__tab--closable': tab.closable,
          }"
          role="tab"
          :aria-selected="tab.active"
          :aria-controls="tab.panelId"
          :aria-disabled="tab.disabled || undefined"
          :tabindex="tab.active && !tab.disabled ? 0 : -1"
          :style="slip(tab.tabId).style"
          v-bind="slip(tab.tabId).attrs"
          @click="onTabClick(tab, $event)"
          @keydown.enter.space.prevent="setActive(tab.name)"
        >
          <span class="m-tabs__label">
            <RenderNode
              v-if="panes[tab.index]?.labelNode !== undefined"
              :node="panes[tab.index]!.labelNode"
            />
            <template v-else>{{ tab.label }}</template>
          </span>
          <button
            v-if="tab.closable"
            type="button"
            class="m-tabs__close"
            :aria-label="tab.closeLabel"
            :disabled="tab.disabled"
            tabindex="-1"
            @click="onRemove(tab, $event)"
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
    <div ref="content" class="m-tabs__content">
      <div
        v-for="tab in tabs"
        v-show="tab.active"
        :id="tab.panelId"
        :key="tab.name"
        class="m-tab-pane"
        role="tabpanel"
        :aria-labelledby="tab.tabId"
        :aria-hidden="!tab.active"
      >
        <RenderNode
          v-if="shouldRender(tab.index, tab.name) && panes[tab.index]?.content !== undefined"
          :node="panes[tab.index]!.content"
        />
      </div>
    </div>
  </div>
</template>
