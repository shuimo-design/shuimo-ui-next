<script setup lang="ts">
// 样式必须从 SFC 自己引：rolldown 会跳过只做转发的 index.ts，那里的副作用引入会被丢掉
import "./drawer.css";
import { useElementSize } from "@vueuse/core";
import { computed, ref, useId, useTemplateRef, watch } from "vue";
import { IconClose } from "../../icons";
import { brushLineUrl } from "../../ink/assets/line";
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
const vertical = computed(() => direction === "left" || direction === "right");
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

// 面板贴着页面的那条边是一笔竖（或横）线：按面板实际长度生成，32px 分桶免得拖窗口时一直重画
const { width: panelW, height: panelH } = useElementSize(panel, undefined, { box: "border-box" });
const edge = computed(() => {
  const length = vertical.value ? panelH.value : panelW.value;
  if (length <= 0) return undefined;
  return brushLineUrl({
    seed,
    length: Math.ceil(length / 32) * 32,
    thickness: 4,
    vertical: vertical.value,
    flyingWhite: 0.2,
  });
});

const rootStyle = computed(() => {
  const style: Record<string, string> = {};
  if (size !== undefined) style["--m-drawer-size"] = typeof size === "number" ? `${size}px` : size;
  if (edge.value) {
    style["--m-drawer-edge-mask"] = `url("${edge.value.url}")`;
    style["--m-drawer-edge-band"] = `${vertical.value ? edge.value.width : edge.value.height}px`;
  }
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
          <span class="m-drawer__edge" aria-hidden="true" />
          <button
            v-if="closeBtn"
            type="button"
            class="m-drawer__close"
            aria-label="关闭"
            @click="close"
          >
            <IconClose />
          </button>
          <header v-if="slots.header || title" :id="titleId" class="m-drawer__header">
            <slot name="header">{{ title }}</slot>
          </header>
          <div class="m-drawer__body"><slot /></div>
          <footer v-if="slots.footer" class="m-drawer__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
