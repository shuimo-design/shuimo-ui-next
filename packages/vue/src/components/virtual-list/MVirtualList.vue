<script setup lang="ts" generic="T">
import { computed, onMounted, ref, useTemplateRef, watch, watchEffect, type Directive } from "vue";
import {
  createVirtualList,
  virtualListBodyStyle,
  virtualListClasses,
  virtualListInk,
  virtualListItemStyle,
  virtualListKey,
  virtualListOffsets,
  virtualListPhantomStyle,
  virtualListRange,
  virtualListTotalHeight,
  type VirtualListEmits,
  type VirtualListExpose,
  type VirtualListProps,
  type VirtualListSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

defineOptions({ name: "MVirtualList" });

const {
  list,
  itemHeight,
  estimatedItemHeight = 40,
  buffer = 5,
  height,
  itemKey,
  divider = false,
} = defineProps<VirtualListProps<T>>();
const emit = defineEmits<VirtualListEmits>();
defineSlots<VirtualListSlots<T>>();

const items = computed(() => list ?? []);

// 滚动位置、视口尺寸、变高模式的测量与滚动补偿全在 core 的控制器里，和 React 那边是同一份
const { controller: vlist, state } = useController(createVirtualList, () => ({
  itemHeight,
  estimatedItemHeight,
  buffer,
  onScroll: (top: number) => emit("scroll", top),
  onReachBottom: () => emit("reachBottom"),
}));

const viewport = useTemplateRef<HTMLElement>("viewport");
// flush: "post" —— 元素真的渲染出来了再交给控制器装监听
watchEffect(() => vlist.setViewport(viewport.value), { flush: "post" });
// 换了一份数据，旧的行高就不可信了；只是追加则保留量过的部分（判断在 core 里）
watch(items, (next) => vlist.setItems(next), { immediate: true });

/**
 * 量到的行高表一直是同一个 Map（量尺寸太频繁，复制不起），靠版本号当"变了"的信号。
 * 单独提一个 computed 出来，值没变就不会把下面的前缀和一起拖着重算。
 */
const version = computed(() => state.value.version);
const offsets = computed(() => {
  void version.value;
  return virtualListOffsets({
    count: items.value.length,
    itemHeight,
    estimatedItemHeight,
    measured: state.value.measured,
  });
});
const range = computed(() =>
  virtualListRange({
    offsets: offsets.value,
    count: items.value.length,
    scrollTop: state.value.scrollTop,
    viewportHeight: state.value.viewportHeight,
    buffer,
  }),
);
const visible = computed(() =>
  items.value.slice(range.value.start, range.value.end).map((data, i) => ({
    data,
    index: range.value.start + i,
  })),
);

const rootClass = computed(() => virtualListClasses(divider));
const phantomStyle = computed(() =>
  virtualListPhantomStyle(virtualListTotalHeight(offsets.value, items.value.length)),
);
const bodyStyle = computed(() => virtualListBodyStyle(offsets.value, range.value.start));
const itemStyle = computed(() => virtualListItemStyle(itemHeight));

// 素材登记要有样式表：服务端和水合首帧一律内联，挂载之后才升级成 data 属性
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
const ink = computed(() =>
  virtualListInk({
    divider,
    width: state.value.viewportWidth,
    height,
    registered: mounted.value,
  }),
);

/** 每一项挂上 / 卸下都告诉控制器一声，量尺寸的观察器由它管 */
const vMeasure: Directive<HTMLElement> = {
  mounted: (el) => vlist.observeItem(el),
  beforeUnmount: (el) => vlist.releaseItem(el),
};

defineExpose<VirtualListExpose>({
  scrollTo: vlist.scrollTo,
  scrollToOffset: vlist.scrollToOffset,
  scrollTop: vlist.scrollTop,
});
</script>

<template>
  <div ref="viewport" :class="rootClass" :style="ink.style" v-bind="ink.attrs">
    <!-- 占位层撑出总高度让滚动条正确，可见的那批项由 body 平移到位 -->
    <div class="m-virtual-list__phantom" :style="phantomStyle" />
    <div class="m-virtual-list__body" :style="bodyStyle">
      <template v-for="{ data, index } in visible" :key="virtualListKey(data, index, itemKey)">
        <!-- 分隔线是项之间一个零高的元素，线画在它的伪元素上、骑在两项的交界线上：
             不占高度（占了会让首项和其余项差 1px），也不受定高项 overflow: hidden 的裁切 -->
        <div v-if="divider && index > 0" class="m-virtual-list__divider" aria-hidden="true" />
        <div v-measure class="m-virtual-list__item" :data-index="index" :style="itemStyle">
          <slot :data="data" :index="index" />
        </div>
      </template>
    </div>
  </div>
</template>
