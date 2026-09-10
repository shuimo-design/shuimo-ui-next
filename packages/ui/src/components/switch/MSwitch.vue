<script setup lang="ts">
import "./switch.css";
import { computed } from "vue";
import { brushLineUrl } from "../../ink/assets/line";
import { brushPolygonUrl } from "../../ink/assets/polygon";
import { useDisabled, useFormItem } from "../../internal/form-item";
import type { SwitchEmits, SwitchProps, SwitchSlots, SwitchValue } from "./types";

defineOptions({ name: "MSwitch" });

const {
  disabled: disabledProp = false,
  loading = false,
  activeValue = true,
  inactiveValue = false,
  activeText,
  inactiveText,
  controlled = false,
  name,
} = defineProps<SwitchProps>();
const emit = defineEmits<SwitchEmits>();
const slots = defineSlots<SwitchSlots>();
const model = defineModel<SwitchValue>({ default: false });

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const checked = computed(() => model.value === activeValue);

/** 轨道长度 / 滑钮边长，要和 switch.css 里的默认变量一致；用户改了变量，遮罩会按 100% 跟着拉伸 */
const TRACK_LENGTH = 56;
const CORE_SIZE = 18;
/** 方框比墨块每边多出 2px，像旧版那张手绘边框浮在色块外面 */
const FRAME_OUT = 2;

// 轨道是一抹：起笔按住、向右越写越细，收笔飞白。按轨道实际长度生成，通用长线横向硬压会糊成发丝
// 画幅两端只留 3px：默认留白是按笔宽算的，56px 的短线会被吃掉一大半
const line = brushLineUrl({ seed: 5, length: TRACK_LENGTH, thickness: 10, taper: true, endPad: 3 });
// 滑钮外那圈手画的方框：四边各一笔，拐角出头
const frame = brushPolygonUrl(
  [
    [-FRAME_OUT, -FRAME_OUT],
    [CORE_SIZE + FRAME_OUT, -FRAME_OUT],
    [CORE_SIZE + FRAME_OUT, CORE_SIZE + FRAME_OUT],
    [-FRAME_OUT, CORE_SIZE + FRAME_OUT],
  ],
  CORE_SIZE,
  CORE_SIZE,
  { seed: 11, strokeWidth: 2, roughness: 0.6, flyingWhite: 0.08, overshoot: 1.5 },
);
const inkStyle = {
  "--m-switch-line-mask": `url("${line.url}")`,
  "--m-switch-line-band": `${line.height}px`,
  "--m-switch-frame-mask": `url("${frame.url}")`,
  "--m-switch-frame-pad": `${frame.padding}px`,
};
const inert = computed(() => disabled.value || loading);

function toggle() {
  if (inert.value) return;
  const next = checked.value ? inactiveValue : activeValue;
  // 受控模式只把"将要变成的值"报出去，改不改 v-model 由外部决定
  if (!controlled) model.value = next;
  emit("change", next);
  formItem?.validate("change");
}
</script>

<template>
  <button
    :id="formItem?.id.value"
    type="button"
    class="m-switch"
    :class="{
      'm-switch--checked': checked,
      'm-switch--disabled': disabled,
      'm-switch--loading': loading,
    }"
    :style="inkStyle"
    role="switch"
    :aria-checked="checked"
    :aria-busy="loading || undefined"
    :disabled="disabled"
    :name="name"
    @click="toggle"
  >
    <span v-if="slots.active || activeText" class="m-switch__text m-switch__text--active">
      <slot name="active">{{ activeText }}</slot>
    </span>
    <span class="m-switch__track" aria-hidden="true">
      <!-- 外层只管左右滑，里层只管转 45° 和 loading 时的慢转，两个 transform 不打架 -->
      <span class="m-switch__thumb">
        <span class="m-switch__core" />
      </span>
    </span>
    <span v-if="slots.inactive || inactiveText" class="m-switch__text m-switch__text--inactive">
      <slot name="inactive">{{ inactiveText }}</slot>
    </span>
  </button>
</template>
