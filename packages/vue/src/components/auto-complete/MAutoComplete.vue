<script setup lang="ts">
import { computed, useId, useTemplateRef, watch } from "vue";
import {
  autoCompleteActiveId,
  autoCompleteClasses,
  autoCompleteDropdownBrush,
  autoCompleteLabel,
  autoCompleteOptionClasses,
  autoCompleteOptionId,
  autoCompleteShowClear,
  autoCompleteVisible,
  AUTO_COMPLETE_CLEAR_LABEL,
  AUTO_COMPLETE_DEBOUNCE,
  AUTO_COMPLETE_SEED,
  AUTO_COMPLETE_TRIGGER_BRUSH,
  createAutoComplete,
  type AutoCompleteEmits,
  type AutoCompleteOption,
  type AutoCompleteProps,
  type AutoCompleteSlots,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useBrushBorder } from "../../ink";
import MPopper from "../../internal/popper/MPopper.vue";
import { useController } from "../../runtime";

defineOptions({ name: "MAutoComplete" });

const {
  options,
  filter = true,
  placeholder,
  disabled: disabledProp = false,
  clearable = false,
  debounce = AUTO_COMPLETE_DEBOUNCE,
  placement = "bottom-start",
  teleport = true,
  emptyText = "",
  seed = AUTO_COMPLETE_SEED,
} = defineProps<AutoCompleteProps>();
const emit = defineEmits<AutoCompleteEmits>();
const slots = defineSlots<AutoCompleteSlots>();
/** 输入框里的文字 */
const model = defineModel<string>({ default: "" });

// 上下文形状在 core（context/form-item.ts），这两行只是 Vue 的 inject 胶水
const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const listboxId = useId();
const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
// 输入框和其他表单控件共用一套细笔触参数，同一张表单里边框粗细才一致
useBrushBorder(trigger, AUTO_COMPLETE_TRIGGER_BRUSH);
// 下拉面板被 Teleport 到 body，边框要套在面板容器自己身上；面板每次打开都是新元素，useBrushBorder 会重新落笔
const dropdown = useTemplateRef<HTMLElement>("dropdown");
useBrushBorder(dropdown, autoCompleteDropdownBrush(seed));
const input = useTemplateRef<HTMLInputElement>("input");
const list = useTemplateRef<HTMLElement>("list");

// 展开、聚焦、高亮项、search 的防抖全在 core 的控制器里，React 那边用的是同一份
const { controller: ac, state } = useController(createAutoComplete, () => ({
  options,
  filter,
  value: model.value,
  disabled: disabled.value,
  debounce,
  emptyText,
  onCommit: (next: string) => {
    model.value = next;
    formItem.value.validate("change");
  },
  onSearch: (value: string) => emit("search", value),
  onSelect: (option: AutoCompleteOption) => emit("select", option),
  onFocus: (event: FocusEvent) => emit("focus", event),
  onBlur: (event: FocusEvent) => {
    emit("blur", event);
    formItem.value.validate("blur");
  },
  onClear: () => emit("clear"),
}));

watch(
  [root, input, list],
  () => {
    ac.setRoot(root.value);
    ac.setInput(input.value);
    ac.setList(list.value);
  },
  { immediate: true, flush: "post" },
);
// 高亮换了要把那一项滚进视野；flush: "post" 才等得到这一轮 DOM 更新
watch(
  () => state.value.activeIndex,
  () => ac.scrollActiveIntoView(),
  { flush: "post" },
);

// 过滤是纯函数；控制器内部处理键盘时调的是同一个 autoCompleteVisible
const visible = computed(() => autoCompleteVisible(options, model.value, filter));
const open = computed(() => state.value.open);
const showClear = computed(() =>
  autoCompleteShowClear({ clearable, disabled: disabled.value, value: model.value }),
);
const activeId = computed(() => autoCompleteActiveId(listboxId, state.value));

defineExpose({ focus: () => ac.focus(), blur: () => ac.blur() });
</script>

<template>
  <div
    ref="root"
    :class="autoCompleteClasses({ open, focused: state.focused, disabled })"
    @focusin="ac.onFocusin"
    @focusout="ac.onFocusout"
    @keydown="ac.onKeydown"
  >
    <div ref="trigger" class="m-auto-complete__trigger" @mousedown="ac.onTriggerMousedown">
      <span v-if="slots.prefix" class="m-auto-complete__prefix"><slot name="prefix" /></span>
      <input
        :id="formItem.id"
        ref="input"
        class="m-auto-complete__input"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="listboxId"
        :aria-activedescendant="activeId"
        :value="model"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="ac.onInput"
      />
      <span v-if="showClear || slots.suffix" class="m-auto-complete__suffix">
        <button
          v-if="showClear"
          type="button"
          class="m-auto-complete__clear"
          :aria-label="AUTO_COMPLETE_CLEAR_LABEL"
          tabindex="-1"
          @mousedown.prevent
          @click="ac.clear()"
        >
          <IconClose />
        </button>
        <slot name="suffix" />
      </span>
    </div>
    <MPopper
      :open="open"
      :reference="root"
      :placement="placement"
      match-width
      :teleport="teleport"
      @click-outside="ac.onClickOutside"
    >
      <div
        :id="listboxId"
        ref="dropdown"
        class="m-auto-complete__dropdown"
        role="listbox"
        @mousedown.prevent
      >
        <ul v-if="visible.length" ref="list" class="m-auto-complete__options" role="presentation">
          <li
            v-for="(option, index) in visible"
            :id="autoCompleteOptionId(listboxId, index)"
            :key="option.value"
            :class="
              autoCompleteOptionClasses({
                active: index === state.activeIndex,
                disabled: option.disabled ?? false,
              })
            "
            role="option"
            :aria-selected="index === state.activeIndex"
            :aria-disabled="option.disabled || undefined"
            @click="ac.choose(option)"
            @mousemove="ac.setActiveIndex(index)"
          >
            <slot name="option" :option="option" :active="index === state.activeIndex">
              <span class="m-auto-complete__option-label">{{ autoCompleteLabel(option) }}</span>
            </slot>
          </li>
        </ul>
        <div v-else class="m-auto-complete__empty">{{ emptyText }}</div>
      </div>
    </MPopper>
  </div>
</template>
