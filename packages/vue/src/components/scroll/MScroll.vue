<script setup lang="ts">
import { computed, useTemplateRef, watchEffect } from "vue";
import {
  createScroll,
  scrollBarStyle,
  scrollClasses,
  scrollViewStyle,
  type ScrollEmits,
  type ScrollExpose,
  type ScrollProps,
  type ScrollSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

defineOptions({ name: "MScroll" });

const { height, maxHeight, always = false, minThumb = 20 } = defineProps<ScrollProps>();
const emit = defineEmits<ScrollEmits>();
defineSlots<ScrollSlots>();

// 滚动监听、尺寸监听、滑块拖拽、滚完淡出的定时器全在 core 的控制器里，和 React 那边是同一份
const { controller: scroll, state } = useController(createScroll, () => ({
  minThumb,
  onScroll: (position) => emit("scroll", position),
}));

const root = useTemplateRef<HTMLElement>("root");
const view = useTemplateRef<HTMLElement>("view");
const content = useTemplateRef<HTMLElement>("content");
const thumbV = useTemplateRef<HTMLElement>("thumbV");
const thumbH = useTemplateRef<HTMLElement>("thumbH");

// flush: "post" —— 等元素真的渲染出来再交给控制器；滑块是 v-if 出来的，这里会再跑一遍把它接上
watchEffect(
  () => {
    scroll.setRoot(root.value);
    scroll.setView(view.value);
    scroll.setContent(content.value);
    scroll.setThumb("v", thumbV.value);
    scroll.setThumb("h", thumbH.value);
  },
  { flush: "post" },
);

const rootClass = computed(() =>
  scrollClasses({ always, scrolling: state.value.scrolling, dragging: state.value.dragging }),
);
const viewStyle = computed(() => scrollViewStyle({ height, maxHeight }));
const barVStyle = computed(() => scrollBarStyle(state.value.v, "v"));
const barHStyle = computed(() => scrollBarStyle(state.value.h, "h"));

defineExpose<ScrollExpose>({
  scrollTo: scroll.scrollTo,
  update: scroll.measure,
  view: scroll.view,
});
</script>

<template>
  <div ref="root" :class="rootClass">
    <div ref="view" class="m-scroll__view" :style="viewStyle">
      <div ref="content" class="m-scroll__content">
        <slot />
      </div>
    </div>
    <div
      v-if="state.v.track > 0"
      class="m-scroll__bar m-scroll__bar--v"
      :style="barVStyle"
      aria-hidden="true"
    >
      <div ref="thumbV" class="m-scroll__thumb" />
    </div>
    <div
      v-if="state.h.track > 0"
      class="m-scroll__bar m-scroll__bar--h"
      :style="barHStyle"
      aria-hidden="true"
    >
      <div ref="thumbH" class="m-scroll__thumb" />
    </div>
  </div>
</template>
