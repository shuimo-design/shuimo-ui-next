<script setup lang="ts">
// 样式必须从 SFC 自己引：rolldown 会跳过只做转发的 index.ts，那里的副作用引入会被丢掉
import "../../internal/modal-ink.css";
import "./drawer.css";
import { computed, ref, useId, useTemplateRef, watch } from "vue";
import { IconClose } from "../../icons";
import { inkLatticeUrl } from "../../ink/assets/lattice";
import { inkSplashUrl } from "../../ink/assets/splash";
import { useBrushBorder } from "../../ink/stroke";
import { resolveMask, useModal } from "../../internal/modal";
import type { DrawerEmits, DrawerProps, DrawerSlots } from "./types";

// 根是多个节点（触发器 + Teleport），class / style 这类透传属性手动落到面板上
defineOptions({ name: "MDrawer", inheritAttrs: false });

// mask 的类型里有 Boolean，Vue 会把"没传"当成 false（布尔属性的惯例），不写默认值遮罩就永远不显示
const {
  mask: maskProp = true,
  direction = "right",
  size,
  closeBtn = true,
  closeOnEsc = true,
  title,
  teleport = true,
  seed = 1,
} = defineProps<DrawerProps>();
const emit = defineEmits<DrawerEmits>();
const slots = defineSlots<DrawerSlots>();
const model = defineModel<boolean>({ default: false });

const mask = computed(() => resolveMask(maskProp));
const teleportTo = computed(() => (typeof teleport === "string" ? teleport : "body"));
// 首次打开才渲染内容；之后用 v-show 留着，边缘那一笔不用每次重画
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

// 纸框、四角回纹、题头小景、挂牌都和弹窗同一套（外观见 internal/modal-ink.css）。
// 5px 一笔、边缘晕成干笔毛边；四角留空给回纹，实线在角饰第一根条处停笔（[横边, 竖边]，px）。
// 抽屉贴着屏幕边，装饰不能探出纸外（会被视口裁掉），所以回纹整块收进纸里：
// 回纹比弹窗往里挪了 12px（弹窗的角饰是 inset -12px，抽屉是 inset 0），留空跟着 +12px。
// 左上角也和其它三个角一样按回纹留空，不用像弹窗那样给山脚让路
useBrushBorder(panel, {
  seed,
  strokeWidth: 5,
  roughness: 0.6,
  flyingWhite: 0.1,
  overshoot: 0,
  wobble: 0.8,
  bleed: { scale: 2.5, blur: 0.6 },
  cornerGap: { tl: [31.5, 38], tr: [29.9, 29.5], br: [30, 29.5], bl: [30, 29.5] },
  specks: 1,
});
const rootStyle = computed(() => {
  const style: Record<string, string> = {
    "--m-modal-splash": `url("${inkSplashUrl({ seed })}")`,
  };
  for (const corner of ["tl", "tr", "br", "bl"] as const)
    style[`--m-modal-lattice-${corner}`] =
      `url("${inkLatticeUrl({ seed, corner, size: 64, strokeWidth: 2 })}")`;
  if (size !== undefined) style["--m-drawer-size"] = typeof size === "number" ? `${size}px` : size;
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
  <span v-if="slots.active" class="m-drawer__active" @click="open">
    <slot name="active" />
  </span>
  <Teleport :to="teleportTo" :disabled="teleport === false">
    <Transition name="m-drawer">
      <div
        v-if="rendered"
        v-show="model"
        class="m-drawer"
        :class="[`m-drawer--${direction}`, { 'm-drawer--masked': mask.show }]"
        :style="rootStyle"
      >
        <div class="m-drawer__mask" @click="onMaskClick" />
        <!-- 和弹窗一样包一层：四角回纹挂在这一层上，推拉动画也在这一层 -->
        <div class="m-drawer__frame">
          <div
            ref="panel"
            class="m-drawer__panel"
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
              class="m-drawer__close"
              aria-label="关闭"
              @click="close"
            >
              <!-- 牌顶的墨花和牌底的坠子只在 m.ink 层显示 -->
              <span class="m-drawer__close-splash" aria-hidden="true" />
              <IconClose />
              <span class="m-drawer__close-tassel" aria-hidden="true" />
            </button>
            <header v-if="slots.header || title" :id="titleId" class="m-drawer__header">
              <slot name="header">{{ title }}</slot>
            </header>
            <div class="m-drawer__body"><slot /></div>
            <footer v-if="slots.footer" class="m-drawer__footer"><slot name="footer" /></footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
