<script setup lang="ts">
import "./avatar.css";
import { computed, ref, watch } from "vue";
import { IconUser } from "../../icons";
import { inkBlobUrl } from "../../ink/assets/blob";
import { svgToDataUrl } from "../../ink/assets/brush";
import { inkRingUrl } from "../../ink/assets/ring";
import { generateInkShape } from "../../ink/assets/shape";
import { generateBrushBorder } from "../../ink/stroke/generate";
import type { AvatarEmits, AvatarProps, AvatarSlots } from "./types";

defineOptions({ name: "MAvatar" });

const { src, alt, variant = "circle", size = "md", seed = 1 } = defineProps<AvatarProps>();
const emit = defineEmits<AvatarEmits>();
defineSlots<AvatarSlots>();

const SIZES = { sm: 24, md: 40, lg: 50 } as const;

const failed = ref(false);
// 换了图片地址就重新尝试加载
watch(
  () => src,
  () => {
    failed.value = false;
  },
);

const showImage = computed(() => Boolean(src) && !failed.value);
const sizeClass = computed(() => (typeof size === "number" ? undefined : `m-avatar--${size}`));
const px = computed(() => (typeof size === "number" ? size : SIZES[size]));

/**
 * 尺寸是已知的像素数，两张图都按实际大小直接生成，不用量元素：
 * 圆——图片被毛边墨团裁成圆，外面套一笔墨圈；方——图片被毛边矩形裁，外面套一圈笔触边框。
 */
const style = computed(() => {
  const s = px.value;
  const vars: Record<string, string> = { "--m-avatar-size": `${s}px` };
  if (variant === "circle") {
    const ring = inkRingUrl({ seed, size: s });
    const body = Math.round(s * 0.84);
    vars["--m-avatar-body"] = `${body}px`;
    vars["--m-avatar-mask"] =
      `url("${inkBlobUrl({ seed, size: 64, raggedness: 0.05, radius: 0.47 })}")`;
    vars["--m-avatar-mask-size"] = "100% 100%";
    vars["--m-avatar-frame"] = `url("${ring.url}")`;
    vars["--m-avatar-frame-pad"] = `${ring.padding}px`;
  } else {
    const stroke = Math.max(2, s * 0.075);
    const border = generateBrushBorder(s, s, {
      seed,
      strokeWidth: stroke,
      roughness: 0.8,
      flyingWhite: 0.25,
      overshoot: s * 0.04,
      wobble: stroke * 0.2,
    });
    const body = Math.round(s - stroke);
    const shape = generateInkShape(body, body, { seed, raggedness: 0.35, corner: 0.05 });
    vars["--m-avatar-body"] = `${body}px`;
    vars["--m-avatar-mask"] = `url("${shape.url}")`;
    vars["--m-avatar-mask-size"] = `${shape.width}px ${shape.height}px`;
    vars["--m-avatar-frame"] = `url("${svgToDataUrl(border.svg)}")`;
    vars["--m-avatar-frame-pad"] = `${border.padding}px`;
  }
  return vars;
});

function onError(event: Event) {
  failed.value = true;
  emit("error", event);
}
</script>

<template>
  <span
    class="m-avatar"
    :class="[`m-avatar--${variant}`, sizeClass]"
    :style="style"
    :role="showImage ? undefined : 'img'"
    :aria-label="showImage ? undefined : alt"
  >
    <span class="m-avatar__body">
      <img v-if="showImage" class="m-avatar__img" :src="src" :alt="alt" @error="onError" />
      <span v-else class="m-avatar__fallback">
        <slot><IconUser class="m-avatar__icon" /></slot>
      </span>
    </span>
    <span class="m-avatar__frame" aria-hidden="true" />
  </span>
</template>
