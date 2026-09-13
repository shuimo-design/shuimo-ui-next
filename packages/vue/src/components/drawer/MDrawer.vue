<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from "vue";
import {
  DRAWER_TRANSITION,
  createModal,
  drawerBrush,
  drawerClasses,
  drawerStyle,
  resolveMask,
  type DrawerEmits,
  type DrawerProps,
  type DrawerSlots,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useController } from "../../runtime";

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
// 滚动锁、模态栈、ESC、焦点存还、Tab 循环全在 core 的控制器里，和弹窗是同一份
const { controller: modal } = useController(createModal, () => ({
  closeOnEsc,
  onRequestClose: close,
}));
// flush: "post" —— 要等面板真的渲染出来再交给控制器
watch(
  [model, panel],
  () => {
    modal.setPanel(panel.value);
    modal.setOpen(model.value);
  },
  { immediate: true, flush: "post" },
);

useBrushBorder(panel, drawerBrush(seed));
const rootStyle = computed(() => drawerStyle({ seed, size }));

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
    <Transition :name="DRAWER_TRANSITION">
      <div
        v-if="rendered"
        v-show="model"
        :class="drawerClasses(direction, mask.show)"
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
            @keydown="modal.trapFocus"
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
