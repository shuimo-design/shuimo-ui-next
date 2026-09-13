<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from "vue";
import {
  DIALOG_TRANSITION,
  createModal,
  dialogBrush,
  dialogScene,
  dialogStyle,
  resolveMask,
  type DialogEmits,
  type DialogProps,
  type DialogSlots,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useController } from "../../runtime";

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
/** 是否显示 */
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
// 滚动锁、模态栈、ESC、焦点存还、Tab 循环全在 core 的控制器里，抽屉和确认框共用同一份
const { controller: modal } = useController(createModal, () => ({
  closeOnEsc,
  onRequestClose: close,
}));
// flush: "post" —— 要等面板真的渲染出来再交给控制器，它拿到元素才好聚焦
watch(
  [model, panel],
  () => {
    modal.setPanel(panel.value);
    modal.setOpen(model.value);
  },
  { immediate: true, flush: "post" },
);

useBrushBorder(panel, dialogBrush(seed));

const uid = useId();
const scene = computed(() => dialogScene(seed, uid));
const rootStyle = computed(() => dialogStyle({ seed, width, height }));

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
    <Transition :name="DIALOG_TRANSITION">
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
            @keydown="modal.trapFocus"
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
