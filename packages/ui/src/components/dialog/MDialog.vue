<script setup lang="ts">
// 样式必须从 SFC 自己引：rolldown 会跳过只做转发的 index.ts，那里的副作用引入会被丢掉
import "./dialog.css";
import { computed, ref, useId, useTemplateRef, watch } from "vue";
import { IconClose } from "../../icons";
import { inkLatticeUrl } from "../../ink/assets/lattice";
import { inkSceneSvg } from "../../ink/assets/scene";
import { inkSplashUrl } from "../../ink/assets/splash";
import { useBrushBorder } from "../../ink/stroke";
import { resolveMask, useModal } from "../../internal/modal";
import type { DialogEmits, DialogProps, DialogSlots } from "./types";

// 根是多个节点（触发器 + Teleport），class / style 这类透传属性手动落到面板上
defineOptions({ name: "MDialog", inheritAttrs: false });

// mask 的类型里有 Boolean，Vue 会把"没传"当成 false（布尔属性的惯例），不写默认值遮罩就永远不显示
const {
  mask: maskProp = true,
  closeBtn = true,
  closeOnEsc = true,
  title,
  width,
  height,
  teleport = true,
  seed = 1,
} = defineProps<DialogProps>();
const emit = defineEmits<DialogEmits>();
const slots = defineSlots<DialogSlots>();
const model = defineModel<boolean>({ default: false });

const mask = computed(() => resolveMask(maskProp));
const teleportTo = computed(() => (typeof teleport === "string" ? teleport : "body"));
// 首次打开才渲染内容；之后用 v-show 留着，笔触边框和面板尺寸不用每次重算
const rendered = ref(model.value);
watch(model, (open, was) => {
  if (open) rendered.value = true;
  if (open === was) return;
  if (open) emit("open");
  else emit("close");
});

const titleId = useId();
const panel = useTemplateRef<HTMLElement>("panel");
const { trapFocus } = useModal({
  open: () => model.value,
  panel,
  closeOnEsc: () => closeOnEsc,
  close,
});
// 纸框：5px 一笔，边缘晕成干笔毛边、粗细缓慢起伏（旧版底图就是这样的软边）；
// 拐角留空给回纹：四角各是一套老图描下来的图案，实线在角饰第一根条处停笔，每个角的两条边各自留（[横边, 竖边]，px）：
// 左上的上边线整段藏在山下面，左边线从横带底沿（26px）起笔；右上的上边线停在竖杠（右 17.9px）、右边线从横带底（17.5px）起笔；
// 左下、右下的下边线在粗竖杠（离侧边 18px）处停笔、侧边线在长横线（底上 17.5px）处停笔；沿线洒少许溅点
useBrushBorder(panel, {
  seed,
  strokeWidth: 5,
  roughness: 0.6,
  flyingWhite: 0.1,
  overshoot: 0,
  wobble: 0.8,
  bleed: { scale: 2.5, blur: 0.6 },
  cornerGap: { tl: [40, 26], tr: [17.9, 17.5], br: [18, 17.5], bl: [18, 17.5] },
  specks: 1,
});
// 题头小景是内联 SVG，滤镜 / 渐变 id 要全页唯一：组件 id 保证同一个应用里不撞；
// 页面上有多个 Vue 应用时 useId 会重复，再把 seed 编进去——同 seed 撞了也是同一份定义，画出来一样
const uid = useId().replace(/[^\w-]/g, "-");
const scene = computed(() => inkSceneSvg({ seed, id: `m-dialog-scene-${seed}-${uid}` }));

const px = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;
// 四角回纹是 SVG 遮罩，通过变量交给 m.ink 层；宽高覆盖也走变量，方便用户用 CSS 改
const rootStyle = computed(() => {
  const style: Record<string, string> = {
    "--m-dialog-splash": `url("${inkSplashUrl({ seed })}")`,
  };
  for (const corner of ["tl", "tr", "br", "bl"] as const)
    style[`--m-dialog-lattice-${corner}`] =
      `url("${inkLatticeUrl({ seed, corner, size: 64, strokeWidth: 2 })}")`;
  const w = px(width);
  const h = px(height);
  if (w) style["--m-dialog-w"] = w;
  if (h) style["--m-dialog-h"] = h;
  return style;
});

function open() {
  model.value = true;
}
function close() {
  model.value = false;
}
function onMaskClick() {
  if (mask.value.clickClose) close();
}
</script>

<template>
  <span v-if="slots.active" class="m-dialog__active" @click="open">
    <slot name="active" />
  </span>
  <Teleport :to="teleportTo" :disabled="teleport === false">
    <Transition name="m-dialog">
      <div
        v-if="rendered"
        v-show="model"
        class="m-dialog"
        :class="{ 'm-dialog--masked': mask.show }"
        :style="rootStyle"
      >
        <div class="m-dialog__mask" @click="onMaskClick" />
        <!-- 包一层：面板要用 clip-path 挖掉左上角的缺口（旧版那里没有纸、透出遮罩），四角回纹和题头小景挂在这一层上才不会被一起裁掉 -->
        <div class="m-dialog__frame">
          <!-- 小景是自己生成的可信标记，不含用户内容 -->
          <span class="m-dialog__scene" aria-hidden="true" v-html="scene" />
          <div
            ref="panel"
            class="m-dialog__panel"
            v-bind="$attrs"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="slots.header || title ? titleId : undefined"
            tabindex="-1"
            @keydown="trapFocus"
          >
            <button
              v-if="closeBtn"
              type="button"
              class="m-dialog__close"
              aria-label="关闭"
              @click="close"
            >
              <!-- 牌顶的墨渍和牌底的坠子只在 m.ink 层显示 -->
              <span class="m-dialog__close-splash" aria-hidden="true" />
              <IconClose />
              <span class="m-dialog__close-tassel" aria-hidden="true" />
            </button>
            <header v-if="slots.header || title" :id="titleId" class="m-dialog__header">
              <slot name="header">{{ title }}</slot>
            </header>
            <div class="m-dialog__body"><slot /></div>
            <footer v-if="slots.footer" class="m-dialog__footer"><slot name="footer" /></footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
