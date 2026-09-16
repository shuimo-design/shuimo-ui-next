<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  BACK_TOP_LABEL,
  BACK_TOP_OFFSET,
  BACK_TOP_TRANSITION,
  BACK_TOP_VISIBILITY_HEIGHT,
  backTopClasses,
  backTopStamp,
  backTopStyle,
  createBackTop,
  type BackTopEmits,
  type BackTopProps,
  type BackTopSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import MStamp from "../stamp/MStamp.vue";

// 根是 Teleport，class / style 这类透传属性手动落到按钮上
defineOptions({ name: "MBackTop", inheritAttrs: false });

const {
  target,
  visibilityHeight = BACK_TOP_VISIBILITY_HEIGHT,
  right = BACK_TOP_OFFSET,
  bottom = BACK_TOP_OFFSET,
  seed = 1,
} = defineProps<BackTopProps>();
const emit = defineEmits<BackTopEmits>();
const slots = defineSlots<BackTopSlots>();

// 目标解析、滚动监听、可见性判断、滚回顶部全在 core 的控制器里，React 那边用的是同一份
const { controller: backTop, state } = useController(createBackTop, () => ({
  target,
  visibilityHeight,
}));

// 传送到 body 的内容不进服务端 HTML，挂载后才渲染
const mounted = ref(false);
onMounted(() => (mounted.value = true));

const classes = computed(() => backTopClasses({ custom: Boolean(slots.default) }));
const style = computed(() => backTopStyle({ right, bottom }));
const stamp = computed(() => backTopStamp(seed));

function onClick(event: MouseEvent) {
  emit("click", event);
  backTop.scrollToTop();
}
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <Transition :name="BACK_TOP_TRANSITION">
      <button
        v-if="state.visible"
        type="button"
        :class="classes"
        :style="style"
        v-bind="$attrs"
        :aria-label="BACK_TOP_LABEL"
        @click="onClick"
      >
        <span class="m-back-top__seal">
          <slot><MStamp v-bind="stamp" /></slot>
        </span>
      </button>
    </Transition>
  </Teleport>
</template>
