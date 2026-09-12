<script setup lang="ts">
import {
  computed,
  onMounted,
  onScopeDispose,
  reactive,
  ref,
  useTemplateRef,
  watch,
  watchEffect,
  watchPostEffect,
} from "vue";
import {
  cardBrush,
  cardClasses,
  cardDividerLine,
  cardInk,
  createCardDivider,
  ensureCardSheet,
  observeSize,
  type CardProps,
  type CardSlots,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";

defineOptions({ name: "MCard" });

const {
  // bordered 必须直接从 defineProps() 上解构并写默认值：类型是 boolean，
  // Vue 会做 Boolean 转型，不写 default 的话"不传"会变成 false
  bordered = true,
  title,
  shadow,
  frame,
  padding,
  seed,
} = defineProps<CardProps>();
const slots = defineSlots<CardSlots>();

/** 转型过的这份 props 才是 core 的输入；其余默认值由 core 归一化，两个壳共用一份 */
const props = computed<CardProps>(() => ({ title, shadow, bordered, frame, padding, seed }));
const hasHeader = computed(() => Boolean(slots.header || slots.extra || title));

const root = useTemplateRef<HTMLElement>("root");
// useBrushBorder 内部用 watchEffect 读这个对象，所以它必须是响应式的
const brush = computed(() => cardBrush(props.value));
const brushOptions = reactive({ ...brush.value });
watchEffect(() => Object.assign(brushOptions, brush.value));
const { update: redrawBorder } = useBrushBorder(root, brushOptions);
// 框型 / 种子换了，元素尺寸没变，控制器不会自己重新落笔，得推一把
watch(brush, () => redrawBorder(), { flush: "post" });

// 纸缘遮罩要按卡片实际尺寸生成，只能挂载后量；服务端和水合首帧都是 0×0，渲染的是没有纸的朴素版
const size = ref({ width: 0, height: 0 });
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
  if (root.value) observeSize(root.value, (box) => (size.value = box), "border-box");
  ensureCardSheet();
});

const ink = computed(() =>
  cardInk({
    seed,
    padding,
    width: size.value.width,
    height: size.value.height,
    mounted: mounted.value,
  }),
);

// 头部和内容之间那条线按卡片实际宽度单独生成；有没有头部是条件渲染的，元素换了要重新接
const divider = useTemplateRef<HTMLElement>("divider");
const dividerLine = createCardDivider(seed);
watchPostEffect(() => {
  dividerLine.attach(divider.value);
  dividerLine.update(cardDividerLine(seed));
});
onScopeDispose(() => dividerLine.dispose());
</script>

<template>
  <div
    ref="root"
    :class="[...cardClasses(props, Boolean(slots.cover))]"
    :style="ink.style"
    v-bind="ink.attrs"
  >
    <div v-if="slots.cover" class="m-card__cover">
      <slot name="cover" />
    </div>
    <div v-if="hasHeader" class="m-card__header">
      <div class="m-card__title">
        <slot name="header">{{ title }}</slot>
      </div>
      <div v-if="slots.extra" class="m-card__extra">
        <slot name="extra" />
      </div>
    </div>
    <div v-if="hasHeader" ref="divider" class="m-card__divider" aria-hidden="true" />
    <div class="m-card__body">
      <slot />
    </div>
    <div v-if="slots.footer" class="m-card__footer">
      <slot name="footer" />
    </div>
    <div v-if="slots.seal" class="m-card__seal">
      <slot name="seal" />
    </div>
  </div>
</template>
