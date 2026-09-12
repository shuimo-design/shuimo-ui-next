<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import {
  createDatePicker,
  datePickerCellClasses,
  datePickerClasses,
  datePickerFormat,
  datePickerPageLabel,
  datePickerPageStep,
  datePickerPanelInkStyle,
  datePickerShowClear,
  datePickerView,
  DATE_PICKER_CLEAR_LABEL,
  DATE_PICKER_NEXT_MONTH_LABEL,
  DATE_PICKER_PANEL_BRUSH,
  DATE_PICKER_PLACEHOLDER,
  DATE_PICKER_PREV_MONTH_LABEL,
  DATE_PICKER_TRIGGER_BRUSH,
  type DatePickerEmits,
  type DatePickerProps,
} from "@shuimo-design/core";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconClose,
} from "../../icons";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useBrushBorder } from "../../ink";
import MPopper from "../../internal/popper/MPopper.vue";
import { useController } from "../../runtime";

defineOptions({ name: "MDatePicker" });

const {
  type = "date",
  format: formatProp,
  placeholder = DATE_PICKER_PLACEHOLDER,
  disabled: disabledProp = false,
  clearable = true,
  disabledDate,
  firstDayOfWeek = 0,
  teleport = true,
} = defineProps<DatePickerProps>();
const emit = defineEmits<DatePickerEmits>();
/** 进来可以是格式化字符串或 Date 对象，写回去一律是格式化字符串（和旧版一致） */
const model = defineModel<string | Date | null>();

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLButtonElement>("trigger");
// 触发器和输入框共用一套细笔触参数，同一张表单里边框粗细才一致
useBrushBorder(trigger, DATE_PICKER_TRIGGER_BRUSH);
// 面板被 Teleport 到 body，边框要套在面板容器自己身上；每次打开都是新元素，useBrushBorder 会重新落笔
const panel = useTemplateRef<HTMLElement>("panel");
useBrushBorder(panel, DATE_PICKER_PANEL_BRUSH);

const format = computed(() => datePickerFormat(type, formatProp));

// 展开、看的是日 / 月 / 年、正在看哪个月、键盘焦点落在哪天全在 core 的控制器里，
// React 那边用的是同一份
const { controller: picker, state } = useController(createDatePicker, () => ({
  type,
  format: format.value,
  value: model.value,
  firstDayOfWeek,
  disabled: disabled.value,
  disabledDate,
  onCommit: (next: string | null) => {
    model.value = next;
    emit("change", next);
    formItem.value.validate("change");
  },
  onVisibleChange: (open: boolean) => emit("visibleChange", open),
  onClear: () => emit("clear"),
}));

// 交元素和挪焦点必须在同一个 post 回调里按顺序做：面板是每次打开才新建的，
// 焦点要落到它里面的格子上，所以得先把新面板交给控制器，再让它挪焦点。
// flush: "post" 是为了等这一轮 DOM 画完；没待办时 flushFocus 是空操作。
watch(
  [trigger, panel, state],
  () => {
    picker.setTrigger(trigger.value);
    picker.setPanel(panel.value);
    picker.flushFocus();
  },
  { immediate: true, flush: "post" },
);

// 月历、月格年格、文案一次算完
const calendar = computed(() =>
  datePickerView({
    type,
    view: state.value.view,
    format: format.value,
    value: model.value,
    viewDate: state.value.viewDate,
    focusDate: state.value.focusDate,
    today: state.value.today,
    firstDayOfWeek,
    disabledDate,
  }),
);
const showClear = computed(() =>
  datePickerShowClear({
    clearable,
    disabled: disabled.value,
    displayText: calendar.value.displayText,
  }),
);
const panelInkStyle = datePickerPanelInkStyle();
</script>

<template>
  <div ref="root" :class="datePickerClasses({ open: state.open, disabled })">
    <button
      :id="formItem.id"
      ref="trigger"
      type="button"
      class="m-date-picker__trigger"
      aria-haspopup="dialog"
      :aria-expanded="state.open"
      :disabled="disabled"
      @click="picker.toggle"
      @keydown="picker.onTriggerKeydown"
    >
      <IconCalendar class="m-date-picker__icon" />
      <span
        class="m-date-picker__text"
        :class="{ 'm-date-picker__placeholder': !calendar.displayText }"
      >
        {{ calendar.displayText || placeholder }}
      </span>
    </button>
    <button
      v-if="showClear"
      type="button"
      class="m-date-picker__clear"
      :aria-label="DATE_PICKER_CLEAR_LABEL"
      tabindex="-1"
      @click="picker.clear"
    >
      <IconClose />
    </button>
    <MPopper
      :open="state.open"
      :reference="root"
      role="dialog"
      :teleport="teleport"
      @click-outside="picker.onClickOutside"
    >
      <div
        ref="panel"
        class="m-date-picker__panel"
        :style="panelInkStyle"
        @keydown="picker.onPanelKeydown"
      >
        <header class="m-date-picker__header">
          <button
            type="button"
            class="m-date-picker__nav m-date-picker__nav--prev-year"
            :aria-label="datePickerPageLabel(state.view, -1)"
            @click="picker.shiftView(datePickerPageStep(state.view, -1))"
          >
            <IconChevronsLeft class="m-date-picker__nav-icon" />
            <span class="m-date-picker__nav-ink" aria-hidden="true" />
          </button>
          <button
            v-if="state.view === 'date'"
            type="button"
            class="m-date-picker__nav m-date-picker__nav--prev-month"
            :aria-label="DATE_PICKER_PREV_MONTH_LABEL"
            @click="picker.shiftView(-1)"
          >
            <IconChevronLeft class="m-date-picker__nav-icon" />
            <span class="m-date-picker__nav-ink" aria-hidden="true" />
          </button>
          <span class="m-date-picker__title">
            <button
              v-if="state.view !== 'year'"
              type="button"
              class="m-date-picker__year"
              @click="picker.setView('year')"
            >
              {{ calendar.viewYear }}年
            </button>
            <span v-else class="m-date-picker__year">
              {{ calendar.yearStart }} – {{ calendar.yearStart + 11 }}
            </span>
            <button
              v-if="state.view === 'date'"
              type="button"
              class="m-date-picker__month"
              @click="picker.setView('month')"
            >
              {{ calendar.viewMonth + 1 }}月
            </button>
          </span>
          <button
            v-if="state.view === 'date'"
            type="button"
            class="m-date-picker__nav m-date-picker__nav--next-month"
            :aria-label="DATE_PICKER_NEXT_MONTH_LABEL"
            @click="picker.shiftView(1)"
          >
            <IconChevronRight class="m-date-picker__nav-icon" />
            <span class="m-date-picker__nav-ink" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="m-date-picker__nav m-date-picker__nav--next-year"
            :aria-label="datePickerPageLabel(state.view, 1)"
            @click="picker.shiftView(datePickerPageStep(state.view, 1))"
          >
            <IconChevronsRight class="m-date-picker__nav-icon" />
            <span class="m-date-picker__nav-ink" aria-hidden="true" />
          </button>
        </header>

        <template v-if="state.view === 'date'">
          <div class="m-date-picker__weekdays" aria-hidden="true">
            <span v-for="name in calendar.weekdays" :key="name">{{ name }}</span>
          </div>
          <hr class="m-date-picker__divider" aria-hidden="true" />
          <div class="m-date-picker__grid" role="grid">
            <div
              v-for="(row, rowIndex) in calendar.rows"
              :key="rowIndex"
              class="m-date-picker__row"
              role="row"
            >
              <button
                v-for="cell in row"
                :key="cell.key"
                type="button"
                :class="
                  datePickerCellClasses({
                    unit: 'date',
                    outside: cell.outside,
                    today: cell.today,
                    selected: cell.selected,
                    disabled: cell.disabled,
                  })
                "
                role="gridcell"
                :aria-selected="cell.selected"
                :aria-label="cell.label"
                :disabled="cell.disabled"
                :tabindex="cell.key === calendar.tabStopKey ? 0 : -1"
                :data-key="cell.key"
                @focus="picker.focusDay(cell.date)"
                @click="picker.pick(cell.date)"
              >
                {{ cell.text }}
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <hr class="m-date-picker__divider" aria-hidden="true" />
          <div
            v-if="state.view === 'month'"
            class="m-date-picker__grid m-date-picker__grid--month"
            role="grid"
          >
            <div
              v-for="(row, rowIndex) in calendar.monthRows"
              :key="rowIndex"
              class="m-date-picker__row"
              role="row"
            >
              <button
                v-for="cell in row"
                :key="cell.key"
                type="button"
                :class="
                  datePickerCellClasses({
                    unit: 'month',
                    today: cell.today,
                    selected: cell.selected,
                    disabled: cell.disabled,
                  })
                "
                role="gridcell"
                :aria-selected="cell.selected"
                :aria-label="cell.label"
                :disabled="cell.disabled"
                :tabindex="cell.key === calendar.tabStopKey ? 0 : -1"
                :data-key="cell.key"
                @focus="picker.focusMonth(cell.date)"
                @click="picker.pickMonth(cell.date)"
              >
                {{ cell.text }}
              </button>
            </div>
          </div>

          <div v-else class="m-date-picker__grid m-date-picker__grid--year" role="grid">
            <div
              v-for="(row, rowIndex) in calendar.yearRows"
              :key="rowIndex"
              class="m-date-picker__row"
              role="row"
            >
              <button
                v-for="cell in row"
                :key="cell.key"
                type="button"
                :class="
                  datePickerCellClasses({
                    unit: 'year',
                    today: cell.today,
                    selected: cell.selected,
                    disabled: cell.disabled,
                  })
                "
                role="gridcell"
                :aria-selected="cell.selected"
                :aria-label="cell.label"
                :disabled="cell.disabled"
                :tabindex="cell.key === calendar.tabStopKey ? 0 : -1"
                :data-key="cell.key"
                @focus="picker.focusYear(cell.date)"
                @click="picker.pickYear(cell.date)"
              >
                {{ cell.text }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </MPopper>
  </div>
</template>
