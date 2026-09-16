<script setup lang="ts">
import { computed, onMounted, ref, useSlots, useTemplateRef } from "vue";
import {
  descriptionsClasses,
  descriptionsGrid,
  descriptionsInk,
  descriptionsValueText,
  type DescriptionsSlots,
} from "@shuimo-design/core";
import { RenderNode } from "../../runtime/render-node";
import { useSize } from "../../runtime";
import { collectDescriptionsItems, type MDescriptionsProps } from "./collect";

defineOptions({ name: "MDescriptions" });

const {
  items: itemsProp,
  title,
  column = 3,
  bordered = false,
  layout = "horizontal",
  size = "md",
  colon = true,
} = defineProps<MDescriptionsProps>();
const slots = useSlots() as DescriptionsSlots;
defineSlots<DescriptionsSlots>();

/**
 * 数据的来源：传了 items 就用传的，没传才从子组件收集。
 * 收集在渲染期完成（读 vnode 的 props），顺序 = 模板里的书写顺序。
 */
const grid = computed(() =>
  descriptionsGrid(itemsProp ?? collectDescriptionsItems(slots.default?.()), {
    column,
    layout,
    bordered,
  }),
);

// 插槽的有无是框架概念，只能在壳里判断
const hasHeader = computed(() => Boolean(title || slots.title || slots.extra));

// ---- 墨线：带格线时按实际宽度生成，宽度按 32px 分桶 ----
const root = useTemplateRef<HTMLElement>("root");
const { width } = useSize(root, "border-box");
/** 挂载后才敢走素材登记（服务端登记不了），首帧一律内联，两边输出才对得上 */
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const ink = computed(() =>
  descriptionsInk({ width: width.value, mounted: mounted.value, bordered }),
);
</script>

<template>
  <div
    ref="root"
    :class="descriptionsClasses({ layout, size, bordered, colon })"
    :style="ink.style"
    v-bind="ink.attrs"
  >
    <div v-if="hasHeader" class="m-descriptions__header">
      <div class="m-descriptions__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="slots.extra" class="m-descriptions__extra">
        <slot name="extra" />
      </div>
    </div>
    <!-- 网格挂在 <dl> 外面：带格线时的横线要和格子在同一张网格里，而 <dl> 里只能放 dt / dd -->
    <div class="m-descriptions__grid" :style="{ gridTemplateColumns: grid.template }">
      <dl class="m-descriptions__list">
        <template v-for="cell in grid.cells" :key="cell.key">
          <dt :class="cell.labelClass" :style="cell.labelStyle">
            <slot name="label" :item="cell.item">
              <RenderNode v-if="cell.item.renderLabel" :node="cell.item.renderLabel" />
              <template v-else>{{ cell.item.label }}</template>
            </slot>
          </dt>
          <dd :class="cell.valueClass" :style="cell.valueStyle">
            <slot name="value" :item="cell.item">
              <RenderNode v-if="cell.item.render" :node="cell.item.render" />
              <template v-else>{{ descriptionsValueText(cell.item.value) }}</template>
            </slot>
          </dd>
        </template>
      </dl>
      <span
        v-for="line in grid.lines"
        :key="line.key"
        :class="line.className"
        :style="line.style"
        aria-hidden="true"
      />
    </div>
  </div>
</template>
