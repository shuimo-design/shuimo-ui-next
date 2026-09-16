<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import {
  IMAGE_ERROR_TEXT,
  IMAGE_PREVIEW_LABELS,
  IMAGE_PREVIEW_TRANSITION,
  createImagePreview,
  imageClasses,
  imageIsComplete,
  imageLoading,
  imagePreviewCounter,
  imagePreviewHasMany,
  imagePreviewImgStyle,
  imagePreviewList,
  imagePreviewStart,
  imagePreviewStyle,
  imagePreviewable,
  imageSized,
  imageStatus,
  imageStyle,
  imageTriggerAttrs,
  type ImageEmits,
  type ImageProps,
  type ImageSlots,
} from "@shuimo-design/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconMinus,
  IconPlus,
  IconRestore,
  IconRotate,
} from "../../icons";
import { useController } from "../../runtime";
import { MSkeletonItem } from "../skeleton";

// 根是多个节点（图片 + Teleport），class / style 这类透传属性手动落到图片容器上
defineOptions({ name: "MImage", inheritAttrs: false });

const {
  src,
  alt,
  fit,
  width,
  height,
  lazy = false,
  preview = true,
  previewSrcList,
  initialIndex,
  zIndex,
  seed = 1,
} = defineProps<ImageProps>();
const emit = defineEmits<ImageEmits>();
defineSlots<ImageSlots>();

// 记"哪个地址成功 / 失败了"而不是布尔：换了地址自然回到加载中
const loadedSrc = ref<string>();
const failedSrc = ref<string>();
const status = computed(() =>
  imageStatus({ src, loadedSrc: loadedSrc.value, failedSrc: failedSrc.value }),
);
const previewable = computed(() => imagePreviewable({ preview, status: status.value }));
const sized = computed(() => imageSized({ width, height }));
const rootClass = computed(() =>
  imageClasses({ fit, status: status.value, previewable: previewable.value, sized: sized.value }),
);
const rootStyle = computed(() => imageStyle({ width, height }));

function onLoad(event: Event) {
  loadedSrc.value = src;
  emit("load", event);
}
function onError(event: Event) {
  failedSrc.value = src;
  emit("error", event);
}
/** 缓存命中的图在监听挂上之前就加载完了，load 不会再来，挂上时问一次 */
function setImg(el: HTMLImageElement | null) {
  if (imageIsComplete(el)) loadedSrc.value = src;
}

/* ── 预览层 ─────────────────────────────────────────────── */
const list = computed(() => imagePreviewList(src, previewSrcList));
const start = computed(() => imagePreviewStart(list.value, src, initialIndex));
// 开合、翻页、缩放、旋转、滚轮、方向键全在 core 的控制器里；滚动锁 / ESC / 焦点由它里面的模态层管
const { controller: viewer, state } = useController(createImagePreview, () => ({
  count: list.value.length,
  onShow: () => emit("show"),
  onClose: () => emit("close"),
}));

// flush: "post" —— 面板在 Teleport 里，行内 :ref 触发时它还没插进文档，焦点送不进去；等这一轮 DOM 落地再交给控制器
const panel = useTemplateRef<HTMLElement>("panel");
watch(panel, (el) => viewer.setPanel(el), { flush: "post" });

const many = computed(() => imagePreviewHasMany(list.value.length));
const previewStyle = computed(() => imagePreviewStyle({ zIndex, seed }));

function openPreview() {
  if (previewable.value) viewer.open(start.value);
}
function onTriggerKeyDown(event: KeyboardEvent) {
  if (previewable.value) viewer.onTriggerKeyDown(event, start.value);
}
</script>

<template>
  <div :class="rootClass" :style="rootStyle" v-bind="$attrs">
    <img
      :ref="(el) => setImg(el as HTMLImageElement | null)"
      class="m-image__img"
      :src="src"
      :alt="alt"
      :loading="imageLoading(lazy)"
      v-bind="imageTriggerAttrs(previewable)"
      @load="onLoad"
      @error="onError"
      @click="openPreview"
      @keydown="onTriggerKeyDown"
    />
    <div v-if="status === 'loading'" class="m-image__placeholder" aria-hidden="true">
      <slot name="placeholder"><MSkeletonItem variant="image" /></slot>
    </div>
    <div v-else-if="status === 'error'" class="m-image__error" role="img" :aria-label="alt">
      <slot name="error">{{ IMAGE_ERROR_TEXT }}</slot>
    </div>
  </div>
  <!-- 预览层传送到 body；开着才渲染，服务端一律没有 -->
  <Teleport to="body">
    <Transition :name="IMAGE_PREVIEW_TRANSITION">
      <div v-if="state.open" class="m-image-preview" :style="previewStyle">
        <div class="m-image-preview__mask" @click="viewer.close" />
        <div
          ref="panel"
          class="m-image-preview__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="IMAGE_PREVIEW_LABELS.dialog"
          tabindex="-1"
          @keydown="viewer.onKeyDown"
        >
          <img
            class="m-image-preview__img"
            :src="list[state.index]"
            :alt="alt"
            :style="imagePreviewImgStyle(state)"
            draggable="false"
          />
          <button
            v-if="many"
            type="button"
            class="m-image-preview__arrow m-image-preview__arrow--prev"
            :aria-label="IMAGE_PREVIEW_LABELS.prev"
            @click="viewer.prev"
          >
            <IconChevronLeft />
          </button>
          <button
            v-if="many"
            type="button"
            class="m-image-preview__arrow m-image-preview__arrow--next"
            :aria-label="IMAGE_PREVIEW_LABELS.next"
            @click="viewer.next"
          >
            <IconChevronRight />
          </button>
          <div
            class="m-image-preview__toolbar"
            role="toolbar"
            :aria-label="IMAGE_PREVIEW_LABELS.dialog"
          >
            <button
              type="button"
              class="m-image-preview__tool"
              :aria-label="IMAGE_PREVIEW_LABELS.zoomOut"
              @click="viewer.zoomOut"
            >
              <IconMinus />
            </button>
            <button
              type="button"
              class="m-image-preview__tool"
              :aria-label="IMAGE_PREVIEW_LABELS.zoomIn"
              @click="viewer.zoomIn"
            >
              <IconPlus />
            </button>
            <button
              type="button"
              class="m-image-preview__tool"
              :aria-label="IMAGE_PREVIEW_LABELS.rotate"
              @click="viewer.rotate"
            >
              <IconRotate />
            </button>
            <button
              type="button"
              class="m-image-preview__tool"
              :aria-label="IMAGE_PREVIEW_LABELS.reset"
              @click="viewer.reset"
            >
              <IconRestore />
            </button>
            <span v-if="many" class="m-image-preview__counter" aria-live="polite">
              {{ imagePreviewCounter(state.index, list.length) }}
            </span>
          </div>
          <button
            type="button"
            class="m-image-preview__close"
            :aria-label="IMAGE_PREVIEW_LABELS.close"
            @click="viewer.close"
          >
            <!-- 牌顶的墨渍和牌底的坠子只在 m.ink 层显示 -->
            <span class="m-image-preview__close-splash" aria-hidden="true" />
            <IconClose />
            <span class="m-image-preview__close-tassel" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
